// ─── Attendance Controller ────────────────────────────────────────────────────
// Module: attendance | Layer: api
// FRD Section 23.1: Controllers are thin — they map the request into service
// calls and never contain business logic.

import type { Response, NextFunction } from "express";
import { attendanceService } from "../application/services/attendance.service.js";
import { actionRequestService } from "../application/services/action-request.service.js";
import { sendSuccess, sendPaginatedSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function getParam(req: RequestWithContext, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0]! : value!;
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

export const attendanceController = {
  // ─── Legacy attendance (kept for history/corrections) ────────────────────

  async correct(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const attendance = await attendanceService.correct(
        getRestaurantId(req),
        getParam(req, "attendance_id"),
        getActorId(req),
        getActorRole(req),
        req.body,
      );
      sendSuccess(res, { attendance, message: "Attendance corrected" });
    } catch (err) {
      next(err);
    }
  },

  async list(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await attendanceService.list(
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
        req.query,
      );
      sendPaginatedSuccess(res, data, meta);
    } catch (err) {
      next(err);
    }
  },

  async listActive(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.listActive(
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
      );
      sendSuccess(res, { attendance: data });
    } catch (err) {
      next(err);
    }
  },

  async listForUser(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await attendanceService.listForUser(
        getRestaurantId(req),
        getParam(req, "user_id"),
        getActorId(req),
        getActorRole(req),
        req.query,
      );
      sendPaginatedSuccess(res, data, meta);
    } catch (err) {
      next(err);
    }
  },

  // ─── Action Request Endpoints ──────────────────────────────────────────

  async createActionRequest(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await actionRequestService.createRequest(
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
        req.body,
      );
      sendSuccess(res, { request: result, message: "Action request created" }, 201);
    } catch (err) {
      next(err);
    }
  },

  async getPendingRequests(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const requests = await actionRequestService.getPendingRequests(
        getActorId(req),
        getRestaurantId(req),
      );
      sendSuccess(res, { requests });
    } catch (err) {
      next(err);
    }
  },

  async confirmRequest(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await actionRequestService.confirmRequest(
        getParam(req, "id"),
        getActorId(req),
        getRestaurantId(req),
        getActorRole(req),
      );
      sendSuccess(res, { request: result, message: "Request confirmed" });
    } catch (err) {
      next(err);
    }
  },

  async declineRequest(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await actionRequestService.declineRequest(
        getParam(req, "id"),
        getActorId(req),
        getRestaurantId(req),
      );
      sendSuccess(res, { request: result, message: "Request declined" });
    } catch (err) {
      next(err);
    }
  },

  async getDashboard(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const dashboard = await actionRequestService.getDashboard(
        getRestaurantId(req),
        getActorId(req),
        getActorRole(req),
      );
      sendSuccess(res, dashboard);
    } catch (err) {
      next(err);
    }
  },
};
