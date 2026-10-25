// ─── Order Repository ─────────────────────────────────────────────────────────
// Module: order | Layer: infrastructure

import { OrderModel, type IOrder } from "../models/order.model.js";
import type mongoose from "mongoose";

export const orderRepository = {
  async findById(id: string, restaurantId: string): Promise<IOrder | null> {
    return OrderModel.findOne({ _id: id, restaurantId }).populate("table", "tableNumber");
  },

  async findByTable(tableId: string, restaurantId: string): Promise<IOrder[]> {
    return OrderModel.find({ table: tableId, restaurantId })
      .populate("table", "tableNumber")
      .sort({ createdAt: -1 });
  },

  async findAll(restaurantId: string, filters: { status?: string } = {}): Promise<IOrder[]> {
    const query: Record<string, unknown> = { restaurantId };
    if (filters.status) query.status = filters.status;

    return OrderModel.find(query).populate("table", "tableNumber").sort({ createdAt: -1 });
  },

  async create(data: Partial<IOrder>, session?: mongoose.ClientSession): Promise<IOrder> {
    const docs = await OrderModel.create([data], session ? { session } : {});
    return docs[0]!;
  },

  async applyDiscount(
    id: string,
    restaurantId: string,
    couponId: string,
    discountAmount: number,
  ): Promise<IOrder | null> {
    return OrderModel.findOneAndUpdate(
      { _id: id, restaurantId, discountAmount: 0 },
      [{ $set: { couponId, discountAmount, totalAmount: { $subtract: ["$subtotalAmount", discountAmount] } } }],
      { new: true },
    );
  },

  async updateStatus(
    id: string,
    restaurantId: string,
    status: string,
    session?: mongoose.ClientSession,
  ): Promise<IOrder | null> {
    return OrderModel.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: { status } },
      { new: true, session },
    );
  },
};
