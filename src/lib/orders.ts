import "server-only";
import { db } from "@/lib/db";
import { generateOrderNumber, randomToken, sha256 } from "@/lib/tokens";
import { quoteCart, getCartLines } from "@/lib/cart";
import { getSettings, shippingFeeFor } from "@/lib/settings";
import { distributeDiscount } from "@/lib/coupon";
import { notifyOrderPlaced } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const ORDER_STATUSES = ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"] as const;
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "cod_due", "cod_collected", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "পেমেন্টের অপেক্ষায়",
  confirmed: "নিশ্চিত",
  processing: "প্রস্তুত হচ্ছে",
  shipped: "পাঠানো হয়েছে",
  delivered: "ডেলিভারি সম্পন্ন",
  cancelled: "বাতিল",
  returned: "ফেরত",
  refunded: "রিফান্ড",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "অপরিশোধিত",
  pending: "প্রক্রিয়াধীন",
  paid: "পরিশোধিত",
  failed: "ব্যর্থ",
  cod_due: "ক্যাশ অন ডেলিভারি (বাকি)",
  cod_collected: "ক্যাশ অন ডেলিভারি (গৃহীত)",
  refunded: "রিফান্ড",
};

export type CreateOrderInput = {
  contactName: string;
  contactPhone: string;
  contactEmail?: string | null;
  paymentMethod: "cod" | "online";
  shippingZone?: "inside_dhaka" | "outside_dhaka" | null;
  shipping?: {
    recipientName: string;
    recipientPhone: string;
    district: string;
    area: string;
    address: string;
    postcode?: string | null;
    note?: string | null;
  } | null;
  customerNote?: string | null;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; guestToken: string | null; requiresRedirect: boolean; paymentId?: string }
  | { ok: false; error: string; code: "CART_EMPTY" | "INVALID" | "COD_NOT_ALLOWED" | "STOCK" | "COUPON" | "SHIPPING_REQUIRED" };

/**
 * Create an order from the server-side cart state.
 * - Recomputes every amount from the DB; browser-submitted totals are ignored.
 * - Writes immutable order-line snapshots.
 * - COD only for physical-only carts. Digital/mixed carts must pay online.
 * - Stock commit policy (documented): committed atomically at the moment the order
 *   becomes confirmed — COD orders at creation, online orders at verified payment.
 *   Cancel/return restocks per policy.
 */
