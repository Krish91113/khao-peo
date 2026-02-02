import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
    getAllUsers,
    getUsersByRole,
    getUserStats,
    getRecentSignups,
    getOnlineUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
} from "../controllers/superadmin.controller.js";

import { requireRole } from "../middleware/role.middleware.js";
const router = express.Router();

// All routes require authentication and specific roles
router.use(protect);
router.use(requireRole("superadmin", "restaurant_owner", "platform_superadmin"));

// Get all users
router.get("/users", getAllUsers);

// Get user statistics
router.get("/users/stats", getUserStats);

// Get recent signups
router.get("/users/recent", getRecentSignups);

// Get currently online users
router.get("/users/online", getOnlineUsers);

// Get users by role
router.get("/users/role/:role", getUsersByRole);

// Create new user
router.post("/users", createUser);

// Update user
router.put("/users/:id", updateUser);

// Delete user
router.delete("/users/:id", deleteUser);

// Toggle user status
router.patch("/users/:id/toggle-status", toggleUserStatus);

export default router;

