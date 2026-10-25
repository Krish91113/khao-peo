// ─── Attendance Record Mongoose Model ────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// FRD Section 23.1: `attendance_records` collection. A partial unique index on
// (restaurantId, userId) where isActive=true enforces one active shift per user.

import mongoose, { Schema, type Document } from "mongoose";
import type { AttendanceStatus } from "../../../../shared/types/index.js";
import { ATTENDANCE_STATUSES } from "../../domain/attendance.constants.js";

export interface IAttendanceBreak {
  startedAt: Date;
  endedAt?: Date | null;
  durationMinutes?: number | null;
}

export interface IAttendanceRecord extends Document {
  restaurantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  // Restaurant-local business date (YYYY-MM-DD, Asia/Kolkata). Stored so
  // history can be queried by business day regardless of server timezone.
  businessDate: string;
  checkedInAt: Date;
  checkedOutAt?: Date | null;
  breaks: IAttendanceBreak[];
  totalBreakMinutes: number;
  totalWorkingMinutes: number;
  isActive: boolean;
  note?: string;
  correctedAt?: Date | null;
  correctedBy?: mongoose.Types.ObjectId;
  correctionNote?: string;
  reasonCode?: string;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceData {
  restaurantId: string;
  userId: string;
  status?: AttendanceStatus;
  businessDate: string;
  checkedInAt: Date;
  note?: string;
  createdBy: string;
}

export interface UpdateAttendanceData {
  status?: AttendanceStatus;
  checkedOutAt?: Date | null;
  breaks?: IAttendanceBreak[];
  totalBreakMinutes?: number;
  totalWorkingMinutes?: number;
  isActive?: boolean;
  note?: string;
  correctedAt?: Date;
  correctedBy?: string;
  correctionNote?: string;
  reasonCode?: string;
  updatedBy?: string;
}

const breakSchema = new Schema<IAttendanceBreak>(
  {
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
  },
  { _id: false },
);

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
      index: true,
    },
    businessDate: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    checkedInAt: { type: Date, required: true, index: true },
    checkedOutAt: { type: Date, default: null, index: true },
    breaks: { type: [breakSchema], default: [] },
    totalBreakMinutes: { type: Number, default: 0 },
    totalWorkingMinutes: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    note: { type: String, trim: true },
    correctedAt: { type: Date, default: null },
    correctedBy: { type: Schema.Types.ObjectId, ref: "User" },
    correctionNote: { type: String, trim: true },
    reasonCode: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    version: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "attendance_records" },
);

// One active record per user within a restaurant. When a record is checked out
// `isActive` flips to false so a new shift can be opened.
attendanceRecordSchema.index(
  { restaurantId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);

// List/history access patterns.
attendanceRecordSchema.index({ restaurantId: 1, checkedInAt: -1 });
attendanceRecordSchema.index({ restaurantId: 1, userId: 1, checkedInAt: -1 });
attendanceRecordSchema.index({ restaurantId: 1, status: 1, checkedInAt: -1 });
attendanceRecordSchema.index({ restaurantId: 1, businessDate: -1 });
attendanceRecordSchema.index({ restaurantId: 1, userId: 1, businessDate: -1 });
attendanceRecordSchema.index({ restaurantId: 1, status: 1, businessDate: -1 });

export const AttendanceRecordModel = mongoose.model<IAttendanceRecord>(
  "AttendanceRecord",
  attendanceRecordSchema,
);
