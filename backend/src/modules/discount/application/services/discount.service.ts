import mongoose from "mongoose";
import { calculatePercentage } from "../../../../shared/money/money.js";
import { resourceNotFound, validationFailed } from "../../../../shared/errors/app-error.js";
import { CouponModel } from "../../infrastructure/models/coupon.model.js";

function oid(value: string, label: string): mongoose.Types.ObjectId {
  if (!mongoose.isValidObjectId(value)) throw validationFailed(`Invalid ${label}`);
  return new mongoose.Types.ObjectId(value);
}
function normalizeCode(value: string): string { return value.trim().toUpperCase(); }

function assertCoupon(coupon: { active: boolean; validFrom?: Date; validUntil?: Date; usageLimit?: number; usedCount: number; minimumOrderPaise: number }, subtotalPaise: number): void {
  const now = new Date();
  if (!coupon.active) throw validationFailed("Coupon is inactive");
  if (coupon.validFrom && now < coupon.validFrom) throw validationFailed("Coupon is not active yet");
  if (coupon.validUntil && now > coupon.validUntil) throw validationFailed("Coupon has expired");
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) throw validationFailed("Coupon usage limit reached");
  if (subtotalPaise < coupon.minimumOrderPaise) throw validationFailed("Order does not meet the coupon minimum");
}

export const discountService = {
  async createCoupon(restaurantId: string, actorId: string, data: Record<string, unknown>) {
    const discountType = data.discountType as string;
    const discountValue = Number(data.discountValue);
    if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) throw validationFailed("Percentage must be between 0 and 100");
    if (discountType === "fixed" && discountValue <= 0) throw validationFailed("Fixed discount must be positive");
    if (data.validFrom && data.validUntil && new Date(String(data.validFrom)) >= new Date(String(data.validUntil))) throw validationFailed("validUntil must be after validFrom");
    return CouponModel.create({ ...data, code: normalizeCode(String(data.code)), restaurantId: oid(restaurantId, "restaurant id"), createdBy: oid(actorId, "actor id") });
  },

  async listCoupons(restaurantId: string) {
    return CouponModel.find({ restaurantId: oid(restaurantId, "restaurant id") }).sort({ createdAt: -1 }).lean();
  },

  async updateCoupon(restaurantId: string, couponId: string, data: Record<string, unknown>) {
    if (data.code) data.code = normalizeCode(String(data.code));
    const coupon = await CouponModel.findOneAndUpdate({ _id: oid(couponId, "coupon id"), restaurantId: oid(restaurantId, "restaurant id") }, { $set: data }, { new: true, runValidators: true }).lean();
    if (!coupon) throw resourceNotFound("Coupon", couponId);
    return coupon;
  },

  async validateCoupon(restaurantId: string, code: string, subtotalPaise: number) {
    if (!Number.isInteger(subtotalPaise) || subtotalPaise < 0) throw validationFailed("subtotalPaise must be a non-negative integer");
    const coupon = await CouponModel.findOne({ restaurantId: oid(restaurantId, "restaurant id"), code: normalizeCode(code) }).lean();
    if (!coupon) throw resourceNotFound("Coupon");
    assertCoupon(coupon, subtotalPaise);
    const rawDiscount = coupon.discountType === "percentage" ? calculatePercentage(subtotalPaise, coupon.discountValue) : coupon.discountValue;
    const discountPaise = Math.min(rawDiscount, coupon.maximumDiscountPaise ?? rawDiscount, subtotalPaise);
    return { couponId: String(coupon._id), code: coupon.code, discountPaise, subtotalPaise, totalPaise: subtotalPaise - discountPaise };
  },

  async redeemCoupon(restaurantId: string, couponId: string, subtotalPaise: number) {
    const coupon = await CouponModel.findOne({ _id: oid(couponId, "coupon id"), restaurantId: oid(restaurantId, "restaurant id") });
    if (!coupon) throw resourceNotFound("Coupon", couponId);
    assertCoupon(coupon, subtotalPaise);
    const updated = await CouponModel.findOneAndUpdate({ _id: coupon._id, restaurantId: coupon.restaurantId, usedCount: coupon.usedCount }, { $inc: { usedCount: 1 } }, { new: true });
    if (!updated) throw validationFailed("Coupon was redeemed concurrently; please retry");
    return this.validateCoupon(restaurantId, updated.code, subtotalPaise);
  },
};
