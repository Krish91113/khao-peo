import apiClient from './client';

export interface Table {
  _id: string;
  table_number: string;
  capacity: number;
  is_booked: boolean;
  current_order_id?: string;
}

export const tablesAPI = {
  getAll: async (): Promise<Table[]> => {
    const response = await apiClient.get<Table[]>('/tables');
    return response.data;
  },

  getById: async (id: string): Promise<Table> => {
    const response = await apiClient.get<Table>(`/tables/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, data: { is_booked: boolean; current_order_id?: string | null }): Promise<Table> => {
    const response = await apiClient.put<Table>(`/tables/${id}/status`, data);
    return response.data;
  },

  resetTable: async (id: string): Promise<Table> => {
    const response = await apiClient.put<Table>(`/tables/${id}/reset`, {});
    return response.data;
  },
};

