import apiClient from './client';

export interface MenuItem {
    _id?: string;
    id?: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    available: boolean;
}

export const menuAPI = {
    getAll: async (): Promise<MenuItem[]> => {
        const response = await apiClient.get<MenuItem[]>('/menu');
        return response.data;
    },

    getById: async (id: string): Promise<MenuItem> => {
        const response = await apiClient.get<MenuItem>(`/menu/${id}`);
        return response.data;
    },

    create: async (data: Omit<MenuItem, '_id' | 'id'>): Promise<MenuItem> => {
        const response = await apiClient.post<MenuItem>('/menu', data);
        return response.data;
    },

    update: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
        const response = await apiClient.put<MenuItem>(`/menu/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/menu/${id}`);
    },

    toggleAvailability: async (id: string): Promise<MenuItem> => {
        const response = await apiClient.patch<MenuItem>(`/menu/${id}/toggle-availability`);
        return response.data;
    },
};
