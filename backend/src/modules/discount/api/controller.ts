import type { NextFunction, Response } from "express";
import type { RequestWithContext } from "../../../shared/http/request-context.js";
import { sendSuccess } from "../../../shared/http/response.js";
import { discountService } from "../application/services/discount.service.js";

function restaurant(req: RequestWithContext): string { if (!req.user?.restaurantId) throw new Error("Authenticated user has no restaurant scope"); return req.user.restaurantId; }
function actor(req: RequestWithContext): string { const value = req.user?._id || req.user?.id; if (!value) throw new Error("Authenticated user not found"); return value; }
function param(req: RequestWithContext): string { const value = req.params.coupon_id; return Array.isArray(value) ? value[0]! : value!; }

export const discountController = {
  async create(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await discountService.createCoupon(restaurant(req), actor(req), req.body), 201); } catch (error) { next(error); } },
  async list(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await discountService.listCoupons(restaurant(req))); } catch (error) { next(error); } },
  async update(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await discountService.updateCoupon(restaurant(req), param(req), req.body)); } catch (error) { next(error); } },
  async validate(req: RequestWithContext, res: Response, next: NextFunction) { try { sendSuccess(res, await discountService.validateCoupon(restaurant(req), req.body.code, req.body.subtotalPaise)); } catch (error) { next(error); } },
};
