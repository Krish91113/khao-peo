// ─── Auth Service ─────────────────────────────────────────────────────────────
// Module: auth | Layer: application
// FRD: Business logic must not exist in controllers.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../../../../shared/config/env.js";
import { userRepository } from "../../infrastructure/repositories/user.repository.js";
import {
  invalidCredentials,
  accountLocked,
  userInactive,
  userSuspended,
  resourceNotFound,
  validationFailed,
} from "../../../../shared/errors/app-error.js";
import { resolvePermissions } from "../../../../shared/auth/permission-catalog.js";
import { createModuleLogger } from "../../../../shared/logging/logger.js";
import type { UserRole } from "../../../../shared/types/index.js";

const log = createModuleLogger("auth-service");

const MAX_FAILED_LOGINS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginResult {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    restaurantId?: string;
    isOnline: boolean;
    last_login_at: Date;
    permissions: string[];
  };
  access_token: string;
  refresh_token: string;
}

interface TokenPayload {
  id: string;
  role: string;
  token_version: number;
}

function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRY as string & jwt.SignOptions["expiresIn"],
  });
}

function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRY as string & jwt.SignOptions["expiresIn"],
  });
}

function userId(user: { _id: unknown }): string {
  return String(user._id);
}

export const authService = {
  /**
   * Authenticate user with email and password.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw invalidCredentials();
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      throw accountLocked(`Account locked until ${user.locked_until.toISOString()}`);
    }

    // Check user status
    if (user.status === "inactive") {
      throw userInactive();
    }
    if (user.status === "suspended") {
      throw userSuspended();
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await userRepository.incrementFailedLogins(userId(user));

      const newCount = (user.failed_login_count || 0) + 1;
      if (newCount >= MAX_FAILED_LOGINS) {
        const lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await userRepository.lockAccount(userId(user), lockUntil);
        log.warn({ user_id: userId(user), email }, "Account locked due to failed logins");
      }

      throw invalidCredentials();
    }

    // Reset failed login count on success
    await userRepository.resetFailedLogins(userId(user));

    // Update login metadata
    await userRepository.updateByIdNoTenant(userId(user), {
      isOnline: true,
      last_login_at: new Date(),
      last_activity_at: new Date(),
    });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      id: userId(user),
      role: user.role,
      token_version: user.token_version || 0,
    };

    const access_token = signAccessToken(tokenPayload);
    const refresh_token = signRefreshToken(tokenPayload);

    const permissions = resolvePermissions(user.role as UserRole, user.permissions_override || []);

    log.info({ user_id: userId(user), role: user.role }, "User logged in");

    return {
      user: {
        id: userId(user),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId?.toString(),
        isOnline: true,
        last_login_at: new Date(),
        permissions,
      },
      access_token,
      refresh_token,
    };
  },

  /**
   * Register a new user.
   */
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    role?: string;
    restaurantId?: string;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw validationFailed("Email already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: data.role || "restaurant_admin",
      restaurantId: data.restaurantId,
    });

    const tokenPayload: TokenPayload = {
      id: userId(user),
      role: user.role,
      token_version: user.token_version || 0,
    };

    const access_token = signAccessToken(tokenPayload);
    const refresh_token = signRefreshToken(tokenPayload);

    log.info({ user_id: userId(user), role: user.role }, "User registered");

    return {
      user: {
        id: userId(user),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      access_token,
      refresh_token,
    };
  },

  /**
   * Logout a user.
   */
  async logout(logoutUserId: string): Promise<void> {
    await userRepository.updateByIdNoTenant(logoutUserId, {
      isOnline: false,
      last_activity_at: new Date(),
    });

    log.info({ user_id: logoutUserId }, "User logged out");
  },

  /**
   * Get current user profile.
   */
  async getMe(meUserId: string) {
    const user = await userRepository.findById(meUserId);
    if (!user) {
      throw resourceNotFound("User", meUserId);
    }

    const permissions = resolvePermissions(user.role as UserRole, user.permissions_override || []);

    return {
      id: userId(user),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      restaurantId: user.restaurantId?.toString(),
      isOnline: user.isOnline,
      last_login_at: user.last_login_at,
      permissions,
    };
  },

  /**
   * Change user password.
   */
  async changePassword(
    changeUserId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepository.findByIdWithPassword(changeUserId);
    if (!user) {
      throw resourceNotFound("User", changeUserId);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw invalidCredentials("Current password is incorrect");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.updateByIdNoTenant(changeUserId, {
      password: hashedPassword,
      password_changed_at: new Date(),
      must_change_password: false,
      token_version: (user.token_version || 0) + 1,
    });

    log.info({ user_id: changeUserId }, "Password changed");
  },

  /**
   * Refresh access token.
   */
  async refreshToken(refreshTokenValue: string) {
    try {
      const decoded = jwt.verify(refreshTokenValue, ENV.JWT_SECRET) as TokenPayload;

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw invalidCredentials("Invalid refresh token");
      }

      if (user.token_version !== undefined && decoded.token_version !== user.token_version) {
        throw invalidCredentials("Refresh token has been revoked");
      }

      const tokenPayload: TokenPayload = {
        id: userId(user),
        role: user.role,
        token_version: user.token_version || 0,
      };

      const access_token = signAccessToken(tokenPayload);
      const new_refresh_token = signRefreshToken(tokenPayload);

      return { access_token, refresh_token: new_refresh_token };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw invalidCredentials("Refresh token expired");
      }
      throw invalidCredentials("Invalid refresh token");
    }
  },
};
