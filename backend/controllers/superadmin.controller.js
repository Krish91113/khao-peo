import { User } from "../models/User.model.js";

// Get all users (superadmin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
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

        const users = await User.find({ role })
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
        const totalUsers = await User.countDocuments();
        const admins = await User.countDocuments({ role: "admin" });
        const owners = await User.countDocuments({ role: "owner" });
        const waiters = await User.countDocuments({ role: "waiter" });
        const superadmins = await User.countDocuments({ role: "superadmin" });

        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentSignups = await User.countDocuments({
            createdAt: { $gte: sevenDaysAgo },
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

        const recentUsers = await User.find({})
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
