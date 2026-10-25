// ─── Platform Application Service ─────────────────────────────────────────────
// Module: platform | Layer: application

import bcrypt from "bcryptjs";
import { restaurantRepository } from "../../../restaurant/public.js";
import { userRepository } from "../../../auth/public.js";
import { subscriptionRepository } from "../../infrastructure/repositories/subscription.repository.js";
import { withTransaction } from "../../../../shared/database/transaction.js";
import { validationFailed, resourceNotFound } from "../../../../shared/errors/app-error.js";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { sendWelcomeEmail } from "../../../../shared/email/email.service.js";

export const platformService = {
  /**
   * Create a new restaurant tenant and its owner.
   */
  async createRestaurant(data: any) {
    const { name, slug, address, contact, business, owner, plan } = data;
    const temporaryPassword = owner.password || randomBytes(12).toString("base64url");

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    const email = owner.email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      throw validationFailed("Invalid owner email format");
    }

    // Check slug and email availability
    const [existingSlug, existingEmail] = await Promise.all([
      restaurantRepository.findBySlug(slug),
      userRepository.findByEmail(email),
    ]);

    if (existingSlug) {
      throw validationFailed("Restaurant ID/Slug already exists");
    }
    if (existingEmail) {
      throw validationFailed("Owner email already registered");
    }

    const result = await withTransaction(async (session: mongoose.ClientSession) => {
      // 1. Create Restaurant
      const restaurant = await restaurantRepository.create(
        {
          restaurantId: `rest_${Date.now()}`,
          name,
          slug,
          address,
          contact,
          business,
        },
        session,
      );

      // 2. Create Owner User
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

      const ownerUser = await userRepository.create(
        {
          fullName: owner.fullName,
          email,
          password: hashedPassword,
          role: "restaurant_owner",
          restaurantId: String(restaurant._id),
          status: "active",
          must_change_password: true,
        },
        session,
      );

      // 3. Create Subscription
      const selectedPlan = plan || "basic";
      await subscriptionRepository.create(
        {
          restaurantId: restaurant._id as mongoose.Types.ObjectId,
          plan: selectedPlan,
          status: "trial",
          trial: {
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            isTrialActive: true,
          },
          features: {
            maxTables:
              selectedPlan === "enterprise" ? 999 : selectedPlan === "professional" ? 30 : 10,
            maxStaff:
              selectedPlan === "enterprise" ? 999 : selectedPlan === "professional" ? 15 : 5,
            analytics: selectedPlan !== "basic",
            customBranding: selectedPlan !== "basic",
            apiAccess: selectedPlan === "professional" || selectedPlan === "enterprise",
            multiLocation: selectedPlan === "enterprise",
          },
        },
        session,
      );

      return {
        restaurant,
        owner: {
          id: String(ownerUser._id),
          email: ownerUser.email,
        },
        temporaryPassword,
        selectedPlan,
      };
    });

    const delivery = await sendWelcomeEmail({
      ownerName: owner.fullName,
      restaurantName: name,
      email,
      temporaryPassword: result.temporaryPassword,
      plan: result.selectedPlan,
    });

    return {
      restaurant: result.restaurant,
      owner: result.owner,
      email: { success: delivery.success, configured: delivery.configured },
    };
  },

  /**
   * Generate new temporary credentials and resend the onboarding email.
   */
  async resendWelcomeEmail(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) throw resourceNotFound("Restaurant", id);
    const owners = await userRepository.findByRestaurant(id, { role: "restaurant_owner" });
    const owner = owners[0];
    if (!owner) throw resourceNotFound("Restaurant owner", id);
    const temporaryPassword = randomBytes(12).toString("base64url");
    const password = await bcrypt.hash(temporaryPassword, 12);
    await userRepository.updateByIdNoTenant(String(owner._id), {
      password,
      must_change_password: true,
      token_version: owner.token_version + 1,
    });
    const delivery = await sendWelcomeEmail({
      ownerName: owner.fullName,
      restaurantName: restaurant.name,
      email: owner.email,
      temporaryPassword,
    });
    return { email: { success: delivery.success, configured: delivery.configured, recipient: owner.email } };
  },

  /**
   * Get all restaurants with owner and subscription info.
   */
  async getAllRestaurants() {
    const restaurants = await restaurantRepository.findAll();

    const enriched = await Promise.all(
      restaurants.map(async (res: any) => {
        const [subscription, owner] = await Promise.all([
          subscriptionRepository.findByRestaurantId(String(res._id)),
          userRepository.findByRestaurant(String(res._id), { role: "restaurant_owner" }),
        ]);

        return {
          ...res.toObject(),
          subscription: subscription || null,
          owner: owner[0] || null,
        };
      }),
    );

    return enriched;
  },

  /**
   * Get restaurant by ID.
   */
  async getRestaurantById(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", id);
    }

    const [subscription, owner] = await Promise.all([
      subscriptionRepository.findByRestaurantId(id),
      userRepository.findByRestaurant(id, { role: "restaurant_owner" }),
    ]);

    return {
      ...restaurant.toObject(),
      subscription: subscription || null,
      owner: owner[0] || null,
    };
  },

  /**
   * Update restaurant.
   */
  async updateRestaurant(id: string, data: any) {
    const { plan, status, ownerPassword, restaurantName } = data;

    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", id);
    }

    if (restaurantName) {
      restaurant.name = restaurantName;
      await restaurant.save();
    }

    if (status) {
      restaurant.status = status;
      await restaurant.save();
    }

    if (plan) {
      const subscription = await subscriptionRepository.findByRestaurantId(id);
      if (subscription) {
        subscription.plan = plan;
        subscription.features = {
          maxTables: plan === "enterprise" ? 999 : plan === "professional" ? 30 : 10,
          maxStaff: plan === "enterprise" ? 999 : plan === "professional" ? 15 : 5,
          analytics: plan !== "basic",
          customBranding: plan !== "basic",
          apiAccess: plan === "professional" || plan === "enterprise",
          multiLocation: plan === "enterprise",
        };
        await subscription.save();
      }
    }

    if (ownerPassword) {
      const owners = await userRepository.findByRestaurant(id, { role: "restaurant_owner" });
      const owner = owners[0];
      if (owner) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ownerPassword, salt);
        await userRepository.updateByIdNoTenant(String(owner._id), { password: hashedPassword });
      }
    }

    return { success: true };
  },

  /**
   * Delete restaurant and associated tenant records.
   */
  async deleteRestaurant(id: string) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw resourceNotFound("Restaurant", id);
    }

    // Delete associated models
    const User = mongoose.model("User");
    const Table = mongoose.model("Table");
    const Order = mongoose.model("Order");
    const Bill = mongoose.model("Bill");

    await Promise.all([
      User.deleteMany({ restaurantId: restaurant._id }),
      subscriptionRepository.deleteByRestaurantId(id),
      Table.deleteMany({ restaurantId: restaurant._id }),
      Order.deleteMany({ restaurantId: restaurant._id }),
      Bill.deleteMany({ restaurantId: restaurant._id }),
      restaurantRepository.deleteById(id),
    ]);
  },
};
