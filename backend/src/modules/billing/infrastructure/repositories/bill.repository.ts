// ─── Bill Repository ──────────────────────────────────────────────────────────
// Module: billing | Layer: infrastructure

import { BillModel, type IBill } from "../models/bill.model.js";
import type mongoose from "mongoose";

export const billRepository = {
  async findById(id: string, restaurantId: string): Promise<IBill | null> {
    return BillModel.findOne({ _id: id, restaurantId })
      .populate("order")
      .populate("table", "tableNumber");
  },

  async findByOrder(orderId: string, restaurantId: string): Promise<IBill | null> {
    return BillModel.findOne({ order: orderId, restaurantId })
      .populate("order")
      .populate("table", "tableNumber");
  },

  async findAll(restaurantId: string): Promise<IBill[]> {
    return BillModel.find({ restaurantId })
      .populate("order")
      .populate("table", "tableNumber")
      .sort({ createdAt: -1 });
  },

  async create(data: Partial<IBill>, session?: mongoose.ClientSession): Promise<IBill> {
    const docs = await BillModel.create([data], session ? { session } : {});
    return docs[0]!;
  },
};
