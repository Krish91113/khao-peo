import apiClient from "./client";
export interface OwnerSummary { grossSalesPaise: number; discountsPaise: number; netSalesPaise: number; taxPaise: number; collectedPaise: number; outstandingPaise: number; averageOrderValuePaise: number; orderCount: number; tableCount: number; kitchenTicketCount: number; }
export const analyticsAPI = {
  summary: async (from?: string, to?: string): Promise<OwnerSummary> => (await apiClient.get("/analytics/owner_summary", { params: { from, to } })).data,
  revenue: async (from?: string, to?: string) => (await apiClient.get("/analytics/revenue", { params: { from, to } })).data,
  kitchen: async (from?: string, to?: string) => (await apiClient.get("/analytics/kitchen", { params: { from, to } })).data,
  staff: async (from?: string, to?: string) => (await apiClient.get("/analytics/staff", { params: { from, to } })).data,
};