export async function createOrderFromCart(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { getCartIdFromCookies } = await import("@/lib/cart");
  const cartId = await getCartIdFromCookies();
  const cartRecord = cartId ? await db.cart.findUnique({ where: { id: cartId } }) : null;
  if (!cartId || !cartRecord) return { ok: false, error: "কার্ট খালি।", code: "CART_EMPTY" };

  const quote = await quoteCart(cartId);
  const purchasable = quote.lines.filter((l) => l.hasIssue === null);
  if (purchasable.length === 0) {
    return { ok: false, error: quote.lines.length === 0 ? "কার্ট খালি।" : "কার্টে অপ্রাপ্য বা স্টকশেষ আইটেম আছে — সেগুলো সরিয়ে আবার চেষ্টা করুন।", code: quote.lines.length === 0 ? "CART_EMPTY" : "STOCK" };
  }

  // Business rules
  if (input.paymentMethod === "cod") {
    if (!quote.codEligible) {
      return { ok: false, error: "ক্যাশ অন ডেলিভারি শুধুমাত্র শারীরিক বইয়ের অর্ডারে প্রযোজ্য। ডিজিটাল আইটেম থাকলে অনলাইন পেমেন্ট করতে হবে।", code: "COD_NOT_ALLOWED" };
    }
    if (!input.shipping || !input.shippingZone) {
      return { ok: false, error: "ডেলিভারির ঠিকানা ও জোন প্রয়োজন।", code: "SHIPPING_REQUIRED" };
    }
  }
  if (quote.hasPhysical && (!input.shipping || !input.shippingZone)) {
    return { ok: false, error: "ডেলিভারির ঠিকানা ও জোন প্রয়োজন।", code: "SHIPPING_REQUIRED" };
  }

  const settings = await getSettings();

  // Re-validate coupon server-side one final time against purchasable subtotal.
  let discountMinor = 0;
  let couponSnapshot: string | null = null;
  if (cartRecord.couponCode) {
    const formats = [...new Set(purchasable.map((l) => l.formatType))];
    const { validateCoupon } = await import("@/lib/coupon");
    const res = await validateCoupon(cartRecord.couponCode, quote.subtotalMinor, formats);
    if (!res.ok) return { ok: false, error: `কুপন প্রয়োগ করা যায়নি: ${res.reason}`, code: "COUPON" };
    discountMinor = res.discountMinor;
    couponSnapshot = JSON.stringify({ code: res.coupon.code, discountType: res.coupon.discountType, discountValue: res.coupon.discountValue, appliedMinor: discountMinor });
  }

  const shippingMinor = quote.hasPhysical ? shippingFeeFor(input.shippingZone ?? "inside_dhaka", settings) : 0;
  const shippingMinorFinal =
    settings.freeShippingThreshold && quote.subtotalMinor - discountMinor >= settings.freeShippingThreshold ? 0 : shippingMinor;
  const totalMinor = Math.max(0, quote.subtotalMinor - discountMinor) + shippingMinorFinal;

  // Distribute order-level discount to lines for line_total snapshots.
  const lineDiscounts = distributeDiscount(purchasable.map((l) => ({ lineSubtotalMinor: l.lineSubtotalMinor })), discountMinor);

  const paymentStatus: PaymentStatus = input.paymentMethod === "cod" ? "cod_due" : "unpaid";
  const status: OrderStatus = input.paymentMethod === "cod" ? "confirmed" : "pending_payment";

  const guestToken = randomToken(32);
  const guestTokenHash = sha256(guestToken);
  const session = await (await import("@/lib/auth")).getSession();
  const userId = session?.uid ?? null;

  let order;
  try {
    order = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        guestEmail: userId ? null : input.contactEmail ?? null,
        guestPhone: userId ? null : input.contactPhone,
        guestTokenHash,
        guestTokenExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status,
        paymentStatus,
        currency: "BDT",
        subtotalMinor: quote.subtotalMinor,
        discountMinor,
        shippingMinor: shippingMinorFinal,
        totalMinor,
        couponCode: cartRecord.couponCode,
        couponSnapshot,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail ?? null,
        shippingName: input.shipping?.recipientName ?? null,
        shippingPhone: input.shipping?.recipientPhone ?? null,
        shippingDistrict: input.shipping?.district ?? null,
        shippingArea: input.shipping?.area ?? null,
        shippingAddress: input.shipping?.address ?? null,
        shippingPostcode: input.shipping?.postcode ?? null,
        shippingZone: quote.hasPhysical ? input.shippingZone ?? null : null,
        shippingNote: input.shipping?.note ?? null,
        customerNote: input.customerNote ?? null,
      },
    });

    for (let i = 0; i < purchasable.length; i++) {
      const l = purchasable[i];
      const lineDiscount = lineDiscounts[i] ?? 0;
      const item = await tx.orderItem.create({
        data: {
          orderId: created.id,
          productId: l.productId,
          variantId: l.variantId,
          productSlug: l.slug,
          productTitle: l.title,
          authorDisplay: l.authorDisplay,
          formatType: l.formatType,
          sku: null,
          unitPriceMinor: l.unitPriceMinor,
          quantity: l.quantity,
          lineSubtotalMinor: l.lineSubtotalMinor,
          lineDiscountMinor: lineDiscount,
          lineTotalMinor: Math.max(0, l.lineSubtotalMinor - lineDiscount),
          coverImage: l.coverImage,
          coverPattern: l.coverPattern,
        },
      });

      // Digital asset snapshot for entitlements later.
      if (l.formatType === "digital" || l.formatType === "bundle") {
        const variant = await tx.productVariant.findUnique({ where: { id: l.variantId }, select: { digitalAssetId: true } });
        if (variant?.digitalAssetId) {
          await tx.orderItem.update({ where: { id: item.id }, data: { digitalAssetId: variant.digitalAssetId } });
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          type: "status_change",
          toStatus: status,
          message: "অর্ডার তৈরি হয়েছে",
          actor: userId ? `customer:${session?.email}` : "guest",
        },
      });
    }

    // Coupon redemption (atomic usage limit guard)
    if (cartRecord.couponCode && discountMinor > 0) {
      const coupon = await tx.coupon.findUnique({ where: { code: cartRecord.couponCode } });
      if (coupon) {
        const overLimit = coupon.usageLimit !== null && coupon.usageCount + 1 > coupon.usageLimit;
        if (overLimit) throw new Error("COUPON_LIMIT");
        await tx.coupon.update({ where: { id: coupon.id }, data: { usageCount: { increment: 1 } } });
        await tx.couponRedemption.create({ data: { couponId: coupon.id, orderId: created.id, amountMinor: discountMinor } });
      }
    }

    // Stock commit for COD (order is confirmed immediately).
    if (input.paymentMethod === "cod") {
      await commitStock(tx, purchasable, created.id);
    }

    return created;
    })
  } catch (e) {
    if (e instanceof CouponLimitError) throw e;
    if (e instanceof StockCommitError) {
      return { ok: false, error: "দুঃখিত, কোনো একটি আইটেমের স্টক সদ্যই শেষ হয়ে গেছে। কার্ট আপডেট করে আবার চেষ্টা করুন।", code: "STOCK" };
    }
    if (e instanceof Error && e.message === "COUPON_LIMIT") {
      return { ok: false, error: "কুপনটির ব্যবহারসীমা শেষ।", code: "COUPON" };
    }
    throw e;
  }

  // Clear the cart only after successful creation (lines are snapshotted in the order).
  await db.cartItem.deleteMany({ where: { cartId } });
  await db.cart.update({ where: { id: cartId }, data: { couponCode: null } });

  await notifyOrderPlaced(order.id).catch((e) => console.error("[notify] order placed failed", e));

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    guestToken,
    requiresRedirect: input.paymentMethod === "online",
    paymentId: undefined,
  };
}

