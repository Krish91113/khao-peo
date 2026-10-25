// ─── Subscription Repository ──────────────────────────────────────────────────
// Module: platform | Layer: infrastructure

import { SubscriptionModel, type ISubscription } from "../models/subscription.model.js";
import type mongoose from "mongoose";

export const subscriptionRepository = {
  async findByRestaurantId(restaurantId: string): Promise<ISubscription | null> {
    return SubscriptionModel.findOne({ restaurantId });
  },

  async create(
    data: Partial<ISubscription>,
    session?: mongoose.ClientSession,
  ): Promise<ISubscription> {
    const docs = await SubscriptionModel.create([data], session ? { session } : {});
    return docs[0]!;
  },

  async deleteByRestaurantId(restaurantId: string, session?: mongoose.ClientSession): Promise<any> {
    return SubscriptionModel.deleteMany({ restaurantId }, session ? { session } : {});
  },
};
