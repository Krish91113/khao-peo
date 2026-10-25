import { z } from "zod";
export const dateQuery = z.object({ from: z.string().optional(), to: z.string().optional() });
