import apiClient from "./client";

export const superadminAPI = {
    // Get all users
    getAllUsers: async () => {
        const response = await apiClient.get("/superadmin/users");
        return response.data;
    },

    // Get user statistics
    getUserStats: async () => {
        const response = await apiClient.get("/superadmin/users/stats");
        return response.data;
    },

    // Get recent signups
    getRecentSignups: async (limit = 10) => {
        const response = await apiClient.get(`/superadmin/users/recent?limit=${limit}`);
        return response.data;
    },

    // Get users by role
    getUsersByRole: async (role: string) => {
        const response = await apiClient.get(`/superadmin/users/role/${role}`);
        return response.data;
    },

    // Create new user
    createUser: async (data: any) => {
        const response = await apiClient.post("/superadmin/users", data);
        return response.data;
    },

    // Update user
    updateUser: async (id: string, data: any) => {
        const response = await apiClient.put(`/superadmin/users/${id}`, data);
        return response.data;
    },

    // Delete user
    deleteUser: async (id: string) => {
        const response = await apiClient.delete(`/superadmin/users/${id}`);
        return response.data;
    },

    // Toggle user status
    toggleUserStatus: async (id: string) => {
        const response = await apiClient.patch(`/superadmin/users/${id}/toggle-status`, {});
        return response.data;
    },
};
