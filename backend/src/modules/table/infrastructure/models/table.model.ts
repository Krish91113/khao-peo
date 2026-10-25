// ─── Table Mongoose Model ─────────────────────────────────────────────────────
// Module: table | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface ITable extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  capacity: number;
  isBooked: boolean;
  currentOrder?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index to guarantee uniqueness per restaurant
tableSchema.index({ restaurantId: 1, tableNumber: 1 }, { unique: true });

export const TableModel = mongoose.model<ITable>("Table", tableSchema);
