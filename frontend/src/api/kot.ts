import apiClient from './client';

export interface KOT {
    _id?: string;
    id?: string;
    kot_number: string;
    kotNumber?: string;
    table_id: string;
    tableId?: string;
    items: Array<{
        item_name: string;
        quantity: number;
        price: number;
    }>;
    created_at?: string;
    createdAt?: string;
}

export const kotAPI = {
    generate: async (data: {
        table_id: string;
        items: Array<{
            item_name: string;
            quantity: number;
            price: number;
        }>;
    }): Promise<KOT> => {
        const response = await apiClient.post<KOT>('/kot/generate', data);
        return response.data;
    },

    getByTable: async (tableId: string): Promise<KOT[]> => {
        const response = await apiClient.get<KOT[]>(`/kot/table/${tableId}`);
        return response.data;
    },

    getAll: async (): Promise<KOT[]> => {
        const response = await apiClient.get<KOT[]>('/kot');
        return response.data;
    },
};
