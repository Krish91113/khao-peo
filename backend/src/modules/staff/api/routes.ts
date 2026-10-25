// ─── Staff Routes ─────────────────────────────────────────────────────────────
// Module: staff | Layer: api
// KP-FRD-002 Section 21: REST endpoints. RBAC enforced via permissions.

import { Router } from "express";
import { staffController } from "./controller.js";
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  staffIdParamsSchema,
  listStaffQuerySchema,
} from "./validator.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
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
 * /staff:
 *   get:
 *     tags:
 *       - Staff
 *     summary: List staff for the restaurant (search / filter / paginate / sort)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 20 }
 *       - name: search
 *         in: query
 *         description: Search by name, email, phone or employee code
 *         schema: { type: string }
 *       - name: role
 *         in: query
 *         schema: { type: string }
 *       - name: status
 *         in: query
 *         schema: { type: string }
 *       - name: joined_from
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: joined_to
 *         in: query
 *         schema: { type: string, format: date }
 *       - name: sort
 *         in: query
 *         description: newest | oldest | name_asc | name_desc | joined
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated staff list
 *   post:
 *     tags:
 *       - Staff
 *     summary: Create a new staff member (Owner/Admin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [first_name, email, password, role]
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string }
 *               status: { type: string }
 *               profile_image: { type: string }
 *               joined_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Staff created
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  validate({ query: listStaffQuerySchema }),
  (req, res, next) => staffController.listStaff(req as unknown as RequestWithContext, res, next),
);

router.post(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_CREATE) as import("express").RequestHandler,
  validate({ body: createStaffSchema }),
  (req, res, next) => staffController.createStaff(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /staff/me:
 *   get:
 *     tags:
 *       - Staff
 *     summary: Get the authenticated user's own staff profile (Waiter/Chef self-view)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Own staff profile
 */
router.get("/me", ...authChain, (req, res, next) =>
  staffController.getMyProfile(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /staff/{id}:
 *   get:
 *     tags:
 *       - Staff
 *     summary: Get a single staff member by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Staff member details
 *       404:
 *         description: STAFF_NOT_FOUND
 *   patch:
 *     tags:
 *       - Staff
 *     summary: Update a staff member
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string }
 *               status: { type: string }
 *               profile_image: { type: string }
 *               joined_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Staff updated
 *   delete:
 *     tags:
 *       - Staff
 *     summary: Soft-delete a staff member (BR-006)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Staff soft-deleted
 */
router.get(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_READ) as import("express").RequestHandler,
  validate({ params: staffIdParamsSchema }),
  (req, res, next) => staffController.getStaffById(req as unknown as RequestWithContext, res, next),
);

router.patch(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_UPDATE) as import("express").RequestHandler,
  validate({ params: staffIdParamsSchema, body: updateStaffSchema }),
  (req, res, next) => staffController.updateStaff(req as unknown as RequestWithContext, res, next),
);

router.delete(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_DEACTIVATE) as import("express").RequestHandler,
  validate({ params: staffIdParamsSchema }),
  (req, res, next) => staffController.deleteStaff(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /staff/{id}/status:
 *   patch:
 *     tags:
 *       - Staff
 *     summary: Update staff status (activate / deactivate / suspend)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *               reason_code: { type: string }
 *               reason_text: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/:id/status",
  ...authChain,
  requirePermissions(PERMISSIONS.STAFF_DEACTIVATE) as import("express").RequestHandler,
  validate({ params: staffIdParamsSchema, body: updateStaffStatusSchema }),
  (req, res, next) =>
    staffController.updateStaffStatus(req as unknown as RequestWithContext, res, next),
);

export default router;
