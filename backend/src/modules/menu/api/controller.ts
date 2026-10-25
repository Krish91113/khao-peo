// ─── Menu Controller ──────────────────────────────────────────────────────────
// Module: menu | Layer: api

import type { Response, NextFunction } from "express";
import { menuService } from "../application/services/menu.service.js";
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
function mapItemResponse(item: any) {
  const itemObj = item.toObject ? item.toObject() : item;
  return {
    ...itemObj,
    price: fromPaise(itemObj.price),
    customizations: itemObj.customizations?.map((group: any) => ({
      ...group,
      options: group.options?.map((opt: any) => ({
        ...opt,
        price: fromPaise(opt.price),
      })),
    })),
  };
}

export const menuController = {
  async getMenuItems(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { category, isAvailable } = req.query;
      const filters: any = {};
      if (typeof category === "string") filters.category = category;
      if (typeof isAvailable === "string") filters.isAvailable = isAvailable === "true";

      const items = await menuService.getMenuItems(getRestaurantId(req), filters);
      sendSuccess(res, items.map(mapItemResponse));
    } catch (err) {
      next(err);
    }
  },

  async getMenuItemById(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const item = await menuService.getMenuItemById(getParamId(req), getRestaurantId(req));
      sendSuccess(res, mapItemResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async createMenuItem(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const userId = req.user?._id || req.user?.id || "";
      const item = await menuService.createMenuItem(getRestaurantId(req), req.body, userId);
      sendSuccess(res, mapItemResponse(item), 201);
    } catch (err) {
      next(err);
    }
  },

  async updateMenuItem(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const item = await menuService.updateMenuItem(
        getParamId(req),
        getRestaurantId(req),
        req.body,
      );
      sendSuccess(res, mapItemResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async deleteMenuItem(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await menuService.deleteMenuItem(getParamId(req), getRestaurantId(req));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
