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
};
