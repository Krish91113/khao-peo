// ─── Tenant Guard Middleware ──────────────────────────────────────────────────
// FRD Section 11.3: Enforces restaurant_id from token context.
// Client-supplied restaurant_id MUST NOT override session context.

import { authenticationRequired } from "../errors/app-error.js";
import type { RequestWithContext } from "../http/request-context.js";
import type { Response, NextFunction } from "express";

/**
 * Middleware that enforces tenant (restaurant) scope.
 *
 * Rules:
 * 1. restaurant_id comes from the authenticated user's context.
 * 2. Client-supplied restaurant_id in the request body is ignored/overridden.
 * 3. Platform superadmins can access any restaurant via explicit path params.
 * 4. Cross-tenant access is denied without information leakage.
 */
export function enforceTenantScope(
  req: RequestWithContext,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Platform superadmin routes don't require tenant scope
    if (req.context.role === "platform_superadmin") {
      return next();
    }

    const tenantId = req.context.restaurant_id;

    if (!tenantId) {
      throw authenticationRequired("No restaurant associated with this user");
    }

    // Override any client-supplied restaurant_id in the body
    if (req.body && typeof req.body === "object" && "restaurant_id" in req.body) {
      req.body.restaurant_id = tenantId;
    }
    if (req.body && typeof req.body === "object" && "restaurantId" in req.body) {
      req.body.restaurantId = tenantId;
    }

    // Set restaurantId on request for backward compatibility
    req.restaurantId = tenantId;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware to verify that a resource belongs to the user's restaurant.
 * Use this when an endpoint accesses a resource by ID and you need to verify ownership.
 */
export function verifyResourceTenant(
  resourceRestaurantId: string | undefined,
  userRestaurantId: string | undefined,
): boolean {
  if (!resourceRestaurantId || !userRestaurantId) {
    return false;
  }
  return resourceRestaurantId.toString() === userRestaurantId.toString();
}
