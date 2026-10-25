// ─── Notification Repository ─────────────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// Persistence layer for notifications.

import mongoose from "mongoose";
import {
  NotificationModel,
  type CreateNotificationData,
  type INotification,
} from "../models/notification.model.js";

export const notificationRepository = {
  /**
   * Create a new notification.
   */
  async create(data: CreateNotificationData): Promise<INotification> {
    const docs = await NotificationModel.create([
      {
        restaurantId: new mongoose.Types.ObjectId(data.restaurantId),
        userId: new mongoose.Types.ObjectId(data.userId),
        type: data.type,
        referenceType: data.referenceType,
        referenceId: new mongoose.Types.ObjectId(data.referenceId),
        title: data.title,
        message: data.message,
      },
    ]);
    return docs[0]!;
  },

  /**
   * Find unread notifications for a user.
   */
  async findUnreadForUser(userId: string, restaurantId?: string): Promise<INotification[]> {
    const filter: Record<string, unknown> = { userId, readAt: null };
    if (restaurantId) filter.restaurantId = restaurantId;
    return NotificationModel.find(filter).sort({ createdAt: -1 }).limit(50);
  },

  /**
   * Mark a notification as read.
   */
  async markRead(id: string): Promise<INotification | null> {
    return NotificationModel.findByIdAndUpdate(id, { $set: { readAt: new Date() } }, { new: true });
  },

  /**
   * Update notification message/title by reference ID.
   */
  async updateByReference(
    referenceId: string,
    update: { title?: string; message?: string },
  ): Promise<void> {
    await NotificationModel.updateMany(
      { referenceId: new mongoose.Types.ObjectId(referenceId) },
      { $set: update },
    );
  },
};
