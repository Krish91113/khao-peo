// ─── Attendance Module Types ──────────────────────────────────────────────────
// Module: attendance | Layer: domain
// FRD Section 23.1: Request / response DTOs and domain value objects.

import type { AttendanceStatus } from "../../../shared/types/index.js";

// ─── Break period ─────────────────────────────────────────────────────────────
export interface BreakPeriod {
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes?: number | null;
}

// ─── Input shapes ─────────────────────────────────────────────────────────────
export interface CheckInInput {
  note?: string;
}

export interface CheckOutInput {
  force?: boolean;
  note?: string;
}

export interface CorrectAttendanceInput {
  checked_in_at?: string;
  checked_out_at?: string;
  total_working_minutes?: number;
  total_break_minutes?: number;
  note?: string;
  reason_code?: string;
  reason_text?: string;
  /** Legacy alias for reason_text. */
  correction_note?: string;
}

export interface ListAttendanceQuery {
  page?: number;
  limit?: number;
  status?: string;
  user_id?: string;
  from?: Date;
  to?: Date;
  /** Restaurant-local business date (YYYY-MM-DD). */
  date?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

// ─── Response DTO ─────────────────────────────────────────────────────────────
// Shape of a stored `attendance_records` document as read by the module.
export interface AttendanceRecord {
  _id: unknown;
  restaurantId: unknown;
  userId: unknown;
  status: AttendanceStatus;
  businessDate: string;
  checkedInAt: Date;
  checkedOutAt?: Date | null;
  breaks: BreakPeriod[];
  totalBreakMinutes: number;
  totalWorkingMinutes: number;
  isActive: boolean;
  note?: string;
  correctedAt?: Date | null;
  correctedBy?: unknown;
  correctionNote?: string;
  reasonCode?: string;
  createdBy?: unknown;
  updatedBy?: unknown;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// User snapshot enriched into responses (read from the shared users collection).
export interface AttendanceUserInfo {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  employee_code: string | null;
  role: string;
}

export interface AttendanceDTO {
  _id: string;
  id: string;
  restaurant_id: string | null;
  user_id: string;
  user: AttendanceUserInfo | null;
  status: AttendanceStatus;
  business_date: string | null;
  checked_in_at: Date | null;
  checked_out_at: Date | null;
  breaks: {
    started_at: Date;
    ended_at: Date | null;
    duration_minutes: number | null;
  }[];
  break_count: number;
  total_break_minutes: number;
  total_working_minutes: number;
  is_active: boolean;
  note: string | null;
  corrected_at: Date | null;
  corrected_by: string | null;
  correction_note: string | null;
  reason_code: string | null;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface AttendanceListResult {
  data: AttendanceDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
