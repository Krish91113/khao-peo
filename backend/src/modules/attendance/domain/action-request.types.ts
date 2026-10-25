// ─── Action Request Types ─────────────────────────────────────────────────────
// Module: attendance | Layer: domain
// Types for the admin-initiated, user-confirmed attendance action request flow.

import type { ActionRequestAction, ActionRequestStatus } from "./attendance.constants.js";

// ─── Domain entity ────────────────────────────────────────────────────────────

export interface ActionRequest {
  _id: unknown;
  restaurantId: unknown;
  userId: unknown;
  requestedBy: unknown;
  action: ActionRequestAction;
  status: ActionRequestStatus;
  requestedAt: Date;
  respondedAt?: Date | null;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ─── API response DTO (snake_case) ────────────────────────────────────────────

export interface ActionRequestDTO {
  id: string;
  restaurant_id: string;
  user_id: string;
  requested_by: string;
  action: ActionRequestAction;
  status: ActionRequestStatus;
  requested_at: string;
  responded_at: string | null;
  expires_at: string;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Input shapes ─────────────────────────────────────────────────────────────

export interface CreateActionRequestInput {
  user_id: string;
  action: ActionRequestAction;
}

// ─── Dashboard response ───────────────────────────────────────────────────────

export interface DashboardStaffAttendance {
  status: "CHECKED_IN" | "ON_BREAK" | "CHECKED_OUT" | "OFF_DUTY";
  attendance_id: string | null;
  checked_in_at: string | null;
  current_break_started_at: string | null;
}

export interface DashboardPendingRequest {
  id: string;
  action: ActionRequestAction;
  status: ActionRequestStatus;
  requested_at: string;
  expires_at: string;
}

export interface DashboardStaffItem {
  user_id: string;
  name: string;
  role: string;
  attendance: DashboardStaffAttendance;
  pending_request: DashboardPendingRequest | null;
}

export interface DashboardResponse {
  staff: DashboardStaffItem[];
}
