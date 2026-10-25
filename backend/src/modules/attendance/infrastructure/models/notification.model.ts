// ─── Notification Mongoose Model ─────────────────────────────────────────────
// Module: attendance | Layer: infrastructure
// Persistent notifications for attendance action requests. These survive even
// if the user is offline — they see them on next login.

import mongoose, { Schema, type Document } from "mongoose";

export interface INotification extends Document {
  restaurantId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: string;
  referenceType: string;
  referenceId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationData {
  restaurantId: string;
  userId: string;
  type: string;
  referenceType: string;
  referenceId: string;
  title: string;
  message: string;
}

const notificationSchema = new Schema<INotification>(
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
    type: { type: String, required: true, index: true },
    referenceType: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notifications" },
);

// Unread notifications for user.
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
