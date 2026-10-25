// ─── Shared TypeScript Types ──────────────────────────────────────────────────
// Central type definitions used across all modules.
// FRD Section 7.2, 10.1, 10.2, 11.1

// ─── User Roles ───────────────────────────────────────────────────────────────
// KP-FRD-002: Staff roles. FRD names (OWNER/ADMIN/MANAGER/WAITER/CHEF/CASHIER)
// map to stored values below for backward compatibility with existing modules.
export type UserRole =
  | "platform_superadmin"
  | "restaurant_owner"
  | "restaurant_admin"
  | "manager"
  | "waiter"
  | "cook"
  | "cashier";

// ─── User Status ──────────────────────────────────────────────────────────────
export type UserStatus = "active" | "inactive" | "suspended";

// ─── Request Context ──────────────────────────────────────────────────────────
export interface RequestContext {
  request_id: string;
  user_id?: string;
  restaurant_id?: string;
  role?: UserRole;
  permissions: string[];
  ip_address?: string;
  user_agent?: string;
  started_at: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

// ─── Standard Response ────────────────────────────────────────────────────────
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
  request_id: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  request_id: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export interface AuditEntry {
  audit_id: string;
  restaurant_id: string;
  actor_id: string;
  actor_role: UserRole;
  action: string;
  entity_type: string;
  entity_id: string;
  reason_code?: string;
  reason_text?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  request_id: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ─── Domain Event ─────────────────────────────────────────────────────────────
export interface DomainEvent<T = unknown> {
  event_id: string;
  event_name: string;
  event_version: number;
  occurred_at: string;
  request_id: string;
  restaurant_id: string;
  actor_id: string;
  payload: T;
}

// ─── Order Status ─────────────────────────────────────────────────────────────
export type OrderStatus =
  "pending" | "sent_to_kitchen" | "preparing" | "ready" | "served" | "voided";

export type OrderType = "dine_in" | "inhouse_delivery";

// ─── Kitchen Ticket Status ────────────────────────────────────────────────────
export type KitchenItemStatus = "received" | "preparing" | "partially_ready" | "ready";

// ─── Table Status ─────────────────────────────────────────────────────────────
export type TableStatus = "available" | "occupied" | "reserved" | "maintenance";

// ─── Payment ──────────────────────────────────────────────────────────────────
export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";
export type PaymentMethod = "cash" | "card" | "upi" | "wallet" | "other";

// ─── Discount ─────────────────────────────────────────────────────────────────
export type DiscountType =
  "item_percentage" | "item_fixed" | "order_percentage" | "order_fixed" | "complimentary";

export type DiscountApprovalStatus = "pending" | "approved" | "rejected";

// ─── Inventory ────────────────────────────────────────────────────────────────
export type InventoryTransactionType = "stock_in" | "stock_out" | "adjustment" | "waste";

// ─── Attendance ───────────────────────────────────────────────────────────────
export type AttendanceStatus = "checked_in" | "on_break" | "checked_out";

// ─── Restaurant Status ────────────────────────────────────────────────────────
export type RestaurantStatus = "active" | "suspended" | "trial" | "inactive";

// ─── Subscription ─────────────────────────────────────────────────────────────
export type SubscriptionPlan = "basic" | "professional" | "enterprise";
export type SubscriptionStatus = "active" | "trial" | "suspended" | "cancelled" | "expired";

// ─── Utility Types ────────────────────────────────────────────────────────────
export type WithTimestamps<T> = T & {
  created_at: Date;
  updated_at: Date;
};

export type WithTenant<T> = T & {
  restaurant_id: string;
};

export type WithAuditFields<T> = T & {
  created_by: string;
  updated_by: string;
  version: number;
  is_deleted: boolean;
  deleted_at?: Date;
};
