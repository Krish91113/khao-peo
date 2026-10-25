import { Router } from "express";
import { kitchenController } from "./controller.js";
import { idParams, itemParams, itemStatus, priority } from "./validator.js";
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
const permission = (value: string) => requirePermissions(value) as import("express").RequestHandler;
const request = (req: unknown) => req as RequestWithContext;

/** @openapi
 * /kitchen/tickets:
 *   get:
 *     tags: [Kitchen]
 *     summary: List tenant kitchen tickets
 *     security: [{ BearerAuth: [] }]
 */
/** @openapi
 * /kitchen/dashboard:
 *   get:
 *     tags: [Kitchen]
 *     summary: Get the tenant-scoped kitchen dashboard
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Kitchen workload and active tickets
 */
router.get("/dashboard", ...authChain, permission(PERMISSIONS.KITCHEN_READ), (req, res, next) => kitchenController.dashboard(request(req), res, next));
router.get("/tickets", ...authChain, permission(PERMISSIONS.KITCHEN_READ), (req, res, next) => kitchenController.tickets(request(req), res, next));
router.get("/tickets/:id", ...authChain, permission(PERMISSIONS.KITCHEN_READ), validate({ params: idParams }), (req, res, next) => kitchenController.ticket(request(req), res, next));
router.patch("/items/:itemId/status", ...authChain, permission(PERMISSIONS.KITCHEN_TRANSITION), validate({ params: itemParams, body: itemStatus }), (req, res, next) => kitchenController.itemStatus(request(req), res, next));
router.patch("/tickets/:id/priority", ...authChain, permission(PERMISSIONS.KITCHEN_TRANSITION), validate({ params: idParams, body: priority }), (req, res, next) => kitchenController.priority(request(req), res, next));
router.post("/tickets/:id/pick_up", ...authChain, permission(PERMISSIONS.KITCHEN_TRANSITION), validate({ params: idParams }), (req, res, next) => kitchenController.pickUp(request(req), res, next));
router.post("/tickets/:id/serve", ...authChain, permission(PERMISSIONS.KITCHEN_TRANSITION), validate({ params: idParams }), (req, res, next) => kitchenController.serve(request(req), res, next));
export default router;
