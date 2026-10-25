// ─── Centralized Environment Configuration ───────────────────────────────────
// Single source of truth for process.env access.
// FRD: No direct process.env outside config module.

import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_SECURE: z.coerce.boolean().default(true),
  SMTP_USER: z.string().email().optional(),
  SMTP_APP_PASSWORD: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(1).optional(),
  MAIL_FROM_NAME: z.string().default("Khao Peeo POS"),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    // eslint-disable-next-line no-console
    console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
    throw new Error(
      "Invalid environment configuration. Check .env.example for required variables.",
    );
  }

  return result.data;
}

export const ENV: EnvConfig = loadEnv();
