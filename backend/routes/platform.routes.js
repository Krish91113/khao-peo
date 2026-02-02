import express from "express";
import { createRestaurant, getAllRestaurants } from "../controllers/platform.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

// All routes are protected and require platform_superadmin role
router.use(protect);
router.use(requireRole("platform_superadmin"));

router.post("/restaurants", createRestaurant);
router.get("/restaurants", getAllRestaurants);

export default router;
