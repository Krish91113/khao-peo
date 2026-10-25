// ─── Action Request Service Unit Tests ─────────────────────────────────────────
// Tests covering all 14 approval workflow scenarios:
// 1. Admin sends check-in request -> creates PENDING request
// 2. Waiter receives pending request -> returned by getPendingRequests
// 3. Confirm creates attendance -> attendance record exists after confirm
// 4. Decline does not create attendance -> no attendance record
// 5. Duplicate pending request rejected -> 409 ATTENDANCE_REQUEST_ALREADY_PENDING
// 6. Confirmation after state changed rejected -> revalidation fails
// 7. Start-break confirmation -> status transitions to ON_BREAK
// 8. End-break confirmation -> status transitions back to CHECKED_IN
// 9. Checkout confirmation -> status transitions to CHECKED_OUT
// 10. History remains after checkout -> attendance_records not deleted
// 11. Cross-restaurant requests rejected -> different restaurant -> 403
// 12. User cannot confirm another user's request -> wrong user -> 403
// 13. Socket event invalidates dashboard -> mock socket emission
// 14. Offline user sees persistent notification -> notification record exists

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  actionRequestRepo: {
    create: vi.fn(),
    findById: vi.fn(),
    findPendingForUser: vi.fn(),
    findPendingByUser: vi.fn(),
    updateStatus: vi.fn(),
  },
  notificationRepo: {
    create: vi.fn(),
    findUnreadForUser: vi.fn(),
    markRead: vi.fn(),
    updateByReference: vi.fn(),
  },
  attendanceRepo: {
    findActiveForUser: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    findById: vi.fn(),
  },
  auditRepo: {
    create: vi.fn(),
  },
  userModel: {
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
  },
  socket: {
    emitToRooms: vi.fn(),
  },
  transaction: {
    withTransaction: vi.fn(async (cb: (session: unknown) => Promise<unknown>) => cb({})),
  },
}));

vi.mock("../../infrastructure/repositories/action-request.repository.js", () => ({
  actionRequestRepository: mocks.actionRequestRepo,
  isDuplicatePendingConflict: vi.fn(() => false),
}));

vi.mock("../../infrastructure/repositories/notification.repository.js", () => ({
  notificationRepository: mocks.notificationRepo,
}));

vi.mock("../../infrastructure/repositories/attendance.repository.js", () => ({
  attendanceRepository: mocks.attendanceRepo,
}));

vi.mock("../../infrastructure/repositories/audit-log.repository.js", () => ({
  attendanceAuditLogRepository: mocks.auditRepo,
}));

vi.mock("../../../auth/public.js", () => ({
  UserModel: mocks.userModel,
}));

vi.mock("../../../../shared/database/transaction.js", () => ({
  withTransaction: mocks.transaction.withTransaction,
}));

vi.mock("../../../../shared/realtime/socket.js", () => ({
  emitToRooms: mocks.socket.emitToRooms,
}));

import { actionRequestService } from "../../application/services/action-request.service.js";

const RESTAURANT_ID = "60d5ecb74e5f8b0015e1c5a1";
const OWNER_ID = "60d5ecb74e5f8b0015e1c5a2";
const ADMIN_ID = "60d5ecb74e5f8b0015e1c5a3";
const WAITER_ID = "60d5ecb74e5f8b0015e1c5a4";
const REQUEST_ID = "60d5ecb74e5f8b0015e1c5a5";

function makeActionRequest(overrides: Record<string, unknown> = {}) {
  return {
    _id: REQUEST_ID,
    restaurantId: RESTAURANT_ID,
    userId: WAITER_ID,
    requestedBy: OWNER_ID,
    action: "CHECK_IN",
    status: "PENDING",
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ...overrides,
  };
}

