// ─── Time Utilities Unit Tests ───────────────────────────────────────────────
// FRD: attendance_records store UTC instants plus a restaurant-local
// business_date (Asia/Kolkata) so history queries are timezone-independent.

import { describe, it, expect } from "vitest";
import { getBusinessDate, isWithinBusinessDate, getBusinessDayStartUTC } from "./time.js";

const KOLKATA = "Asia/Kolkata";

describe("getBusinessDate (Asia/Kolkata)", () => {
  it("maps a UTC morning timestamp to the same business date", () => {
    // 2026-08-09T04:00:00Z == 09:30 IST on 2026-08-09
    expect(getBusinessDate(new Date("2026-08-09T04:00:00.000Z"), KOLKATA)).toBe("2026-08-09");
  });

  it("maps a UTC evening timestamp past IST midnight to the NEXT business date", () => {
    // 2026-08-09T18:30:00Z == 00:00 IST on 2026-08-10
    expect(getBusinessDate(new Date("2026-08-09T18:30:00.000Z"), KOLKATA)).toBe("2026-08-10");
  });

  it("keeps the same business date one second before IST midnight", () => {
    // 2026-08-09T18:29:59Z == 23:59:59 IST on 2026-08-09
    expect(getBusinessDate(new Date("2026-08-09T18:29:59.000Z"), KOLKATA)).toBe("2026-08-09");
  });

  it("maps the FRD example (2026-08-09T04:00:00.000Z -> 2026-08-09)", () => {
    expect(getBusinessDate(new Date("2026-08-09T04:00:00.000Z"), KOLKATA)).toBe("2026-08-09");
  });
});

describe("getBusinessDayStartUTC", () => {
  it("returns a UTC instant whose Kolkata wall time is midnight of the business date", () => {
    const start = getBusinessDayStartUTC("2026-08-09", KOLKATA);
    // 2026-08-09 00:00 IST == 2026-08-08T18:30:00Z
    expect(start.toISOString()).toBe("2026-08-08T18:30:00.000Z");
    expect(getBusinessDate(start, KOLKATA)).toBe("2026-08-09");
  });

  it("round-trips: every instant in [start, start+24h) belongs to the business date", () => {
    const start = getBusinessDayStartUTC("2026-08-09", KOLKATA);
    const probe = new Date(start.getTime() + 12 * 60 * 60 * 1000); // noon IST
    expect(getBusinessDate(probe, KOLKATA)).toBe("2026-08-09");
    const lateProbe = new Date(start.getTime() + 23 * 60 * 60 * 1000 + 59 * 60 * 1000);
    expect(getBusinessDate(lateProbe, KOLKATA)).toBe("2026-08-09");
  });
});

describe("isWithinBusinessDate", () => {
  it("confirms a record timestamp falls on its stored business date", () => {
    expect(
      isWithinBusinessDate(new Date("2026-08-09T04:00:00.000Z"), "2026-08-09", KOLKATA),
    ).toBe(true);
    expect(
      isWithinBusinessDate(new Date("2026-08-09T04:00:00.000Z"), "2026-08-10", KOLKATA),
    ).toBe(false);
  });
});
