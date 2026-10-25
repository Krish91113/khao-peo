// ─── Bill Routes ──────────────────────────────────────────────────────────────
// Module: billing | Layer: api

import { Router } from "express";
import { billController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
import { createBillSchema } from "./validator.js";
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
 * /bills:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get all bills for the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bills
 *   post:
 *     tags:
 *       - Billing
 *     summary: Generate a bill for an order
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuccessEnvelope'
 *     responses:
 *       201:
 *         description: Bill generated successfully
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.BILL_READ) as import("express").RequestHandler,
  (req, res, next) => billController.getAllBills(req as unknown as RequestWithContext, res, next),
);

router.post(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.BILL_GENERATE) as import("express").RequestHandler,
  validate({ body: createBillSchema }),
  (req, res, next) => billController.createBill(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /bills/order/{orderId}:
 *   get:
 *     tags:
 *       - Billing
 *     summary: Get the bill associated with a specific order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill details
 */
router.get(
  "/order/:orderId",
  ...authChain,
  requirePermissions(PERMISSIONS.BILL_READ) as import("express").RequestHandler,
  (req, res, next) =>
    billController.getBillByOrder(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /bills/final/{tableId}:
 *   post:
 *     tags:
 *       - Billing
 *     summary: Aggregate active table session orders and generate a final consolidated bill
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: tableId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Consolidated final bill created successfully
 */
router.post(
  "/final/:tableId",
  ...authChain,
  requirePermissions(PERMISSIONS.BILL_GENERATE) as import("express").RequestHandler,
  (req, res, next) =>
    billController.createFinalBill(req as unknown as RequestWithContext, res, next),
);

export default router;
