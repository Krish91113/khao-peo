// ─── Zod Validation Middleware ────────────────────────────────────────────────
// FRD Section 12: Every write endpoint must have runtime validation.

import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { validationFailed } from "../errors/app-error.js";

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/**
 * Express middleware that validates request parts against Zod schemas.
 *
 * Usage:
 *   router.post("/",
 *     validate({ body: createOrderSchema }),
 *     controller.create
 *   );
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors = err.flatten().fieldErrors as Record<string, string[] | undefined>;
        const formattedErrors: Record<string, string> = {};

        for (const [field, messages] of Object.entries(fieldErrors)) {
          if (messages && messages.length > 0) {
            formattedErrors[field] = messages[0]!;
          }
        }

        next(
          validationFailed("Validation failed", {
            fields: formattedErrors,
          }),
        );
        return;
      }
      next(err);
    }
  };
}
