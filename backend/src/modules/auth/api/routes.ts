// ─── Auth Routes ──────────────────────────────────────────────────────────────
// Module: auth | Layer: api
// FRD Section 10.4: Authentication APIs under /api/v1/auth/*

import { Router } from "express";
import { authController } from "./controller.js";
import { validate } from "../../../shared/validation/validate.js";
import { authenticate } from "../../../shared/auth/authenticate.js";
import { ensureActive } from "../../../shared/auth/ensure-active.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  refreshTokenSchema,
} from "./validator.js";
import type { RequestWithContext } from "../../../shared/http/request-context.js";

const router = Router();

// Public routes

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate user and get tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       401:
 *         description: Invalid credentials or account locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post("/login", validate({ body: loginSchema }), (req, res, next) =>
  authController.login(req as RequestWithContext, res, next),
);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user admin/owner/staff
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [restaurant_owner, restaurant_admin, waiter, cook]
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       422:
 *         description: Validation failed or email already exists
 */
router.post("/register", validate({ body: registerSchema }), (req, res, next) =>
  authController.register(req as RequestWithContext, res, next),
);

/**
 * @openapi
 * /auth/refresh_token:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh access token using valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh_token", validate({ body: refreshTokenSchema }), (req, res, next) =>
  authController.refreshToken(req as RequestWithContext, res, next),
);

// Protected routes
router.post(
  "/logout",
  (req, res, next) => authenticate(req as RequestWithContext, res, next),
  (req, res, next) => authController.logout(req as RequestWithContext, res, next),
);

router.get(
  "/me",
  (req, res, next) => authenticate(req as RequestWithContext, res, next),
  (req, res, next) => ensureActive(req as RequestWithContext, res, next),
  (req, res, next) => authController.me(req as RequestWithContext, res, next),
);

router.post(
  "/change_password",
  (req, res, next) => authenticate(req as RequestWithContext, res, next),
  (req, res, next) => ensureActive(req as RequestWithContext, res, next),
  validate({ body: changePasswordSchema }),
  (req, res, next) => authController.changePassword(req as RequestWithContext, res, next),
);

export default router;
