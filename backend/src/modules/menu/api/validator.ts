// ─── Menu Validators ──────────────────────────────────────────────────────────
// Module: menu | Layer: api

import { z } from "zod";

const modifierOptionSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
});

const modifierGroupSchema = z.object({
  name: z.string().min(1),
  options: z.array(modifierOptionSchema),
  isRequired: z.boolean().optional(),
  minSelection: z.coerce.number().int().positive().optional(),
  maxSelection: z.coerce.number().int().positive().optional(),
});

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  image: z.string().url().optional().or(z.string().max(0)),
  isAvailable: z.boolean().optional(),
  isVeg: z.boolean().optional(),
  preparationTime: z.coerce.number().int().positive().optional(),
  customizations: z.array(modifierGroupSchema).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateMenuItemSchema = createMenuItemSchema.partial();
