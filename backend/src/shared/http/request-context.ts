// ─── Request Context with AsyncLocalStorage ───────────────────────────────────
// FRD Section 9.1: Propagate request_id, user, tenant through the call chain.

import { AsyncLocalStorage } from "async_hooks";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response, NextFunction } from "express";
import type { RequestContext } from "../types/index.js";

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context from AsyncLocalStorage.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Get the current request_id, falling back to "unknown".
 */
export function getRequestId(): string {
  return getRequestContext()?.request_id ?? "unknown";
}

/**
 * Express middleware that initializes a RequestContext for every request.
 */
export function requestContextMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const request_id = (req.headers["x-request-id"] as string | undefined) || `req_${uuidv4()}`;

  const context: RequestContext = {
    request_id,
    permissions: [],
    ip_address: req.ip || req.socket.remoteAddress,
    user_agent: req.headers["user-agent"],
    started_at: Date.now(),
  };

  // Attach to request object for easy access in middleware chain
  (req as RequestWithContext).context = context;

  asyncLocalStorage.run(context, () => {
    next();
  });
}

/**
 * Extended Express Request with our context attached.
 */
export interface RequestWithContext extends Request {
  context: RequestContext;
  user?: {
    _id: string;
    id?: string;
    role: string;
    restaurantId?: string;
    status?: string;
    permissions_override?: string[];
    token_version?: number;
  };
  restaurantId?: string;
}
