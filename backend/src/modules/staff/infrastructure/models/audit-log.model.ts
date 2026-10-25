// ─── Staff Audit Log Mongoose Model ──────────────────────────────────────────
// Module: staff | Layer: infrastructure
// KP-FRD-002 Section 24: Every mutation on staff generates an audit event.

import mongoose, { Schema, type Document } from "mongoose";

export interface IStaffAuditLog extends Document {
  restaurantId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: mongoose.Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonCode?: string;
  reasonText?: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface CreateAuditLogData {
  restaurantId: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reasonCode?: string;
  reasonText?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const staffAuditLogSchema = new Schema<IStaffAuditLog>(
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
    before: {
      type: Schema.Types.Mixed,
    },
    after: {
      type: Schema.Types.Mixed,
    },
    reasonCode: {
      type: String,
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
  { timestamps: true, collection: "staff_audit_logs" },
);

staffAuditLogSchema.index({ restaurantId: 1, createdAt: -1 });
staffAuditLogSchema.index({ entityId: 1, createdAt: -1 });
staffAuditLogSchema.index({ action: 1, createdAt: -1 });

export const StaffAuditLogModel = mongoose.model<IStaffAuditLog>(
  "StaffAuditLog",
  staffAuditLogSchema,
);
