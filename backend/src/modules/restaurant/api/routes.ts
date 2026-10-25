// ─── Restaurant Routes ────────────────────────────────────────────────────────
// Module: restaurant | Layer: api

import { Router } from "express";
import { restaurantController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

const router = Router();

const authChain = [
  (req: unknown, res: unknown, next: unknown) =>
    authenticate(
      req as RequestWithContext,
      res as import("express").Response,
      next as import("express").NextFunction,
    ),
  (req: unknown, res: unknown, next: unknown) =>
    ensureActive(
      req as RequestWithContext,
      res as import("express").Response,
      next as import("express").NextFunction,
    ),
  (req: unknown, res: unknown, next: unknown) =>
    enforceTenantScope(
      req as RequestWithContext,
      res as import("express").Response,
      next as import("express").NextFunction,
    ),
];

/**
 * @openapi
 * /restaurant/me:
 *   get:
 *     tags:
 *       - Restaurant
 *     summary: Get details of the current logged in restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant profiles details returned successfully
 */
router.get("/me", ...authChain, (req, res, next) =>
  restaurantController.getMyRestaurant(req as RequestWithContext, res, next),
);

export default router;
