// ─── Attendance Routes Integration Tests ──────────────────────────────────────
// FRD Section 23.1: RBAC, tenant isolation, validation and response envelopes
// tested through the real middleware chain. The repository layer and JWT
// authentication are mocked; auth/permission/tenant middleware runs for real.

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { resolvePermissions } from "../../../../shared/auth/permission-catalog.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  attendanceRepo: {
    findById: vi.fn(),
    findActiveForUser: vi.fn(),
    findUserById: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    list: vi.fn(),
    listActive: vi.fn(),
    toUserInfo: vi.fn(),
  },
  auditRepo: { create: vi.fn(), findByEntity: vi.fn() },
}));

vi.mock("../../../../shared/auth/authenticate.js", () => ({
  authenticate: (req: unknown, _res: unknown, next: unknown) => {
    const u = mocks.auth();
    const reqCtx = req as {
      user?: Record<string, unknown>;
      restaurantId?: string;
      context: Record<string, unknown>;
    };
    reqCtx.user = {
      _id: u.id,
      id: u.id,
      role: u.role,
      restaurantId: u.restaurantId,
      status: u.status ?? "active",
      permissions_override: [],
    };
    reqCtx.restaurantId = u.restaurantId;
    reqCtx.context.user_id = u.id;
    reqCtx.context.restaurant_id = u.restaurantId;
    reqCtx.context.role = u.role;
    reqCtx.context.permissions = u.permissions ?? [];
    (next as () => void)();
  },
}));
vi.mock("../../infrastructure/repositories/attendance.repository.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../infrastructure/repositories/attendance.repository.js")
  >("../../infrastructure/repositories/attendance.repository.js");
  return {
    ...actual,
    attendanceRepository: mocks.attendanceRepo,
  };
});
vi.mock("../../infrastructure/repositories/audit-log.repository.js", () => ({
  attendanceAuditLogRepository: mocks.auditRepo,
}));

import attendanceRoutes from "../../api/routes.js";
import { requestContextMiddleware } from "../../../../shared/http/request-context.js";
import { globalErrorHandler } from "../../../../shared/errors/error-handler.js";

const RESTAURANT_ID = "restaurant_1";
const ATTENDANCE_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const ACTOR_ID = "actor_1";
const OTHER_USER = "bbbbbbbbbbbbbbbbbbbbbbbb";

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: ATTENDANCE_ID,
    restaurantId: RESTAURANT_ID,
    userId: ACTOR_ID,
    status: "checked_in",
    checkedInAt: new Date("2026-08-05T09:00:00.000Z"),
    checkedOutAt: null,
    breaks: [],
    totalBreakMinutes: 0,
    totalWorkingMinutes: 0,
    isActive: true,
    note: null,
    correctedAt: null,
    correctedBy: null,
    correctionNote: null,
    createdBy: ACTOR_ID,
    updatedBy: ACTOR_ID,
    createdAt: new Date("2026-08-05T09:00:00.000Z"),
    updatedAt: new Date("2026-08-05T09:00:00.000Z"),
    ...overrides,
  };
}

const userInfo = {
  id: ACTOR_ID,
  full_name: "Krish Naik",
  first_name: "Krish",
  last_name: "Naik",
  employee_code: "EMP-00001",
  role: "waiter",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use("/api/v1/attendance", attendanceRoutes);
  app.use(globalErrorHandler);
  return app;
}

function asUser(role: string, overrides: Record<string, unknown> = {}) {
  return {
    id: ACTOR_ID,
    role,
    restaurantId: RESTAURANT_ID,
    status: "active",
    permissions: resolvePermissions(role as Parameters<typeof resolvePermissions>[0]),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auditRepo.create.mockResolvedValue({ _id: "audit_1" });
  mocks.attendanceRepo.toUserInfo.mockResolvedValue(userInfo);
  mocks.attendanceRepo.findUserById.mockResolvedValue({ _id: ACTOR_ID, status: "active" });
  mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
  mocks.attendanceRepo.create.mockResolvedValue(makeRecord());
});



