// ─── JWT Authentication Middleware ────────────────────────────────────────────
// FRD Section 10.5: Verifies JWT, attaches user to context.
// Replaces middleware/auth.middleware.js

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ENV } from "../config/env.js";
import { authenticationRequired, tokenExpired, tokenRevoked } from "../errors/app-error.js";
import { resolvePermissions } from "./permission-catalog.js";
import type { RequestWithContext } from "../http/request-context.js";
import type { Response, NextFunction } from "express";
import type { UserRole } from "../types/index.js";
import { createModuleLogger } from "../logging/logger.js";

const log = createModuleLogger("auth");

interface JwtPayload {
  id: string;
  role: UserRole;
  token_version?: number;
  iat: number;
  exp: number;
}

/**
 * Authenticate requests via Bearer JWT token.
 * Populates req.context with user_id, restaurant_id, role, permissions.
 */
export async function authenticate(
  req: RequestWithContext,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw authenticationRequired("No token provided");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw authenticationRequired("No token provided");
    }

    // Verify JWT
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw tokenExpired();
      }
      throw authenticationRequired("Invalid token");
    }

    // Look up user from DB (to check status, token_version, etc.)
    const User = mongoose.model("User");
    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      throw authenticationRequired("User not found");
    }

    const userDoc = user as Record<string, unknown>;

    // Check token_version for revocation
    if (
      userDoc.token_version !== undefined &&
      decoded.token_version !== undefined &&
      decoded.token_version !== userDoc.token_version
    ) {
      throw tokenRevoked();
    }

    // Attach user to request
    req.user = {
      _id: (userDoc._id as mongoose.Types.ObjectId).toString(),
      id: (userDoc._id as mongoose.Types.ObjectId).toString(),
      role: userDoc.role as string,
      restaurantId: userDoc.restaurantId
        ? (userDoc.restaurantId as mongoose.Types.ObjectId).toString()
        : undefined,
      status: (userDoc.status as string) || "active",
      permissions_override: (userDoc.permissions_override as string[]) || [],
      token_version: userDoc.token_version as number | undefined,
    };

    // Attach restaurantId for backward compatibility
    if (req.user.restaurantId) {
      req.restaurantId = req.user.restaurantId;
    }

    // Populate context
    const role = req.user.role as UserRole;
    req.context.user_id = req.user._id;
    req.context.restaurant_id = req.user.restaurantId;
    req.context.role = role;
    req.context.permissions = resolvePermissions(role, req.user.permissions_override);

    log.debug(
      { user_id: req.user._id, role, request_id: req.context.request_id },
      "User authenticated",
    );

    next();
  } catch (err) {
    next(err);
  }
}
