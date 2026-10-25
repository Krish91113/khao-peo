// ─── Menu Routes ──────────────────────────────────────────────────────────────
// Module: menu | Layer: api

import { Router } from "express";
import { menuController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
import { createMenuItemSchema, updateMenuItemSchema } from "./validator.js";
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
 * /menu:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get all menu items for the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *       - name: isAvailable
 *         in: query
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of menu items
 *   post:
 *     tags:
 *       - Menu
 *     summary: Create a new menu item
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
 *         description: Menu item created successfully
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.MENU_READ) as import("express").RequestHandler,
  (req, res, next) => menuController.getMenuItems(req as unknown as RequestWithContext, res, next),
);

router.post(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.MENU_MANAGE) as import("express").RequestHandler,
  validate({ body: createMenuItemSchema }),
  (req, res, next) =>
    menuController.createMenuItem(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /menu/{id}:
 *   get:
 *     tags:
 *       - Menu
 *     summary: Get details of a single menu item by ID
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
 *         description: Menu item details
 *   put:
 *     tags:
 *       - Menu
 *     summary: Update an existing menu item
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
 *         description: Menu item updated successfully
 *   delete:
 *     tags:
 *       - Menu
 *     summary: Delete a menu item
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
 *         description: Menu item deleted successfully
 */
router.get(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.MENU_READ) as import("express").RequestHandler,
  (req, res, next) =>
    menuController.getMenuItemById(req as unknown as RequestWithContext, res, next),
);

router.put(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.MENU_MANAGE) as import("express").RequestHandler,
  validate({ body: updateMenuItemSchema }),
  (req, res, next) =>
    menuController.updateMenuItem(req as unknown as RequestWithContext, res, next),
);

router.delete(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.MENU_MANAGE) as import("express").RequestHandler,
  (req, res, next) =>
    menuController.deleteMenuItem(req as unknown as RequestWithContext, res, next),
);

export default router;
