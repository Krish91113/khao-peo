// ─── Order Validators ─────────────────────────────────────────────────────────
// Module: order | Layer: api

import { z } from "zod";

const orderItemSchema = z.object({
  name: z.string().min(1).optional(),
  item_name: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
});

export const createOrderSchema = z.object({
  table_id: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  total_amount: z.coerce.number().positive(),
  coupon_code: z.string().trim().min(2).max(40).optional(),
  orderType: z.enum(["dine_in", "inhouse_delivery"]).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "sent_to_kitchen", "preparing", "ready", "served", "voided"]),
});

export const applyCouponSchema = z.object({ code: z.string().trim().min(2).max(40) });
