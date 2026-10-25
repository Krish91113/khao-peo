import apiClient from "./client";

export const servedOrdersAPI = {
    // Get all served orders with optional table number filter
    getAll: async (tableNumber?: number) => {
        const params = tableNumber ? { tableNumber } : {};
        const response = await apiClient.get("/served-orders", {
            params,
        });
        return response.data;
    },

    // Get specific served order by ID
    getById: async (id: string) => {
        const response = await apiClient.get(`/served-orders/${id}`);
        return response.data;
    },

    // Get bill data for reprinting
    getBillData: async (id: string) => {
        const response = await apiClient.get(`/served-orders/${id}/bill`);
        return response.data;
    },
};
