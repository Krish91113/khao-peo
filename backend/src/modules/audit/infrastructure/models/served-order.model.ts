// ─── ServedOrder Mongoose Model ────────────────────────────────────────────────
// Module: audit | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface IServedOrderItem {
  item_name: string;
  quantity: number;
  price: number; // in paise
}

export interface IServedOrderDetail {
  orderId: string;
  items: IServedOrderItem[];
  totalAmount: number; // in paise
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServedOrder extends Document {
  restaurantId: mongoose.Types.ObjectId;
  tableNumber: number;
  orders: IServedOrderDetail[];
  totalBillAmount: number; // in paise
  billDetails?: any;
  servedAt: Date;
  servedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const servedOrderItemSchema = new Schema<IServedOrderItem>(
  {
    item_name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false },
);

const servedOrderDetailSchema = new Schema<IServedOrderDetail>(
  {
    orderId: { type: String, required: true },
    items: [servedOrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false },
);

const servedOrderSchema = new Schema<IServedOrder>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      index: true,
    },
    orders: [servedOrderDetailSchema],
    totalBillAmount: {
      type: Number,
      required: true,
    },
    billDetails: {
      type: Schema.Types.Mixed,
    },
    servedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    servedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

servedOrderSchema.index({ tableNumber: 1, servedAt: -1 });

export const ServedOrderModel = mongoose.model<IServedOrder>("ServedOrder", servedOrderSchema);
