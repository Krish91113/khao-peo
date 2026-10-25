// ─── Order Mongoose Model ─────────────────────────────────────────────────────
// Module: order | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";
import type { OrderStatus, OrderType } from "../../../../shared/types/index.js";

export interface IOrderItem {
  item_name: string;
  quantity: number;
  price: number; // in paise
}

export interface IOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  table: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number; // in paise
  subtotalAmount: number; // in paise before discount/tax
  discountAmount: number; // in paise
  couponId?: mongoose.Types.ObjectId | null;
  status: OrderStatus;
  orderType: OrderType;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    table: {
      type: Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    subtotalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    discountAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "sent_to_kitchen", "preparing", "ready", "served", "voided"],
      default: "sent_to_kitchen",
    },
    orderType: {
      type: String,
      enum: ["dine_in", "inhouse_delivery"],
      default: "dine_in",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);
