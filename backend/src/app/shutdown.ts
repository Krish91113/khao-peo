// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// FRD: Clean shutdown handling for Render compatibility.

import type { Server } from "http";
import { disconnectDB } from "../shared/config/database.js";
import { logger } from "../shared/logging/logger.js";

export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received, closing gracefully...");

    server.close(async () => {
      logger.info("HTTP server closed");

      await disconnectDB();

      logger.info("All connections closed. Exiting.");
      process.exit(0);
    });

    // Force kill after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled rejection");
    process.exit(1);
  });
}
