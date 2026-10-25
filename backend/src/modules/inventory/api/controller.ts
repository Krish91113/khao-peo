import type { NextFunction, Response } from "express";
import { inventoryService } from "../application/services/inventory.service.js";
import { sendSuccess } from "../../../shared/http/response.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

function tenant(req: RequestWithContext): string {
  const restaurantId = req.user?.restaurantId;
  if (!restaurantId) throw new Error("Authenticated user has no restaurant scope");
  return restaurantId;
}

function actor(req: RequestWithContext): string {
  const id = req.user?._id || req.user?.id;
  if (!id) throw new Error("Authenticated user not found");
  return id;
}

export const inventoryController = {
  async create(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.createItem(tenant(req), req.body)); } catch (error) { next(error); }
  },
  async list(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.listItems(tenant(req), req.query.active === undefined ? undefined : req.query.active === "true")); } catch (error) { next(error); }
  },
  async get(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.getItem(tenant(req), req.params.id as string)); } catch (error) { next(error); }
  },
  async update(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.updateItem(tenant(req), req.params.id as string, req.body)); } catch (error) { next(error); }
  },
  async transaction(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.recordTransaction(tenant(req), req.params.id as string, actor(req), req.body), 201); } catch (error) { next(error); }
  },
  async transactions(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.listTransactions(tenant(req), req.params.id as string)); } catch (error) { next(error); }
  },
  async alerts(req: RequestWithContext, res: Response, next: NextFunction) {
    try { sendSuccess(res, await inventoryService.alerts(tenant(req))); } catch (error) { next(error); }
  },
};
