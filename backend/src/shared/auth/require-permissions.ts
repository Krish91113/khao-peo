// ─── Permission-Based RBAC Middleware ─────────────────────────────────────────
// FRD Section 11.2: Permission-driven authorization (replaces role-based checks).

import { permissionDenied } from "../errors/app-error.js";
import type { RequestWithContext } from "../http/request-context.js";
import type { Response, NextFunction } from "express";

/**
 * Middleware factory that requires one or more permissions.
 * The user must have ALL specified permissions.
 *
 * Usage:
 *   router.post("/", authenticate, ensureActive, requirePermissions("order.create"), controller);
 */
export function requirePermissions(...required: string[]) {
  return (req: RequestWithContext, _res: Response, next: NextFunction): void => {
    try {
      const userPermissions = req.context.permissions;

      // Platform superadmin bypasses permission checks
      if (req.context.role === "platform_superadmin") {
        return next();
      }

      const missing = required.filter((p) => !userPermissions.includes(p));

      if (missing.length > 0) {
        throw permissionDenied(`Missing required permissions: ${missing.join(", ")}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Middleware factory that requires ANY ONE of the specified permissions.
 */
export function requireAnyPermission(...required: string[]) {
  return (req: RequestWithContext, _res: Response, next: NextFunction): void => {
    try {
      const userPermissions = req.context.permissions;

      // Platform superadmin bypasses permission checks
      if (req.context.role === "platform_superadmin") {
        return next();
      }

      const hasAny = required.some((p) => userPermissions.includes(p));

      if (!hasAny) {
        throw permissionDenied(`Requires at least one of: ${required.join(", ")}`);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Legacy compatibility: requireRole middleware for backward compatibility.
 * Checks if the user's role is in the allowed list.
 */
export function requireRole(...roles: string[]) {
  return (req: RequestWithContext, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw permissionDenied("Forbidden: insufficient permissions");
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
