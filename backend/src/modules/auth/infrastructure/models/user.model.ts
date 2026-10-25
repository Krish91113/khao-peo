// ─── User Mongoose Model ──────────────────────────────────────────────────────
// Module: auth | Layer: infrastructure
// FRD Section 10.3: Extended user model with status, token_version, lockout fields.

import mongoose, { Schema, type Document } from "mongoose";
import type { UserRole, UserStatus } from "../../../../shared/types/index.js";

export interface IUser extends Document {
  restaurantId?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  permissions_override: string[];
  manager_pin_hash?: string;
  token_version: number;
  last_login_at?: Date;
  last_activity_at?: Date;
  failed_login_count: number;
  locked_until?: Date;
  password_changed_at?: Date;
  must_change_password: boolean;
  isOnline: boolean;
  createdAt: Date;
  updatedAt: Date;
  // ── KP-FRD-002 Staff Management Fields ────────────────────────────────────
  employeeCode?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  joinedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: [
        "platform_superadmin",
        "restaurant_owner",
        "restaurant_admin",
        "manager",
        "waiter",
        "cook",
        "cashier",
        // Legacy role kept for migration safety
        "superadmin",
      ] as string[],
      default: "restaurant_admin",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    permissions_override: {
      type: [String],
      default: [],
    },
    manager_pin_hash: {
      type: String,
      select: false, // Never returned by default
    },
    token_version: {
      type: Number,
      default: 0,
    },
    last_login_at: {
      type: Date,
    },
    last_activity_at: {
      type: Date,
    },
    failed_login_count: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
    },
    password_changed_at: {
      type: Date,
    },
    must_change_password: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    // ── KP-FRD-002 Staff Management Fields ──────────────────────────────────
    employeeCode: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    joinedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Indexes
// KP-FRD-002 Section 15: Compound unique indexes for tenant-scoped uniqueness.
userSchema.index({ restaurantId: 1, email: 1 }, { unique: true });
userSchema.index({ restaurantId: 1, phone: 1 }, { unique: true, sparse: true });
userSchema.index({ restaurantId: 1, employeeCode: 1 }, { unique: true, sparse: true });
userSchema.index({ restaurantId: 1, role: 1 });
userSchema.index({ restaurantId: 1, status: 1 });
userSchema.index({ restaurantId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
// Note: a global unique index on `email` is already created by the field-level
// `unique: true` declaration above, and is required for auth (global login).

export const UserModel = mongoose.model<IUser>("User", userSchema);
