import "server-only";
import { db } from "@/lib/db";
import { applyPercent } from "@/lib/money";
import type { FormatType } from "@/lib/catalog";

export type CouponValidation =
  | { ok: true; coupon: { code: string; discountType: string; discountValue: number }; discountMinor: number; message: string }
  | { ok: false; reason: string };

/**
 * Validate a coupon against a subtotal and cart format mix.
 * Pure validation — redemption is written transactionally during order creation.
 */
export async function validateCoupon(code: string, subtotalMinor: number, formatsInCart: FormatType[]): Promise<CouponValidation> {
  const clean = code.trim().toUpperCase();
  if (!clean) return { ok: false, reason: "কুপন কোড লিখুন।" };
  const coupon = await db.coupon.findUnique({ where: { code: clean } });
  if (!coupon || !coupon.isActive) return { ok: false, reason: "কুপন কোডটি সঠিক নয়।" };
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, reason: "কুপনটি এখনও চালু হয়নি।" };
  if (coupon.endsAt && coupon.endsAt < now) return { ok: false, reason: "কুপনটির মেয়াদ শেষ হয়ে গেছে।" };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, reason: "কুপনটির ব্যবহারসীমা শেষ।" };
  }
  if (coupon.minSpendMinor !== null && subtotalMinor < coupon.minSpendMinor) {
    return { ok: false, reason: "এই কুপনের জন্য সর্বনিম্ন কেনাকাটা প্রয়োজন।" };
  }
  if (coupon.appliesToFormat && !formatsInCart.includes(coupon.appliesToFormat as FormatType)) {
    return { ok: false, reason: "এই কুপনটি কার্টের কোনো ফরম্যাটে প্রযোজ্য নয়।" };
  }

  let discount = 0;
  if (coupon.discountType === "percent") {
    discount = applyPercent(subtotalMinor, coupon.discountValue);
  } else {
    discount = Math.min(coupon.discountValue, subtotalMinor);
  }
  if (coupon.maxDiscountMinor !== null) discount = Math.min(discount, coupon.maxDiscountMinor);
  if (discount <= 0) return { ok: false, reason: "এই কুপনে কোনো ছাড় তৈরি হয়নি।" };

  return {
    ok: true,
    coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
    discountMinor: discount,
    message: `কুপন ${coupon.code} প্রয়োগ হয়েছে।`,
  };
}

/** Distribute an order-level discount across lines proportionally (integer, remainder to first lines). */
export function distributeDiscount(lines: { lineSubtotalMinor: number }[], totalDiscountMinor: number): number[] {
  const n = lines.length;
  if (n === 0 || totalDiscountMinor <= 0) return lines.map(() => 0);
  const subtotal = lines.reduce((s, l) => s + l.lineSubtotalMinor, 0);
  if (subtotal <= 0) return lines.map(() => 0);
  const result: number[] = [];
  let allocated = 0;
  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      result.push(totalDiscountMinor - allocated);
    } else {
      const share = Math.floor((lines[i].lineSubtotalMinor * totalDiscountMinor) / subtotal);
      result.push(share);
      allocated += share;
    }
  }
  return result;
}
