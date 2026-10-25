import apiClient from './client';

export interface StaffMember {
    _id?: string;
    id: string;
    restaurant_id: string | null;
    employee_code: string | null;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string;
    phone: string | null;
    role: string;
    status: string;
    profile_image: string | null;
    joined_at: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface StaffListResponse {
    data: StaffMember[];
    meta: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}

export const staffAPI = {
    getAll: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
        status?: string;
    }): Promise<StaffListResponse> => {
        const response = await apiClient.get('/staff', { params });
        return { data: response.data, meta: response.data.meta };
    },
};
