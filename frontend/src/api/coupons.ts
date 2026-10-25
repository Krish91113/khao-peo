import apiClient from "./client";
export interface Coupon { _id: string; code: string; active: boolean; discountType: "percentage" | "fixed"; discountValue: number; minimumOrderPaise: number; usedCount: number; }
export const couponsAPI = {
  list: async () => (await apiClient.get("/coupons")).data,
  create: async (data: Record<string, unknown>) => (await apiClient.post("/coupons", data)).data,
  validate: async (code: string, subtotalPaise: number) => (await apiClient.post("/coupons/validate", { code, subtotalPaise })).data,
};
