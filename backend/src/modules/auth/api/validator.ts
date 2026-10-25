// ─── Auth Validators ──────────────────────────────────────────────────────────
// Module: auth | Layer: api
// FRD Section 12: Every write endpoint must have runtime validation.

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .email("Invalid email format")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z
    .enum(["restaurant_owner", "restaurant_admin", "waiter", "cook"])
    .optional()
    .default("restaurant_admin"),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters").max(128),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});
