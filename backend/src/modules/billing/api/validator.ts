// ─── Bill Validators ──────────────────────────────────────────────────────────
// Module: billing | Layer: api

import { z } from "zod";

const billItemSchema = z.object({
  name: z.string().min(1).optional(),
  item_name: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive(),
  price: z.coerce.number().positive(),
});

export const createBillSchema = z.object({
  order_id: z.string().min(1),
  table_id: z.string().min(1),
  subtotal: z.coerce.number().nonnegative(),
  tax: z.coerce.number().nonnegative(),
  total_amount: z.coerce.number().positive(),
  items: z.array(billItemSchema).optional(),
});
