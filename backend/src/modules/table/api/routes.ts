// ─── Table Routes ─────────────────────────────────────────────────────────────
// Module: table | Layer: api

import { Router } from "express";
import { tableController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { enforceTenantScope } from "../../../shared/tenant/tenant-guard.js";
import { requirePermissions } from "../../../shared/auth/require-permissions.js";
import { PERMISSIONS } from "../../../shared/auth/permission-catalog.js";
import { validate } from "../../../shared/validation/validate.js";
import {
  createTableSchema,
  updateTableStatusSchema,
  assignTableSchema,
  reassignTableSchema,
  releaseTableSchema,
  tableIdParamSchema,
} from "./validator.js";
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

// ─── Floor Overview ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /tables/floor:
 *   get:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: Live floor plan view and waiter workload counts
 *     description: Returns current occupancy, assigned waiters, and active table counts per waiter.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Floor map with table status & active waiter workloads
 *       401:
 *         description: AUTHENTICATION_REQUIRED
 */
router.get(
  "/floor",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_READ) as import("express").RequestHandler,
  (req, res, next) =>
    tableController.getFloorView(req as unknown as RequestWithContext, res, next),
);

// ─── Standard Table CRUD ─────────────────────────────────────────────────────

/**
 * @openapi
 * /tables:
 *   get:
 *     tags:
 *       - Tables
 *     summary: Get all tables for the restaurant tenant
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *   post:
 *     tags:
 *       - Tables
 *     summary: Create a new dining table
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *             properties:
 *               tableNumber:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Table created successfully
 */
router.get(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_READ) as import("express").RequestHandler,
  (req, res, next) => tableController.getTables(req as unknown as RequestWithContext, res, next),
);

router.post(
  "/",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_CREATE) as import("express").RequestHandler,
  validate({ body: createTableSchema }),
  (req, res, next) => tableController.createTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}:
 *   get:
 *     tags:
 *       - Tables
 *     summary: Get details of a single table by ID
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
 *         description: Table details
 *   delete:
 *     tags:
 *       - Tables
 *     summary: Delete an available table
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
 *         description: Table deleted successfully
 */
router.get(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_READ) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema }),
  (req, res, next) => tableController.getTableById(req as unknown as RequestWithContext, res, next),
);

router.delete(
  "/:id",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_RELEASE) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema }),
  (req, res, next) => tableController.deleteTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/status:
 *   put:
 *     tags:
 *       - Tables
 *     summary: Update table booking status
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
 *               - isBooked
 *             properties:
 *               isBooked:
 *                 type: boolean
 *               currentOrderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put(
  "/:id/status",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_UPDATE) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema, body: updateTableStatusSchema }),
  (req, res, next) =>
    tableController.updateTableStatus(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/reset:
 *   put:
 *     tags:
 *       - Tables
 *     summary: Release table session, archiving active orders into ServedOrder, and resetting state
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
 *         description: Table session cleared
 */
router.put(
  "/:id/reset",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_RELEASE) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema }),
  (req, res, next) => tableController.resetTable(req as unknown as RequestWithContext, res, next),
);

// ─── Table Assignments (Phase 2 APIs) ──────────────────────────────────────

/**
 * @openapi
 * /tables/{id}/claim:
 *   post:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: Waiter self-claims an available table
 *     description: Waiter claims table. Requires checked-in attendance status. Prevents simultaneous claims (409 Conflict).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Table claimed successfully
 *       409:
 *         description: TABLE_ALREADY_ASSIGNED - Table already claimed by another waiter
 *       422:
 *         description: Waiter not checked in
 */
router.post(
  "/:id/claim",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_ASSIGN) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema }),
  (req, res, next) => tableController.claimTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/assign:
 *   post:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: Manager assigns table to a checked-in waiter
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
 *             required: [waiterId]
 *             properties:
 *               waiterId: { type: string }
 *     responses:
 *       201:
 *         description: Table assigned successfully
 *       409:
 *         description: TABLE_ALREADY_ASSIGNED
 */
router.post(
  "/:id/assign",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_ASSIGN) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema, body: assignTableSchema }),
  (req, res, next) => tableController.assignTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/reassign:
 *   post:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: Manager reassigns table to a new checked-in waiter
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
 *             required: [waiterId]
 *             properties:
 *               waiterId: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Table reassigned successfully
 */
router.post(
  "/:id/reassign",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_REASSIGN) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema, body: reassignTableSchema }),
  (req, res, next) =>
    tableController.reassignTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/release:
 *   post:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: Release table assignment and clear session
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Table released successfully
 */
router.post(
  "/:id/release",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_RELEASE) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema, body: releaseTableSchema }),
  (req, res, next) =>
    tableController.releaseTable(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /tables/{id}/assignment_history:
 *   get:
 *     tags:
 *       - Table Assignment & Floor
 *     summary: View history of all waiter assignments for a table
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of past assignment records with waiter and manager details
 */
router.get(
  "/:id/assignment_history",
  ...authChain,
  requirePermissions(PERMISSIONS.TABLE_READ) as import("express").RequestHandler,
  validate({ params: tableIdParamSchema }),
  (req, res, next) =>
    tableController.getAssignmentHistory(req as unknown as RequestWithContext, res, next),
);

export default router;