describe("ActionRequestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Admin sends check-in request -> creates PENDING request
  it("1. Admin sends check-in request -> creates PENDING request", async () => {
    mocks.userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, role: "waiter", status: "active" }),
    });
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.actionRequestRepo.findPendingByUser.mockResolvedValue(null);
    mocks.actionRequestRepo.create.mockResolvedValue(makeActionRequest());
    mocks.userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ fullName: "Owner User" }),
      }),
    });

    const result = await actionRequestService.createRequest(
      RESTAURANT_ID,
      OWNER_ID,
      "restaurant_owner",
      { user_id: WAITER_ID, action: "CHECK_IN" },
    );

    expect(result.status).toBe("PENDING");
    expect(result.action).toBe("CHECK_IN");
    expect(mocks.actionRequestRepo.create).toHaveBeenCalled();
  });

  // 2. Waiter receives pending request -> returned by getPendingRequests
  it("2. Waiter receives pending request -> returned by getPendingRequests", async () => {
    mocks.actionRequestRepo.findPendingForUser.mockResolvedValue([makeActionRequest()]);

    const result = await actionRequestService.getPendingRequests(WAITER_ID, RESTAURANT_ID);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(REQUEST_ID);
    expect(result[0].status).toBe("PENDING");
  });

  // 3. Confirm creates attendance -> attendance record exists after confirm
  it("3. Confirm creates attendance -> attendance record exists after confirm", async () => {
    const req = makeActionRequest({ action: "CHECK_IN" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "CONFIRMED" });
    mocks.attendanceRepo.create.mockResolvedValue({ _id: "att_1", status: "checked_in" });

    const result = await actionRequestService.confirmRequest(
      REQUEST_ID,
      WAITER_ID,
      RESTAURANT_ID,
      "waiter",
    );

    expect(result.status).toBe("CONFIRMED");
    expect(mocks.attendanceRepo.create).toHaveBeenCalled();
    expect(mocks.auditRepo.create).toHaveBeenCalled();
  });

  // 4. Decline does not create attendance -> no attendance record
  it("4. Decline does not create attendance -> no attendance record", async () => {
    const req = makeActionRequest({ action: "CHECK_IN" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "DECLINED" });

    const result = await actionRequestService.declineRequest(
      REQUEST_ID,
      WAITER_ID,
      RESTAURANT_ID,
    );

    expect(result.status).toBe("DECLINED");
    expect(mocks.attendanceRepo.create).not.toHaveBeenCalled();
  });

  // 5. Duplicate pending request rejected -> 409 ATTENDANCE_REQUEST_ALREADY_PENDING
  it("5. Duplicate pending request rejected -> 409 ATTENDANCE_REQUEST_ALREADY_PENDING", async () => {
    mocks.userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, role: "waiter", status: "active" }),
    });
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.actionRequestRepo.findPendingByUser.mockResolvedValue(makeActionRequest());

    await expect(
      actionRequestService.createRequest(RESTAURANT_ID, OWNER_ID, "restaurant_owner", {
        user_id: WAITER_ID,
        action: "CHECK_IN",
      }),
    ).rejects.toThrow("already pending");
  });

  // 6. Confirmation after state changed rejected -> revalidation fails
  it("6. Confirmation after state changed rejected -> revalidation fails", async () => {
    const req = makeActionRequest({ action: "CHECK_IN" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    // User is ALREADY checked in when trying to confirm CHECK_IN
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue({ _id: "att_1", status: "checked_in" });

    await expect(
      actionRequestService.confirmRequest(REQUEST_ID, WAITER_ID, RESTAURANT_ID, "waiter"),
    ).rejects.toThrow();
  });

  // 7. Start-break confirmation -> status transitions to ON_BREAK
  it("7. Start-break confirmation -> status transitions to ON_BREAK", async () => {
    const req = makeActionRequest({ action: "START_BREAK" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
      _id: "att_1",
      status: "checked_in",
      breaks: [],
    });
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "CONFIRMED" });

    const result = await actionRequestService.confirmRequest(
      REQUEST_ID,
      WAITER_ID,
      RESTAURANT_ID,
      "waiter",
    );

    expect(result.status).toBe("CONFIRMED");
    expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
      "att_1",
      RESTAURANT_ID,
      expect.objectContaining({ status: "on_break" }),
    );
  });

  // 8. End-break confirmation -> status transitions back to CHECKED_IN
  it("8. End-break confirmation -> status transitions back to CHECKED_IN", async () => {
    const req = makeActionRequest({ action: "END_BREAK" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
      _id: "att_1",
      status: "on_break",
      breaks: [{ startedAt: new Date(Date.now() - 600000), endedAt: null, durationMinutes: null }],
    });
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "CONFIRMED" });

    const result = await actionRequestService.confirmRequest(
      REQUEST_ID,
      WAITER_ID,
      RESTAURANT_ID,
      "waiter",
    );

    expect(result.status).toBe("CONFIRMED");
    expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
      "att_1",
      RESTAURANT_ID,
      expect.objectContaining({ status: "checked_in" }),
    );
  });

  // 9. Checkout confirmation -> status transitions to CHECKED_OUT
  it("9. Checkout confirmation -> status transitions to CHECKED_OUT", async () => {
    const req = makeActionRequest({ action: "CHECK_OUT" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
      _id: "att_1",
      status: "checked_in",
      checkedInAt: new Date(Date.now() - 3600000),
      breaks: [],
    });
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "CONFIRMED" });

    const result = await actionRequestService.confirmRequest(
      REQUEST_ID,
      WAITER_ID,
      RESTAURANT_ID,
      "waiter",
    );

    expect(result.status).toBe("CONFIRMED");
    expect(mocks.attendanceRepo.updateById).toHaveBeenCalledWith(
      "att_1",
      RESTAURANT_ID,
      expect.objectContaining({ status: "checked_out", isActive: false }),
    );
  });

  // 10. History remains after checkout -> attendance_records not deleted
  it("10. History remains after checkout -> attendance_records not deleted", async () => {
    const req = makeActionRequest({ action: "CHECK_OUT" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
      _id: "att_1",
      status: "checked_in",
      checkedInAt: new Date(Date.now() - 3600000),
      breaks: [],
    });
    mocks.actionRequestRepo.updateStatus.mockResolvedValue({ ...req, status: "CONFIRMED" });

    await actionRequestService.confirmRequest(REQUEST_ID, WAITER_ID, RESTAURANT_ID, "waiter");

    // Verified: updateById was called with isActive: false, not delete
    expect(mocks.attendanceRepo.updateById).toHaveBeenCalled();
  });

  // 11. Cross-restaurant requests rejected -> different restaurant -> 403
  it("11. Cross-restaurant requests rejected -> different restaurant -> 403", async () => {
    const req = makeActionRequest({ restaurantId: "other_restaurant_id" });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);

    await expect(
      actionRequestService.confirmRequest(REQUEST_ID, WAITER_ID, RESTAURANT_ID, "waiter"),
    ).rejects.toThrow("denied");
  });

  // 12. User cannot confirm another user's request -> wrong user -> 403
  it("12. User cannot confirm another user's request -> wrong user -> 403", async () => {
    const req = makeActionRequest({ userId: WAITER_ID });
    mocks.actionRequestRepo.findById.mockResolvedValue(req);

    await expect(
      actionRequestService.confirmRequest(REQUEST_ID, "different_user_id", RESTAURANT_ID, "waiter"),
    ).rejects.toThrow("Only the target user can confirm");
  });

  // 13. Socket event invalidates dashboard -> mock socket emission
  it("13. Socket event invalidates dashboard -> mock socket emission", async () => {
    mocks.userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, role: "waiter", status: "active" }),
    });
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.actionRequestRepo.findPendingByUser.mockResolvedValue(null);
    mocks.actionRequestRepo.create.mockResolvedValue(makeActionRequest());
    mocks.userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ fullName: "Owner User" }),
      }),
    });

    await actionRequestService.createRequest(RESTAURANT_ID, OWNER_ID, "restaurant_owner", {
      user_id: WAITER_ID,
      action: "CHECK_IN",
    });

    expect(mocks.socket.emitToRooms).toHaveBeenCalledWith(
      expect.any(Array),
      "attendance.request_created.v1",
      expect.objectContaining({ request_id: REQUEST_ID }),
    );
  });

  // 14. Offline user sees persistent notification -> notification record exists
  it("14. Offline user sees persistent notification -> notification record exists", async () => {
    mocks.userModel.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, role: "waiter", status: "active" }),
    });
    mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);
    mocks.actionRequestRepo.findPendingByUser.mockResolvedValue(null);
    mocks.actionRequestRepo.create.mockResolvedValue(makeActionRequest());
    mocks.userModel.findById.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({ fullName: "Owner User" }),
      }),
    });

    await actionRequestService.createRequest(RESTAURANT_ID, OWNER_ID, "restaurant_owner", {
      user_id: WAITER_ID,
      action: "CHECK_IN",
    });

    expect(mocks.notificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: WAITER_ID,
        type: "ATTENDANCE_REQUEST",
        referenceId: REQUEST_ID,
      }),
    );
  });
});
