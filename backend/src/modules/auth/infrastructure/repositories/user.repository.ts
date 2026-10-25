// ─── User Repository ──────────────────────────────────────────────────────────
// Module: auth | Layer: infrastructure
// FRD: Repositories own tenant-scoped persistence. Controllers never access models.

import { UserModel, type IUser } from "../models/user.model.js";
import type mongoose from "mongoose";

export interface CreateUserData {
  fullName: string;
  email: string;
  password: string;
  role: string;
  restaurantId?: string;
  status?: string;
  must_change_password?: boolean;
  // ── KP-FRD-002 Staff fields ───────────────────────────────────────────────
  employeeCode?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  joinedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface UpdateUserData {
  fullName?: string;
  role?: string;
  status?: string;
  password?: string;
  permissions_override?: string[];
  isOnline?: boolean;
  last_login_at?: Date;
  last_activity_at?: Date;
  failed_login_count?: number;
  locked_until?: Date | null;
  password_changed_at?: Date;
  must_change_password?: boolean;
  token_version?: number;
  // ── KP-FRD-002 Staff fields ───────────────────────────────────────────────
  employeeCode?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  joinedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date | null;
}

export const userRepository = {
  /**
   * Find a user by email (global, not tenant-scoped — for login).
   * Soft-deleted staff (KP-FRD-002) are excluded so they cannot log in.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email: email.toLowerCase().trim(), deletedAt: null });
  },

  /**
   * Find a user by ID.
   * Soft-deleted staff (KP-FRD-002) are excluded.
   */
  async findById(id: string): Promise<IUser | null> {
    return UserModel.findOne({ _id: id, deletedAt: null }).select("-password");
  },

  /**
   * Find a user by ID including password (for auth operations).
   */
  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  },

  /**
   * Find users by restaurant ID (tenant-scoped).
   */
  async findByRestaurant(
    restaurantId: string,
    filters: { role?: string; status?: string } = {},
  ): Promise<IUser[]> {
    const query: Record<string, unknown> = { restaurantId };
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;

    return UserModel.find(query).select("-password").sort({ createdAt: -1 });
  },

  /**
   * Create a new user.
   */
  async create(data: CreateUserData, session?: mongoose.ClientSession): Promise<IUser> {
    const users = await UserModel.create(
      [
        {
          ...data,
          status: data.status || "active",
        },
      ],
      session ? { session } : {},
    );
    return users[0]!;
  },

  /**
   * Update a user by ID (tenant-scoped).
   */
  async updateById(
    id: string,
    restaurantId: string | undefined,
    data: UpdateUserData,
  ): Promise<IUser | null> {
    const query: Record<string, unknown> = { _id: id };
    if (restaurantId) query.restaurantId = restaurantId;

    return UserModel.findOneAndUpdate(query, { $set: data }, { new: true }).select("-password");
  },

  /**
   * Update a user by ID (no tenant check — for self operations).
   */
  async updateByIdNoTenant(id: string, data: UpdateUserData): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true }).select("-password");
  },

  /**
   * Count users by restaurant with optional filters.
   */
  async countByRestaurant(
    restaurantId: string,
    filters: { role?: string | string[]; status?: string } = {},
  ): Promise<number> {
    const query: Record<string, unknown> = { restaurantId };
    if (filters.role) {
      query.role = Array.isArray(filters.role) ? { $in: filters.role } : filters.role;
    }
    if (filters.status) query.status = filters.status;

    return UserModel.countDocuments(query);
  },

  /**
   * Delete a user by ID (tenant-scoped).
   */
  async deleteById(id: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOneAndDelete({ _id: id, restaurantId });
  },

  /**
   * Find online users by restaurant.
   */
  async findOnline(restaurantId: string): Promise<IUser[]> {
    return UserModel.find({ restaurantId, isOnline: true })
      .select("-password")
      .sort({ last_activity_at: -1 });
  },

  /**
   * Increment failed login count.
   */
  async incrementFailedLogins(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $inc: { failed_login_count: 1 },
    });
  },

  /**
   * Reset failed login count.
   */
  async resetFailedLogins(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { failed_login_count: 0, locked_until: null },
    });
  },

  /**
   * Lock an account until a given time.
   */
  async lockAccount(id: string, until: Date): Promise<void> {
    await UserModel.findByIdAndUpdate(id, {
      $set: { locked_until: until },
    });
  },
};
