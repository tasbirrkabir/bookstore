import "server-only";
import { db } from "@/lib/db";
import type { StoreSetting } from "@prisma/client";

export type StoreSettings = StoreSetting;

let cache: { value: StoreSettings; at: number } | null = null;
const TTL = 10_000;

export async function getSettings(): Promise<StoreSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  let s = await db.storeSetting.findUnique({ where: { id: "main" } });
  if (!s) {
    s = await db.storeSetting.create({ data: { id: "main" } });
  }
  cache = { value: s, at: Date.now() };
  return s;
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
