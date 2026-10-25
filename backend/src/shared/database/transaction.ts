// ─── MongoDB Transaction Helper ───────────────────────────────────────────────
// FRD Section 19: Transaction-required operations get a clean helper.

import mongoose from "mongoose";
import { createModuleLogger } from "../logging/logger.js";

const log = createModuleLogger("transaction");

/**
 * Execute a function within a MongoDB transaction.
 * Automatically commits on success, aborts on error.
 *
 * Usage:
 *   const result = await withTransaction(async (session) => {
 *     await Model.create([{ ... }], { session });
 *     return someResult;
 *   });
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await fn(session);

    await session.commitTransaction();
    log.debug("Transaction committed");

    return result;
  } catch (error) {
    await session.abortTransaction();
    log.error({ err: error }, "Transaction aborted");
    throw error;
  } finally {
    session.endSession();
  }
}
