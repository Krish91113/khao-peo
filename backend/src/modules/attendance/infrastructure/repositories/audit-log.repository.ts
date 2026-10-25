// ─── Attendance Audit Log Repository ─────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// FRD Section 16: Persists attendance audit events.

import mongoose from "mongoose";
import {
  AttendanceAuditLogModel,
  type CreateAttendanceAuditData,
  type IAttendanceAuditLog,
} from "../models/audit-log.model.js";

export const attendanceAuditLogRepository = {
  /**
   * Write a new attendance audit event.
   */
  async create(data: CreateAttendanceAuditData): Promise<IAttendanceAuditLog> {
    const docs = await AttendanceAuditLogModel.create([
      {
        ...data,
        restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
        actorId: new mongoose.Types.ObjectId(data.actorId),
        entityId: new mongoose.Types.ObjectId(data.entityId),
        userId: new mongoose.Types.ObjectId(data.userId),
      },
    ]);
    return docs[0]!;
  },

  /**
   * List audit events for an attendance record (tenant-scoped).
   */
  async findByEntity(entityId: string, restaurantId: string): Promise<IAttendanceAuditLog[]> {
    return AttendanceAuditLogModel.find({ entityId, restaurantId }).sort({ createdAt: -1 });
  },
};
