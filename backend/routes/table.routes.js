import express from "express";
import { getTables, updateTableStatus, createTable, resetTable, getTableById } from "../controllers/table.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, requireRole("restaurant_owner", "restaurant_admin", "waiter"), getTables);
router.get("/:id", protect, requireRole("restaurant_owner", "restaurant_admin", "waiter"), getTableById);
router.post("/", protect, requireRole("restaurant_owner"), createTable);
router.put("/:id/status", protect, requireRole("restaurant_owner", "restaurant_admin"), updateTableStatus);
router.put("/:id/reset", protect, requireRole("restaurant_owner", "restaurant_admin", "waiter"), resetTable);

export default router;


