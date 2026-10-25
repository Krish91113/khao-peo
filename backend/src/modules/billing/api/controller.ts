// ─── Bill Controller ──────────────────────────────────────────────────────────
// Module: billing | Layer: api

import type { Response, NextFunction } from "express";
import { billService } from "../application/services/bill.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";
import { fromPaise } from "../../../shared/money/money.js";

function getParamId(req: RequestWithContext): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

function getRestaurantId(req: RequestWithContext): string {
  return req.restaurantId ?? req.context.restaurant_id ?? "";
}

/**
 * Maps DB integer paise fields back to rupees float values for frontend consumption.
 */
function mapBillResponse(result: any) {
  const bill = result.bill ? result.bill.toObject() : result.toObject();
  const items = result.items || [];
  const tableNumber =
    result.tableNumber || (bill.table?.tableNumber ? String(bill.table.tableNumber) : "");

  return {
    _id: bill._id,
    id: bill._id,
    order_id: bill.order?._id ? String(bill.order._id) : String(bill.order),
    table_id: bill.table?._id ? String(bill.table._id) : String(bill.table),
    subtotal: fromPaise(bill.subtotal),
    tax: fromPaise(bill.tax),
    total_amount: fromPaise(bill.totalAmount),
    payment_status: bill.paymentStatus,
    created_at: bill.createdAt,
    items: items.map((i: any) => ({
      ...i,
      price: fromPaise(i.price),
    })),
    table: {
      table_number: String(tableNumber),
    },
    ...(result.ordersCount ? { is_final: true, orders_count: result.ordersCount } : {}),
  };
}

export const billController = {
  async getAllBills(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const bills = await billService.getAllBills(getRestaurantId(req));
      sendSuccess(
        res,
        bills.map((b) => mapBillResponse(b)),
      );
    } catch (err) {
      next(err);
    }
  },

  async getBillByOrder(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const id = Array.isArray(orderId) ? orderId[0]! : orderId!;

      const bill = await billService.getBillByOrder(id, getRestaurantId(req));
      sendSuccess(res, mapBillResponse(bill));
    } catch (err) {
      next(err);
    }
  },

  async createBill(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await billService.createBill(getRestaurantId(req), req.body);
      sendSuccess(res, mapBillResponse(result), 201);
    } catch (err) {
      next(err);
    }
  },

  async createFinalBill(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;
      const id = Array.isArray(tableId) ? tableId[0]! : tableId!;

      const result = await billService.createFinalBill(getRestaurantId(req), id);
      sendSuccess(res, mapBillResponse(result), 201);
    } catch (err) {
      next(err);
    }
  },
};
