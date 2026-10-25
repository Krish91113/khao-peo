// ─── ServedOrder Controller ───────────────────────────────────────────────────
// Module: audit | Layer: api

import type { Response, NextFunction } from "express";
import { servedOrderService } from "../application/services/served-order.service.js";
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
 * Maps DB integer paise amounts back to rupees decimals for frontend compatibility.
 */
function mapServedOrderResponse(order: any) {
  const orderObj = order.toObject ? order.toObject() : order;
  return {
    ...orderObj,
    id: String(orderObj._id),
    total_bill_amount: fromPaise(orderObj.totalBillAmount),
    totalBillAmount: fromPaise(orderObj.totalBillAmount),
    served_at: orderObj.servedAt,
    servedAt: orderObj.servedAt,
    served_by: orderObj.servedBy,
    servedBy: orderObj.servedBy,
    created_at: orderObj.createdAt,
    updated_at: orderObj.updatedAt,
    orders: orderObj.orders?.map((o: any) => ({
      ...o,
      total_amount: fromPaise(o.totalAmount),
      totalAmount: fromPaise(o.totalAmount),
      created_at: o.createdAt,
      createdAt: o.createdAt,
      updated_at: o.updatedAt,
      updatedAt: o.updatedAt,
      items: o.items?.map((item: any) => ({
        ...item,
        price: fromPaise(item.price),
      })),
    })),
    billDetails: orderObj.billDetails
      ? {
          ...orderObj.billDetails,
          subtotal: fromPaise(orderObj.billDetails.subtotal),
          tax: fromPaise(orderObj.billDetails.tax),
          discount: fromPaise(orderObj.billDetails.discount || 0),
          total: fromPaise(orderObj.billDetails.total),
        }
      : null,
    bill_details: orderObj.billDetails
      ? {
          ...orderObj.billDetails,
          subtotal: fromPaise(orderObj.billDetails.subtotal),
          tax: fromPaise(orderObj.billDetails.tax),
          discount: fromPaise(orderObj.billDetails.discount || 0),
          total: fromPaise(orderObj.billDetails.total),
        }
      : null,
  };
}

export const servedOrderController = {
  async getServedOrders(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { tableNumber } = req.query;
      const filters: any = {};
      if (typeof tableNumber === "string" && tableNumber.trim()) {
        filters.tableNumber = parseInt(tableNumber, 10);
      }

      const orders = await servedOrderService.getServedOrders(getRestaurantId(req), filters);
      sendSuccess(res, orders.map(mapServedOrderResponse));
    } catch (err) {
      next(err);
    }
  },

  async getServedOrderById(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const order = await servedOrderService.getServedOrderById(
        getParamId(req),
        getRestaurantId(req),
      );
      sendSuccess(res, mapServedOrderResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async getServedOrderBill(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const bill = await servedOrderService.getServedOrderBill(
        getParamId(req),
        getRestaurantId(req),
      );
      sendSuccess(
        res,
        bill
          ? {
              ...bill,
              subtotal: fromPaise(bill.subtotal),
              tax: fromPaise(bill.tax),
              discount: fromPaise(bill.discount || 0),
              total: fromPaise(bill.total),
            }
          : null,
      );
    } catch (err) {
      next(err);
    }
  },
};
