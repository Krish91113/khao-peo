// ─── Staff Repository ────────────────────────────────────────────────────────
// Module: staff | Layer: infrastructure
// KP-FRD-002: Repository owns tenant-scoped persistence on the shared `users`
// collection (Section 11 — no separate staff collection). Controllers never
// access models directly.

import mongoose from "mongoose";
import { UserModel, type IUser } from "../../../auth/public.js";
import type { StaffRecord } from "../../domain/staff.types.js";
import type { StaffSortKey } from "../../domain/staff.constants.js";
import { STAFF_SORT_OPTIONS } from "../../domain/staff.constants.js";

export interface StaffListParams {
  restaurantId: string;
  search?: string;
  role?: string;
  status?: string;
  joinedFrom?: Date;
  joinedTo?: Date;
  skip: number;
  limit: number;
  sort: StaffSortKey;
}

export interface StaffCreateData {
  restaurantId: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  employeeCode?: string;
  profileImage?: string;
  joinedAt?: Date;
  createdBy?: string;
}

export interface StaffUpdateData {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  employeeCode?: string;
  profileImage?: string;
  joinedAt?: Date;
  updatedBy?: string;
  deletedAt?: Date | null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchQuery(search: string): Record<string, unknown> {
  // User input is escaped first, so constructing a RegExp from it is safe.
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(escapeRegex(search), "i");
  return {
    $or: [
      { firstName: regex },
      { lastName: regex },
      { fullName: regex },
      { email: regex },
      { phone: regex },
      { employeeCode: regex },
    ],
  };
}

export const staffRepository = {
  /**
   * Find one staff member within a restaurant (excludes soft-deleted).
   */
  async findById(id: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOne({ _id: id, restaurantId, deletedAt: null });
  },

  /**
   * Find a staff member by email within a restaurant (excludes soft-deleted).
   */
  async findByEmail(email: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOne({
      email: email.toLowerCase().trim(),
      restaurantId,
      deletedAt: null,
    });
  },

  /**
   * Find a staff member by phone within a restaurant (excludes soft-deleted).
   */
  async findByPhone(phone: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOne({ phone, restaurantId, deletedAt: null });
  },

  /**
   * Find a staff member by employee code within a restaurant.
   */
  async findByEmployeeCode(employeeCode: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOne({ employeeCode, restaurantId, deletedAt: null });
  },

  /**
   * Return the highest (most recent) employee code for a restaurant, or null.
   * Used by the application service to generate sequential codes (BR-005).
   */
  async findLatestEmployeeCode(restaurantId: string): Promise<string | null> {
    const doc = await UserModel.findOne({ restaurantId, employeeCode: { $ne: null } })
      .sort({ employeeCode: -1 })
      .select("employeeCode")
      .lean();
    return doc?.employeeCode ?? null;
  },

  /**
   * List staff with search, filters, pagination and sorting.
   */
  async list(params: StaffListParams): Promise<{ data: StaffRecord[]; total: number }> {
    const query: Record<string, unknown> = {
      restaurantId: params.restaurantId,
      deletedAt: null,
    };

    if (params.search) {
      query.$or = buildSearchQuery(params.search).$or;
    }
    if (params.role) {
      query.role = params.role;
    }
    if (params.status) {
      query.status = params.status;
    }
    if (params.joinedFrom || params.joinedTo) {
      const joinedAt: Record<string, unknown> = {};
      if (params.joinedFrom) joinedAt.$gte = params.joinedFrom;
      if (params.joinedTo) joinedAt.$lte = params.joinedTo;
      query.joinedAt = joinedAt;
    }

    const sort = STAFF_SORT_OPTIONS[params.sort];

    const [data, total] = await Promise.all([
      UserModel.find(query)
        .select(
          "-password -permissions_override -manager_pin_hash -failed_login_count -locked_until",
        )
        .sort(sort)
        .skip(params.skip)
        .limit(params.limit)
        .lean(),
      UserModel.countDocuments(query),
    ]);

    return { data: data as unknown as StaffRecord[], total };
  },

  /**
   * Count active staff for a restaurant.
   */
  async countActive(restaurantId: string): Promise<number> {
    return UserModel.countDocuments({ restaurantId, deletedAt: null, status: "active" });
  },

  /**
   * Create a staff member on the shared users collection.
   */
  async create(data: StaffCreateData, session?: mongoose.ClientSession): Promise<IUser> {
    const docs = await UserModel.create(
      [
        {
          ...data,
          restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
          createdBy: data.createdBy ? new mongoose.Types.ObjectId(data.createdBy) : undefined,
          status: data.status || "active",
        },
      ],
      session ? { session } : {},
    );
    return docs[0]!;
  },

  /**
   * Update a staff member (tenant-scoped).
   */
  async updateById(
    id: string,
    restaurantId: string,
    data: StaffUpdateData,
    session?: mongoose.ClientSession,
  ): Promise<IUser | null> {
    const update: Record<string, unknown> = { ...data };
    if (update.updatedBy) update.updatedBy = new mongoose.Types.ObjectId(String(update.updatedBy));

    return UserModel.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: update },
      { new: true, session },
    );
  },

  /**
   * Soft delete a staff member (BR-006). Never physically removes the record.
   */
  async softDelete(
    id: string,
    restaurantId: string,
    updatedBy: string,
    session?: mongoose.ClientSession,
  ): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { _id: id, restaurantId },
      {
        $set: {
          deletedAt: new Date(),
          status: "inactive",
          updatedBy: new mongoose.Types.ObjectId(updatedBy),
        },
      },
      { new: true, session },
    );
  },
};
