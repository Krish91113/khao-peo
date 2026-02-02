import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMyRestaurant } from "../controllers/restaurant.controller.js";

const router = express.Router();

router.get("/me", protect, getMyRestaurant);

export default router;
