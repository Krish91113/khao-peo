// ─── Attendance Module Constants ─────────────────────────────────────────────
// Module: attendance | Layer: domain
// FRD Section 23.1: Statuses, audit events and sort options for attendance.

import type { AttendanceStatus } from "../../../shared/types/index.js";

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  "checked_in",
  "on_break",
  "checked_out",
];

export const ACTIVE_ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ["checked_in", "on_break"];

// FRD Section 23.1: Audit event names (attendance correction is a required
// auditable action per Section 16).
export const ATTENDANCE_AUDIT_EVENTS = {
  CHECKED_IN: "ATTENDANCE_CHECKED_IN",
  BREAK_STARTED: "ATTENDANCE_BREAK_STARTED",
  BREAK_ENDED: "ATTENDANCE_BREAK_ENDED",
  CHECKED_OUT: "ATTENDANCE_CHECKED_OUT",
  FORCED_CHECKOUT: "ATTENDANCE_FORCED_CHECKOUT",
  CORRECTED: "ATTENDANCE_CORRECTED",
} as const;

export const ATTENDANCE_ENTITY_TYPE = "ATTENDANCE_RECORD";

// Manager-correction reason codes (FRD: reason_code is required).
export const ATTENDANCE_REASON_CODES = [
  "time_correction",
  "missed_checkout",
  "missed_checkin",
  "break_correction",
  "other",
] as const;

export type AttendanceReasonCode = (typeof ATTENDANCE_REASON_CODES)[number];

// Realtime event names (FRD: attendance.*.v1, room restaurant:{id}:operations).
export const ATTENDANCE_REALTIME_EVENTS = {
  CHECKED_IN: "attendance.checked_in.v1",
  BREAK_STARTED: "attendance.break_started.v1",
  BREAK_ENDED: "attendance.break_ended.v1",
  CHECKED_OUT: "attendance.checked_out.v1",
  CORRECTED: "attendance.corrected.v1",
  // Action-request workflow events.
  REQUEST_CREATED: "attendance.request_created.v1",
  REQUEST_CONFIRMED: "attendance.request_confirmed.v1",
  REQUEST_DECLINED: "attendance.request_declined.v1",
  STATUS_CHANGED: "attendance.status_changed.v1",
} as const;

// Roles that may manage attendance for other staff members. All other roles
// only ever see / operate on their own records.
export const ATTENDANCE_MANAGE_ROLES: readonly string[] = [
  "restaurant_owner",
  "restaurant_admin",
  "manager",
];

// ─── Action Request Constants ────────────────────────────────────────────────

export const ACTION_REQUEST_ACTIONS = [
  "CHECK_IN",
  "START_BREAK",
  "END_BREAK",
  "CHECK_OUT",
] as const;

export type ActionRequestAction = (typeof ACTION_REQUEST_ACTIONS)[number];

export const ACTION_REQUEST_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
] as const;

export type ActionRequestStatus = (typeof ACTION_REQUEST_STATUSES)[number];

export const ACTION_REQUEST_ENTITY_TYPE = "ATTENDANCE_ACTION_REQUEST";

/** Notification type for attendance action requests. */
export const ATTENDANCE_NOTIFICATION_TYPE = "ATTENDANCE_REQUEST";
export const ATTENDANCE_NOTIFICATION_REF_TYPE = "ATTENDANCE_ACTION_REQUEST";

/**
 * Valid state transitions: maps current attendance status to allowed actions.
 * "OFF_DUTY" means no active attendance record exists.
 */
export const VALID_STATE_TRANSITIONS: Record<string, readonly ActionRequestAction[]> = {
  OFF_DUTY: ["CHECK_IN"],
  CHECKED_IN: ["START_BREAK", "CHECK_OUT"],
  ON_BREAK: ["END_BREAK"],
  CHECKED_OUT: ["CHECK_IN"],
} as const;

/**
 * Roles that an admin (restaurant_admin / manager) can manage.
 * restaurant_owner can manage ALL roles (including restaurant_admin).
 */
export const ADMIN_MANAGEABLE_ROLES: readonly string[] = [
  "waiter",
  "cook",
  "cashier",
];

/** Default expiry for action requests (15 minutes). */
export const ACTION_REQUEST_EXPIRY_MS = 15 * 60 * 1000;

export const ATTENDANCE_SORT_OPTIONS = {
  newest: { checkedInAt: -1 },
  oldest: { checkedInAt: 1 },
  updated: { updatedAt: -1 },
} as const;

export type AttendanceSortKey = keyof typeof ATTENDANCE_SORT_OPTIONS;
