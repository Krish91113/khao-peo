// ─── Bill Mongoose Model ──────────────────────────────────────────────────────
// Module: billing | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";
import type { PaymentStatus } from "../../../../shared/types/index.js";

export interface IBill extends Document {
  restaurantId: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  table: mongoose.Types.ObjectId;
  subtotal: number; // in paise
  tax: number; // in paise
  totalAmount: number; // in paise
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    table: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export const BillModel = mongoose.model<IBill>("Bill", billSchema);
