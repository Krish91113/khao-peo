// ─── Order Routes ─────────────────────────────────────────────────────────────
// Module: order | Layer: api

import { Router } from "express";
import { orderController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
import { createOrderSchema, updateOrderStatusSchema, applyCouponSchema } from "./validator.js";
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
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders for the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create a new order for a table session
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
 *         description: Order created successfully
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.ORDER_READ) as import("express").RequestHandler,
  (req, res, next) => orderController.getAllOrders(req as unknown as RequestWithContext, res, next),
);

router.post(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.ORDER_CREATE) as import("express").RequestHandler,
  validate({ body: createOrderSchema }),
  (req, res, next) => orderController.createOrder(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /orders/table/{tableId}:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get all orders associated with a table session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: tableId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of table orders
 */
router.get(
  "/table/:tableId",
  ...authChain,
  requirePermissions(PERMISSIONS.ORDER_READ) as import("express").RequestHandler,
  (req, res, next) =>
    orderController.getOrdersByTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /orders/{id}/status:
 *   patch:
 *     tags:
 *       - Orders
 *     summary: Transition the status of an order
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, sent_to_kitchen, preparing, ready, served, voided]
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.post(
  "/:id/apply-coupon",
  ...authChain,
  requirePermissions(PERMISSIONS.DISCOUNT_APPLY) as import("express").RequestHandler,
  validate({ body: applyCouponSchema }),
  (req, res, next) => orderController.applyCoupon(req as unknown as RequestWithContext, res, next),
);

router.patch(
  "/:id/status",
  ...authChain,
  requirePermissions(PERMISSIONS.ORDER_UPDATE) as import("express").RequestHandler,
  validate({ body: updateOrderStatusSchema }),
  (req, res, next) =>
    orderController.updateOrderStatus(req as unknown as RequestWithContext, res, next),
);

export default router;
