// ─── Express Application ──────────────────────────────────────────────────────
// FRD Section 4.2: Request flow with middleware chain.
// Replaces the old app.js while maintaining backward compatibility.

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ENV } from "../shared/config/env.js";
import { requestContextMiddleware } from "../shared/http/request-context.js";
import { globalErrorHandler } from "../shared/errors/error-handler.js";
import { registerRoutes } from "./routes.js";
import { setupSwagger } from "./swagger.js";

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  ENV.CLIENT_URL,
  "http://localhost:8080",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
];

const normalizeOrigin = (val?: string) => (val ? val.replace(/\/+$/, "").toLowerCase() : "");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (ENV.NODE_ENV === "development") {
        return callback(null, true); // Allow all in dev
      }
      const normOrigin = normalizeOrigin(origin);
      const isAllowed =
        normOrigin === normalizeOrigin(ENV.CLIENT_URL) ||
        allowedOrigins.some((o) => normalizeOrigin(o) === normOrigin) ||
        normOrigin.endsWith(".vercel.app");

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging ───────────────────────────────────────────────────────────
if (ENV.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Request Context (generates request_id) ────────────────────────────────────
app.use(requestContextMiddleware);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      message: "Khao Peeo backend running",
      version: "1.0.0",
      environment: ENV.NODE_ENV,
    },
  });
});

// ── Swagger ───────────────────────────────────────────────────────────────────
setupSwagger(app);

// ── Module Routes ─────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(globalErrorHandler);

export default app;
