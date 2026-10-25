// ─── Order Controller ─────────────────────────────────────────────────────────
// Module: order | Layer: api

import type { Response, NextFunction } from "express";
import { orderService } from "../application/services/order.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";
import { fromPaise } from "../../../shared/money/money.js";
import { permissionDenied } from "../../../shared/errors/app-error.js";

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
function mapOrderResponse(order: any) {
  const orderObj = order.toObject ? order.toObject() : order;
  return {
    ...orderObj,
    id: String(orderObj._id),
    table_id: orderObj.table?._id ? String(orderObj.table._id) : String(orderObj.table),
    total_amount: fromPaise(orderObj.totalAmount),
    totalAmount: fromPaise(orderObj.totalAmount),
    created_at: orderObj.createdAt,
    updated_at: orderObj.updatedAt,
    items: orderObj.items?.map((item: any) => ({
      ...item,
      price: fromPaise(item.price),
    })),
  };
}

export const orderController = {
  async getAllOrders(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const filters: any = {};
      if (typeof status === "string") filters.status = status;

      const orders = await orderService.getAllOrders(getRestaurantId(req), filters);
      sendSuccess(res, orders.map(mapOrderResponse));
    } catch (err) {
      next(err);
    }
  },

  async getOrdersByTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;
      const id = Array.isArray(tableId) ? tableId[0]! : tableId!;

      const orders = await orderService.getOrdersByTable(id, getRestaurantId(req));
      sendSuccess(res, orders.map(mapOrderResponse));
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id || req.user?.id || "";
      if (req.body.coupon_code && !req.context.permissions.includes("discount.apply")) {
        throw permissionDenied("Only authorized managers can apply a coupon to an order");
      }
      const order = await orderService.createOrder(getRestaurantId(req), userId, req.body);
      sendSuccess(res, mapOrderResponse(order), 201);
    } catch (err) {
      next(err);
    }
  },

  async applyCoupon(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const order = await orderService.applyCoupon(getParamId(req), getRestaurantId(req), req.body.code);
      sendSuccess(res, mapOrderResponse(order));
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(
        getParamId(req),
        getRestaurantId(req),
        status,
      );
      sendSuccess(res, mapOrderResponse(order));
    } catch (err) {
      next(err);
    }
  },
};
