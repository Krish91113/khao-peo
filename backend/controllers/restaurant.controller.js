import { Restaurant } from "../models/Restaurant.model.js";

// @route   GET /api/restaurant/me
// @desc    Get details of the current user's restaurant
// @access  Protected
export const getMyRestaurant = async (req, res) => {
    try {
        const restaurantId = req.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ message: "No restaurant ID associated with this user" });
        }

        const restaurant = await Restaurant.findOne({ restaurantId });

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        return res.json(restaurant);
    } catch (error) {
        console.error("getMyRestaurant error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
