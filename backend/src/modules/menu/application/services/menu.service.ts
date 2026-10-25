// ─── Menu Application Service ─────────────────────────────────────────────────
// Module: menu | Layer: application

import { menuItemRepository } from "../../infrastructure/repositories/menu-item.repository.js";
import { resourceNotFound } from "../../../../shared/errors/app-error.js";
import { toPaise } from "../../../../shared/money/money.js";
import mongoose from "mongoose";

export const menuService = {
  async getMenuItems(
    restaurantId: string,
    filters: { category?: string; isAvailable?: boolean } = {},
  ) {
    return menuItemRepository.findByRestaurant(restaurantId, filters);
  },

  async getMenuItemById(id: string, restaurantId: string) {
    const item = await menuItemRepository.findById(id, restaurantId);
    if (!item) {
      throw resourceNotFound("MenuItem", id);
    }
    return item;
  },

  async createMenuItem(restaurantId: string, data: any, userId: string) {
    const priceInPaise = toPaise(data.price);

    // Convert modifiers prices to paise if any
    const customizations = data.customizations?.map((group: any) => ({
      name: group.name,
      isRequired: group.isRequired || false,
      minSelection: group.minSelection,
      maxSelection: group.maxSelection,
      options: group.options?.map((opt: any) => ({
        name: opt.name,
        price: toPaise(opt.price || 0),
      })),
    }));

    const menuItem = await menuItemRepository.create({
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      name: data.name,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      price: priceInPaise,
      image: data.image,
      isAvailable: data.isAvailable ?? true,
      isVeg: data.isVeg ?? true,
      preparationTime: data.preparationTime,
      customizations,
      tags: data.tags || [],
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return menuItem;
  },

  async updateMenuItem(id: string, restaurantId: string, data: any) {
    const updateData: any = { ...data };

    if (data.price !== undefined) {
      updateData.price = toPaise(data.price);
    }

    if (data.customizations) {
      updateData.customizations = data.customizations.map((group: any) => ({
        name: group.name,
        isRequired: group.isRequired || false,
        minSelection: group.minSelection,
        maxSelection: group.maxSelection,
        options: group.options?.map((opt: any) => ({
          name: opt.name,
          price: toPaise(opt.price || 0),
        })),
      }));
    }

    const item = await menuItemRepository.updateById(id, restaurantId, updateData);
    if (!item) {
      throw resourceNotFound("MenuItem", id);
    }
    return item;
  },

  async deleteMenuItem(id: string, restaurantId: string) {
    const item = await menuItemRepository.deleteById(id, restaurantId);
    if (!item) {
      throw resourceNotFound("MenuItem", id);
    }
    return { success: true, message: "Menu item deleted successfully" };
  },
};
