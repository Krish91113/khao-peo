// ─── Pagination Helper ────────────────────────────────────────────────────────
// FRD Section 13.2: ?page=1&limit=20&sort_by=created_at&sort_order=desc

import type { PaginationMeta, PaginationQuery } from "../types/index.js";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Parse pagination parameters from query string with safe defaults.
 */
export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  const page = Math.max(1, parseInt(String(query.page ?? "1"), 10) || 1);
  const rawLimit = parseInt(String(query.limit ?? String(DEFAULT_LIMIT)), 10) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);
  const sort_by = typeof query.sort_by === "string" ? query.sort_by : "created_at";
  const sort_order = query.sort_order === "asc" ? "asc" : "desc";

  return { page, limit, sort_by, sort_order };
}

/**
 * Build pagination metadata from query results.
 */
export function buildPaginationMeta(total: number, pagination: PaginationQuery): PaginationMeta {
  const total_pages = Math.ceil(total / pagination.limit);

  return {
    page: pagination.page,
    limit: pagination.limit,
    total,
    total_pages,
    has_next: pagination.page < total_pages,
    has_prev: pagination.page > 1,
  };
}

/**
 * Calculate skip value for Mongoose queries.
 */
export function getSkip(pagination: PaginationQuery): number {
  return (pagination.page - 1) * pagination.limit;
}

/**
 * Build Mongoose sort object from pagination params.
 */
export function getSortObject(pagination: PaginationQuery): Record<string, 1 | -1> {
  return { [pagination.sort_by]: pagination.sort_order === "asc" ? 1 : -1 };
}
