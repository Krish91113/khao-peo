// ─── Server Entry Point ───────────────────────────────────────────────────────
// Replaces server.js — starts HTTP server with graceful shutdown.

import http from "http";
import app from "./app.js";
import { connectDB } from "../shared/config/database.js";
import { ENV } from "../shared/config/env.js";
import { initSocket } from "../shared/realtime/socket.js";
import { setupGracefulShutdown } from "./shutdown.js";
import { logger } from "../shared/logging/logger.js";

const server = http.createServer(app);

const start = async (): Promise<void> => {
  await connectDB();

  // Realtime (Socket.IO) shares the HTTP server.
  await initSocket(server);

  server.listen(ENV.PORT, () => {
    logger.info(
      {
        port: ENV.PORT,
        environment: ENV.NODE_ENV,
        swagger: `http://localhost:${ENV.PORT}/api/docs`,
      },
      `🚀 Khao Peeo server running on http://localhost:${ENV.PORT}`,
    );
  });

  setupGracefulShutdown(server);
};

start().catch((err) => {
  logger.fatal({ err }, "Failed to start server");
  process.exit(1);
});
