// Client-safe order UI constants (no server-only imports).

export const ORDER_STATUS_LABELS = {
  pending_payment: "পেমেন্টের অপেক্ষায়",
  confirmed: "নিশ্চিত",
  processing: "প্রস্তুত হচ্ছে",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
  returned: "ফেরত",
  refunded: "রিফান্ড",
} as const;

export const PAYMENT_STATUS_LABELS = {
  unpaid: "অপরিশোধিত",
  pending: "প্রক্রিয়াধীন",
  paid: "পরিশোধিত",
  failed: "ব্যর্থ",
  cod_due: "ক্যাশ অন ডেলিভারি (বাকি)",
  cod_collected: "ক্যাশ অন ডেলিভারি (গৃহীত)",
  refunded: "রিফান্ড",
} as const;

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

export const FORMAT_LABELS = {
  physical: "হার্ড কপি",
  digital: "PDF / ই-বুক",
  bundle: "হার্ড কপি + PDF",
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABELS;
export type PaymentStatusKey = keyof typeof PAYMENT_STATUS_LABELS;
export type FormatKey = keyof typeof FORMAT_LABELS;
