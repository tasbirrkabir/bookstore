import "server-only";
import { db } from "@/lib/db";
import type { StoreSetting } from "@prisma/client";

export type StoreSettings = StoreSetting;

let cache: { value: StoreSettings; at: number } | null = null;
const TTL = 10_000;

const DEFAULT_SETTINGS: StoreSettings = {
  id: "main",
  storeName: "পাতা",
  storeNameEn: "PATA",
  tagline: "বইয়ের নিজস্ব ঠিকানা",
  supportEmail: "support@pata.example",
  supportPhone: "+880 1700-000000",
  addressLine: "ঢাকা, বাংলাদেশ",
  facebookUrl: null,
  announcement: null,
  announcementEnabled: false,
  shippingInsideDhaka: 7000,
  shippingOutsideDhaka: 13000,
  freeShippingThreshold: null,
  deliveryEstimateInside: "ঢাকার ভেতরে ২ থেকে ৩ দিন",
  deliveryEstimateOutside: "ঢাকার বাইরে ৩ থেকে ৫ দিন",
  downloadLimitDefault: 5,
  downloadExpiryDays: 365,
  paymentProvider: "disabled",
  codEnabled: true,
  returnWindowDays: 7,
  aboutText: null,
  updatedAt: new Date(),
};

export async function getSettings(): Promise<StoreSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  try {
    let s = await db.storeSetting.findUnique({ where: { id: "main" } });
    if (!s) {
      try {
        s = await db.storeSetting.create({ data: { id: "main" } });
      } catch {
        s = DEFAULT_SETTINGS;
      }
    }
    cache = { value: s, at: Date.now() };
    return s;
  } catch (err) {
    console.error("[settings] Could not load store settings, using fallback:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(data: Partial<StoreSetting>): Promise<StoreSettings> {
  const s = await db.storeSetting.update({ where: { id: "main" }, data });
  cache = { value: s, at: Date.now() };
  return s;
}

export function shippingZones(s: StoreSettings) {
  return [
    { id: "inside_dhaka", label: "ঢাকার ভিতরে", feeMinor: s.shippingInsideDhaka, estimate: s.deliveryEstimateInside },
    { id: "outside_dhaka", label: "ঢাকার বাইরে", feeMinor: s.shippingOutsideDhaka, estimate: s.deliveryEstimateOutside },
  ] as const;
}

export function shippingFeeFor(zone: string, s: StoreSettings): number {
  if (zone === "inside_dhaka") return s.shippingInsideDhaka;
  if (zone === "outside_dhaka") return s.shippingOutsideDhaka;
  return 0;
}
