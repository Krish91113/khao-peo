// ─── Table Repository ─────────────────────────────────────────────────────────
// Module: table | Layer: infrastructure

import { TableModel, type ITable } from "../models/table.model.js";
import type mongoose from "mongoose";

export const tableRepository = {
  async findById(id: string, restaurantId: string): Promise<ITable | null> {
    return TableModel.findOne({ _id: id, restaurantId });
  },

  async findByTableNumber(tableNumber: number, restaurantId: string): Promise<ITable | null> {
    return TableModel.findOne({ tableNumber, restaurantId });
  },

  async findByRestaurant(restaurantId: string): Promise<ITable[]> {
    return TableModel.find({ restaurantId }).sort({ tableNumber: 1 });
  },

  async create(data: Partial<ITable>, session?: mongoose.ClientSession): Promise<ITable> {
    const docs = await TableModel.create([data], session ? { session } : {});
    return docs[0]!;
  },

  async updateById(
    id: string,
    restaurantId: string,
    data: Partial<ITable>,
    session?: mongoose.ClientSession,
  ): Promise<ITable | null> {
    return TableModel.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, session },
    );
  },

  async deleteById(id: string, restaurantId: string): Promise<ITable | null> {
    return TableModel.findOneAndDelete({ _id: id, restaurantId });
  },
};
