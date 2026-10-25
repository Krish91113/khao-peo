// ─── Platform Validators ──────────────────────────────────────────────────────
// Module: platform | Layer: api

import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.trim().toLowerCase()),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      contactPerson: z.string().optional(),
    })
    .optional(),
  business: z
    .object({
      gstNumber: z.string().optional(),
      fssaiNumber: z.string().optional(),
      businessType: z.string().optional(),
    })
    .optional(),
  owner: z.object({
    fullName: z.string().min(2).max(100),
    email: z
      .string()
      .email()
      .transform((v) => v.trim().toLowerCase()),
    password: z.string().min(6).max(128).optional(),
  }),
  plan: z.enum(["basic", "professional", "enterprise"]).optional(),
});

export const updateRestaurantSchema = z.object({
  plan: z.enum(["basic", "professional", "enterprise"]).optional(),
  status: z.enum(["active", "trial", "suspended", "inactive"]).optional(),
  ownerPassword: z.string().min(6).max(128).optional(),
  restaurantName: z.string().min(2).max(100).optional(),
});
