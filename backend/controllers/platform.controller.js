import bcrypt from "bcryptjs";
import { Restaurant } from "../models/Restaurant.model.js";
import { User } from "../models/User.model.js";
import { Subscription } from "../models/Subscription.model.js";

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

        // 1. Check if restaurant slug exists
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
                    restaurantId: `rest_${Date.now()}`, // Simple ID generation
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
        await Subscription.create(
            [
                {
                    restaurantId: restaurantId,
                    plan: plan || "basic",
                    status: "trial",
                    trial: {
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                        isTrialActive: true,
                    },
                    features: {
                        maxTables: plan === "enterprise" ? 999 : plan === "professional" ? 30 : 10,
                        maxStaff: plan === "enterprise" ? 999 : plan === "professional" ? 15 : 5,
                        analytics: plan !== "basic",
                        customBranding: plan !== "basic",
                        apiAccess: plan === "professional" || plan === "enterprise",
                        multiLocation: plan === "enterprise",
                    },
                },
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

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
// @desc    Get all restaurants
// @access  Private (Platform SuperAdmin only)
export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().sort({ createdAt: -1 });
        return res.json({ success: true, count: restaurants.length, restaurants });
    } catch (error) {
        console.error("Get Restaurants Error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
