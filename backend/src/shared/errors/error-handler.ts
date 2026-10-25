// ─── Global Error Handler ─────────────────────────────────────────────────────
// FRD Section 15: Maps AppError → standard error envelope. No stack trace in production.

import type { Request, Response, NextFunction } from "express";
import { AppError } from "./app-error.js";
import { getRequestId } from "../http/request-context.js";
import { logger } from "../logging/logger.js";
import { ZodError } from "zod";

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const request_id = getRequestId();

  // ── Zod Validation Errors ───────────────────────────────────────────────
  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    logger.warn({ request_id, errors: fieldErrors }, "Validation failed");

    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Validation failed",
        details: fieldErrors,
      },
      request_id,
    });
    return;
  }

  // ── Known Application Errors ────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.is_operational) {
      logger.error({ request_id, err }, "Non-operational AppError");
    } else {
      logger.warn({ request_id, code: err.code, message: err.message }, "Operational error");
    }

    res.status(err.status_code).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      request_id,
    });
    return;
  }

  // ── Mongoose Validation Error ───────────────────────────────────────────
  if (err.name === "ValidationError") {
    logger.warn({ request_id, err }, "Mongoose validation error");

    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: err.message,
        details: {},
      },
      request_id,
    });
    return;
  }

  // ── Mongoose Cast Error (invalid ObjectId) ──────────────────────────────
  if (err.name === "CastError") {
    logger.warn({ request_id, err }, "Invalid ID format");

    res.status(422).json({
      success: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "Invalid ID format",
        details: {},
      },
      request_id,
    });
    return;
  }

  // ── Unknown / Unexpected Errors ─────────────────────────────────────────
  logger.error({ request_id, err }, "Unhandled error");

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      details: {},
    },
    request_id,
  });
}

// Backward-compatible export used by existing integration tests and consumers.
export const errorHandler = globalErrorHandler;
