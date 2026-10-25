// ─── Attendance Service Unit Tests ───────────────────────────────────────────
// FRD Section 23.1: Business rules — single active shift, break lifecycle,
// forced checkout, corrections, self-view scoping and audit events.

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
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

import { attendanceService } from "../../application/services/attendance.service.js";

const RESTAURANT_ID = "restaurant_1";
const ACTOR_ID = "actor_1";

function makeRecord(overrides: Record<string, unknown> = {}) {
  return {
    _id: "attendance_1",
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
    createdBy: "actor_1",
    updatedBy: "actor_1",
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auditRepo.create.mockResolvedValue({ _id: "audit_1" });
  mocks.attendanceRepo.toUserInfo.mockResolvedValue(userInfo);
  mocks.attendanceRepo.findUserById.mockResolvedValue({ _id: ACTOR_ID, status: "active" });
});

describe("attendanceService.checkIn", () => {
  it("opens a shift when the user has no active record", async () => {
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.attendanceRepo.create.mockResolvedValue(makeRecord());

    const result = await attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {});

    expect(result.status).toBe("checked_in");
    expect(result.is_active).toBe(true);
    expect(mocks.attendanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: RESTAURANT_ID, userId: ACTOR_ID }),
    );
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_CHECKED_IN", entityId: "attendance_1" }),
    );
  });

  it("stores a restaurant business date (YYYY-MM-DD) on check-in", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T04:00:00.000Z"));
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.attendanceRepo.create.mockResolvedValue(makeRecord());

    try {
      await attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {});

      // 2026-08-09T04:00:00Z is 09:30 IST on 2026-08-09 → business date 2026-08-09.
      expect(mocks.attendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ businessDate: "2026-08-09" }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a duplicate check-in (single active record rule)", async () => {
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(makeRecord());

    await expect(
      attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "ATTENDANCE_ALREADY_ACTIVE" });
    expect(mocks.attendanceRepo.create).not.toHaveBeenCalled();
  });

  it("rejects an unknown user", async () => {
    mocks.attendanceRepo.findUserById.mockResolvedValue(null);

    await expect(
      attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
  });

  it("turns a concurrent duplicate-key insert into ATTENDANCE_ALREADY_ACTIVE", async () => {
    // Two requests race past the pre-check; the partial unique index fires 11000.
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.attendanceRepo.create.mockRejectedValue({ code: 11000 });

    await expect(
      attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "ATTENDANCE_ALREADY_ACTIVE" });
  });

  it("rejects check-in for an inactive staff member -> STAFF_NOT_ACTIVE", async () => {
    mocks.attendanceRepo.findUserById.mockResolvedValue({ _id: ACTOR_ID, status: "inactive" });

    await expect(
      attendanceService.checkIn(RESTAURANT_ID, ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "STAFF_NOT_ACTIVE" });
    expect(mocks.attendanceRepo.create).not.toHaveBeenCalled();
  });
});

describe("attendanceService.startBreak / endBreak", () => {
  it("starts a break only from checked_in status", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({ status: "on_break", breaks: [{ startedAt: new Date(), endedAt: null }] }),
    );

    const result = await attendanceService.startBreak(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "waiter",
    );

    expect(result.status).toBe("on_break");
    expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
      "attendance_1",
      RESTAURANT_ID,
      expect.objectContaining({ status: "on_break" }),
    );
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_BREAK_STARTED" }),
    );
  });

  it("rejects starting a break when already on break -> BREAK_ALREADY_ACTIVE", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord({ status: "on_break" }));

    await expect(
      attendanceService.startBreak(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter"),
    ).rejects.toMatchObject({ code: "BREAK_ALREADY_ACTIVE" });
  });

  it("rejects starting a break from checked_out -> INVALID_ATTENDANCE_STATE", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(
      makeRecord({ status: "checked_out", isActive: false }),
    );

    await expect(
      attendanceService.startBreak(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter"),
    ).rejects.toMatchObject({ code: "INVALID_ATTENDANCE_STATE" });
  });

  it("ends a break and accumulates break minutes", async () => {
    const startedAt = new Date("2026-08-05T10:00:00.000Z");
    mocks.attendanceRepo.findById.mockResolvedValue(
      makeRecord({
        status: "on_break",
        breaks: [{ startedAt, endedAt: null, durationMinutes: null }],
      }),
    );
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        status: "checked_in",
        breaks: [{ startedAt, endedAt: new Date("2026-08-05T10:30:00.000Z"), durationMinutes: 30 }],
        totalBreakMinutes: 30,
      }),
    );

    const result = await attendanceService.endBreak(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "waiter",
    );

    expect(result.status).toBe("checked_in");
    expect(result.total_break_minutes).toBe(30);
    expect(result.breaks[0]!.duration_minutes).toBe(30);
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_BREAK_ENDED" }),
    );
  });

  it("rejects ending a break when not on break -> NO_ACTIVE_BREAK", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord({ status: "checked_in" }));

    await expect(
      attendanceService.endBreak(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter"),
    ).rejects.toMatchObject({ code: "NO_ACTIVE_BREAK" });
  });
});

