// ─── Identity Validators ──────────────────────────────────────────────────────
import { z } from "zod";

export const createUserSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["restaurant_admin", "waiter", "cook"]),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(["restaurant_admin", "waiter", "cook"]).optional(),
  password: z.string().min(6).max(128).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]),
  reason_code: z.string().min(2).max(50).optional(),
  reason_text: z.string().min(5).max(500).optional(),
});
