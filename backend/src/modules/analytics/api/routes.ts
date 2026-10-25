import { Router } from "express";
import { analyticsController } from "./controller.js";
import { dateQuery } from "./validator.js";
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
const read = requirePermissions(PERMISSIONS.ANALYTICS_READ) as import("express").RequestHandler;
const request = (req: unknown) => req as RequestWithContext;
const get = (path: string, handler: (req: RequestWithContext, res: import("express").Response, next: import("express").NextFunction) => void) => router.get(path, ...authChain, read, validate({ query: dateQuery }), (req, res, next) => handler(request(req), res, next));

/** @openapi
 * /analytics/owner_summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Tenant-scoped owner dashboard summary
 *     security: [{ BearerAuth: [] }]
 */
get("/owner_summary", analyticsController.summary);
get("/revenue", analyticsController.revenue);
get("/items", analyticsController.items);
get("/tables", analyticsController.tables);
get("/kitchen", analyticsController.kitchen);
get("/staff", analyticsController.staff);
export default router;
