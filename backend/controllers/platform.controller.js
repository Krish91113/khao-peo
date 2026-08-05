import bcrypt from "bcryptjs";
import { Restaurant } from "../models/Restaurant.model.js";
import { User } from "../models/User.model.js";
import { Subscription } from "../models/Subscription.model.js";
import { Table } from "../models/Table.model.js";
import { Order } from "../models/Order.model.js";
import { Bill } from "../models/Bill.model.js";
import { sendWelcomeEmail } from "../utils/email.js";

// @route   POST /api/platform/restaurants
// @desc    Create a new restaurant tenant
// @access  Private (Platform SuperAdmin only)
export const createRestaurant = async (req, res) => {
    const session = await Restaurant.startSession();
    session.startTransaction();

    try {
        const {
            name,
            slug,
            address,
            contact,
            business,
            owner, // { fullName, email, password }
            plan, // "basic", "professional", "enterprise"
        } = req.body;

        // 1. Validate owner email format
        if (owner && owner.email) {
            owner.email = owner.email.trim().toLowerCase();
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(owner.email)) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: "Invalid owner email format" });
            }
        }

        // 2. Check if restaurant slug exists
        const existingSlug = await Restaurant.findOne({ slug });
        if (existingSlug) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Restaurant ID/Slug already exists" });
        }

        // 2. Check if owner email exists
        const existingOwner = await User.findOne({ email: owner.email });
        if (existingOwner) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Owner email already registered" });
        }

        // 3. Create Restaurant
        const newRestaurant = await Restaurant.create(
            [
                {
                    restaurantId: `rest_${Date.now()}`,
                    name,
                    slug,
                    address,
                    contact,
                    business,
                    createdBy: req.user._id,
                },
            ],
            { session }
        );

        const restaurantId = newRestaurant[0]._id;

        // 4. Create Owner User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(owner.password, salt);

        const newOwner = await User.create(
            [
                {
                    restaurantId: restaurantId,
                    fullName: owner.fullName,
                    email: owner.email,
                    password: hashedPassword,
                    role: "restaurant_owner",
                },
            ],
            { session }
        );

        // 5. Create Subscription
        const selectedPlan = plan || "basic";
        await Subscription.create(
            [
                {
                    restaurantId: restaurantId,
                    plan: selectedPlan,
                    status: "trial",
                    trial: {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        isTrialActive: true,
                    },
                    features: {
                        maxTables: selectedPlan === "enterprise" ? 999 : selectedPlan === "professional" ? 30 : 10,
                        maxStaff: selectedPlan === "enterprise" ? 999 : selectedPlan === "professional" ? 15 : 5,
                        analytics: selectedPlan !== "basic",
                        customBranding: selectedPlan !== "basic",
                        apiAccess: selectedPlan === "professional" || selectedPlan === "enterprise",
                        multiLocation: selectedPlan === "enterprise",
                    },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // 6. Send welcome email (non-blocking – do not fail if email fails)
        /* sendWelcomeEmail({
            ownerName: owner.fullName,
            restaurantName: name,
            email: owner.email,
            password: owner.password, // plain-text for the email (before hashing)
            plan: selectedPlan,
        }).catch((err) => console.error("Email send error:", err)); */

        return res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            restaurant: newRestaurant[0],
            owner: {
                id: newOwner[0]._id,
                email: newOwner[0].email,
            },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Create Restaurant Error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @route   GET /api/platform/restaurants
// @desc    Get all restaurants (with subscription info)
// @access  Private (Platform SuperAdmin only)
export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().sort({ createdAt: -1 });

        // For each restaurant, also fetch its subscription and owner
        const enriched = await Promise.all(
            restaurants.map(async (restaurant) => {
                const subscription = await Subscription.findOne({ restaurantId: restaurant._id });
                const owner = await User.findOne({
                    restaurantId: restaurant._id,
                    role: "restaurant_owner",
                }).select("-password");

                return {
                    ...restaurant.toObject(),
                    subscription: subscription || null,
                    owner: owner || null,
                };
            })
        );

        return res.json({ success: true, count: enriched.length, restaurants: enriched });
    } catch (error) {
        console.error("Get Restaurants Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   GET /api/platform/restaurants/:id
// @desc    Get single restaurant with subscription and owner info
// @access  Private (Platform SuperAdmin only)
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const subscription = await Subscription.findOne({ restaurantId: id });
        const owner = await User.findOne({ restaurantId: id, role: "restaurant_owner" }).select("-password");

        return res.json({
            success: true,
            restaurant: {
                ...restaurant.toObject(),
                subscription: subscription || null,
                owner: owner || null,
            },
        });
    } catch (error) {
        console.error("Get Restaurant Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   PUT /api/platform/restaurants/:id
// @desc    Update restaurant plan, status, or owner credentials
// @access  Private (Platform SuperAdmin only)
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { plan, status, ownerPassword, restaurantName } = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Update restaurant name if provided
        if (restaurantName) {
            restaurant.name = restaurantName;
            await restaurant.save();
        }

        // Update restaurant status if provided
        if (status) {
            restaurant.status = status;
            await restaurant.save();
        }

        // Update subscription plan if provided
        if (plan) {
            const subscription = await Subscription.findOne({ restaurantId: id });
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

        // Update owner password if provided
        if (ownerPassword) {
            const owner = await User.findOne({ restaurantId: id, role: "restaurant_owner" });
            if (owner) {
                const salt = await bcrypt.genSalt(10);
                owner.password = await bcrypt.hash(ownerPassword, salt);
                await owner.save();
            }
        }

        return res.json({ success: true, message: "Restaurant updated successfully" });
    } catch (error) {
        console.error("Update Restaurant Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   DELETE /api/platform/restaurants/:id
// @desc    Delete restaurant and all associated data
// @access  Private (Platform SuperAdmin only)
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Delete all associated data in parallel
        await Promise.all([
            User.deleteMany({ restaurantId: restaurant._id }),
            Subscription.deleteMany({ restaurantId: restaurant._id }),
            Table.deleteMany({ restaurantId: restaurant._id }),
            Order.deleteMany({ restaurantId: restaurant._id }),
            Bill.deleteMany({ restaurantId: restaurant._id }),
        ]);

        // Delete the restaurant itself
        await Restaurant.findByIdAndDelete(id);

        return res.json({ success: true, message: "Restaurant and all associated data deleted successfully" });
    } catch (error) {
        console.error("Delete Restaurant Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