describe("attendanceService.checkOut", () => {
  it("closes a shift and computes total working minutes", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        status: "checked_out",
        checkedOutAt: new Date("2026-08-05T17:00:00.000Z"),
        totalWorkingMinutes: 8 * 60,
        isActive: false,
      }),
    );

    const result = await attendanceService.checkOut(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "waiter",
      {},
    );

    expect(result.status).toBe("checked_out");
    expect(result.is_active).toBe(false);
    expect(result.total_working_minutes).toBe(480);
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_CHECKED_OUT" }),
    );
  });

  it("closes an open break automatically during checkout", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T12:15:00.000Z"));
    const startedAt = new Date("2026-08-05T12:00:00.000Z");
    mocks.attendanceRepo.findById.mockResolvedValue(
      makeRecord({
        status: "on_break",
        breaks: [{ startedAt, endedAt: null, durationMinutes: null }],
      }),
    );
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        status: "checked_out",
        checkedOutAt: new Date("2026-08-05T12:15:00.000Z"),
        breaks: [{ startedAt, endedAt: new Date("2026-08-05T12:15:00.000Z"), durationMinutes: 15 }],
        totalBreakMinutes: 15,
        totalWorkingMinutes: 180,
        isActive: false,
      }),
    );

    try {
      const result = await attendanceService.checkOut(
        RESTAURANT_ID,
        "attendance_1",
        ACTOR_ID,
        "waiter",
        {},
      );

      expect(result.total_break_minutes).toBe(15);
      expect(result.total_working_minutes).toBe(180);
      expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
        "attendance_1",
        RESTAURANT_ID,
        expect.objectContaining({ status: "checked_out", isActive: false, totalBreakMinutes: 15 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("records ATTENDANCE_FORCED_CHECKOUT when a manager forces checkout", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord({ userId: "other_user" }));
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({ userId: "other_user", status: "checked_out", isActive: false }),
    );

    const result = await attendanceService.checkOut(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "restaurant_owner",
      { force: true },
    );

    expect(result.status).toBe("checked_out");
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ATTENDANCE_FORCED_CHECKOUT" }),
    );
  });

  it("rejects a non-manager forcing checkout of another user", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord({ userId: "other_user" }));

    await expect(
      attendanceService.checkOut(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter", {
        force: true,
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("rejects checkout of an already checked-out record -> ATTENDANCE_ALREADY_CHECKED_OUT", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(
      makeRecord({ status: "checked_out", isActive: false }),
    );

    await expect(
      attendanceService.checkOut(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "ATTENDANCE_ALREADY_CHECKED_OUT" });
  });

  it("blocks a waiter from checking out another user's record", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord({ userId: "other_user" }));

    await expect(
      attendanceService.checkOut(RESTAURANT_ID, "attendance_1", ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });
});

