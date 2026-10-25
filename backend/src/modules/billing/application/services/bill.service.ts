// ─── Bill Application Service ─────────────────────────────────────────────────
// Module: billing | Layer: application

import { billRepository } from "../../infrastructure/repositories/bill.repository.js";
import { resourceNotFound, validationFailed } from "../../../../shared/errors/app-error.js";
import { toPaise } from "../../../../shared/money/money.js";
import { withTransaction } from "../../../../shared/database/transaction.js";
import mongoose from "mongoose";

export const billService = {
  async getAllBills(restaurantId: string) {
    return billRepository.findAll(restaurantId);
  },

  async getBillByOrder(orderId: string, restaurantId: string) {
    const bill = await billRepository.findByOrder(orderId, restaurantId);
    if (!bill) {
      throw resourceNotFound("Bill", `orderId: ${orderId}`);
    }
    return bill;
  },

  async createBill(restaurantId: string, data: any) {
    const { order_id, table_id, subtotal, tax, total_amount } = data;

    return withTransaction(async (session) => {
      const Order = mongoose.model("Order");
      const Table = mongoose.model("Table");

      const [order, table] = await Promise.all([
        Order.findOne({ _id: order_id, restaurantId }).session(session),
        Table.findOne({ _id: table_id, restaurantId }).session(session),
      ]);

      if (!order || !table) {
        throw resourceNotFound("Order or Table", `order: ${order_id}, table: ${table_id}`);
      }

      const bill = await billRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          order: order._id as mongoose.Types.ObjectId,
          table: table._id as mongoose.Types.ObjectId,
          subtotal: toPaise(subtotal),
          tax: toPaise(tax),
          totalAmount: toPaise(total_amount),
          paymentStatus: "pending",
        },
        session,
      );

      return {
        bill,
        items: order.items,
        tableNumber: table.tableNumber,
      };
    });
  },

  async createFinalBill(restaurantId: string, tableId: string) {
    return withTransaction(async (session) => {
      const Table = mongoose.model("Table");
      const Order = mongoose.model("Order");

      const table = await Table.findOne({ _id: tableId, restaurantId }).session(session);
      if (!table) {
        throw resourceNotFound("Table", tableId);
      }

      // Fetch all active orders for the current table session
      const orders = await Order.find({
        table: table._id,
        restaurantId,
        status: { $in: ["sent_to_kitchen", "preparing", "ready", "pending"] },
      })
        .session(session)
        .sort({ createdAt: 1 });

      if (orders.length === 0) {
        throw validationFailed("No active orders found for this table");
      }

      // Aggregate items and calculate subtotal in integer paise
      const allItems: any[] = [];
      let totalSubtotalPaise = 0;

      orders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          const existing = allItems.find((i) => i.item_name === item.item_name);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            allItems.push({
              item_name: item.item_name,
              quantity: item.quantity,
              price: item.price, // already in paise
            });
          }
          totalSubtotalPaise += item.price * item.quantity;
        });
      });

      const taxPaise = Math.round(totalSubtotalPaise * 0.05); // 5% tax
      const totalAmountPaise = totalSubtotalPaise + taxPaise;

      const bill = await billRepository.create(
        {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          order: orders[0]._id as mongoose.Types.ObjectId, // first order as ref
          table: table._id as mongoose.Types.ObjectId,
          subtotal: totalSubtotalPaise,
          tax: taxPaise,
          totalAmount: totalAmountPaise,
          paymentStatus: "pending",
        },
        session,
      );

      return {
        bill,
        items: allItems,
        tableNumber: table.tableNumber,
        ordersCount: orders.length,
      };
    });
  },
};
