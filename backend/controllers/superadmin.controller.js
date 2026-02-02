import { User } from "../models/User.model.js";
import bcrypt from "bcryptjs";

// Get all users (superadmin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ restaurantId: req.restaurantId })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

// Get users by role
export const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params;

        const users = await User.find({ role, restaurantId: req.restaurantId })
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Error fetching users by role:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};

// Get user statistics
export const getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ restaurantId: req.restaurantId });
        const admins = await User.countDocuments({ role: "admin", restaurantId: req.restaurantId });
        const owners = await User.countDocuments({ role: "owner", restaurantId: req.restaurantId });
        const waiters = await User.countDocuments({ role: "waiter", restaurantId: req.restaurantId });
        const superadmins = await User.countDocuments({ role: "superadmin", restaurantId: req.restaurantId });

        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
            restaurantId: req.restaurantId,
        });

        res.status(200).json({
            success: true,
            stats: {
                total: totalUsers,
                admins,
                owners,
                waiters,
                superadmins,
                recentSignups,
            },
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch statistics",
        });
    }
};

// Get recent signups
export const getRecentSignups = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentUsers = await User.find({ restaurantId: req.restaurantId })
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            success: true,
            users: recentUsers,
        });
    } catch (error) {
        console.error("Error fetching recent signups:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch recent signups",
        });
    }
};

// Get currently online users
export const getOnlineUsers = async (req, res) => {
    try {
        const onlineUsers = await User.find({ isOnline: true, restaurantId: req.restaurantId })
            .select("-password")
            .sort({ lastActivity: -1 });

        res.status(200).json({
            success: true,
            count: onlineUsers.length,
            users: onlineUsers,
        });
    } catch (error) {
        console.error("Error fetching online users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch online users",
        });
    }
};

// Create new user (superadmin only)
export const createUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists",
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role,
            restaurantId: req.restaurantId,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create user",
        });
    }
};

// Update user (superadmin only)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, password } = req.body;

        const user = await User.findOne({ _id: id, restaurantId: req.restaurantId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update fields
        if (fullName) user.fullName = fullName;
        if (role) user.role = role;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
        });
    }
};

// Delete user (superadmin only)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ _id: id, restaurantId: req.restaurantId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent deleting superadmin
        if (user.role === "superadmin") {
            return res.status(403).json({
                success: false,
                message: "Cannot delete superadmin user",
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
        });
    }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findOne({ _id: id, restaurantId: req.restaurantId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Toggle isOnline status (can be used for activate/deactivate)
        user.isOnline = !user.isOnline;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User status updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isOnline: user.isOnline,
            },
        });
    } catch (error) {
        console.error("Error toggling user status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update user status",
        });
    }
};

