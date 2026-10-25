// ─── Attendance Audit Log Mongoose Model ─────────────────────────────────────
// Module: attendance | Layer: infrastructure
// FRD Section 16: Every attendance mutation generates an immutable audit event.

import mongoose, { Schema, type Document } from "mongoose";

export interface IAttendanceAuditLog extends Document {
  restaurantId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonText?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAttendanceAuditData {
  restaurantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonText?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const attendanceAuditLogSchema = new Schema<IAttendanceAuditLog>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    actorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    reasonText: {
      type: String,
    },
    requestId: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  { timestamps: true, collection: "attendance_audit_logs" },
);

attendanceAuditLogSchema.index({ restaurantId: 1, createdAt: -1 });
attendanceAuditLogSchema.index({ entityId: 1, createdAt: -1 });
attendanceAuditLogSchema.index({ userId: 1, createdAt: -1 });
attendanceAuditLogSchema.index({ action: 1, createdAt: -1 });

export const AttendanceAuditLogModel = mongoose.model<IAttendanceAuditLog>(
  "AttendanceAuditLog",
  attendanceAuditLogSchema,
);
