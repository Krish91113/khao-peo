// ─── Route Aggregator ─────────────────────────────────────────────────────────
// Centralized route registration. Imports each module's routes.

import type { Express } from "express";
import { authRoutes } from "../modules/auth/index.js";
import { identityRoutes } from "../modules/identity/index.js";
import { restaurantRoutes } from "../modules/restaurant/index.js";
import { platformRoutes } from "../modules/platform/index.js";
import { tableRoutes } from "../modules/table/index.js";
import { menuRoutes } from "../modules/menu/index.js";
import { orderRoutes } from "../modules/order/index.js";
import { billRoutes } from "../modules/billing/index.js";
import { servedOrderRoutes } from "../modules/audit/index.js";
import { inventoryRoutes } from "../modules/inventory/index.js";
import { kitchenRoutes } from "../modules/kitchen/index.js";
import { discountRoutes } from "../modules/discount/index.js";
import { analyticsRoutes } from "../modules/analytics/index.js";
import { staffRoutes } from "../modules/staff/index.js";
import { attendanceRoutes } from "../modules/attendance/index.js";

export function registerRoutes(app: Express): void {
  // ── V1 API Routes ─────────────────────────────────────────────────────────
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/restaurant", restaurantRoutes);
  app.use("/api/v1/platform", platformRoutes);
  app.use("/api/v1/tables", tableRoutes);
  app.use("/api/v1/menu", menuRoutes);
  app.use("/api/v1/orders", orderRoutes);
  app.use("/api/v1/bills", billRoutes);
  app.use("/api/v1/staff", staffRoutes);
  app.use("/api/v1/attendance", attendanceRoutes);
  app.use("/api/v1/inventory", inventoryRoutes);
  app.use("/api/v1/kitchen", kitchenRoutes);
  app.use("/api/v1/coupons", discountRoutes);
  app.use("/api/v1/discounts", discountRoutes);
  app.use("/api/v1/analytics", analyticsRoutes);
  app.use("/api/v1/served-orders", servedOrderRoutes);
  app.use("/api/v1", identityRoutes);

  // ── Legacy Compatibility Routes ───────────────────────────────────────────
  // These map old /api/* paths to the new module handlers so existing
  // frontend code continues working until updated.
  app.use("/api/auth", authRoutes);
  app.use("/api/restaurant", restaurantRoutes);
  app.use("/api/platform", platformRoutes);
  app.use("/api/tables", tableRoutes);
  app.use("/api/menu", menuRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/bills", billRoutes);
  app.use("/api/served-orders", servedOrderRoutes);
  app.use("/api/superadmin", identityRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/kitchen", kitchenRoutes);
  app.use("/api/coupons", discountRoutes);
  app.use("/api/discounts", discountRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/staff", staffRoutes);
}
