import { MenuItem } from "../models/MenuItem.model.js";

// @route   POST /api/menu
// @desc    Create a new menu item
// @access  Protected (owner/admin)
export const createMenuItem = async (req, res) => {
    try {
        const {
            name,
            category,
            subcategory,
            description,
            price,
            image,
            isAvailable,
            isVeg,
            preparationTime,
            customizations,
            tags,
        } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ message: "Name, category, and price are required" });
        }

        const menuItem = await MenuItem.create({
            restaurantId: req.restaurantId, // Scoped to restaurant
            name,
            category,
            subcategory,
            description,
            price,
            image,
            isAvailable: isAvailable ?? true,
            isVeg: isVeg ?? true,
            preparationTime,
            customizations,
            tags,
            createdBy: req.user._id,
        });

        return res.status(201).json(menuItem);
    } catch (error) {
        console.error("createMenuItem error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   GET /api/menu
// @desc    Get all menu items for the restaurant
// @access  Protected
export const getMenuItems = async (req, res) => {
    try {
        const { category, isAvailable } = req.query;

        const query = { restaurantId: req.restaurantId };
        if (category) query.category = category;
        if (isAvailable !== undefined) query.isAvailable = isAvailable === "true";

        const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
        return res.json(menuItems);
    } catch (error) {
        console.error("getMenuItems error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Protected
export const getMenuItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await MenuItem.findOne({ _id: id, restaurantId: req.restaurantId });
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        return res.json(menuItem);
    } catch (error) {
        console.error("getMenuItemById error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Protected (owner/admin)
export const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const menuItem = await MenuItem.findOneAndUpdate(
            { _id: id, restaurantId: req.restaurantId },
            updateData,
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        return res.json(menuItem);
    } catch (error) {
        console.error("updateMenuItem error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Protected (owner/admin)
export const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const menuItem = await MenuItem.findOneAndDelete({ _id: id, restaurantId: req.restaurantId });

        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        return res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
        console.error("deleteMenuItem error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
