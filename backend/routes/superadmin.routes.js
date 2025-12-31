import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    getAllUsers,
    getUsersByRole,
    getUserStats,
    getRecentSignups,
} from "../controllers/superadmin.controller.js";

const router = express.Router();

// Middleware to check if user is superadmin
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Superadmin only.",
        });
    }
    next();
};

// All routes require authentication and superadmin role
router.use(protect);
router.use(isSuperAdmin);

// Get all users
router.get("/users", getAllUsers);

// Get user statistics
router.get("/users/stats", getUserStats);

// Get recent signups
router.get("/users/recent", getRecentSignups);

// Get users by role
router.get("/users/role/:role", getUsersByRole);

export default router;
