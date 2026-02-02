import express from "express";
import {
    createMenuItem,
    getMenuItems,
    getMenuItemById,
    updateMenuItem,
    deleteMenuItem,
} from "../controllers/menu.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", requireRole("restaurant_owner", "restaurant_admin"), createMenuItem);
router.get("/", getMenuItems);
router.get("/:id", getMenuItemById);
router.put("/:id", requireRole("restaurant_owner", "restaurant_admin"), updateMenuItem);
router.delete("/:id", requireRole("restaurant_owner", "restaurant_admin"), deleteMenuItem);

export default router;
