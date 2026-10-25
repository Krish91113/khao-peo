// ─── MenuItem Repository ──────────────────────────────────────────────────────
// Module: menu | Layer: infrastructure

import { MenuItemModel, type IMenuItem } from "../models/menu-item.model.js";
import type mongoose from "mongoose";

export const menuItemRepository = {
  async findById(id: string, restaurantId: string): Promise<IMenuItem | null> {
    return MenuItemModel.findOne({ _id: id, restaurantId });
  },

  async findByRestaurant(
    restaurantId: string,
    filters: { category?: string; isAvailable?: boolean } = {},
  ): Promise<IMenuItem[]> {
    const query: Record<string, unknown> = { restaurantId };
    if (filters.category) query.category = filters.category;
    if (filters.isAvailable !== undefined) query.isAvailable = filters.isAvailable;

    return MenuItemModel.find(query).sort({ category: 1, name: 1 });
  },

  async create(data: Partial<IMenuItem>, session?: mongoose.ClientSession): Promise<IMenuItem> {
    const docs = await MenuItemModel.create([data], session ? { session } : {});
    return docs[0]!;
  },

  async updateById(
    id: string,
    restaurantId: string,
    data: Partial<IMenuItem>,
    session?: mongoose.ClientSession,
  ): Promise<IMenuItem | null> {
    return MenuItemModel.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true, session },
    );
  },

  async deleteById(id: string, restaurantId: string): Promise<IMenuItem | null> {
    return MenuItemModel.findOneAndDelete({ _id: id, restaurantId });
  },
};
