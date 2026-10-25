import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(80).optional(),
  unit: z.string().trim().min(1).max(30),
  lowStockThreshold: z.number().finite().min(0).optional(),
  seasonal: z.boolean().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial().extend({ active: z.boolean().optional() });
export const transactionSchema = z.object({
  type: z.enum(["stock_in", "stock_out", "adjustment", "waste"]),
  quantity: z.number().finite().refine((value) => value !== 0, "quantity must not be zero"),
  reason: z.string().trim().max(500).optional(),
});
export const itemIdSchema = z.object({ id: z.string().min(1) });
