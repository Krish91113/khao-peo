import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "../../../shared/http/request-context.js";
import { sendSuccess } from "../../../shared/http/response.js";
import { kitchenService } from "../application/services/kitchen.service.js";

function restaurant(req: RequestWithContext): string { if (!req.user?.restaurantId) throw new Error("Authenticated user has no restaurant scope"); return req.user.restaurantId; }
function user(req: RequestWithContext): string { const value = req.user?._id || req.user?.id; if (!value) throw new Error("Authenticated user not found"); return value; }
function param(req: RequestWithContext, name: string): string { const value = req.params[name]; return Array.isArray(value) ? value[0]! : value!; }

export const kitchenController = {
  async tickets(req: RequestWithContext, res: Response, next: NextFunction) { try { const status = typeof req.query.status === "string" ? req.query.status.split(",") : undefined; sendSuccess(res, await kitchenService.listTickets(restaurant(req), status)); } catch (error) { next(error); } },
  async dashboard(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.dashboard(restaurant(req))); } catch (error) { next(error); } },
  async ticket(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.getTicket(restaurant(req), param(req, "id"))); } catch (error) { next(error); } },
  async itemStatus(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.updateItemStatus(restaurant(req), param(req, "itemId"), req.body.status)); } catch (error) { next(error); } },
  async priority(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.setPriority(restaurant(req), param(req, "id"), req.body.priority)); } catch (error) { next(error); } },
  async pickUp(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.pickUp(restaurant(req), param(req, "id"), user(req))); } catch (error) { next(error); } },
  async serve(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await kitchenService.serve(restaurant(req), param(req, "id"))); } catch (error) { next(error); } },
};
