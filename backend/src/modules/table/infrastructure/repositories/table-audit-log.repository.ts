// ─── Table Audit Log Repository ───────────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose from "mongoose";
import { TableAuditLogModel, type ITableAuditLog } from "../models/table-audit-log.model.js";

export const tableAuditLogRepository = {
  async create(data: {
    restaurantId: string;
    actorId: string;
    actorRole: string;
    action: "TABLE_CLAIMED" | "TABLE_ASSIGNED" | "TABLE_REASSIGNED" | "TABLE_RELEASED" | "TABLE_RESET";
    entityType: "TABLE_ASSIGNMENT" | "TABLE_SESSION";
    entityId: string;
    tableId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    reasonText?: string | null;
  }): Promise<ITableAuditLog> {
    const docs = await TableAuditLogModel.create([
      {
        ...data,
        restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
        actorId: new mongoose.Types.ObjectId(data.actorId),
        entityId: new mongoose.Types.ObjectId(data.entityId),
        tableId: new mongoose.Types.ObjectId(data.tableId),
      },
    ]);
    return docs[0]!;
  },

  async findByTable(tableId: string, restaurantId: string): Promise<ITableAuditLog[]> {
    return TableAuditLogModel.find({ tableId, restaurantId }).sort({ createdAt: -1 });
  },
};
