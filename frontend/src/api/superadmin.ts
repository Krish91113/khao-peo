import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

export const superadminAPI = {
    // Get all users
    getAllUsers: async () => {
        const response = await axios.get(
            `${API_URL}/superadmin/users`,
            getAuthHeaders()
        );
        return response.data;
    },

    // Get user statistics
    getUserStats: async () => {
        const response = await axios.get(
            `${API_URL}/superadmin/users/stats`,
            getAuthHeaders()
        );
        return response.data;
    },

    // Get recent signups
    getRecentSignups: async (limit = 10) => {
        const response = await axios.get(
            `${API_URL}/superadmin/users/recent?limit=${limit}`,
            getAuthHeaders()
        );
        return response.data;
    },

    // Get users by role
    getUsersByRole: async (role: string) => {
        const response = await axios.get(
            `${API_URL}/superadmin/users/role/${role}`,
            getAuthHeaders()
        );
        return response.data;
    },

    // Create new user
    createUser: async (data: any) => {
        const response = await axios.post(
            `${API_URL}/superadmin/users`,
            data,
            getAuthHeaders()
        );
        return response.data;
    },

    // Update user
    updateUser: async (id: string, data: any) => {
        const response = await axios.put(
            `${API_URL}/superadmin/users/${id}`,
            data,
            getAuthHeaders()
        );
        return response.data;
    },

    // Delete user
    deleteUser: async (id: string) => {
        const response = await axios.delete(
            `${API_URL}/superadmin/users/${id}`,
            getAuthHeaders()
        );
        return response.data;
    },

    // Toggle user status
    toggleUserStatus: async (id: string) => {
        const response = await axios.patch(
            `${API_URL}/superadmin/users/${id}/toggle-status`,
            {},
            getAuthHeaders()
        );
        return response.data;
    },
};
