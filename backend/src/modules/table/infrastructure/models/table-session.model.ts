// ─── Table Session Mongoose Model ─────────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface ITableSession extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  currentWaiterId?: mongoose.Types.ObjectId | null;
  activeAssignmentId?: mongoose.Types.ObjectId | null;
  status: "VACANT" | "OCCUPIED" | "RESERVED";
  sessionStartAt?: Date | null;
  sessionEndAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TableSessionSchema = new Schema<ITableSession>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    tableId: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    currentWaiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    activeAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: "TableAssignment",
      default: null,
    },
    status: {
      type: String,
      enum: ["VACANT", "OCCUPIED", "RESERVED"],
      default: "VACANT",
      index: true,
    },
    sessionStartAt: {
      type: Date,
      default: null,
    },
    sessionEndAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

TableSessionSchema.index({ restaurantId: 1, tableId: 1 });

export const TableSessionModel: mongoose.Model<ITableSession> =
  (mongoose.models.TableSession as mongoose.Model<ITableSession> | undefined) ||
  mongoose.model<ITableSession>("TableSession", TableSessionSchema);
