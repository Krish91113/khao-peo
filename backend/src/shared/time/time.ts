// ─── Time Utilities ───────────────────────────────────────────────────────────
// FRD Section 9.4: Store UTC, display restaurant timezone, default Asia/Kolkata.

const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Get the current UTC timestamp.
 */
export function utcNow(): Date {
  return new Date();
}

/**
 * Format a Date to an ISO string (UTC).
 */
export function toUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Format a UTC date for display in a specific timezone.
 */
export function toTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return date.toLocaleString("en-IN", { timeZone: timezone });
}

/**
 * Get the business date (YYYY-MM-DD) for a restaurant's timezone.
 * Business dates may differ from UTC dates near midnight.
 */
export function getBusinessDate(
  date: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE,
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // Returns YYYY-MM-DD
}

/**
 * Get the start of the business day in UTC.
 *
 * The business day starts at midnight in the restaurant's timezone. The offset
 * is computed with `Intl.DateTimeFormat.formatToParts` so the result is
 * correct regardless of the server's local timezone.
 */
export function getBusinessDayStartUTC(
  businessDate: string,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  const [y, m, d] = businessDate.split("-").map(Number);
  const year = y!;
  const month = m!;
  const day = d!;
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(guess);

  const read = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const wallClockUtc = Date.UTC(
    read("year"),
    read("month") - 1,
    read("day"),
    read("hour") % 24,
    read("minute"),
    read("second"),
  );
  const tzOffsetMs = wallClockUtc - guess.getTime();

  return new Date(guess.getTime() - tzOffsetMs);
}

/**
 * Check if a date falls within a specific business date.
 */
export function isWithinBusinessDate(
  date: Date,
  businessDate: string,
  timezone: string = DEFAULT_TIMEZONE,
): boolean {
  return getBusinessDate(date, timezone) === businessDate;
}
