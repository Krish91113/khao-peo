import apiClient from './client';

export interface Restaurant {
    _id: string;
    restaurantId: string;
    name: string;
    business: {
        gstNumber: string;
        fssaiNumber: string;
    };
    contact: {
        phone: string;
        email: string;
    };
    settings?: {
        taxRates?: {
            cgst: number;
            sgst: number;
        }
    }
}

export const restaurantAPI = {
    getMyRestaurant: async (): Promise<Restaurant> => {
        const response = await apiClient.get<Restaurant>('/restaurant/me');
        return response.data;
    },
};
