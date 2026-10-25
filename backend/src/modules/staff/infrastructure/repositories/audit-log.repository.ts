// ─── Staff Audit Log Repository ──────────────────────────────────────────────
// Module: staff | Layer: infrastructure
// KP-FRD-002 Section 24: Persists audit events (BR-009).

import mongoose from "mongoose";
import {
  StaffAuditLogModel,
  type CreateAuditLogData,
  type IStaffAuditLog,
} from "../models/audit-log.model.js";

export const auditLogRepository = {
  /**
   * Write a new audit event.
   */
  async create(
    data: CreateAuditLogData,
    session?: mongoose.ClientSession,
  ): Promise<IStaffAuditLog> {
    const docs = await StaffAuditLogModel.create(
      [
        {
          ...data,
          restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
          actorId: new mongoose.Types.ObjectId(data.actorId),
          entityId: new mongoose.Types.ObjectId(data.entityId),
        },
      ],
      session ? { session } : {},
    );
    return docs[0]!;
  },

  /**
   * List audit events for a staff member (tenant-scoped).
   */
  async findByEntity(entityId: string, restaurantId: string): Promise<IStaffAuditLog[]> {
    return StaffAuditLogModel.find({ entityId, restaurantId }).sort({ createdAt: -1 });
  },
};
