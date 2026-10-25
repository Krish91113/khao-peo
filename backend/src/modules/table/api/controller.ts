// ─── Table Controller ─────────────────────────────────────────────────────────
// Module: table | Layer: api

import type { Response, NextFunction } from "express";
import { tableService } from "../application/services/table.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function getParamId(req: RequestWithContext): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0]! : id!;
}

function getRestaurantId(req: RequestWithContext): string {
  return req.restaurantId ?? req.context?.restaurant_id ?? "";
}

function getActorId(req: RequestWithContext): string {
  return req.context?.user_id ?? req.user?._id ?? req.user?.id ?? "";
}

function getActorRole(req: RequestWithContext): string {
  return req.context?.role ?? req.user?.role ?? "";
}

export const tableController = {
  async getTables(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tables = await tableService.getTables(getRestaurantId(req));
      sendSuccess(res, tables);
    } catch (err) {
      next(err);
    }
  },

  async getTableById(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const table = await tableService.getTableById(getParamId(req), getRestaurantId(req));
      sendSuccess(res, table);
    } catch (err) {
      next(err);
    }
  },

  async createTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await tableService.createTable(getRestaurantId(req), req.body);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async updateTableStatus(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await tableService.updateTableStatus(
        getParamId(req),
        getRestaurantId(req),
        req.body,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async deleteTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const result = await tableService.deleteTable(getParamId(req), getRestaurantId(req));
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async resetTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const userId = getActorId(req);
      const result = await tableService.resetTable(getParamId(req), getRestaurantId(req), userId);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  // ─── Phase 2 Table Assignment Handlers ─────────────────────────────────────

  async getFloorView(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const floorView = await tableService.getFloorView(getRestaurantId(req));
      sendSuccess(res, floorView);
    } catch (err) {
      next(err);
    }
  },

  async claimTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tableId = getParamId(req);
      const restaurantId = getRestaurantId(req);
      const waiterId = getActorId(req);
      const actorRole = getActorRole(req);

      const result = await tableService.claimTable(tableId, restaurantId, waiterId, actorRole);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async assignTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tableId = getParamId(req);
      const restaurantId = getRestaurantId(req);
      const managerId = getActorId(req);
      const managerRole = getActorRole(req);
      const { waiterId } = req.body;

      const result = await tableService.assignTable(
        tableId,
        restaurantId,
        waiterId,
        managerId,
        managerRole,
      );
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  },

  async reassignTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tableId = getParamId(req);
      const restaurantId = getRestaurantId(req);
      const managerId = getActorId(req);
      const managerRole = getActorRole(req);
      const { waiterId, reason } = req.body;

      const result = await tableService.reassignTable(
        tableId,
        restaurantId,
        waiterId,
        managerId,
        managerRole,
        reason,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async releaseTable(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tableId = getParamId(req);
      const restaurantId = getRestaurantId(req);
      const actorId = getActorId(req);
      const actorRole = getActorRole(req);
      const { reason } = req.body;

      const result = await tableService.releaseTable(
        tableId,
        restaurantId,
        actorId,
        actorRole,
        reason,
      );
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getAssignmentHistory(req: RequestWithContext, res: Response, next: NextFunction) {
    try {
      const tableId = getParamId(req);
      const restaurantId = getRestaurantId(req);
      const history = await tableService.getAssignmentHistory(tableId, restaurantId);
      sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  },
};
