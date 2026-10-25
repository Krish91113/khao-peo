// ─── Restaurant Repository ───────────────────────────────────────────────────
// Module: restaurant | Layer: infrastructure

import { RestaurantModel, type IRestaurant } from "../models/restaurant.model.js";
import type mongoose from "mongoose";

export const restaurantRepository = {
  async findById(id: string): Promise<IRestaurant | null> {
    return RestaurantModel.findById(id);
  },

  async findByRestaurantId(restaurantId: string): Promise<IRestaurant | null> {
    return RestaurantModel.findOne({ restaurantId });
  },

  async findBySlug(slug: string): Promise<IRestaurant | null> {
    return RestaurantModel.findOne({ slug: slug.toLowerCase().trim() });
  },

  async create(data: Partial<IRestaurant>, session?: mongoose.ClientSession): Promise<IRestaurant> {
    const docs = await RestaurantModel.create([data], session ? { session } : {});
    return docs[0]!;
  },

  async updateById(id: string, data: Partial<IRestaurant>): Promise<IRestaurant | null> {
    return RestaurantModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  },

  async deleteById(id: string): Promise<IRestaurant | null> {
    return RestaurantModel.findByIdAndDelete(id);
  },

  async findAll(): Promise<IRestaurant[]> {
    return RestaurantModel.find().sort({ createdAt: -1 });
  },
};
