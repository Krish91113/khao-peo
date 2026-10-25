// ─── ServedOrder Repository ───────────────────────────────────────────────────
// Module: audit | Layer: infrastructure

import { ServedOrderModel, type IServedOrder } from "../models/served-order.model.js";

export const servedOrderRepository = {
  async findById(id: string, restaurantId: string): Promise<IServedOrder | null> {
    return ServedOrderModel.findOne({ _id: id, restaurantId }).populate(
      "servedBy",
      "fullName email",
    );
  },

  async findAll(
    restaurantId: string,
    filters: { tableNumber?: number } = {},
  ): Promise<IServedOrder[]> {
    const query: Record<string, unknown> = { restaurantId };
    if (filters.tableNumber !== undefined) query.tableNumber = filters.tableNumber;

    return ServedOrderModel.find(query)
      .populate("servedBy", "fullName email")
      .sort({ servedAt: -1 });
  },
};
