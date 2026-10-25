// ─── Money Utilities (Integer Paise) ──────────────────────────────────────────
// FRD Section 9.3: Use integer paise. ₹250.50 → 25050
// All financial conversion happens at API boundaries.

/**
 * Convert rupees (decimal) to paise (integer).
 * ₹250.50 → 25050
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise (integer) to rupees (decimal).
 * 25050 → ₹250.50
 */
export function fromPaise(paise: number): number {
  return paise / 100;
}

/**
 * Add two paise amounts safely.
 */
export function addPaise(a: number, b: number): number {
  return a + b;
}

/**
 * Calculate percentage of a paise amount, rounding to nearest paise.
 * e.g., calculatePercentage(10000, 5) → 500 (5% of ₹100)
 */
export function calculatePercentage(paise: number, percentage: number): number {
  return Math.round((paise * percentage) / 100);
}

/**
 * Apply a fixed discount in paise, ensuring result is not negative.
 */
export function applyFixedDiscount(amount: number, discount: number): number {
  return Math.max(0, amount - discount);
}

/**
 * Apply a percentage discount, ensuring result is not negative.
 */
export function applyPercentageDiscount(amount: number, percentage: number): number {
  const discount = calculatePercentage(amount, percentage);
  return Math.max(0, amount - discount);
}

/**
 * Format paise as a display string.
 * 25050 → "₹250.50"
 */
export function formatPaise(paise: number): string {
  return `₹${fromPaise(paise).toFixed(2)}`;
}
