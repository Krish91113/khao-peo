// ─── Subscription Mongoose Model ─────────────────────────────────────────────
// Module: platform | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";
import type { SubscriptionPlan, SubscriptionStatus } from "../../../../shared/types/index.js";

export interface ISubscription extends Document {
  restaurantId: mongoose.Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billing?: {
    cycle?: "monthly" | "yearly";
    amount?: number;
    currency: string;
    nextBillingDate?: Date;
  };
  trial?: {
    startDate?: Date;
    endDate?: Date;
    isTrialActive?: boolean;
  };
  features: {
    maxTables: number;
    maxStaff: number;
    analytics: boolean;
    customBranding: boolean;
    apiAccess: boolean;
    multiLocation: boolean;
  };
  paymentHistory: Array<{
    amount?: number;
    date?: Date;
    status?: string;
    invoiceUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    plan: {
      type: String,
      enum: ["basic", "professional", "enterprise"],
      default: "basic",
    },
    status: {
      type: String,
      enum: ["active", "trial", "suspended", "cancelled", "expired"],
      default: "trial",
    },
    billing: {
      cycle: { type: String, enum: ["monthly", "yearly"] },
      amount: Number,
      currency: { type: String, default: "INR" },
      nextBillingDate: Date,
    },
    trial: {
      startDate: Date,
      endDate: Date,
      isTrialActive: Boolean,
    },
    features: {
      maxTables: Number,
      maxStaff: Number,
      analytics: Boolean,
      customBranding: Boolean,
      apiAccess: Boolean,
      multiLocation: Boolean,
    },
    paymentHistory: [
      {
        amount: Number,
        date: Date,
        status: String,
        invoiceUrl: String,
      },
    ],
  },
  { timestamps: true },
);

export const SubscriptionModel = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
