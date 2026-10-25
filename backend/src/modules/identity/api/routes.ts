// ─── Identity Routes ──────────────────────────────────────────────────────────
import { Router } from "express";
import { identityController } from "./controller.js";
import { validate } from "../../../shared/validation/validate.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { createUserSchema, updateUserSchema, updateStatusSchema } from "./validator.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

const router = Router();

// All routes require auth + active + tenant
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
 * /users:
 *   get:
 *     tags:
 *       - Identity
 *     summary: Get all staff members in the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff members returned
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 */
router.get(
  "/users",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  (req, res, next) => identityController.getAllUsers(req as RequestWithContext, res, next),
);

/**
 * @openapi
 * /users/stats:
 *   get:
 *     tags:
 *       - Identity
 *     summary: Get user statistics (total, online, roles count) for the restaurant
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics data
 */
router.get(
  "/users/stats",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  (req, res, next) => identityController.getUserStats(req as RequestWithContext, res, next),
);

/**
 * @openapi
 * /users/online:
 *   get:
 *     tags:
 *       - Identity
 *     summary: Get currently online staff members
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of online staff members
 */
router.get(
  "/users/online",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  (req, res, next) => identityController.getOnlineUsers(req as RequestWithContext, res, next),
);

router.post(
  "/users",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_CREATE) as import("express").RequestHandler,
  validate({ body: createUserSchema }),
  (req, res, next) => identityController.createUser(req as RequestWithContext, res, next),
);

router.put(
  "/users/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_UPDATE) as import("express").RequestHandler,
  validate({ body: updateUserSchema }),
  (req, res, next) => identityController.updateUser(req as RequestWithContext, res, next),
);

router.patch(
  "/users/:id/status",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_DEACTIVATE) as import("express").RequestHandler,
  validate({ body: updateStatusSchema }),
  (req, res, next) => identityController.updateUserStatus(req as RequestWithContext, res, next),
);

router.delete(
  "/users/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_DEACTIVATE) as import("express").RequestHandler,
  (req, res, next) => identityController.deleteUser(req as RequestWithContext, res, next),
);

router.patch(
  "/users/:id/toggle-status",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_UPDATE) as import("express").RequestHandler,
  (req, res, next) => identityController.toggleUserStatus(req as RequestWithContext, res, next),
);

router.get(
  "/users/recent",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  (req, res, next) => identityController.getRecentSignups(req as RequestWithContext, res, next),
);

router.get(
  "/users/role/:role",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  (req, res, next) => {
    // Inject role param to query to reuse getAllUsers
    req.query.role = req.params.role;
    return identityController.getAllUsers(req as RequestWithContext, res, next);
  },
);

export default router;
