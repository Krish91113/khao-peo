import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  active: z.boolean().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().positive(),
  minimumOrderPaise: z.number().int().nonnegative().optional(),
  maximumDiscountPaise: z.number().int().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
});
export const updateCouponSchema = createCouponSchema.partial();
export const couponIdSchema = z.object({ coupon_id: z.string().min(1) });
export const validateCouponSchema = z.object({ code: z.string().min(2).max(40), subtotalPaise: z.number().int().nonnegative() });
