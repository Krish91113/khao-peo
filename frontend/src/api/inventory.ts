import apiClient from "./client";

export interface InventoryItem {
  _id: string;
  name: string;
  sku?: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  active: boolean;
  seasonal: boolean;
}

export const inventoryAPI = {
  list: async () => (await apiClient.get<{ data: InventoryItem[] }>("/inventory/items")).data,
  alerts: async () => (await apiClient.get<{ data: InventoryItem[] }>("/inventory/alerts")).data,
  create: async (data: { name: string; unit: string; lowStockThreshold?: number; sku?: string }) => (await apiClient.post("/inventory/items", data)).data,
  transaction: async (id: string, data: { type: "stock_in" | "stock_out" | "adjustment" | "waste"; quantity: number; reason?: string }) => (await apiClient.post(`/inventory/items/${id}/transactions`, data)).data,
};