export class CouponLimitError extends Error {
  constructor() {
    super("COUPON_LIMIT");
  }
}

/** Atomic stock commit — conditional update prevents overselling under concurrency. */
export async function commitStock(tx: Prisma.TransactionClient, lines: { variantId: string; quantity: number; formatType: string }[], orderId: string) {
  for (const line of lines) {
    if (line.formatType === "digital") continue; // digital has no stock
    const res = await tx.productVariant.updateMany({
      where: { id: line.variantId, formatType: { in: ["physical", "bundle"] }, stockOnHand: { gte: line.quantity } },
      data: { stockOnHand: { decrement: line.quantity } },
    });
    if (res.count === 0) {
      throw new StockCommitError(`স্টক পর্যাপ্ত নয় (variant ${line.variantId})`);
    }
    await tx.inventoryMovement.create({
      data: { variantId: line.variantId, orderId, type: "sale", quantityDelta: -line.quantity, actor: "system", reason: "অর্ডার নিশ্চিত হওয়ায় স্টক কমিট" },
    });
  }
}

export class StockCommitError extends Error {}

/** Restock when an order with committed stock is cancelled/returned. */
export async function restockOrder(orderId: string, actor: string, reason: string) {
  const items = await db.orderItem.findMany({ where: { orderId, formatType: { in: ["physical", "bundle"] }, variantId: { not: null } } });
  for (const item of items) {
    if (!item.variantId) continue;
    await db.$transaction(async (tx) => {
      await tx.productVariant.update({ where: { id: item.variantId! }, data: { stockOnHand: { increment: item.quantity } } });
      await tx.inventoryMovement.create({ data: { variantId: item.variantId!, orderId, type: "restock", quantityDelta: item.quantity, actor, reason } });
    });
  }
}

/** Verify an order is accessible by a customer session or guest capability token. */
export async function authorizeOrderAccess(orderNumber: string, guestToken?: string | null) {
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true, payments: { orderBy: { createdAt: "desc" } }, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return { ok: false as const, error: "not_found" };
  const session = await (await import("@/lib/auth")).getSession();
  if (session && order.userId === session.uid) return { ok: true as const, order };
  if (session?.role === "admin") return { ok: true as const, order };
  if (guestToken && order.guestTokenHash) {
    const hash = sha256(guestToken);
    if (hash === order.guestTokenHash && order.guestTokenExpiresAt && order.guestTokenExpiresAt > new Date()) {
      return { ok: true as const, order };
    }
  }
  return { ok: false as const, error: "forbidden" };
}

/** Safe customer-facing order projection — strips admin notes and token hashes. */
export function publicOrderProjection(order: NonNullable<Awaited<ReturnType<typeof authorizeOrderAccess>>["order"]> | Prisma.OrderGetPayload<{ include: { items: true; payments: true; events: true } }>) {
  const { adminNote: _a, guestTokenHash: _g, ...safe } = order;
  return safe;
}
