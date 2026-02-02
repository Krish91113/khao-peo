import express from "express";
import { getServedOrders, getServedOrderById, getServedOrderBill } from "../controllers/servedOrder.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes require authentication and admin/owner role
router.get("/", protect, requireRole("restaurant_owner", "restaurant_admin", "platform_superadmin"), getServedOrders);
router.get("/:id", protect, requireRole("restaurant_owner", "restaurant_admin", "platform_superadmin"), getServedOrderById);
router.get("/:id/bill", protect, requireRole("restaurant_owner", "restaurant_admin", "platform_superadmin"), getServedOrderBill);

export default router;
