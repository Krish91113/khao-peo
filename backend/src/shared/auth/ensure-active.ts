// ─── Active User Check Middleware ─────────────────────────────────────────────
// FRD Section 11.2: Reject inactive/suspended users.

import { userInactive, userSuspended } from "../errors/app-error.js";
import type { RequestWithContext } from "../http/request-context.js";
import type { Response, NextFunction } from "express";

/**
 * Middleware to ensure the authenticated user's account is active.
 * Must run AFTER authenticate middleware.
 */
export function ensureActive(req: RequestWithContext, _res: Response, next: NextFunction): void {
  try {
    const status = req.user?.status;

    if (status === "inactive") {
      throw userInactive();
    }

    if (status === "suspended") {
      throw userSuspended();
    }

    next();
  } catch (err) {
    next(err);
  }
}
