// Client-safe Bengali formatting helpers (pure functions, no server imports).

/** 5 -> "৫" ; 512 -> "৫১২" */
export function bnNumber(value: number | string): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  try {
    return new Intl.NumberFormat("bn-BD").format(n);
  } catch {
    return String(value);
  }
}

/** ISO/Date -> "১৫ জানুয়ারি, ২০২৫" */
export function bnDate(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("bn-BD", { day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** ISO/Date -> "১৫ জানুয়ারি, ২০২৫ · বিকাল ৪:৩০" */
export function bnDateTime(input: string | Date | null | undefined): string {
  if (!input) return "-";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

/** Bengali label for an order-event actor string ("system" | "admin:…" | "guest" | "customer:…"). */
export function actorLabel(actor: string): string {
  if (actor === "system") return "সিস্টেম";
  if (actor === "guest") return "অতিথি গ্রাহক";
  if (actor.startsWith("admin:")) return "অ্যাডমিন";
  if (actor.startsWith("customer:")) return "গ্রাহক";
  return actor;
}
