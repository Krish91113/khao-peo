import apiClient from "./client";

export type KitchenItemStatus = "received" | "preparing" | "partially_ready" | "ready" | "cancelled";
export type KitchenTicketStatus = "received" | "preparing" | "partially_ready" | "ready" | "served" | "cancelled";

export interface KitchenItem {
  _id?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  status: KitchenItemStatus;
  startedAt?: string;
  readyAt?: string;
}

export interface KitchenTicket {
  _id: string;
  orderId: string;
  status: KitchenTicketStatus;
  priority: number;
  createdAt: string;
  updatedAt: string;
  items: KitchenItem[];
  pickedUpBy?: string;
  pickedUpAt?: string;
  servedAt?: string;
}

export interface KitchenDashboard {
  new_ticket_count: number;
  preparing_count: number;
  partially_ready_count: number;
  ready_count: number;
  delayed_count: number;
  completed_today: number;
  average_prep_time_minutes: number;
  on_time_rate: number;
  kitchen_load: "low" | "normal" | "high";
  tickets: KitchenTicket[];
}

export const kitchenAPI = {
  getDashboard: async (): Promise<KitchenDashboard> => {
    const response = await apiClient.get<KitchenDashboard>("/kitchen/dashboard");
    return response.data;
  },
  updateItemStatus: async (itemId: string, status: KitchenItemStatus): Promise<KitchenTicket> => {
    const response = await apiClient.patch<KitchenTicket>(`/kitchen/items/${itemId}/status`, { status });
    return response.data;
  },
  setPriority: async (ticketId: string, priority: number): Promise<KitchenTicket> => {
    const response = await apiClient.patch<KitchenTicket>(`/kitchen/tickets/${ticketId}/priority`, { priority });
    return response.data;
  },
  pickUp: async (ticketId: string): Promise<KitchenTicket> => {
    const response = await apiClient.post<KitchenTicket>(`/kitchen/tickets/${ticketId}/pick_up`);
    return response.data;
  },
  serve: async (ticketId: string): Promise<KitchenTicket> => {
    const response = await apiClient.post<KitchenTicket>(`/kitchen/tickets/${ticketId}/serve`);
    return response.data;
  },
};
