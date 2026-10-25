// ─── Identity Service ─────────────────────────────────────────────────────────
// Module: identity | Layer: application
// User management (CRUD, status, permissions). Migrates superadmin.controller.js logic.

import bcrypt from "bcryptjs";
import { userRepository } from "../../../auth/public.js";
import {
  resourceNotFound,
  validationFailed,
  permissionDenied,
} from "../../../../shared/errors/app-error.js";
import { createModuleLogger } from "../../../../shared/logging/logger.js";
import mongoose from "mongoose";

const log = createModuleLogger("identity-service");

export const identityService = {
  /**
   * Get all users in a restaurant.
   */
  async getAllUsers(restaurantId: string, filters: { role?: string } = {}) {
    return userRepository.findByRestaurant(restaurantId, filters);
  },

  /**
   * Get user stats for a restaurant.
   */
  async getUserStats(restaurantId: string) {
    const [total, admins, owners, waiters, cooks, online] = await Promise.all([
      userRepository.countByRestaurant(restaurantId),
      userRepository.countByRestaurant(restaurantId, {
        role: ["restaurant_admin"],
      }),
      userRepository.countByRestaurant(restaurantId, {
        role: ["restaurant_owner"],
      }),
      userRepository.countByRestaurant(restaurantId, { role: "waiter" }),
      userRepository.countByRestaurant(restaurantId, { role: "cook" }),
      userRepository.findOnline(restaurantId),
    ]);

    return {
      total,
      admins,
      owners,
      waiters,
      cooks,
      online_count: online.length,
    };
  },

  /**
   * Create a new staff user.
   */
  async createUser(
    restaurantId: string,
    data: {
      fullName: string;
      email: string;
      password: string;
      role: string;
    },
  ) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw validationFailed("User with this email already exists");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await userRepository.create({
      fullName: data.fullName,
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: data.role,
      restaurantId,
    });

    log.info({ user_id: user._id, role: data.role, restaurantId }, "User created");

    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * Update a user.
   */
  async updateUser(
    userId: string,
    restaurantId: string,
    data: { fullName?: string; role?: string; password?: string },
  ) {
    const updateData: Record<string, unknown> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.role) updateData.role = data.role;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(data.password, salt);
    }

    const user = await userRepository.updateById(userId, restaurantId, updateData);
    if (!user) {
      throw resourceNotFound("User", userId);
    }

    log.info({ user_id: userId, restaurantId }, "User updated");

    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * Update user status.
   */
  async updateUserStatus(
    userId: string,
    restaurantId: string,
    status: string,
    reason?: { reason_code?: string; reason_text?: string },
  ) {
    const user = await userRepository.updateById(userId, restaurantId, {
      status: status as "active" | "inactive" | "suspended",
    });
    if (!user) {
      throw resourceNotFound("User", userId);
    }

    log.info({ user_id: userId, status, reason }, "User status updated");

    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  },

  /**
   * Delete a user.
   */
  async deleteUser(userId: string, restaurantId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw resourceNotFound("User", userId);
    }

    if (user.role === "platform_superadmin" || user.role === "restaurant_owner") {
      throw permissionDenied("Cannot delete owner or superadmin accounts");
    }

    const deleted = await userRepository.deleteById(userId, restaurantId);
    if (!deleted) {
      throw resourceNotFound("User", userId);
    }

    log.info({ user_id: userId, restaurantId }, "User deleted");
  },

  /**
   * Get online users.
   */
  async getOnlineUsers(restaurantId: string) {
    return userRepository.findOnline(restaurantId);
  },

  /**
   * Toggle user online status.
   */
  async toggleUserStatus(userId: string, restaurantId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw resourceNotFound("User", userId);
    }

    const updated = await userRepository.updateById(userId, restaurantId, {
      isOnline: !user.isOnline,
    });

    return updated;
  },

  /**
   * Get recent signups for a restaurant.
   */
  async getRecentSignups(restaurantId: string, limit: number) {
    const User = mongoose.model("User");
    return User.find({ restaurantId })
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },
};
