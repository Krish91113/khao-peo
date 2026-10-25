// ─── Table Assignment Routes Integration Tests ──────────────────────────────
// Module: table | Phase 2 features integration test

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { resolvePermissions } from "../../../../shared/auth/permission-catalog.js";
import { errorHandler } from "../../../../shared/errors/error-handler.js";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
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
    reqCtx.context = {
      user_id: u.id,
      restaurant_id: u.restaurantId,
      role: u.role,
      permissions: u.permissions ?? [],
    };
    (next as () => void)();
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

import tableRoutes from "../../api/routes.js";

const app = express();
app.use(express.json());
app.use("/api/v1/tables", tableRoutes);
app.use(errorHandler);

const RESTAURANT_ID = "507f1f77bcf86cd799439011";
const WAITER_ID = "507f1f77bcf86cd799439033";
const MANAGER_ID = "507f1f77bcf86cd799439044";
const TABLE_ID = "507f1f77bcf86cd799439022";

function authenticateAs(role: "waiter" | "manager" | "restaurant_owner", userId: string) {
  mocks.auth.mockReturnValue({
    id: userId,
    restaurantId: RESTAURANT_ID,
    role,
    status: "active",
    permissions: resolvePermissions(role as any),
  });
}

describe("Table Assignment API Routes (Phase 2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/tables/floor", () => {
    it("should return 200 OK with floor overview", async () => {
      authenticateAs("waiter", WAITER_ID);
      mocks.tableRepo.findByRestaurant.mockResolvedValue([
        { _id: TABLE_ID, tableNumber: 1, capacity: 4, isBooked: false, currentOrder: null },
      ]);
      mocks.tableSessionRepo.findAllByRestaurant.mockResolvedValue([]);
      mocks.userModel.find.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      const res = await request(app).get("/api/v1/tables/floor");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tables).toHaveLength(1);
    });
  });

  describe("POST /api/v1/tables/:id/claim", () => {
    it("should allow a checked-in waiter to claim a table (201 Created)", async () => {
      authenticateAs("waiter", WAITER_ID);

      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "Waiter Bob" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({ status: "checked_in" });
      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue(null);
      mocks.tableAssignmentRepo.create.mockResolvedValue({
        _id: "assign_123",
        assignedAt: new Date(),
      });

      const res = await request(app).post(`/api/v1/tables/${TABLE_ID}/claim`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.assignment_id).toBe("assign_123");
    });

    it("should return 409 Conflict if table is already claimed", async () => {
      authenticateAs("waiter", WAITER_ID);

      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "Waiter Bob" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({ status: "checked_in" });
      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({ _id: "existing_assign" });

      const res = await request(app).post(`/api/v1/tables/${TABLE_ID}/claim`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("TABLE_ALREADY_ASSIGNED");
    });
  });

  describe("POST /api/v1/tables/:id/assign", () => {
    it("should allow manager to assign table (201 Created)", async () => {
      authenticateAs("manager", MANAGER_ID);

      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: WAITER_ID, name: "Waiter Bob" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({ status: "checked_in" });
      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue(null);
      mocks.tableAssignmentRepo.create.mockResolvedValue({
        _id: "assign_mgr_1",
        assignedAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/v1/tables/${TABLE_ID}/assign`)
        .send({ waiterId: WAITER_ID });

      expect(res.status).toBe(201);
      expect(res.body.data.assigned_by).toBe(MANAGER_ID);
    });
  });

  describe("POST /api/v1/tables/:id/reassign", () => {
    it("should allow manager to reassign table (200 OK)", async () => {
      const NEW_WAITER_ID = "507f1f77bcf86cd799439099";
      authenticateAs("manager", MANAGER_ID);

      mocks.userModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: NEW_WAITER_ID, name: "Waiter Alice" }),
      });
      mocks.attendanceRepo.findActiveForUser.mockResolvedValue({ status: "checked_in" });
      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({
        _id: "old_assign",
        waiterId: WAITER_ID,
      });
      mocks.tableAssignmentRepo.create.mockResolvedValue({
        _id: "new_assign",
        assignedAt: new Date(),
      });

      const res = await request(app)
        .post(`/api/v1/tables/${TABLE_ID}/reassign`)
        .send({ waiterId: NEW_WAITER_ID, reason: "Busy shift" });

      expect(res.status).toBe(200);
      expect(res.body.data.new_waiter_id).toBe(NEW_WAITER_ID);
    });
  });

  describe("POST /api/v1/tables/:id/release", () => {
    it("should release table assignment (200 OK)", async () => {
      authenticateAs("waiter", WAITER_ID);

      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findActiveByTable.mockResolvedValue({ _id: "active_assign" });

      const res = await request(app).post(`/api/v1/tables/${TABLE_ID}/release`);

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
    });
  });

  describe("GET /api/v1/tables/:id/assignment_history", () => {
    it("should return assignment history array (200 OK)", async () => {
      authenticateAs("manager", MANAGER_ID);

      mocks.tableRepo.findById.mockResolvedValue({ _id: TABLE_ID, tableNumber: 1 });
      mocks.tableAssignmentRepo.findHistoryByTable.mockResolvedValue([
        {
          _id: "hist_1",
          tableId: TABLE_ID,
          waiterId: { _id: WAITER_ID, name: "Bob", email: "bob@test.com" },
          assignedBy: { _id: MANAGER_ID, name: "Mgr", email: "mgr@test.com" },
          assignedAt: new Date(),
          status: "RELEASED",
        },
      ]);

      const res = await request(app).get(`/api/v1/tables/${TABLE_ID}/assignment_history`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
