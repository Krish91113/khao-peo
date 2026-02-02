import express from "express";
import { createBill, getBillByOrder, getAllBills, createFinalBill } from "../controllers/bill.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, requireRole("restaurant_owner", "restaurant_admin"), getAllBills);
router.post("/", protect, requireRole("restaurant_owner", "restaurant_admin"), createBill); // Kitchen receipt - admin only
router.post("/final/:tableId", protect, requireRole("restaurant_owner", "restaurant_admin"), createFinalBill); // Final bill - admin only
router.get("/order/:orderId", protect, getBillByOrder);

export default router;


