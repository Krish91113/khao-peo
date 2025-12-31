import express from "express";
import { getTables, updateTableStatus, createTable, resetTable, getTableById } from "../controllers/table.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, requireRole("owner", "admin", "waiter"), getTables);
router.get("/:id", protect, requireRole("owner", "admin", "waiter"), getTableById);
router.post("/", protect, requireRole("owner"), createTable);
router.put("/:id/status", protect, requireRole("owner", "admin"), updateTableStatus);
router.put("/:id/reset", protect, requireRole("owner", "admin", "waiter"), resetTable);

export default router;


