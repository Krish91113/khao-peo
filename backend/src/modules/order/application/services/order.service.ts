// ─── Order Application Service ─────────────────────────────────────────────────
// Module: order | Layer: application

import { orderRepository } from "../../infrastructure/repositories/order.repository.js";
import { resourceNotFound, validationFailed } from "../../../../shared/errors/app-error.js";
import { withTransaction } from "../../../../shared/database/transaction.js";
import { toPaise } from "../../../../shared/money/money.js";
import mongoose from "mongoose";
import { kitchenService } from "../../../kitchen/public.js";
import { discountService } from "../../../discount/index.js";


export const orderService = {
  async getAllOrders(restaurantId: string, filters: { status?: string } = {}) {
    return orderRepository.findAll(restaurantId, filters);
  },

  async getOrdersByTable(tableId: string, restaurantId: string) {
    return orderRepository.findByTable(tableId, restaurantId);
  },

  async createOrder(restaurantId: string, userId: string, data: any) {
    const { table_id, items, orderType, coupon_code } = data;

    return withTransaction(async (session) => {
      // Dynamic loading to avoid circular dependencies
      const Table = mongoose.model("Table");
      const table = await Table.findOne({ _id: table_id, restaurantId }).session(session);
      if (!table) {
        throw resourceNotFound("Table", table_id);
      }

      // Mark table as booked if not already booked
      if (!table.isBooked) {
        table.isBooked = true;
        await table.save({ session });
      }

      // Map items and convert to paise integers
      const transformedItems = items.map((item: any) => ({
        item_name: item.item_name || item.name,
        quantity: item.quantity,
        price: toPaise(item.price),
      }));

      const subtotalAmount = transformedItems.reduce((sum: number, item: { quantity: number; price: number }) => sum + item.quantity * item.price, 0);
      const coupon = coupon_code ? await discountService.validateCoupon(restaurantId, coupon_code, subtotalAmount) : null;
      const order = await orderRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          table: table._id as mongoose.Types.ObjectId,
          items: transformedItems,
          subtotalAmount,
          discountAmount: coupon?.discountPaise ?? 0,
          couponId: coupon ? new mongoose.Types.ObjectId(coupon.couponId) : null,
          totalAmount: subtotalAmount - (coupon?.discountPaise ?? 0),
          status: "sent_to_kitchen",
          orderType: orderType || "dine_in",
          createdBy: new mongoose.Types.ObjectId(userId),
        },
        session,
      );

      // Update table's currentOrder
      table.currentOrder = order._id as mongoose.Types.ObjectId;
      await table.save({ session });
      await kitchenService.createTicket(restaurantId, String(order._id), transformedItems, session);

      return order;
    });
  },

  async applyCoupon(id: string, restaurantId: string, code: string) {
    const order = await orderRepository.findById(id, restaurantId);
    if (!order) throw resourceNotFound("Order", id);
    if (order.discountAmount > 0 || order.couponId) throw validationFailed("Only one discount or coupon can be applied to an order");
    const subtotal = order.subtotalAmount || order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const result = await discountService.validateCoupon(restaurantId, code, subtotal);
    const updated = await orderRepository.applyDiscount(id, restaurantId, result.couponId, result.discountPaise);
    if (!updated) throw validationFailed("Order discount could not be applied");
    return updated;
  },

  async updateOrderStatus(id: string, restaurantId: string, status: string) {
    const allowed = ["sent_to_kitchen", "preparing", "ready", "served", "voided"];
    if (!allowed.includes(status)) {
      throw validationFailed("Invalid order status");
    }

    const order = await orderRepository.updateStatus(id, restaurantId, status);
    if (!order) {
      throw resourceNotFound("Order", id);
    }
    return order;
  },
};
