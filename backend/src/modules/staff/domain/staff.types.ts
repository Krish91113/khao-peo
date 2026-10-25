// ─── Staff Module Types ──────────────────────────────────────────────────────
// Module: staff | Layer: domain
// KP-FRD-002: Request / response DTOs and domain value objects.

// ─── Status (KP-FRD-002 Section 13) ──────────────────────────────────────────
export type StaffStatus = "active" | "inactive" | "suspended";

// ─── Input / output shapes ───────────────────────────────────────────────────
export interface CreateStaffInput {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  status?: string;
  profile_image?: string;
  joined_at?: string;
}

export interface UpdateStaffInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  profile_image?: string;
  joined_at?: string;
  status?: string;
}

export interface UpdateStaffStatusInput {
  status: string;
  reason_code?: string;
  reason_text?: string;
}

export interface ListStaffQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  joined_from?: Date;
  joined_to?: Date;
  sort?: string;
  sort_by?: string;
  sort_order?: string;
}

// ─── Response DTO (KP-FRD-002 Section 12) ────────────────────────────────────
// Shape of a stored `users` document as read by the staff module.
export interface StaffRecord {
  _id: unknown;
  restaurantId?: unknown;
  employeeCode?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  profileImage?: string | null;
  joinedAt?: Date | null;
  createdBy?: unknown;
  updatedBy?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface StaffDTO {
  _id: string;
  id: string;
  restaurant_id: string | null;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  profile_image: string | null;
  joined_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  deleted_at: Date | null;
}

export interface StaffListResult {
  data: StaffDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
