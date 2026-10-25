// ─── Table Assignment Service Unit Tests ──────────────────────────────────────
// Module: table | Phase 2 features unit test

import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  tableRepo: {
    findById: vi.fn(),
    findByRestaurant: vi.fn(),
    findByTableNumber: vi.fn(),
    create: vi.fn(),
    updateById: vi.fn(),
    deleteById: vi.fn(),
  },
  tableAssignmentRepo: {
    create: vi.fn(),
    findActiveByTable: vi.fn(),
    findActiveByWaiter: vi.fn(),
    countActiveByWaiter: vi.fn(),
    updateStatus: vi.fn(),
    findHistoryByTable: vi.fn(),
  },
  tableSessionRepo: {
    findByTable: vi.fn(),
    upsertSession: vi.fn(),
    findAllByRestaurant: vi.fn(),
    clearSession: vi.fn(),
  },
  tableAuditLogRepo: {
    create: vi.fn(),
    findByTable: vi.fn(),
  },
  attendanceRepo: {
    findActiveForUser: vi.fn(),
  },
  userModel: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("../../infrastructure/repositories/table.repository.js", () => ({
  tableRepository: mocks.tableRepo,
}));
vi.mock("../../infrastructure/repositories/table-assignment.repository.js", () => ({
  tableAssignmentRepository: mocks.tableAssignmentRepo,
}));
vi.mock("../../infrastructure/repositories/table-session.repository.js", () => ({
  tableSessionRepository: mocks.tableSessionRepo,
}));
vi.mock("../../infrastructure/repositories/table-audit-log.repository.js", () => ({
  tableAuditLogRepository: mocks.tableAuditLogRepo,
}));
vi.mock("../../../attendance/public.js", () => ({
  attendanceRepository: mocks.attendanceRepo,
}));
vi.mock("../../../../shared/database/transaction.js", () => ({
  withTransaction: vi.fn((fn: any) => fn(null)),
}));
vi.mock("../../../auth/infrastructure/models/user.model.js", () => ({
  UserModel: mocks.userModel,
}));

import { tableService } from "../../application/services/table.service.js";

const RESTAURANT_ID = "507f1f77bcf86cd799439011";
const TABLE_ID = "507f1f77bcf86cd799439022";
const WAITER_ID = "507f1f77bcf86cd799439033";
const MANAGER_ID = "507f1f77bcf86cd799439044";

describe("Table Assignment Service (Phase 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("claimTable", () => {
    it("should allow a checked-in waiter to claim a table", async () => {
      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "John Waiter" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
        status: "checked_in",
      });
      mocks.tableRepo.findById.mockResolvedValue({
        _id: TABLE_ID,
        tableNumber: 5,
        capacity: 4,
        isBooked: false,
      });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue(null);
      mocks.tableAssignmentRepo.create.mockResolvedValue({
        _id: "assign_1",
        assignedAt: new Date(),
      });

      const result = await tableService.claimTable(TABLE_ID, RESTAURANT_ID, WAITER_ID, "waiter");

      expect(result).toBeDefined();
      expect(result.waiter_id).toBe(WAITER_ID);
      expect(result.status).toBe("ACTIVE");
      expect(mocks.tableSessionRepo.upsertSession).toHaveBeenCalled();
      expect(mocks.tableAuditLogRepo.create).toHaveBeenCalled();
    });

    it("should reject claim if waiter is not checked in", async () => {
      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "John Waiter" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue(null);

      await expect(
        tableService.claimTable(TABLE_ID, RESTAURANT_ID, WAITER_ID, "waiter"),
      ).rejects.toThrow("Waiter must be active and checked in");
    });

    it("should throw 409 conflict if table is already claimed", async () => {
      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "John Waiter" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
        status: "checked_in",
      });
      mocks.tableRepo.findById.mockResolvedValue({
        _id: TABLE_ID,
        tableNumber: 5,
      });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({
        _id: "existing_assign",
        waiterId: "other_waiter",
      });

      await expect(
        tableService.claimTable(TABLE_ID, RESTAURANT_ID, WAITER_ID, "waiter"),
      ).rejects.toThrow("Table is already claimed or assigned");
    });
  });

  describe("reassignTable", () => {
    it("should reassign table to a new waiter and audit the change", async () => {
      const NEW_WAITER_ID = "507f1f77bcf86cd799439055";

      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: NEW_WAITER_ID, name: "Jane Waiter" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({
        status: "checked_in",
      });
      mocks.tableRepo.findById.mockResolvedValue({
        _id: TABLE_ID,
        tableNumber: 5,
      });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({
        _id: "old_assign",
        waiterId: WAITER_ID,
      });
      mocks.tableAssignmentRepo.create.mockResolvedValue({
        _id: "new_assign",
        assignedAt: new Date(),
      });

      const result = await tableService.reassignTable(
        TABLE_ID,
        RESTAURANT_ID,
        NEW_WAITER_ID,
        MANAGER_ID,
        "manager",
        "Shift handover",
      );

      expect(result.previous_waiter_id).toBe(WAITER_ID);
      expect(result.new_waiter_id).toBe(NEW_WAITER_ID);
      expect(mocks.tableAssignmentRepo.updateStatus).toHaveBeenCalledWith(
        "old_assign",
        "REASSIGNED",
        "Shift handover",
        null,
      );
      expect(mocks.tableAuditLogRepo.create).toHaveBeenCalled();
    });
  });

  describe("releaseTable", () => {
    it("should release active table assignment and clear session", async () => {
      mocks.tableRepo.findById.mockResolvedValue({
        _id: TABLE_ID,
        tableNumber: 5,
      });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({
        _id: "active_assign",
      });

      const result = await tableService.releaseTable(
        TABLE_ID,
        RESTAURANT_ID,
        MANAGER_ID,
        "manager",
        "Table finished",
      );

      expect(result.success).toBe(true);
      expect(mocks.tableAssignmentRepo.updateStatus).toHaveBeenCalledWith(
        "active_assign",
        "RELEASED",
        "Table finished",
        null,
      );
      expect(mocks.tableSessionRepo.clearSession).toHaveBeenCalled();
    });
  });
});
