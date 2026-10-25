import { z } from "zod";
export const idParams = z.object({ id: z.string().min(1) });
export const itemParams = z.object({ itemId: z.string().min(1) });
export const itemStatus = z.object({ status: z.enum(["received", "preparing", "partially_ready", "ready", "cancelled"]) });
export const priority = z.object({ priority: z.number().int().min(0).max(10) });
