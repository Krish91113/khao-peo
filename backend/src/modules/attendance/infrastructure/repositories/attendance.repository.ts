// ─── Attendance Repository ────────────────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// FRD Section 23.1: Tenant-scoped persistence on the `attendance_records`
// collection plus read access to the shared `users` collection for response
// enrichment (users is owned by auth, accessed only via auth/public).

import mongoose from "mongoose";
import { UserModel, type IUser } from "../../../auth/public.js";
import { getBusinessDayStartUTC } from "../../../../shared/time/time.js";
import type { AttendanceStatus } from "../../../../shared/types/index.js";
import type { AttendanceRecord, AttendanceUserInfo } from "../../domain/attendance.types.js";
import type { AttendanceSortKey } from "../../domain/attendance.constants.js";
import { ATTENDANCE_SORT_OPTIONS } from "../../domain/attendance.constants.js";
import {
  AttendanceRecordModel,
  type CreateAttendanceData,
  type IAttendanceRecord,
  type UpdateAttendanceData,
} from "../models/attendance-record.model.js";

/** Next calendar day as YYYY-MM-DD (UTC arithmetic — safe for date math). */
function nextBusinessDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + 1));
  return next.toISOString().slice(0, 10);
}

export interface AttendanceListParams {
  restaurantId: string;
  userId?: string;
  status?: AttendanceStatus;
  from?: Date;
  to?: Date;
  /** Restaurant-local business date(s) (YYYY-MM-DD). */
  businessDate?: string;
  businessDateFrom?: string;
  businessDateTo?: string;
  skip: number;
  limit: number;
  sort: AttendanceSortKey;
}

/**
 * Detect the unique-index conflict raised when a second active record is
 * created for the same (restaurantId, userId).
 */
export function isActiveRecordConflict(err: unknown): boolean {
  if (err && typeof err === "object") {
    const e = err as { code?: number };
    return e.code === 11000;
  }
  return false;
}

