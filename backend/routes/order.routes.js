import express from "express";
import {
  createOrder,
  getOrdersByTable,
  updateOrderStatus,
  getAllOrders,
} from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, getAllOrders);
router.post("/", protect, requireRole("restaurant_owner", "restaurant_admin", "waiter"), createOrder);
router.get("/table/:tableId", protect, getOrdersByTable);
router.patch("/:id/status", protect, requireRole("restaurant_owner", "restaurant_admin", "waiter"), updateOrderStatus);

export default router;


