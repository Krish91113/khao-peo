// ─── Table Assignment Mongoose Model ──────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface ITableAssignment extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  tableId: mongoose.Types.ObjectId;
  waiterId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  releasedAt?: Date | null;
  releaseReason?: string | null;
  status: "ACTIVE" | "RELEASED" | "REASSIGNED";
  createdAt: Date;
  updatedAt: Date;
}

const TableAssignmentSchema = new Schema<ITableAssignment>(
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
    waiterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
      default: null,
    },
    releaseReason: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "REASSIGNED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

TableAssignmentSchema.index({ restaurantId: 1, tableId: 1, status: 1 });
TableAssignmentSchema.index({ restaurantId: 1, waiterId: 1, status: 1 });

export const TableAssignmentModel: mongoose.Model<ITableAssignment> =
  (mongoose.models.TableAssignment as mongoose.Model<ITableAssignment> | undefined) ||
  mongoose.model<ITableAssignment>("TableAssignment", TableAssignmentSchema);
