// ─── Staff Controller ─────────────────────────────────────────────────────────
// Module: staff | Layer: api
// KP-FRD-002: Controllers are thin — they map the request into service calls
// and never contain business logic.

import type { Response, NextFunction } from "express";
import { staffService } from "../application/services/staff.service.js";
import { sendSuccess, sendPaginatedSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function getParamId(req: RequestWithContext): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

function getRestaurantId(req: RequestWithContext): string {
  return req.restaurantId ?? req.context.restaurant_id ?? "";
}

function getActorId(req: RequestWithContext): string {
  return req.context.user_id ?? req.user?._id ?? "";
}

function getActorRole(req: RequestWithContext): string {
  return req.context.role ?? req.user?.role ?? "";
}

export const staffController = {
  async createStaff(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.createStaff(
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
        req.body,
      );
      sendSuccess(res, { staff, message: "Staff Created" }, 201);
    } catch (err) {
      next(err);
    }
  },

  async listStaff(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await staffService.listStaff(getRestaurantId(req), req.query);
      sendPaginatedSuccess(res, data, meta);
    } catch (err) {
      next(err);
    }
  },

  async getStaffById(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.getStaffById(getParamId(req), getRestaurantId(req));
      sendSuccess(res, { staff });
    } catch (err) {
      next(err);
    }
  },

  async getMyProfile(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.getMyProfile(getActorId(req), getRestaurantId(req));
      sendSuccess(res, { staff });
    } catch (err) {
      next(err);
    }
  },

  async updateStaff(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.updateStaff(
        getParamId(req),
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
        req.body,
      );
      sendSuccess(res, { staff, message: "Staff Updated" });
    } catch (err) {
      next(err);
    }
  },

  async updateStaffStatus(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.updateStaffStatus(
        getParamId(req),
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
        req.body,
      );
      sendSuccess(res, { staff, message: "Staff Status Updated" });
    } catch (err) {
      next(err);
    }
  },

  async deleteStaff(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const staff = await staffService.deleteStaff(
        getParamId(req),
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
      );
      sendSuccess(res, { staff, message: "Staff Deleted" });
    } catch (err) {
      next(err);
    }
  },
};
