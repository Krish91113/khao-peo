// ─── Staff Routes Integration Tests ───────────────────────────────────────────
// KP-FRD-002: RBAC (BR-007/BR-008), tenant isolation (BR-001/BR-002), validation
// and response envelopes tested through the real middleware chain. The
// repository layer and JWT authentication are mocked; auth/permission/tenant
// middleware runs for real.

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { resolvePermissions } from "../../../../shared/auth/permission-catalog.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  staffRepo: {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByPhone: vi.fn(),
    findLatestEmployeeCode: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    softDelete: vi.fn(),
    countActive: vi.fn(),
  },
  auditRepo: { create: vi.fn(), findByEntity: vi.fn() },
  restaurantRepo: { findById: vi.fn() },
  bcrypt: { genSalt: vi.fn(), hash: vi.fn() },
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
vi.mock("../../infrastructure/repositories/staff.repository.js", () => ({
  staffRepository: mocks.staffRepo,
}));
vi.mock("../../infrastructure/repositories/audit-log.repository.js", () => ({
  auditLogRepository: mocks.auditRepo,
}));
vi.mock("../../../restaurant/public.js", () => ({
  restaurantRepository: mocks.restaurantRepo,
}));
vi.mock("bcryptjs", () => ({ default: mocks.bcrypt }));

import staffRoutes from "../../api/routes.js";
import { requestContextMiddleware } from "../../../../shared/http/request-context.js";
import { globalErrorHandler } from "../../../../shared/errors/error-handler.js";

const RESTAURANT_ID = "restaurant_1";
const STAFF_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: STAFF_ID,
    restaurantId: RESTAURANT_ID,
    fullName: "Krish Naik",
    email: "krish@example.com",
    role: "waiter",
    status: "active",
    employeeCode: "EMP-00001",
    firstName: "Krish",
    lastName: "Naik",
    phone: "9876543210",
    joinedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContextMiddleware);
  app.use("/api/v1/staff", staffRoutes);
  app.use(globalErrorHandler);
  return app;
}

function asUser(role: string, overrides: Record<string, unknown> = {}) {
  return {
    id: "actor_1",
    role,
    restaurantId: RESTAURANT_ID,
    status: "active",
    permissions: resolvePermissions(role as Parameters<typeof resolvePermissions>[0]),
    ...overrides,
  };
}

const validBody = {
  first_name: "Krish",
  last_name: "Naik",
  email: "krish@example.com",
  phone: "9876543210",
  password: "secret123",
  role: "WAITER",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auditRepo.create.mockResolvedValue({ _id: "audit_1" });
  mocks.restaurantRepo.findById.mockResolvedValue({ _id: RESTAURANT_ID });
  mocks.staffRepo.findByEmail.mockResolvedValue(null);
  mocks.staffRepo.findByPhone.mockResolvedValue(null);
  mocks.staffRepo.findLatestEmployeeCode.mockResolvedValue("EMP-00002");
  mocks.bcrypt.genSalt.mockResolvedValue("salt");
  mocks.bcrypt.hash.mockResolvedValue("hashed");
});

describe("RBAC (BR-007 / BR-008)", () => {
  it("waiter cannot create staff -> 403 PERMISSION_DENIED", async () => {
    mocks.auth.mockReturnValue(asUser("waiter"));

    const res = await request(buildApp()).post("/api/v1/staff").send(validBody);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("PERMISSION_DENIED");
    expect(mocks.staffRepo.create).not.toHaveBeenCalled();
  });

  it("waiter cannot delete staff -> 403 PERMISSION_DENIED", async () => {
    mocks.auth.mockReturnValue(asUser("waiter"));

    const res = await request(buildApp()).delete(`/api/v1/staff/${STAFF_ID}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("PERMISSION_DENIED");
  });

  it("restaurant owner can create staff -> 201", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));
    mocks.staffRepo.create.mockResolvedValue(makeUser());

    const res = await request(buildApp()).post("/api/v1/staff").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Staff Created");
    expect(res.body.data.staff.employee_code).toBe("EMP-00001");
  });

  it("restaurant admin can suspend staff -> 200", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_admin"));
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ status: "active" }));
    mocks.staffRepo.updateById.mockResolvedValue(makeUser({ status: "suspended" }));

    const res = await request(buildApp())
      .patch(`/api/v1/staff/${STAFF_ID}/status`)
      .send({ status: "SUSPENDED" });

    expect(res.status).toBe(200);
    expect(res.body.data.staff.status).toBe("suspended");
  });
});

describe("Validation", () => {
  it("rejects an invalid body with VALIDATION_FAILED", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));

    const res = await request(buildApp())
      .post("/api/v1/staff")
      .send({ email: "not-an-email", role: "NOPE", password: "123" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
    expect(res.body.error.details.fields).toBeDefined();
  });

  it("rejects an invalid staff id with VALIDATION_FAILED", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));

    const res = await request(buildApp()).get("/api/v1/staff/not-an-objectid");

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("Tenant Isolation (BR-001 / BR-002)", () => {
  it("overrides client-supplied restaurant_id with the session tenant", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));
    mocks.staffRepo.create.mockResolvedValue(makeUser());

    await request(buildApp())
      .post("/api/v1/staff")
      .send({ ...validBody, restaurant_id: "other_restaurant" });

    expect(mocks.staffRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: RESTAURANT_ID }),
    );
    expect(mocks.staffRepo.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: "other_restaurant" }),
    );
  });

  it("returns STAFF_NOT_FOUND for staff outside the session tenant", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));
    mocks.staffRepo.findById.mockResolvedValue(null);

    const res = await request(buildApp()).get(`/api/v1/staff/${STAFF_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("STAFF_NOT_FOUND");
  });
});

describe("List & Self Profile", () => {
  it("lists staff with search/filter/pagination applied to the repository", async () => {
    mocks.auth.mockReturnValue(asUser("restaurant_owner"));
    mocks.staffRepo.list.mockResolvedValue({ data: [makeUser()], total: 1 });

    const res = await request(buildApp()).get(
      "/api/v1/staff?search=krish&role=WAITER&status=ACTIVE&page=1&limit=10",
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta.total).toBe(1);
    expect(mocks.staffRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: "krish", role: "waiter", status: "active", limit: 10 }),
    );
  });

  it("waiter can view their own profile via /staff/me", async () => {
    mocks.auth.mockReturnValue(asUser("waiter", { id: "staff_me" }));
    mocks.staffRepo.findById.mockResolvedValue(makeUser({ _id: "staff_me" }));

    const res = await request(buildApp()).get("/api/v1/staff/me");

    expect(res.status).toBe(200);
    expect(res.body.data.staff.id).toBe("staff_me");
  });
});
