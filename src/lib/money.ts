// Money helpers — ALL authoritative amounts are integer minor units (poisha, 1 BDT = 100 poisha).
// Never use floating point for totals.

export const CURRENCY = "BDT";

/** Format integer poisha as BDT display string, e.g. 45000 -> "৳450" */
export function formatBdt(poisha: number, opts?: { withDecimals?: boolean }): string {
  const taka = poisha / 100;
  const hasCents = poisha % 100 !== 0;
  try {
    return new Intl.NumberFormat("bn-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: opts?.withDecimals || hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(taka);
  } catch {
    return `৳${taka.toFixed(hasCents ? 2 : 0)}`;
  }
}

/** Format poisha as plain taka number string for form inputs: 45000 -> "450" */
export function poishaToTakaInput(poisha: number | null | undefined): string {
  if (poisha === null || poisha === undefined) return "";
  return String(poisha / 100);
}

/** Parse a taka amount from form input into integer poisha. Returns null if invalid/negative. */
export function takaInputToPoisha(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Round-half-up percent discount on an integer minor amount (never floats). */
export function applyPercent(amountMinor: number, percent: number): number {
  if (percent <= 0) return 0;
  if (percent >= 100) return amountMinor;
  return Math.floor((amountMinor * percent + 50) / 100);
}

export function clampQty(q: unknown, max = 99): number {
  const n = typeof q === "number" ? Math.floor(q) : parseInt(String(q ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, max);
}
