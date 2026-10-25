// ─── Staff Module Constants ──────────────────────────────────────────────────
// Module: staff | Layer: domain
// KP-FRD-002 Section 13/14: Status and role vocabulary.
//
// The API accepts the FRD names (OWNER/ADMIN/MANAGER/WAITER/CHEF/CASHIER and
// ACTIVE/INACTIVE/SUSPENDED) plus the existing stored values. Everything is
// normalised to the stored values so the shared `users` collection remains
// compatible with auth, kitchen and identity modules.

export const STAFF_ROLE_MAP: Record<string, string> = {
  OWNER: "restaurant_owner",
  restaurant_owner: "restaurant_owner",
  ADMIN: "restaurant_admin",
  restaurant_admin: "restaurant_admin",
  MANAGER: "manager",
  manager: "manager",
  WAITER: "waiter",
  waiter: "waiter",
  CHEF: "cook",
  cook: "cook",
  CASHIER: "cashier",
  cashier: "cashier",
};

export const STAFF_STATUS_MAP: Record<string, string> = {
  ACTIVE: "active",
  active: "active",
  INACTIVE: "inactive",
  inactive: "inactive",
  SUSPENDED: "suspended",
  suspended: "suspended",
};

// KP-FRD-002 Section 24: Audit event names.
export const STAFF_AUDIT_EVENTS = {
  CREATED: "STAFF_CREATED",
  UPDATED: "STAFF_UPDATED",
  DEACTIVATED: "STAFF_DEACTIVATED",
  REACTIVATED: "STAFF_REACTIVATED",
  ROLE_CHANGED: "STAFF_ROLE_CHANGED",
} as const;

// KP-FRD-002 Section 20: Sort options.
export const STAFF_SORT_OPTIONS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { firstName: 1, lastName: 1 },
  name_desc: { firstName: -1, lastName: -1 },
  joined: { joinedAt: -1 },
} as const;

export type StaffSortKey = keyof typeof STAFF_SORT_OPTIONS;

export const STAFF_ENTITY_TYPE = "STAFF";

export const MAX_EMPLOYEE_CODE_RETRIES = 5;
