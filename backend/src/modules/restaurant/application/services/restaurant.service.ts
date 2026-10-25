// ─── Restaurant Application Service ──────────────────────────────────────────
// Module: restaurant | Layer: application

import { restaurantRepository } from "../../infrastructure/repositories/restaurant.repository.js";
import { resourceNotFound } from "../../../../shared/errors/app-error.js";

export const restaurantService = {
  async getRestaurantById(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", id);
    }
    return restaurant;
  },

  async updateRestaurant(id: string, updateData: any) {
    const restaurant = await restaurantRepository.updateById(id, updateData);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", id);
    }
    return restaurant;
  },
};
