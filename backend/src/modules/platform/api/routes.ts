// ─── Platform Routes ──────────────────────────────────────────────────────────
// Module: platform | Layer: api

import { Router } from "express";
import { platformController } from "./controller.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import { requireRole } from "../../../shared/auth/require-permissions.js";
import { validate } from "../../../shared/validation/validate.js";
import { createRestaurantSchema, updateRestaurantSchema } from "./validator.js";
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
    requireRole("platform_superadmin")(
      req as RequestWithContext,
      res as import("express").Response,
      next as import("express").NextFunction,
    ),
];

/**
 * @openapi
 * /platform/restaurants:
 *   post:
 *     tags:
 *       - Platform
 *     summary: Onboard a new restaurant tenant and owner user (Superadmin only)
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
 *         description: Restaurant onboarded successfully
 *   get:
 *     tags:
 *       - Platform
 *     summary: Get all restaurants with subscription details (Superadmin only)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.post(
  "/restaurants",
  ...authChain,
  validate({ body: createRestaurantSchema }),
  (req, res, next) =>
    platformController.createRestaurant(req as unknown as RequestWithContext, res, next),
);

router.post("/restaurants/:id/resend_welcome_email", ...authChain, (req, res, next) =>
  platformController.resendWelcomeEmail(req as unknown as RequestWithContext, res, next),
);

router.get("/restaurants", ...authChain, (req, res, next) =>
  platformController.getAllRestaurants(req as unknown as RequestWithContext, res, next),
);

/**
 * @openapi
 * /platform/restaurants/{id}:
 *   get:
 *     tags:
 *       - Platform
 *     summary: Get details of a single restaurant by ID (Superadmin only)
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
 *         description: Restaurant details
 *   put:
 *     tags:
 *       - Platform
 *     summary: Update subscription or owner credentials for a restaurant (Superadmin only)
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
 *         description: Restaurant updated successfully
 *   delete:
 *     tags:
 *       - Platform
 *     summary: Clean up and delete a restaurant and all associated tenant collections (Superadmin only)
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
 *         description: Restaurant purged successfully
 */
router.get("/restaurants/:id", ...authChain, (req, res, next) =>
  platformController.getRestaurantById(req as unknown as RequestWithContext, res, next),
);

router.put(
  "/restaurants/:id",
  ...authChain,
  validate({ body: updateRestaurantSchema }),
  (req, res, next) =>
    platformController.updateRestaurant(req as unknown as RequestWithContext, res, next),
);

router.delete("/restaurants/:id", ...authChain, (req, res, next) =>
  platformController.deleteRestaurant(req as unknown as RequestWithContext, res, next),
);

export default router;
