// ─── MenuItem Mongoose Model ──────────────────────────────────────────────────
// Module: menu | Layer: infrastructure

import mongoose, { Schema, type Document } from "mongoose";

export interface IModifierOption {
  name: string;
  price: number; // in paise
}

export interface IModifierGroup {
  name: string;
  options: IModifierOption[];
  isRequired: boolean;
  minSelection?: number;
  maxSelection?: number;
}

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  price: number; // in paise
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
  preparationTime?: number; // in minutes
  customizations: IModifierGroup[];
  tags: string[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const modifierOptionSchema = new Schema<IModifierOption>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const modifierGroupSchema = new Schema<IModifierGroup>(
  {
    name: { type: String, required: true },
    options: [modifierOptionSchema],
    isRequired: { type: Boolean, default: false },
    minSelection: { type: Number },
    maxSelection: { type: Number },
  },
  { _id: false },
);

const menuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    preparationTime: {
      type: Number,
    },
    customizations: [modifierGroupSchema],
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Compound index for fast lookup per category
menuItemSchema.index({ restaurantId: 1, category: 1 });

export const MenuItemModel = mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
