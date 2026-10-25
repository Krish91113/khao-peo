// ─── Table Audit Log Mongoose Model ───────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface ITableAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  actorId: mongoose.Types.ObjectId;
  actorRole: string;
  action: "TABLE_CLAIMED" | "TABLE_ASSIGNED" | "TABLE_REASSIGNED" | "TABLE_RELEASED" | "TABLE_RESET";
  entityType: "TABLE_ASSIGNMENT" | "TABLE_SESSION";
  entityId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reasonText?: string | null;
  createdAt: Date;
}

const TableAuditLogSchema = new Schema<ITableAuditLog>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
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
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    reasonText: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

TableAuditLogSchema.index({ restaurantId: 1, tableId: 1, createdAt: -1 });

export const TableAuditLogModel: mongoose.Model<ITableAuditLog> =
  (mongoose.models.TableAuditLog as mongoose.Model<ITableAuditLog> | undefined) ||
  mongoose.model<ITableAuditLog>("TableAuditLog", TableAuditLogSchema);
