// ─── ServedOrder Application Service ──────────────────────────────────────────
// Module: audit | Layer: application

import { servedOrderRepository } from "../../infrastructure/repositories/served-order.repository.js";
import { resourceNotFound } from "../../../../shared/errors/app-error.js";

export const servedOrderService = {
  async getServedOrders(restaurantId: string, filters: { tableNumber?: number } = {}) {
    return servedOrderRepository.findAll(restaurantId, filters);
  },

  async getServedOrderById(id: string, restaurantId: string) {
    const order = await servedOrderRepository.findById(id, restaurantId);
    if (!order) {
      throw resourceNotFound("ServedOrder", id);
    }
    return order;
  },

  async getServedOrderBill(id: string, restaurantId: string) {
    const order = await servedOrderRepository.findById(id, restaurantId);
    if (!order || !order.billDetails) {
      throw resourceNotFound("ServedOrderBillDetails", id);
    }
    return order.billDetails;
  },
};
