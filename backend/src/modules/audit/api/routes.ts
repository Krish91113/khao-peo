// ─── ServedOrder Routes ────────────────────────────────────────────────────────
// Module: audit | Layer: api

import { Router } from "express";
import { servedOrderController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
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
 * /served-orders:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get all archived served table sessions for the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: tableNumber
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of archived sessions
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.AUDIT_READ) as import("express").RequestHandler,
  (req, res, next) =>
    servedOrderController.getServedOrders(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /served-orders/{id}:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get details of a single served table session by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session details
 */
router.get(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.AUDIT_READ) as import("express").RequestHandler,
  (req, res, next) =>
    servedOrderController.getServedOrderById(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /served-orders/{id}/bill:
 *   get:
 *     tags:
 *       - Audit
 *     summary: Get bill details of a served session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 */
router.get(
  "/:id/bill",
  ...authChain,
  requirePermissions(PERMISSIONS.AUDIT_READ) as import("express").RequestHandler,
  (req, res, next) =>
    servedOrderController.getServedOrderBill(req as unknown as RequestWithContext, res, next),
);

export default router;