describe("attendanceService.correct", () => {
  it("corrects a record and writes an audited correction", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        checkedOutAt: new Date("2026-08-05T18:00:00.000Z"),
        totalWorkingMinutes: 9 * 60,
        status: "checked_out",
        isActive: false,
        correctionNote: "Late checkout",
        correctedAt: new Date(),
        correctedBy: ACTOR_ID,
      }),
    );

    const result = await attendanceService.correct(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "restaurant_owner",
      {
        checked_out_at: "2026-08-05T18:00:00.000Z",
        reason_code: "time_correction",
        reason_text: "Late checkout",
      },
    );

    expect(result.total_working_minutes).toBe(540);
    expect(result.correction_note).toBe("Late checkout");
    expect(mocks.auditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ATTENDANCE_CORRECTED",
        before: expect.any(Object),
        after: expect.any(Object),
        reasonText: "Late checkout",
      }),
    );
  });

  it("recalculates total working minutes when checked_out_at changes", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(makeRecord());
    mocks.attendanceRepo.updateById.mockResolvedValue(
      makeRecord({
        checkedOutAt: new Date("2026-08-05T18:30:00.000Z"),
        totalBreakMinutes: 30,
        totalWorkingMinutes: 540,
        status: "checked_out",
        isActive: false,
        correctionNote: "Missed checkout",
        correctedAt: new Date(),
        correctedBy: ACTOR_ID,
      }),
    );

    // Record checked in 09:00, corrected to check out 18:30, 30min breaks →
    // working = 570 - 30 = 540. total_working_minutes is NOT provided so the
    // service must recompute it from the corrected timestamps.
    await attendanceService.correct(
      RESTAURANT_ID,
      "attendance_1",
      ACTOR_ID,
      "restaurant_owner",
      {
        checked_out_at: "2026-08-05T18:30:00.000Z",
        total_break_minutes: 30,
        reason_code: "missed_checkout",
        reason_text: "Missed checkout",
      },
    );

    expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
      "attendance_1",
      RESTAURANT_ID,
      expect.objectContaining({ totalWorkingMinutes: 540 }),
    );
  });

  it("throws ATTENDANCE_NOT_FOUND for an unknown record", async () => {
    mocks.attendanceRepo.findById.mockResolvedValue(null);

    await expect(
      attendanceService.correct(RESTAURANT_ID, "missing", ACTOR_ID, "restaurant_owner", {
        reason_code: "other",
        reason_text: "Fix",
      }),
    ).rejects.toMatchObject({ code: "ATTENDANCE_NOT_FOUND" });
  });
});

describe("attendanceService.list / listActive / listForUser", () => {
  it("scopes non-manager history to their own records", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [makeRecord()], total: 1 });

    const result = await attendanceService.list(RESTAURANT_ID, ACTOR_ID, "waiter", {
      page: 1,
      limit: 10,
    });

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: ACTOR_ID, limit: 10 }),
    );
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it("allows a manager to filter history by user", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [], total: 0 });

    await attendanceService.list(RESTAURANT_ID, ACTOR_ID, "manager", {
      user_id: "staff_9",
      limit: 20,
    });

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "staff_9" }),
    );
  });

  it("manager without a user filter sees ALL staff (no user scoping)", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [makeRecord()], total: 1 });

    const result = await attendanceService.list(RESTAURANT_ID, ACTOR_ID, "manager", {
      date: "2026-08-09",
      limit: 50,
    });

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: undefined, businessDate: "2026-08-09" }),
    );
    expect(result.data).toHaveLength(1);
  });

  it("filters history by restaurant business date", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [], total: 0 });

    await attendanceService.list(RESTAURANT_ID, ACTOR_ID, "manager", {
      date: "2026-08-09",
      limit: 50,
    });

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ businessDate: "2026-08-09" }),
    );
  });

  it("passes business date ranges to the repository", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [], total: 0 });

    await attendanceService.list(RESTAURANT_ID, ACTOR_ID, "manager", {
      date_from: "2026-08-01",
      date_to: "2026-08-09",
    });

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ businessDateFrom: "2026-08-01", businessDateTo: "2026-08-09" }),
    );
  });

  it("lists only active records for managers, own record for staff", async () => {
    mocks.attendanceRepo.listActive.mockResolvedValue([makeRecord()]);

    const managerView = await attendanceService.listActive(RESTAURANT_ID, ACTOR_ID, "manager");
    const staffView = await attendanceService.listActive(RESTAURANT_ID, ACTOR_ID, "waiter");

    expect(mocks.attendanceRepo.listActive).toHaveBeenNthCalledWith(1, RESTAURANT_ID, undefined);
    expect(mocks.attendanceRepo.listActive).toHaveBeenNthCalledWith(2, RESTAURANT_ID, ACTOR_ID);
    expect(managerView).toHaveLength(1);
    expect(staffView).toHaveLength(1);
  });

  it("blocks non-managers from viewing another user's history", async () => {
    await expect(
      attendanceService.listForUser(RESTAURANT_ID, "staff_9", ACTOR_ID, "waiter", {}),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
  });

  it("allows a manager to view any user's history", async () => {
    mocks.attendanceRepo.list.mockResolvedValue({ data: [], total: 0 });

    const result = await attendanceService.listForUser(
      RESTAURANT_ID,
      "staff_9",
      ACTOR_ID,
      "manager",
      {},
    );

    expect(mocks.attendanceRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "staff_9" }),
    );
    expect(result.data).toEqual([]);
  });
});
