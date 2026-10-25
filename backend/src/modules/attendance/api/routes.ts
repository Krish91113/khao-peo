// ─── Attendance Routes ────────────────────────────────────────────────────────
// Module: attendance | Layer: api
// Centralized admin-controlled attendance. Self-service check-in/out removed.
// Action requests follow the approval workflow: admin creates → user confirms.

import { Router } from "express";
import { attendanceController } from "./controller.js";
import {
  attendanceIdParamsSchema,
  correctAttendanceSchema,
  listAttendanceQuerySchema,
  staffIdParamsSchema,
  createActionRequestSchema,
  actionRequestIdParamsSchema,
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

// ─── Action Request Endpoints ────────────────────────────────────────────────

/**
 * @openapi
 * /attendance/action_requests:
 *   post:
 *     tags:
 *       - Attendance Action Requests
 *     summary: Create an attendance action request (Owner/Admin only)
 *     description: |
 *       Admin or Owner initiates an attendance action for a staff member.
 *       The request goes to PENDING status and waits for user confirmation.
 *       Only one PENDING request per user is allowed at a time.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, action]
 *             properties:
 *               user_id:
 *                 type: string
 *                 description: Target staff member's user ID
 *                 example: "60d5ecb74e5f8b0015e1c5a1"
 *               action:
 *                 type: string
 *                 enum: [CHECK_IN, START_BREAK, END_BREAK, CHECK_OUT]
 *                 description: The attendance action to request
 *                 example: "CHECK_IN"
 *     responses:
 *       201:
 *         description: Action request created with PENDING status
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       403:
 *         description: PERMISSION_DENIED — requires attendance.manage permission
 *       404:
 *         description: RESOURCE_NOT_FOUND — target user not found
 *       409:
 *         description: |
 *           ATTENDANCE_REQUEST_ALREADY_PENDING — user already has a pending request
 *           INVALID_ATTENDANCE_STATE — action invalid for current state
 *       422:
 *         description: VALIDATION_FAILED
 */
router.post(
  "/action_requests",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_MANAGE) as import("express").RequestHandler,
  validate({ body: createActionRequestSchema }),
  (req, res, next) =>
    attendanceController.createActionRequest(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /attendance/action_requests/pending:
 *   get:
 *     tags:
 *       - Attendance Action Requests
 *     summary: Get pending action requests for the authenticated user
 *     description: |
 *       Returns all PENDING attendance action requests where the authenticated
 *       user is the target. Used by staff to see requests they need to confirm/decline.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending action requests
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 */
router.get(
  "/action_requests/pending",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  (req, res, next) =>
    attendanceController.getPendingRequests(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /attendance/action_requests/{id}/confirm:
 *   post:
 *     tags:
 *       - Attendance Action Requests
 *     summary: Confirm an action request (target user only)
 *     description: |
 *       The target user confirms the pending request. This applies the attendance
 *       transition (check-in, break, checkout) within a MongoDB transaction.
 *       The request must still be PENDING and the action must still be valid.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: Action request ID
 *     responses:
 *       200:
 *         description: Request confirmed, attendance updated
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       403:
 *         description: PERMISSION_DENIED — only the target user can confirm
 *       404:
 *         description: ATTENDANCE_REQUEST_NOT_FOUND
 *       409:
 *         description: |
 *           ATTENDANCE_REQUEST_INVALID_STATE — not PENDING or expired
 *           INVALID_ATTENDANCE_STATE — state changed since request was created
 */
router.post(
  "/action_requests/:id/confirm",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  validate({ params: actionRequestIdParamsSchema }),
  (req, res, next) =>
    attendanceController.confirmRequest(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /attendance/action_requests/{id}/decline:
 *   post:
 *     tags:
 *       - Attendance Action Requests
 *     summary: Decline an action request (target user only)
 *     description: |
 *       The target user declines the pending request. No attendance change occurs.
 *       The requesting admin is notified in realtime.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: Action request ID
 *     responses:
 *       200:
 *         description: Request declined, no attendance change
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       403:
 *         description: PERMISSION_DENIED — only the target user can decline
 *       404:
 *         description: ATTENDANCE_REQUEST_NOT_FOUND
 *       409:
 *         description: ATTENDANCE_REQUEST_INVALID_STATE — not PENDING
 */
router.post(
  "/action_requests/:id/decline",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  validate({ params: actionRequestIdParamsSchema }),
  (req, res, next) =>
    attendanceController.declineRequest(req as unknown as RequestWithContext, res, next),
);

// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * @openapi
 * /attendance/dashboard:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Admin attendance dashboard (Owner/Admin only)
 *     description: |
 *       Returns compact staff data with current attendance status and pending
 *       action requests. Primary API for the admin live-attendance screen.
 *       Owner sees all roles; Admin sees only waiter/cook/cashier.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: |
 *           Dashboard data with staff array. Each item includes user_id, name,
 *           role, attendance status, pending request (if any).
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 *       403:
 *         description: PERMISSION_DENIED — requires attendance.manage
 */
router.get(
  "/dashboard",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_MANAGE) as import("express").RequestHandler,
  (req, res, next) =>
    attendanceController.getDashboard(req as unknown as RequestWithContext, res, next),
);

// ─── Active Staff Board ──────────────────────────────────────────────────────

/**
 * @openapi
 * /attendance/active:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Active shifts / staff availability board
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active attendance records (scoped to self for non-managers)
 */
router.get(
  "/active",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  (req, res, next) =>
    attendanceController.listActive(req as unknown as RequestWithContext, res, next),
);

// ─── History ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /attendance/staff/{user_id}:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Attendance history for a single staff member
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 20 }
 *       - name: status
 *         in: query
 *         schema: { type: string }
 *       - name: from
 *         in: query
 *         schema: { type: string, format: date-time }
 *       - name: to
 *         in: query
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Paginated attendance history
 *       403:
 *         description: PERMISSION_DENIED — non-managers may only view their own
 */
router.get(
  "/staff/:user_id",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  validate({ params: staffIdParamsSchema, query: listAttendanceQuerySchema }),
  (req, res, next) =>
    attendanceController.listForUser(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /attendance:
 *   get:
 *     tags:
 *       - Attendance
 *     summary: Attendance history with filters and pagination
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, default: 20 }
 *       - name: status
 *         in: query
 *         schema: { type: string }
 *       - name: user_id
 *         in: query
 *         description: Manager-only — filter by staff member
 *         schema: { type: string }
 *       - name: date
 *         in: query
 *         description: Restaurant-local business date (YYYY-MM-DD)
 *         schema: { type: string, example: "2026-08-09" }
 *       - name: date_from
 *         in: query
 *         schema: { type: string, example: "2026-08-01" }
 *       - name: date_to
 *         in: query
 *         schema: { type: string, example: "2026-08-09" }
 *       - name: sort
 *         in: query
 *         description: newest | oldest | updated
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated attendance history
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_READ) as import("express").RequestHandler,
  validate({ query: listAttendanceQuerySchema }),
  (req, res, next) => attendanceController.list(req as unknown as RequestWithContext, res, next),
);

// ─── Manager Corrections ─────────────────────────────────────────────────────

/**
 * @openapi
 * /attendance/{attendance_id}/correct:
 *   patch:
 *     tags:
 *       - Attendance
 *     summary: Correct an attendance record (Owner/Manager only, audited)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: attendance_id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason_code, reason_text]
 *             properties:
 *               checked_in_at: { type: string, format: date-time }
 *               checked_out_at: { type: string, format: date-time, nullable: true }
 *               total_working_minutes: { type: integer }
 *               total_break_minutes: { type: integer }
 *               note: { type: string }
 *               reason_code:
 *                 type: string
 *                 enum: [time_correction, missed_checkout, missed_checkin, break_correction, other]
 *               reason_text:
 *                 type: string
 *                 minLength: 3
 *     responses:
 *       200:
 *         description: Attendance corrected and audited
 *       403:
 *         description: PERMISSION_DENIED — Owner/Manager only
 *       404:
 *         description: ATTENDANCE_NOT_FOUND
 */
router.patch(
  "/:attendance_id/correct",
  ...authChain,
  requirePermissions(PERMISSIONS.ATTENDANCE_MANAGE) as import("express").RequestHandler,
  validate({ params: attendanceIdParamsSchema, body: correctAttendanceSchema }),
  (req, res, next) => attendanceController.correct(req as unknown as RequestWithContext, res, next),
);

export default router;
