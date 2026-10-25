// ─── Standard Response Helpers ────────────────────────────────────────────────
// FRD Section 9.2: Every response follows the standard envelope format.

import type { Response } from "express";
import type { PaginationMeta } from "../types/index.js";
import { getRequestId } from "./request-context.js";

/**
 * Send a successful response with the standard envelope.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: PaginationMeta | Record<string, unknown>,
): void {
  res.status(statusCode).json({
    success: true,
    data,
    meta: meta ?? {},
    request_id: getRequestId(),
  });
}

/**
 * Send a successful response with pagination metadata.
 */
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  statusCode: number = 200,
): void {
  sendSuccess(res, data, statusCode, pagination);
}

/**
 * Send an error response with the standard envelope.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, unknown>,
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: details ?? {},
    },
    request_id: getRequestId(),
  });
}
