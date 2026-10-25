// ─── Table Validators ─────────────────────────────────────────────────────────
// Module: table | Layer: api

import { z } from "zod";

export const createTableSchema = z.object({
  tableNumber: z.coerce.number().int().positive("Table number must be positive"),
  capacity: z.coerce.number().int().positive("Capacity must be positive").optional(),
});

export const updateTableStatusSchema = z.object({
  isBooked: z.boolean(),
  currentOrderId: z.string().nullable().optional(),
});

export const assignTableSchema = z.object({
  waiterId: z.string().min(1, "waiterId is required"),
});

export const reassignTableSchema = z.object({
  waiterId: z.string().min(1, "waiterId is required"),
  reason: z.string().optional(),
});

export const releaseTableSchema = z.object({
  reason: z.string().optional(),
});

export const tableIdParamSchema = z.object({
  id: z.string().min(1, "Table ID is required"),
});