export const attendanceRepository = {
  /**
   * Find one attendance record within a restaurant.
   */
  async findById(id: string, restaurantId: string): Promise<IAttendanceRecord | null> {
    return AttendanceRecordModel.findOne({ _id: id, restaurantId });
  },

  /**
   * Find the currently active record for a user, or null.
   */
  async findActiveForUser(userId: string, restaurantId: string): Promise<IAttendanceRecord | null> {
    return AttendanceRecordModel.findOne({
      restaurantId,
      userId,
      isActive: true,
      status: { $in: ["checked_in", "on_break"] },
    });
  },

  /**
   * Look up a staff member on the shared users collection (tenant-scoped,
   * soft-deleted users excluded).
   */
  async findUserById(userId: string, restaurantId: string): Promise<IUser | null> {
    return UserModel.findOne({ _id: userId, restaurantId, deletedAt: null });
  },

  /**
   * Create a new attendance record. May throw a duplicate-key error when the
   * caller races another request that already opened a shift for the user.
   */
  async create(data: CreateAttendanceData): Promise<IAttendanceRecord> {
    const docs = await AttendanceRecordModel.create([
      {
        ...data,
        restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
        userId: new mongoose.Types.ObjectId(data.userId),
        createdBy: new mongoose.Types.ObjectId(data.createdBy),
        status: data.status ?? "checked_in",
        breaks: [],
        totalBreakMinutes: 0,
        totalWorkingMinutes: 0,
        isActive: true,
        version: 0,
      },
    ]);
    return docs[0]!;
  },

  /**
   * Update an attendance record (tenant-scoped).
   */
  async updateById(
    id: string,
    restaurantId: string,
    data: UpdateAttendanceData,
  ): Promise<IAttendanceRecord | null> {
    const update: Record<string, unknown> = { ...data };
    if (update.updatedBy) update.updatedBy = new mongoose.Types.ObjectId(String(update.updatedBy));
    if (update.correctedBy) {
      update.correctedBy = new mongoose.Types.ObjectId(String(update.correctedBy));
    }

    return AttendanceRecordModel.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: update, $inc: { version: 1 } },
      { new: true },
    );
  },

  /**
   * List attendance records with tenant scope, optional user/status/date
   * filters, pagination and sorting.
   */
  async list(params: AttendanceListParams): Promise<{ data: AttendanceRecord[]; total: number }> {
    const query: Record<string, unknown> = { restaurantId: params.restaurantId };

    if (params.userId) {
      query.userId = params.userId;
    }
    if (params.status) {
      query.status = params.status;
    }
    if (params.from || params.to) {
      const checkedInAt: Record<string, unknown> = {};
      if (params.from) checkedInAt.$gte = params.from;
      if (params.to) checkedInAt.$lte = params.to;
      query.checkedInAt = checkedInAt;
    }
    if (params.businessDate) {
      // Match the stored business date, plus legacy records created before the
      // businessDate column existed (their checkedInAt still falls on that
      // business day). This keeps historical attendance visible after checkout
      // even without a backfill.
      const dayStart = getBusinessDayStartUTC(params.businessDate);
      const nextDayStart = getBusinessDayStartUTC(nextBusinessDate(params.businessDate));
      query.$or = [
        { businessDate: params.businessDate },
        {
          businessDate: { $exists: false },
          checkedInAt: { $gte: dayStart, $lt: nextDayStart },
        },
      ];
    } else if (params.businessDateFrom || params.businessDateTo) {
      const businessDate: Record<string, unknown> = {};
      if (params.businessDateFrom) businessDate.$gte = params.businessDateFrom;
      if (params.businessDateTo) businessDate.$lte = params.businessDateTo;
      // Legacy records without businessDate are matched by their checkedInAt
      // falling inside the business-day range, keeping them visible too.
      const from = (params.businessDateFrom ?? params.businessDateTo)!;
      const to = (params.businessDateTo ?? params.businessDateFrom)!;
      const rangeStart = getBusinessDayStartUTC(from);
      const rangeEnd = getBusinessDayStartUTC(nextBusinessDate(to));
      query.$or = [
        { businessDate },
        {
          businessDate: { $exists: false },
          checkedInAt: { $gte: rangeStart, $lt: rangeEnd },
        },
      ];
    }

    const sort = ATTENDANCE_SORT_OPTIONS[params.sort];

    const [data, total] = await Promise.all([
      AttendanceRecordModel.find(query).sort(sort).skip(params.skip).limit(params.limit).lean(),
      AttendanceRecordModel.countDocuments(query),
    ]);

    return { data: data as unknown as AttendanceRecord[], total };
  },

  /**
   * List all active records (checked_in / on_break) for the restaurant.
   * Pass `userId` to scope to a single user (self-view).
   */
  async listActive(restaurantId: string, userId?: string): Promise<AttendanceRecord[]> {
    const query: Record<string, unknown> = {
      restaurantId,
      isActive: true,
      status: { $in: ["checked_in", "on_break"] },
    };
    if (userId) {
      query.userId = userId;
    }
    const docs = await AttendanceRecordModel.find(query).sort({ checkedInAt: 1 }).lean();
    return docs as unknown as AttendanceRecord[];
  },

  /**
   * Enrich an attendance record with user display info for API responses.
   */
  async toUserInfo(doc: AttendanceRecord): Promise<AttendanceUserInfo | null> {
    const userId = String(doc.userId);
    const user = await UserModel.findOne({
      _id: doc.userId,
      restaurantId: doc.restaurantId,
      deletedAt: null,
    })
      .select("fullName firstName lastName employeeCode role")
      .lean();
    if (!user) {
      return null;
    }
    return {
      id: userId,
      full_name: user.fullName ?? null,
      first_name: user.firstName ?? null,
      last_name: user.lastName ?? null,
      employee_code: user.employeeCode ?? null,
      role: user.role,
    };
  },
};
