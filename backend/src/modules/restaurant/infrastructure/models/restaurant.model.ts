// ─── Restaurant Mongoose Model ────────────────────────────────────────────────
// Module: restaurant | Layer: infrastructure
// FRD Section 11.3, 18

import mongoose, { Schema, type Document } from "mongoose";

export interface IRestaurant extends Document {
  restaurantId: string;
  name: string;
  slug: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    contactPerson?: string;
  };
  business?: {
    gstNumber?: string;
    fssaiNumber?: string;
    businessType?: string; // "cafe", "restaurant", "quick-service"
  };
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  settings: {
    currency: string;
    timezone: string;
    taxRates: {
      cgst: number;
      sgst: number;
      serviceCharge: number;
    };
  };
  status: "active" | "suspended" | "trial" | "inactive";
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    restaurantId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    contact: {
      phone: String,
      email: String,
      contactPerson: String,
    },
    business: {
      gstNumber: String,
      fssaiNumber: String,
      businessType: String,
    },
    branding: {
      logo: String,
      primaryColor: String,
      secondaryColor: String,
    },
    settings: {
      currency: { type: String, default: "INR" },
      timezone: { type: String, default: "Asia/Kolkata" },
      taxRates: {
        cgst: { type: Number, default: 2.5 },
        sgst: { type: Number, default: 2.5 },
        serviceCharge: { type: Number, default: 0 },
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "trial", "inactive"],
      default: "trial",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export const RestaurantModel = mongoose.model<IRestaurant>("Restaurant", restaurantSchema);