describe("RBAC", () => {
  it("waiter cannot correct an attendance record -> 403", async () => {
    mocks.auth.mockReturnValue(asUser("waiter"));

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({ correction_note: "Fix time" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PERMISSION_DENIED");
    expect(mocks.attendanceRepo.updateById).not.toHaveBeenCalled();
  });

  it("manager can correct an attendance record -> 200", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        status: "checked_out",
        isActive: false,
        checkedOutAt: new Date("2026-08-05T18:00:00.000Z"),
        totalWorkingMinutes: 540,
        correctionNote: "Fix time",
      }),
    );

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({
        checked_out_at: "2026-08-05T18:00:00.000Z",
        reason_code: "time_correction",
        reason_text: "Fix time",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.attendance.total_working_minutes).toBe(540);
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_CORRECTED" }),
    );
  });

  it("rejects a correction missing reason_code -> 422 VALIDATION_FAILED", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({ total_working_minutes: 400, reason_text: "Fix time" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("waiter without attendance.read cannot list history -> 403", async () => {
    mocks.auth.mockReturnValue(asUser("waiter", { permissions: [] }));

    const res = await request(buildApp()).get("/api/v1/attendance");

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PERMISSION_DENIED");
  });

  it("cook can list history (has attendance.read)", async () => {
    mocks.auth.mockReturnValue(asUser("cook"));
    mocks.attendanceRepo.list.mockResolvedValue({ data: [makeRecord()], total: 1 });

    const res = await request(buildApp()).get("/api/v1/attendance");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ACTOR_ID }),
    );
  });

  it("filters history by business date and keeps checked-out records", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.list.mockResolvedValue({
      data: [makeRecord({ status: "checked_out", isActive: false })],
      total: 1,
    });

    const res = await request(buildApp()).get("/api/v1/attendance?date=2026-08-09");

    expect(res.status).toBe(200);
    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ businessDate: "2026-08-09" }),
    );
    expect(res.body.data[0].status).toBe("checked_out");
  });

  it("rejects an invalid date param -> 422", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));

    const res = await request(buildApp()).get("/api/v1/attendance?date=09-08-2026");

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("Tenant Isolation", () => {
  it("scopes attendance lookup by tenant", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(makeRecord());

    await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({ reason_code: "other", reason_text: "tenant isolation test" });

    expect(mocks.attendanceRepo.findById).toHaveBeenCalledWith(
      ATTENDANCE_ID,
      RESTAURANT_ID,
    );
  });

  it("returns ATTENDANCE_NOT_FOUND for records outside the tenant", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.findById.mockResolvedValue(null);

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({ reason_code: "other", reason_text: "tenant not found test" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ATTENDANCE_NOT_FOUND");
  });
});

describe("Validation", () => {
  it("rejects an invalid attendance id -> 422 VALIDATION_FAILED", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));

    const res = await request(buildApp())
      .patch("/api/v1/attendance/not-an-id/correct")
      .send({ reason_code: "other", reason_text: "invalid id test" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects an empty correction body -> 422", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a correction with an invalid reason_code -> 422", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));

    const res = await request(buildApp())
      .patch(`/api/v1/attendance/${ATTENDANCE_ID}/correct`)
      .send({ total_working_minutes: 400, reason_code: "nonsense", reason_text: "Fix time" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("List & Active", () => {
  it("lists active shifts for a manager", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.listActive.mockResolvedValue([makeRecord(), makeRecord({ _id: "x" })]);

    const res = await request(buildApp()).get("/api/v1/attendance/active");

    expect(res.status).toBe(200);
    expect(res.body.data.attendance).toHaveLength(2);
    expect(mocks.attendanceRepo.listActive).toHaveBeenCalledWith(RESTAURANT_ID, undefined);
  });

  it("scopes active shifts to self for a waiter", async () => {
    mocks.auth.mockReturnValue(asUser("waiter"));
    mocks.attendanceRepo.listActive.mockResolvedValue([makeRecord()]);

    const res = await request(buildApp()).get("/api/v1/attendance/active");

    expect(res.status).toBe(200);
    expect(mocks.attendanceRepo.listActive).toHaveBeenCalledWith(RESTAURANT_ID, ACTOR_ID);
  });

  it("manager history without user_id is unscoped (sees all staff)", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.list.mockResolvedValue({
      data: [
        makeRecord(),
        makeRecord({ _id: "x", userId: OTHER_USER }),
      ],
      total: 2,
    });

    const res = await request(buildApp()).get("/api/v1/attendance?date=2026-08-09");

    expect(res.status).toBe(200);
    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined }),
    );
    expect(res.body.data).toHaveLength(2);
  });

  it("allows a manager to view another staff member's history", async () => {
    mocks.auth.mockReturnValue(asUser("manager"));
    mocks.attendanceRepo.list.mockResolvedValue({ data: [], total: 0 });

    const res = await request(buildApp()).get(`/api/v1/attendance/staff/${OTHER_USER}`);

    expect(res.status).toBe(200);
    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: OTHER_USER }),
    );
  });

  it("blocks a waiter from viewing another staff member's history -> 403", async () => {
    mocks.auth.mockReturnValue(asUser("waiter"));

    const res = await request(buildApp()).get(`/api/v1/attendance/staff/${OTHER_USER}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PERMISSION_DENIED");
  });
});
