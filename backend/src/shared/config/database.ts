// ─── MongoDB Connection ───────────────────────────────────────────────────────
// Replaces config/db.js with graceful shutdown support.

import mongoose from "mongoose";
import { ENV } from "./env.js";
import { logger } from "../logging/logger.js";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(ENV.MONGO_URI);
    logger.info("✅ MongoDB connected");
  } catch (error) {
    logger.fatal({ err: error }, "❌ MongoDB connection failed");
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  } catch (error) {
    logger.error({ err: error }, "Error disconnecting MongoDB");
  }
}
