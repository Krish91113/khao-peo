// ─── Permission Catalog ───────────────────────────────────────────────────────
// FRD Section 11.1: Full permission catalog with default role→permission mappings.

import type { UserRole } from "../types/index.js";

/**
 * All permissions in the system.
 */
export const PERMISSIONS = {
  // Restaurant
  RESTAURANT_READ: "restaurant.read",
  RESTAURANT_UPDATE: "restaurant.update",

  // Staff
  STAFF_READ: "staff.read",
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",
  STAFF_DEACTIVATE: "staff.deactivate",

  // Attendance
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_MANAGE: "attendance.manage",

  // Table
  TABLE_READ: "table.read",
  TABLE_CREATE: "table.create",
  TABLE_UPDATE: "table.update",
  TABLE_ASSIGN: "table.assign",
  TABLE_REASSIGN: "table.reassign",
  TABLE_RELEASE: "table.release",

  // Order
  ORDER_READ: "order.read",
  ORDER_CREATE: "order.create",
  ORDER_UPDATE: "order.update",
  ORDER_VOID: "order.void",

  // Kitchen
  KITCHEN_READ: "kitchen.read",
  KITCHEN_TRANSITION: "kitchen.transition",

  // Discount
  DISCOUNT_REQUEST: "discount.request",
  DISCOUNT_APPLY: "discount.apply",
  DISCOUNT_APPROVE: "discount.approve",
  COUPON_MANAGE: "coupon.manage",

  // Billing
  BILL_READ: "bill.read",
  BILL_GENERATE: "bill.generate",
  BILL_REOPEN: "bill.reopen",
  PAYMENT_COLLECT: "payment.collect",
  PAYMENT_REVERSE: "payment.reverse",

  // Menu
  MENU_READ: "menu.read",
  MENU_MANAGE: "menu.manage",

  // Inventory
  INVENTORY_READ: "inventory.read",
  INVENTORY_MANAGE: "inventory.manage",

  // Analytics
  ANALYTICS_READ: "analytics.read",

  // Audit
  AUDIT_READ: "audit.read",

  // Platform
  PLATFORM_MANAGE: "platform.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Default permissions for each role.
 * Users can also have `permissions_override` for additional grants.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  platform_superadmin: [PERMISSIONS.PLATFORM_MANAGE],

  restaurant_owner: [
    PERMISSIONS.RESTAURANT_READ,
    PERMISSIONS.RESTAURANT_UPDATE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DEACTIVATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.TABLE_READ,
    PERMISSIONS.TABLE_CREATE,
    PERMISSIONS.TABLE_UPDATE,
    PERMISSIONS.TABLE_ASSIGN,
    PERMISSIONS.TABLE_REASSIGN,
    PERMISSIONS.TABLE_RELEASE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_VOID,
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.KITCHEN_TRANSITION,
    PERMISSIONS.DISCOUNT_REQUEST,
    PERMISSIONS.DISCOUNT_APPLY,
    PERMISSIONS.DISCOUNT_APPROVE,
    PERMISSIONS.COUPON_MANAGE,
    PERMISSIONS.BILL_READ,
    PERMISSIONS.BILL_GENERATE,
    PERMISSIONS.BILL_REOPEN,
    PERMISSIONS.PAYMENT_COLLECT,
    PERMISSIONS.PAYMENT_REVERSE,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.MENU_MANAGE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  restaurant_admin: [
    PERMISSIONS.RESTAURANT_READ,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_CREATE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_DEACTIVATE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.TABLE_READ,
    PERMISSIONS.TABLE_CREATE,
    PERMISSIONS.TABLE_UPDATE,
    PERMISSIONS.TABLE_ASSIGN,
    PERMISSIONS.TABLE_REASSIGN,
    PERMISSIONS.TABLE_RELEASE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_VOID,
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.KITCHEN_TRANSITION,
    PERMISSIONS.DISCOUNT_REQUEST,
    PERMISSIONS.DISCOUNT_APPLY,
    PERMISSIONS.DISCOUNT_APPROVE,
    PERMISSIONS.BILL_READ,
    PERMISSIONS.BILL_GENERATE,
    PERMISSIONS.BILL_REOPEN,
    PERMISSIONS.PAYMENT_COLLECT,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.MENU_MANAGE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  manager: [
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.TABLE_READ,
    PERMISSIONS.TABLE_CREATE,
    PERMISSIONS.TABLE_UPDATE,
    PERMISSIONS.TABLE_ASSIGN,
    PERMISSIONS.TABLE_REASSIGN,
    PERMISSIONS.TABLE_RELEASE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.KITCHEN_TRANSITION,
    PERMISSIONS.DISCOUNT_REQUEST,
    PERMISSIONS.DISCOUNT_APPLY,
    PERMISSIONS.DISCOUNT_APPROVE,
    PERMISSIONS.BILL_READ,
    PERMISSIONS.BILL_GENERATE,
    PERMISSIONS.PAYMENT_COLLECT,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  waiter: [
    PERMISSIONS.TABLE_READ,
    PERMISSIONS.TABLE_ASSIGN,
    PERMISSIONS.TABLE_RELEASE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.DISCOUNT_REQUEST,
    PERMISSIONS.BILL_READ,
    PERMISSIONS.BILL_GENERATE,
    PERMISSIONS.PAYMENT_COLLECT,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.AUDIT_READ,
  ],

  cook: [
    PERMISSIONS.KITCHEN_READ,
    PERMISSIONS.KITCHEN_TRANSITION,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.ATTENDANCE_READ,
  ],

  cashier: [
    PERMISSIONS.TABLE_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.BILL_READ,
    PERMISSIONS.BILL_GENERATE,
    PERMISSIONS.PAYMENT_COLLECT,
    PERMISSIONS.MENU_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.AUDIT_READ,
  ],
};

/**
 * Legacy role → current role mapping (migration safety). Accounts created
 * before the role vocabulary was finalised used `owner` / `admin` /
 * `superadmin`; without a mapping they would resolve to an empty permission
 * set and be locked out of every guarded endpoint.
 */
export const LEGACY_ROLE_MAP: Record<string, keyof typeof ROLE_PERMISSIONS> = {
  owner: "restaurant_owner",
  admin: "restaurant_admin",
  superadmin: "platform_superadmin",
};

/**
 * Resolve the full permission set for a user.
 * Combines default role permissions + any permission overrides.
 * Legacy roles are normalised to their modern equivalents.
 */
export function resolvePermissions(role: UserRole, overrides: string[] = []): string[] {
  const normalized: keyof typeof ROLE_PERMISSIONS =
    LEGACY_ROLE_MAP[role as string] ?? (role as keyof typeof ROLE_PERMISSIONS);
  const rolePerms = ROLE_PERMISSIONS[normalized] ?? [];
  const combined = new Set<string>([...rolePerms, ...overrides]);
  return Array.from(combined);
}
