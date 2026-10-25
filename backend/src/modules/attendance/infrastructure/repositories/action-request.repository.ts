// ─── Action Request Repository ───────────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// Persistence layer for attendance_action_requests.

import mongoose, { type ClientSession } from "mongoose";
import {
  ActionRequestModel,
  type CreateActionRequestData,
  type IActionRequest,
} from "../models/action-request.model.js";
import type { ActionRequestStatus } from "../../domain/attendance.constants.js";

/**
 * Detect the unique-index conflict raised when a second PENDING request is
 * created for the same (restaurantId, userId).
 */
export function isDuplicatePendingConflict(err: unknown): boolean {
  if (err && typeof err === "object") {
    const e = err as { code?: number };
    return e.code === 11000;
  }
  return false;
}

export const actionRequestRepository = {
  /**
   * Create a new action request (PENDING).
   */
  async create(data: CreateActionRequestData): Promise<IActionRequest> {
    const docs = await ActionRequestModel.create([
      {
        restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
        userId: new mongoose.Types.ObjectId(data.userId),
        requestedBy: new mongoose.Types.ObjectId(data.requestedBy),
        action: data.action,
        status: "PENDING",
        requestedAt: new Date(),
        expiresAt: data.expiresAt,
      },
    ]);
    return docs[0]!;
  },

  /**
   * Find an action request by ID.
   */
  async findById(id: string): Promise<IActionRequest | null> {
    return ActionRequestModel.findById(id);
  },

  /**
   * Find all PENDING requests for a user within a restaurant.
   */
  async findPendingForUser(userId: string, restaurantId: string): Promise<IActionRequest[]> {
    return ActionRequestModel.find({
      userId,
      restaurantId,
      status: "PENDING",
    }).sort({ createdAt: -1 });
  },

  /**
   * Check if a PENDING request already exists for a user in a restaurant.
   */
  async findPendingByUser(userId: string, restaurantId: string): Promise<IActionRequest | null> {
    return ActionRequestModel.findOne({
      userId,
      restaurantId,
      status: "PENDING",
    });
  },

  /**
   * Update request status. Optionally pass a session for transactions.
   */
  async updateStatus(
    id: string,
    status: ActionRequestStatus,
    respondedAt?: Date,
    session?: ClientSession,
  ): Promise<IActionRequest | null> {
    const update: Record<string, unknown> = { status };
    if (respondedAt) update.respondedAt = respondedAt;
    return ActionRequestModel.findByIdAndUpdate(id, { $set: update }, { new: true, session });
  },
};
