// ─── Backfill: attendance_records businessDate ───────────────────────────────
// One-off migration for documents created before the `businessDate` field
// (Asia/Kolkata) existed. History-by-date would otherwise miss these records.
//
// Usage: npx tsx scripts/backfillAttendanceBusinessDate.ts

import mongoose from "mongoose";
import { ENV } from "../src/shared/config/env.js";
import { getBusinessDate } from "../src/shared/time/time.js";

async function main(): Promise<void> {
  await mongoose.connect(ENV.MONGO_URI);
  const col = mongoose.connection.db!.collection("attendance_records");

  const missing = await col
    .find({ businessDate: { $exists: false } })
    .project({ checkedInAt: 1 })
    .limit(100_000)
    .toArray();

  console.log(`Found ${missing.length} attendance record(s) without businessDate`);

  let updated = 0;
  let skipped = 0;
  for (const doc of missing) {
    const checkedInAt = doc.checkedInAt as Date | undefined;
    if (!checkedInAt || Number.isNaN(new Date(checkedInAt).getTime())) {
      skipped++;
      continue;
    }
    const businessDate = getBusinessDate(new Date(checkedInAt));
    await col.updateOne({ _id: doc._id }, { $set: { businessDate } });
    updated++;
  }

  console.log(`Updated ${updated} record(s), skipped ${skipped} (missing/invalid checkedInAt)`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
