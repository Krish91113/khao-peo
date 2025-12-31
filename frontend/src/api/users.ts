import apiClient from './client';

export interface User {
    _id?: string;
    id?: string;
    email: string;
    full_name: string;
    fullName?: string;
    role: 'owner' | 'admin' | 'waiter' | 'superadmin';
    is_active?: boolean;
    isActive?: boolean;
    created_at?: string;
    createdAt?: string;
    last_login?: string;
    lastLogin?: string;
}

export const usersAPI = {
    getAll: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },

    getById: async (id: string): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },

    create: async (data: {
        email: string;
        password: string;
        full_name: string;
        role: 'admin' | 'waiter';
    }): Promise<User> => {
        const response = await apiClient.post<User>('/users', data);
        return response.data;
    },

    update: async (id: string, data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },

    toggleActive: async (id: string): Promise<User> => {
        const response = await apiClient.patch<User>(`/users/${id}/toggle-active`);
        return response.data;
    },

    getLoginLogs: async (): Promise<any[]> => {
        const response = await apiClient.get<any[]>('/users/login-logs');
        return response.data;
    },

    getSalesAnalytics: async (): Promise<any> => {
        const response = await apiClient.get('/analytics/sales');
        return response.data;
    },
};
