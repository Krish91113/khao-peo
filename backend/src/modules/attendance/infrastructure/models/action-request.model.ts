// ─── Action Request Mongoose Model ───────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// The `attendance_action_requests` collection stores the admin-initiated,
// user-confirmed attendance workflow records.

import mongoose, { Schema, type Document } from "mongoose";
import type { ActionRequestAction, ActionRequestStatus } from "../../domain/attendance.constants.js";
import { ACTION_REQUEST_ACTIONS, ACTION_REQUEST_STATUSES } from "../../domain/attendance.constants.js";

export interface IActionRequest extends Document {
  restaurantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  action: ActionRequestAction;
  status: ActionRequestStatus;
  requestedAt: Date;
  respondedAt?: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateActionRequestData {
  restaurantId: string;
  userId: string;
  requestedBy: string;
  action: ActionRequestAction;
  expiresAt: Date;
}

const actionRequestSchema = new Schema<IActionRequest>(
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
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ACTION_REQUEST_ACTIONS as unknown as string[],
      required: true,
    },
    status: {
      type: String,
      enum: ACTION_REQUEST_STATUSES as unknown as string[],
      required: true,
      default: "PENDING",
      index: true,
    },
    requestedAt: { type: Date, required: true, default: Date.now },
    respondedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true, collection: "attendance_action_requests" },
);

// Prevent duplicate PENDING requests for the same user in the same restaurant.
actionRequestSchema.index(
  { restaurantId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "PENDING" } },
);

// Queries: pending requests for a user.
actionRequestSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Queries: all requests for a restaurant.
actionRequestSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const ActionRequestModel = mongoose.model<IActionRequest>(
  "ActionRequest",
  actionRequestSchema,
);
