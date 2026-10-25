// ─── Restaurant Controller ───────────────────────────────────────────────────
// Module: restaurant | Layer: api

import type { Response, NextFunction } from "express";
import { restaurantService } from "../application/services/restaurant.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

export const restaurantController = {
  async getMyRestaurant(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const restaurantId = req.restaurantId ?? req.context.restaurant_id;
      if (!restaurantId) {
        return next(new Error("No restaurant associated with this user"));
      }

      const restaurant = await restaurantService.getRestaurantById(restaurantId);
      sendSuccess(res, restaurant);
    } catch (err) {
      next(err);
    }
  },
};
