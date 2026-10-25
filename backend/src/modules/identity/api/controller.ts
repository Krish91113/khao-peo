// ─── Identity Controller ──────────────────────────────────────────────────────
// Module: identity | Layer: api

import type { Response, NextFunction } from "express";
import { identityService } from "../application/services/identity.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function getParamId(req: RequestWithContext): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

function getRestaurantId(req: RequestWithContext): string {
  return req.restaurantId ?? req.context.restaurant_id ?? "";
}

export const identityController = {
  async getAllUsers(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const role = typeof req.query.role === "string" ? req.query.role : undefined;
      const users = await identityService.getAllUsers(getRestaurantId(req), role ? { role } : {});
      sendSuccess(res, { users, count: users.length });
    } catch (err) {
      next(err);
    }
  },

  async getUserStats(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const stats = await identityService.getUserStats(getRestaurantId(req));
      sendSuccess(res, { stats });
    } catch (err) {
      next(err);
    }
  },

  async createUser(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const user = await identityService.createUser(getRestaurantId(req), req.body);
      sendSuccess(res, { user, message: "User created successfully" }, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateUser(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const user = await identityService.updateUser(
        getParamId(req),
        getRestaurantId(req),
        req.body,
      );
      sendSuccess(res, { user, message: "User updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  async updateUserStatus(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const user = await identityService.updateUserStatus(
        getParamId(req),
        getRestaurantId(req),
        req.body.status,
        req.body,
      );
      sendSuccess(res, { user, message: "User status updated successfully" });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      await identityService.deleteUser(getParamId(req), getRestaurantId(req));
      sendSuccess(res, { message: "User deleted successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getOnlineUsers(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const users = await identityService.getOnlineUsers(getRestaurantId(req));
      sendSuccess(res, { users, count: users.length });
    } catch (err) {
      next(err);
    }
  },

  async toggleUserStatus(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const user = await identityService.toggleUserStatus(getParamId(req), getRestaurantId(req));
      sendSuccess(res, { user, message: "User status toggled" });
    } catch (err) {
      next(err);
    }
  },

  async getRecentSignups(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(String(req.query.limit || "10"), 10);
      const users = await identityService.getRecentSignups(getRestaurantId(req), limit);
      sendSuccess(res, { users });
    } catch (err) {
      next(err);
    }
  },
};
