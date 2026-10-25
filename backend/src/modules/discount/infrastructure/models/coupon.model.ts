import mongoose, { Schema, type Document } from "mongoose";

export type CouponDiscountType = "percentage" | "fixed";
export interface ICoupon extends Document {
  restaurantId: mongoose.Types.ObjectId;
  code: string;
  active: boolean;
  validFrom?: Date;
  validUntil?: Date;
  discountType: CouponDiscountType;
  discountValue: number;
  minimumOrderPaise: number;
  maximumDiscountPaise?: number;
  usageLimit?: number;
  usedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>({
  restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true, minlength: 2, maxlength: 40 },
  active: { type: Boolean, default: true },
  validFrom: Date,
  validUntil: Date,
  discountType: { type: String, enum: ["percentage", "fixed"], required: true },
  discountValue: { type: Number, required: true, min: 0 },
  minimumOrderPaise: { type: Number, default: 0, min: 0 },
  maximumDiscountPaise: { type: Number, min: 0 },
  usageLimit: { type: Number, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
couponSchema.index({ restaurantId: 1, code: 1 }, { unique: true });
export const CouponModel = mongoose.model<ICoupon>("Coupon", couponSchema);
