// ─── Pino Structured Logger ───────────────────────────────────────────────────
// FRD Section 17: Structured logging with request_id, redaction of sensitive fields.

import pino from "pino";

// Determine if we should use pretty printing (dev only)
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "token",
      "refresh_token",
      "otp",
      "manager_pin",
      "manager_pin_hash",
      "connection_string",
      "payment_secret",
    ],
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * Create a child logger with module context.
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}
