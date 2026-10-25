import { Router } from "express";
import { inventoryController } from "./controller.js";
import { createInventoryItemSchema, updateInventoryItemSchema, transactionSchema, itemIdSchema } from "./validator.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

const router = Router();
const authChain = [
  (req: unknown, res: unknown, next: unknown) => authenticate(req as RequestWithContext, res as import("express").Response, next as import("express").NextFunction),
  (req: unknown, res: unknown, next: unknown) => ensureActive(req as RequestWithContext, res as import("express").Response, next as import("express").NextFunction),
  (req: unknown, res: unknown, next: unknown) => enforceTenantScope(req as RequestWithContext, res as import("express").Response, next as import("express").NextFunction),
];
const asRequest = (req: unknown) => req as RequestWithContext;
const permission = (value: string) => requirePermissions(value) as import("express").RequestHandler;

/** @openapi
 * /inventory/items:
 *   post:
 *     tags: [Inventory]
 *     summary: Create an inventory item
 *     security: [{ BearerAuth: [] }]
 *   get:
 *     tags: [Inventory]
 *     summary: List tenant inventory items
 *     security: [{ BearerAuth: [] }]
 */
router.post("/items", ...authChain, permission(PERMISSIONS.INVENTORY_MANAGE), validate({ body: createInventoryItemSchema }), (req, res, next) => inventoryController.create(asRequest(req), res, next));
router.get("/items", ...authChain, permission(PERMISSIONS.INVENTORY_READ), (req, res, next) => inventoryController.list(asRequest(req), res, next));
router.get("/alerts", ...authChain, permission(PERMISSIONS.INVENTORY_READ), (req, res, next) => inventoryController.alerts(asRequest(req), res, next));
router.get("/items/:id", ...authChain, permission(PERMISSIONS.INVENTORY_READ), validate({ params: itemIdSchema }), (req, res, next) => inventoryController.get(asRequest(req), res, next));
router.patch("/items/:id", ...authChain, permission(PERMISSIONS.INVENTORY_MANAGE), validate({ params: itemIdSchema, body: updateInventoryItemSchema }), (req, res, next) => inventoryController.update(asRequest(req), res, next));
router.post("/items/:id/transactions", ...authChain, permission(PERMISSIONS.INVENTORY_MANAGE), validate({ params: itemIdSchema, body: transactionSchema }), (req, res, next) => inventoryController.transaction(asRequest(req), res, next));
router.get("/items/:id/transactions", ...authChain, permission(PERMISSIONS.INVENTORY_READ), validate({ params: itemIdSchema }), (req, res, next) => inventoryController.transactions(asRequest(req), res, next));

export default router;
