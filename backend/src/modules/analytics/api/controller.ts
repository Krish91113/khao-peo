import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "../../../shared/http/request-context.js";
import { sendSuccess } from "../../../shared/http/response.js";
import { analyticsService } from "../application/services/analytics.service.js";

function restaurant(req: RequestWithContext): string { if (!req.user?.restaurantId) throw new Error("Authenticated user has no restaurant scope"); return req.user.restaurantId; }
function dates(req: RequestWithContext): { from?: string; to?: string } { return { from: typeof req.query.from === "string" ? req.query.from : undefined, to: typeof req.query.to === "string" ? req.query.to : undefined }; }
export const analyticsController = {
  async summary(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.ownerSummary(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
  async revenue(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.revenue(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
  async items(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.items(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
  async tables(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.tables(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
  async kitchen(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.kitchen(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
  async staff(req: RequestWithContext, res: Response, next: NextFunction) { try { const d = dates(req); sendSuccess(res, await analyticsService.staff(restaurant(req), d.from, d.to)); } catch (error) { next(error); } },
};
