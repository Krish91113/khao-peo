// ─── Platform Controller ──────────────────────────────────────────────────────
// Module: platform | Layer: api

import type { Response, NextFunction } from "express";
import { platformService } from "../application/services/platform.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function getParamId(req: RequestWithContext): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

export const platformController = {
  async createRestaurant(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await platformService.createRestaurant(req.body);
      sendSuccess(
        res,
        {
          success: true,
          message: "Restaurant created successfully",
          restaurant: result.restaurant,
          owner: result.owner,
          email: result.email,
        },
        201,
      );
    } catch (err) {
      next(err);
    }
  },

  async resendWelcomeEmail(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const id = getParamId(req);
      const result = await platformService.resendWelcomeEmail(id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAllRestaurants(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const restaurants = await platformService.getAllRestaurants();
      sendSuccess(res, { count: restaurants.length, restaurants });
    } catch (err) {
      next(err);
    }
  },

  async getRestaurantById(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const restaurant = await platformService.getRestaurantById(getParamId(req));
      sendSuccess(res, { restaurant });
    } catch (err) {
      next(err);
    }
  },

  async updateRestaurant(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await platformService.updateRestaurant(getParamId(req), req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteRestaurant(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      await platformService.deleteRestaurant(getParamId(req));
      sendSuccess(res, {
        success: true,
        message: "Restaurant and all associated data deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};
