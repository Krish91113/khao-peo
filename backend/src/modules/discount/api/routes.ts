import { Router } from "express";
import { discountController } from "./controller.js";
import { createCouponSchema, updateCouponSchema, couponIdSchema, validateCouponSchema } from "./validator.js";
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
 * /coupons:
 *   post:
 *     tags: [Discounts]
 *     summary: Create a restaurant coupon
 *     security: [{ BearerAuth: [] }]
 *   get:
 *     tags: [Discounts]
 *     summary: List restaurant coupons
 *     security: [{ BearerAuth: [] }]
 */
router.post("/", ...authChain, permission(PERMISSIONS.COUPON_MANAGE), validate({ body: createCouponSchema }), (req, res, next) => discountController.create(request(req), res, next));
router.get("/", ...authChain, permission(PERMISSIONS.COUPON_MANAGE), (req, res, next) => discountController.list(request(req), res, next));
router.patch("/:coupon_id", ...authChain, permission(PERMISSIONS.COUPON_MANAGE), validate({ params: couponIdSchema, body: updateCouponSchema }), (req, res, next) => discountController.update(request(req), res, next));
router.post("/validate", ...authChain, permission(PERMISSIONS.DISCOUNT_APPLY), validate({ body: validateCouponSchema }), (req, res, next) => discountController.validate(request(req), res, next));
export default router;
