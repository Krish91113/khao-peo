// ─── Attendance Validators ────────────────────────────────────────────────────
// Module: attendance | Layer: api
// FRD Section 23.1: Zod validation on every endpoint.

import { z } from "zod";
import {
  ACTIVE_ATTENDANCE_STATUSES,
  ATTENDANCE_REASON_CODES,
  ATTENDANCE_STATUSES,
} from "../domain/attendance.constants.js";

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const BUSINESS_DATE = /^\d{4}-\d{2}-\d{2}$/;
const statusEnum = z.enum(ATTENDANCE_STATUSES as [string, ...string[]]);
const activeStatusEnum = z.enum(ACTIVE_ATTENDANCE_STATUSES as [string, ...string[]]);
const reasonCodeEnum = z.enum(ATTENDANCE_REASON_CODES as unknown as [string, ...string[]]);

export const attendanceIdParamsSchema = z.object({
  attendance_id: z.string().regex(OBJECT_ID, "Invalid attendance id"),
});

export const checkInSchema = z.object({
  note: z.string().trim().max(500).optional(),
});

export const checkOutSchema = z.object({
  force: z.boolean().optional(),
  note: z.string().trim().max(500).optional(),
});

export const correctAttendanceSchema = z
  .object({
    checked_in_at: z.string().datetime({ offset: true }).optional(),
    checked_out_at: z.string().datetime({ offset: true }).nullable().optional(),
    total_working_minutes: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60)
      .optional(),
    total_break_minutes: z
      .number()
      .int()
      .nonnegative()
      .max(24 * 60)
      .optional(),
    note: z.string().trim().max(500).optional(),
    reason_code: reasonCodeEnum,
    reason_text: z.string().trim().min(3, "reason_text is required").max(500),
    // Legacy alias for reason_text (kept so older clients keep working).
    correction_note: z.string().trim().min(3, "correction_note is required").max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for correction",
  });

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: statusEnum.optional(),
  user_id: z.string().regex(OBJECT_ID, "Invalid user id").optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  date: z.string().regex(BUSINESS_DATE, "Invalid date, expected YYYY-MM-DD").optional(),
  date_from: z.string().regex(BUSINESS_DATE, "Invalid date_from, expected YYYY-MM-DD").optional(),
  date_to: z.string().regex(BUSINESS_DATE, "Invalid date_to, expected YYYY-MM-DD").optional(),
  sort: z.enum(["newest", "oldest", "updated"]).optional(),
});

export const staffIdParamsSchema = z.object({
  user_id: z.string().regex(OBJECT_ID, "Invalid user id"),
});

// ─── Action Request Schemas ──────────────────────────────────────────────────

export const createActionRequestSchema = z.object({
  user_id: z.string().regex(OBJECT_ID, "Invalid user id"),
  action: z.enum(["CHECK_IN", "START_BREAK", "END_BREAK", "CHECK_OUT"]),
});

export const actionRequestIdParamsSchema = z.object({
  id: z.string().regex(OBJECT_ID, "Invalid request id"),
});

export { activeStatusEnum };
