// ─── Staff Validators ─────────────────────────────────────────────────────────
// Module: staff | Layer: api
// KP-FRD-002: Zod validation on every write endpoint and query params.

import { z } from "zod";
import { STAFF_ROLE_MAP, STAFF_STATUS_MAP } from "../domain/staff.constants.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Accept FRD names (OWNER/ADMIN/... / ACTIVE/...) AND stored values, then
// normalise to stored values for persistence.
const roleEnum = z.enum(Object.keys(STAFF_ROLE_MAP) as [string, ...string[]]);
const statusEnum = z.enum(Object.keys(STAFF_STATUS_MAP) as [string, ...string[]]);

export const staffIdParamsSchema = z.object({
  id: z.string().regex(OBJECT_ID, "Invalid staff id"),
});

export const createStaffSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().max(100).optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().trim().min(7, "Valid phone number is required").max(20).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: roleEnum,
  status: statusEnum.optional(),
  profile_image: z.string().url("profile_image must be a valid URL").optional(),
  joined_at: z.string().datetime({ offset: true }).optional(),
});

export const updateStaffSchema = z
  .object({
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().max(100).optional(),
    email: z.string().email("Valid email is required").optional(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(6).max(128).optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    profile_image: z.string().url("profile_image must be a valid URL").optional(),
    joined_at: z.string().datetime({ offset: true }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const updateStaffStatusSchema = z.object({
  status: statusEnum,
  reason_code: z.string().trim().min(2).max(50).optional(),
  reason_text: z.string().trim().min(5).max(500).optional(),
});

export const listStaffQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
  joined_from: z.coerce.date().optional(),
  joined_to: z.coerce.date().optional(),
  sort: z.string().trim().max(20).optional(),
  sort_by: z.string().trim().max(30).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
});
