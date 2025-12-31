import apiClient from './client';

export interface BillItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Bill {
  _id: string;
  order_id: string;
  table_id: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  payment_status: 'pending' | 'paid';
  created_at: string;
  table?: {
    table_number: string;
  };
  items?: BillItem[];
}

export interface CreateBillData {
  order_id: string;
  table_id: string;
  subtotal: number;
  tax: number;
  total_amount: number;
  items: BillItem[];
}

export const billsAPI = {
  create: async (data: CreateBillData): Promise<Bill> => {
    const response = await apiClient.post<Bill>('/bills', data);
    return response.data;
  },

  createFinal: async (tableId: string): Promise<Bill> => {
    const response = await apiClient.post<Bill>(`/bills/final/${tableId}`);
    return response.data;
  },

  getByOrder: async (orderId: string): Promise<Bill> => {
    const response = await apiClient.get<Bill>(`/bills/order/${orderId}`);
    return response.data;
  },

  getAll: async (): Promise<Bill[]> => {
    const response = await apiClient.get<Bill[]>('/bills');
    return response.data;
  },
};

