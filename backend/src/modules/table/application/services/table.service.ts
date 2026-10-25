// ─── Table Application Service ───────────────────────────────────────────────
// Module: table | Layer: application

import mongoose from "mongoose";
import { tableRepository } from "../../infrastructure/repositories/table.repository.js";
import { tableAssignmentRepository } from "../../infrastructure/repositories/table-assignment.repository.js";
import { tableSessionRepository } from "../../infrastructure/repositories/table-session.repository.js";
import { tableAuditLogRepository } from "../../infrastructure/repositories/table-audit-log.repository.js";
import { attendanceRepository } from "../../../attendance/public.js";
import {
  resourceNotFound,
  validationFailed,
  tableAlreadyAssigned,
  permissionDenied,
} from "../../../../shared/errors/app-error.js";
import { withTransaction } from "../../../../shared/database/transaction.js";
import { UserModel } from "../../../auth/infrastructure/models/user.model.js";

export const tableService = {
  async getTables(restaurantId: string) {
    const tables = await tableRepository.findByRestaurant(restaurantId);
    return tables.map((t) => ({
      _id: String(t._id),
      id: String(t._id),
      table_number: String(t.tableNumber),
      capacity: t.capacity,
      is_booked: t.isBooked,
      current_order_id: t.currentOrder ? String(t.currentOrder) : null,
    }));
  },

  async getTableById(id: string, restaurantId: string) {
    const table = await tableRepository.findById(id, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", id);
    }
    return {
      _id: String(table._id),
      id: String(table._id),
      table_number: String(table.tableNumber),
      capacity: table.capacity,
      is_booked: table.isBooked,
      current_order_id: table.currentOrder ? String(table.currentOrder) : null,
    };
  },

  async createTable(restaurantId: string, data: { tableNumber: number; capacity?: number }) {
    const existing = await tableRepository.findByTableNumber(data.tableNumber, restaurantId);
    if (existing) {
      throw validationFailed("Table number already exists in this restaurant");
    }

    const table = await tableRepository.create({
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      tableNumber: data.tableNumber,
      capacity: data.capacity || 4,
    });

    return {
      _id: String(table._id),
      id: String(table._id),
      table_number: String(table.tableNumber),
      capacity: table.capacity,
      is_booked: table.isBooked,
      current_order_id: null,
    };
  },

  async updateTableStatus(
    id: string,
    restaurantId: string,
    data: { isBooked: boolean; currentOrderId?: string | null },
  ) {
    const table = await tableRepository.findById(id, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", id);
    }

    const currentOrder = data.currentOrderId
      ? new mongoose.Types.ObjectId(data.currentOrderId)
      : null;
    const updated = await tableRepository.updateById(id, restaurantId, {
      isBooked: data.isBooked,
      currentOrder,
    });

    if (!updated) {
      throw resourceNotFound("Table", id);
    }

    return {
      _id: String(updated._id),
      id: String(updated._id),
      table_number: String(updated.tableNumber),
      capacity: updated.capacity,
      is_booked: updated.isBooked,
      current_order_id: updated.currentOrder ? String(updated.currentOrder) : null,
    };
  },

  async deleteTable(id: string, restaurantId: string) {
    const table = await tableRepository.findById(id, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", id);
    }

    if (table.isBooked) {
      throw validationFailed(
        "Cannot delete a table that is currently booked. Please reset/serve the table first.",
      );
    }

    await tableRepository.deleteById(id, restaurantId);
    return { success: true, message: `Table ${table.tableNumber} deleted successfully` };
  },

  async resetTable(id: string, restaurantId: string, userId: string) {
    return withTransaction(async (session) => {
      const table = await tableRepository.findById(id, restaurantId);
      if (!table) {
        throw resourceNotFound("Table", id);
      }

      // Dynamically load models to avoid cyclic dependency issues
      const Order = mongoose.model("Order");
      const Bill = mongoose.model("Bill");
      const ServedOrder = mongoose.model("ServedOrder");

      // Find all current orders for this table session
      const orders = await Order.find({ table: table._id, restaurantId }).session(session).lean();
      const bills = await Bill.find({ table: table._id, restaurantId }).session(session).lean();

      if (orders.length > 0) {
        const totalBillAmount = orders.reduce(
          (sum, order: any) => sum + (order.totalAmount || 0),
          0,
        );

        // Sort bills to find the latest
        const latestBill =
          bills.length > 0
            ? [...bills].sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())[0]
            : null;

        // Archive into ServedOrder
        await ServedOrder.create(
          [
            {
              restaurantId: new mongoose.Types.ObjectId(restaurantId),
              tableNumber: table.tableNumber,
              orders: orders.map((o: any) => ({
                orderId: String(o._id),
                items: o.items.map((item: any) => ({
                  item_name: item.item_name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                totalAmount: o.totalAmount,
                status: o.status,
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
              })),
              totalBillAmount,
              billDetails: latestBill
                ? {
                    billId: String((latestBill as any)._id),
                    subtotal: (latestBill as any).subtotal,
                    tax: (latestBill as any).tax,
                    discount: (latestBill as any).discount || 0,
                    total: (latestBill as any).totalAmount,
                    createdAt: (latestBill as any).createdAt,
                  }
                : null,
              servedBy: new mongoose.Types.ObjectId(userId),
              servedAt: new Date(),
            },
          ],
          { session },
        );
      }

      // Clean up orders and bills
      await Order.deleteMany({ table: table._id, restaurantId }).session(session);
      await Bill.deleteMany({ table: table._id, restaurantId }).session(session);

      // Reset table status & assignment
      table.isBooked = false;
      table.currentOrder = null;
      await table.save({ session });

      const activeAssignment = await tableAssignmentRepository.findActiveByTable(id, restaurantId, session);
      if (activeAssignment) {
        await tableAssignmentRepository.updateStatus(activeAssignment._id, "RELEASED", "Table reset", session);
      }
      await tableSessionRepository.clearSession(id, restaurantId, session);

      return {
        _id: String(table._id),
        id: String(table._id),
        table_number: String(table.tableNumber),
        capacity: table.capacity,
        is_booked: false,
        current_order_id: null,
      };
    });
  },

  // ─── Phase 2 Features ──────────────────────────────────────────────────────

  async getFloorView(restaurantId: string) {
    const tables = await tableRepository.findByRestaurant(restaurantId);
    const sessions = await tableSessionRepository.findAllByRestaurant(restaurantId);

    const sessionMap = new Map(sessions.map((s) => [String(s.tableId), s]));
    const waiterIds = new Set<string>();

    for (const s of sessions) {
      if (s.currentWaiterId) {
        waiterIds.add(String(s.currentWaiterId));
      }
    }

    const waiters = await UserModel.find({ _id: { $in: Array.from(waiterIds) } }).lean();
    const waiterMap = new Map(waiters.map((w: any) => [String(w._id), w]));

    // Calculate waiter workload counts
    const waiterWorkloadMap = new Map<string, { waiter_id: string; waiter_name: string; active_table_count: number }>();
    for (const s of sessions) {
      if (s.currentWaiterId && s.status === "OCCUPIED") {
        const wId = String(s.currentWaiterId);
        const wObj = waiterMap.get(wId);
        const existing = waiterWorkloadMap.get(wId) || {
          waiter_id: wId,
          waiter_name: wObj ? wObj.name : "Unknown",
          active_table_count: 0,
        };
        existing.active_table_count += 1;
        waiterWorkloadMap.set(wId, existing);
      }
    }

    const floorTables = tables.map((t) => {
      const s = sessionMap.get(String(t._id));
      const waiter = s?.currentWaiterId ? waiterMap.get(String(s.currentWaiterId)) : null;

      return {
        _id: String(t._id),
        id: String(t._id),
        table_number: String(t.tableNumber),
        capacity: t.capacity,
        is_booked: t.isBooked,
        current_order_id: t.currentOrder ? String(t.currentOrder) : null,
        status: s ? s.status : t.isBooked ? "OCCUPIED" : "VACANT",
        active_waiter: waiter
          ? {
              id: String(waiter._id),
              name: waiter.name,
              email: waiter.email,
            }
          : null,
      };
    });

    return {
      tables: floorTables,
      waiter_workload: Array.from(waiterWorkloadMap.values()),
    };
  },

  async assertWaiterCheckedIn(waiterId: string, restaurantId: string) {
    const user = await UserModel.findById(waiterId).lean();
    if (!user) {
      throw resourceNotFound("User", waiterId);
    }
    const attendance = await attendanceRepository.findActiveForUser(waiterId, restaurantId);
    if (!attendance || attendance.status !== "checked_in") {
      throw validationFailed("Waiter must be active and checked in (on duty) to handle tables");
    }
  },

  async claimTable(tableId: string, restaurantId: string, waiterId: string, actorRole: string) {
    await this.assertWaiterCheckedIn(waiterId, restaurantId);

    const table = await tableRepository.findById(tableId, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", tableId);
    }

    return withTransaction(async (session) => {
      const activeAssignment = await tableAssignmentRepository.findActiveByTable(
        tableId,
        restaurantId,
        session,
      );

      if (activeAssignment) {
        throw tableAlreadyAssigned("Table is already claimed or assigned to another waiter");
      }

      const assignment = await tableAssignmentRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          tableId: new mongoose.Types.ObjectId(tableId),
          waiterId: new mongoose.Types.ObjectId(waiterId),
          assignedBy: new mongoose.Types.ObjectId(waiterId),
          status: "ACTIVE",
        },
        session,
      );

      await tableSessionRepository.upsertSession(
        tableId,
        restaurantId,
        {
          currentWaiterId: new mongoose.Types.ObjectId(waiterId),
          activeAssignmentId: assignment._id,
          status: "OCCUPIED",
          sessionStartAt: new Date(),
        },
        session,
      );

      await tableRepository.updateById(
        tableId,
        restaurantId,
        { isBooked: true },
      );

      await tableAuditLogRepository.create({
        restaurantId,
        actorId: waiterId,
        actorRole,
        action: "TABLE_CLAIMED",
        entityType: "TABLE_ASSIGNMENT",
        entityId: String(assignment._id),
        tableId,
        after: { waiter_id: waiterId, table_id: tableId },
      });

      return {
        assignment_id: String(assignment._id),
        table_id: tableId,
        waiter_id: waiterId,
        status: "ACTIVE",
        assigned_at: assignment.assignedAt,
      };
    });
  },

  async assignTable(
    tableId: string,
    restaurantId: string,
    waiterId: string,
    managerId: string,
    managerRole: string,
  ) {
    await this.assertWaiterCheckedIn(waiterId, restaurantId);

    const table = await tableRepository.findById(tableId, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", tableId);
    }

    return withTransaction(async (session) => {
      const activeAssignment = await tableAssignmentRepository.findActiveByTable(
        tableId,
        restaurantId,
        session,
      );

      if (activeAssignment) {
        throw tableAlreadyAssigned("Table is already assigned. Use reassign API to change waiter.");
      }

      const assignment = await tableAssignmentRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          tableId: new mongoose.Types.ObjectId(tableId),
          waiterId: new mongoose.Types.ObjectId(waiterId),
          assignedBy: new mongoose.Types.ObjectId(managerId),
          status: "ACTIVE",
        },
        session,
      );

      await tableSessionRepository.upsertSession(
        tableId,
        restaurantId,
        {
          currentWaiterId: new mongoose.Types.ObjectId(waiterId),
          activeAssignmentId: assignment._id,
          status: "OCCUPIED",
          sessionStartAt: new Date(),
        },
        session,
      );

      await tableRepository.updateById(
        tableId,
        restaurantId,
        { isBooked: true },
      );

      await tableAuditLogRepository.create({
        restaurantId,
        actorId: managerId,
        actorRole: managerRole,
        action: "TABLE_ASSIGNED",
        entityType: "TABLE_ASSIGNMENT",
        entityId: String(assignment._id),
        tableId,
        after: { waiter_id: waiterId, assigned_by: managerId },
      });

      return {
        assignment_id: String(assignment._id),
        table_id: tableId,
        waiter_id: waiterId,
        assigned_by: managerId,
        status: "ACTIVE",
        assigned_at: assignment.assignedAt,
      };
    });
  },

  async reassignTable(
    tableId: string,
    restaurantId: string,
    newWaiterId: string,
    managerId: string,
    managerRole: string,
    reason?: string,
  ) {
    await this.assertWaiterCheckedIn(newWaiterId, restaurantId);

    const table = await tableRepository.findById(tableId, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", tableId);
    }

    return withTransaction(async (session) => {
      const activeAssignment = await tableAssignmentRepository.findActiveByTable(
        tableId,
        restaurantId,
        session,
      );

      if (!activeAssignment) {
        throw validationFailed("Table has no active assignment to reassign");
      }

      const oldWaiterId = String(activeAssignment.waiterId);

      await tableAssignmentRepository.updateStatus(
        activeAssignment._id,
        "REASSIGNED",
        reason || "Reassigned by manager",
        session,
      );

      const newAssignment = await tableAssignmentRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          tableId: new mongoose.Types.ObjectId(tableId),
          waiterId: new mongoose.Types.ObjectId(newWaiterId),
          assignedBy: new mongoose.Types.ObjectId(managerId),
          status: "ACTIVE",
        },
        session,
      );

      await tableSessionRepository.upsertSession(
        tableId,
        restaurantId,
        {
          currentWaiterId: new mongoose.Types.ObjectId(newWaiterId),
          activeAssignmentId: newAssignment._id,
          status: "OCCUPIED",
        },
        session,
      );

      await tableAuditLogRepository.create({
        restaurantId,
        actorId: managerId,
        actorRole: managerRole,
        action: "TABLE_REASSIGNED",
        entityType: "TABLE_ASSIGNMENT",
        entityId: String(newAssignment._id),
        tableId,
        before: { waiter_id: oldWaiterId },
        after: { waiter_id: newWaiterId, reassigned_by: managerId },
        reasonText: reason,
      });

      return {
        assignment_id: String(newAssignment._id),
        table_id: tableId,
        previous_waiter_id: oldWaiterId,
        new_waiter_id: newWaiterId,
        reassigned_by: managerId,
        status: "ACTIVE",
        assigned_at: newAssignment.assignedAt,
      };
    });
  },

  async releaseTable(
    tableId: string,
    restaurantId: string,
    actorId: string,
    actorRole: string,
    reason?: string,
  ) {
    const table = await tableRepository.findById(tableId, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", tableId);
    }

    return withTransaction(async (session) => {
      const activeAssignment = await tableAssignmentRepository.findActiveByTable(
        tableId,
        restaurantId,
        session,
      );

      if (activeAssignment) {
        await tableAssignmentRepository.updateStatus(
          activeAssignment._id,
          "RELEASED",
          reason || "Table released",
          session,
        );
      }

      await tableSessionRepository.clearSession(tableId, restaurantId, session);
      await tableRepository.updateById(tableId, restaurantId, { isBooked: false });

      await tableAuditLogRepository.create({
        restaurantId,
        actorId,
        actorRole,
        action: "TABLE_RELEASED",
        entityType: "TABLE_SESSION",
        entityId: String(table._id),
        tableId,
        reasonText: reason,
      });

      return { success: true, message: `Table ${table.tableNumber} released successfully` };
    });
  },

  async getAssignmentHistory(tableId: string, restaurantId: string) {
    const table = await tableRepository.findById(tableId, restaurantId);
    if (!table) {
      throw resourceNotFound("Table", tableId);
    }

    const history = await tableAssignmentRepository.findHistoryByTable(tableId, restaurantId);
    return history.map((h: any) => ({
      assignment_id: String(h._id),
      table_id: String(h.tableId),
      waiter: h.waiterId
        ? { id: String(h.waiterId._id), name: h.waiterId.name, email: h.waiterId.email }
        : null,
      assigned_by: h.assignedBy
        ? { id: String(h.assignedBy._id), name: h.assignedBy.name, email: h.assignedBy.email }
        : null,
      assigned_at: h.assignedAt,
      released_at: h.releasedAt,
      release_reason: h.releaseReason,
      status: h.status,
    }));
  },

  async getWaiterActiveTableCount(waiterId: string, restaurantId: string): Promise<number> {
    return tableAssignmentRepository.countActiveByWaiter(waiterId, restaurantId);
  },
};
