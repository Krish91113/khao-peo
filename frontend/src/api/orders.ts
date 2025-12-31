import apiClient from './client';

export interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  table_id: string;
  status: 'pending' | 'sent_to_kitchen' | 'preparing' | 'ready' | 'served';
  total_amount: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  table?: {
    table_number: string;
  };
  items?: OrderItem[];
}

export interface CreateOrderData {
  table_id: string;
  items: OrderItem[];
  total_amount: number;
}

export const ordersAPI = {
  create: async (data: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  },

  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/orders');
    return response.data;
  },

  getByTable: async (tableId: string): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(`/orders/table/${tableId}`);
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: Order['status']): Promise<Order> => {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },
};

