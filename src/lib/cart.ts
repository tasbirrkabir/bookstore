import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/tokens";
import { getSettings, shippingFeeFor } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupon";
import { clampQty } from "@/lib/money";
import type { FormatType } from "@/lib/catalog";

export const CART_COOKIE = "pata_cart";

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  titleEn: string | null;
  authorDisplay: string;
  coverImage: string | null;
  coverPattern: string;
  formatType: FormatType;
  unitPriceMinor: number;
  compareAtPriceMinor: number | null;
  quantity: number;
  lineSubtotalMinor: number;
  inStock: boolean;
  stockOnHand: number | null;
  hasIssue: string | null; // "unavailable" | "out_of_stock" | "qty_over_stock"
};

export type CartQuote = {
  lines: CartLine[];
  subtotalMinor: number;
  discountMinor: number;
  couponCode: string | null;
  couponMessage: string | null;
  couponError: string | null;
  hasPhysical: boolean;
  hasDigital: boolean;
  allPhysicalAvailable: boolean;
  codEligible: boolean;
  requiresOnlinePayment: boolean;
  shippingEstimateMinor: number | null; // null when zone unknown
  shippingZones: { id: string; label: string; feeMinor: number; estimate: string }[];
  totalMinorWithShippingEstimate: number | null;
  itemCount: number;
};

/** Get cart id from cookie (read-only safe for RSC). */
export async function getCartIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** Get or create the cart + cookie. Only call in route handlers / server actions. */
export async function getOrCreateCart(): Promise<{ id: string; created: boolean }> {
  const store = await cookies();
  const existing = store.get(CART_COOKIE)?.value;
  if (existing) {
    const cart = await db.cart.findUnique({ where: { id: existing } });
    if (cart) return { id: cart.id, created: false };
  }
  const created = await db.cart.create({ data: {} });
  store.set(CART_COOKIE, created.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  return { id: created.id, created: true };
}

/** Build live cart lines from DB, prices/stock always fresh from the database. */
export async function getCartLines(cartId: string | null): Promise<CartLine[]> {
  if (!cartId) return [];
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!cart) return [];
  const lines: CartLine[] = [];
  for (const item of cart.items) {
    const v = item.variant;
    if (!v || !v.isActive || v.product.status !== "published") {
      lines.push({
        id: item.id,
        variantId: item.variantId,
        productId: v?.product?.id ?? "",
        slug: v?.product?.slug ?? "",
        title: v?.product?.title ?? "অপ্রাপ্য পণ্য",
        titleEn: v?.product?.titleEn ?? null,
        authorDisplay: v?.product?.authorDisplay ?? "",
        coverImage: v?.product?.coverImage ?? null,
        coverPattern: v?.product?.coverPattern ?? "oxblood",
        formatType: (v?.formatType ?? "physical") as FormatType,
        unitPriceMinor: v?.priceMinor ?? 0,
        compareAtPriceMinor: v?.compareAtPriceMinor ?? null,
        quantity: item.quantity,
        lineSubtotalMinor: (v?.priceMinor ?? 0) * item.quantity,
        inStock: false,
        stockOnHand: v?.stockOnHand ?? null,
        hasIssue: "unavailable",
      });
      continue;
    }
    const isDigital = v.formatType === "digital";
    const stock = isDigital ? null : v.stockOnHand ?? 0;
    let issue: CartLine["hasIssue"] = null;
    if (!isDigital && stock !== null && stock <= 0) issue = "out_of_stock";
    else if (!isDigital && stock !== null && item.quantity > stock) issue = "qty_over_stock";
    lines.push({
      id: item.id,
      variantId: v.id,
      productId: v.product.id,
      slug: v.product.slug,
      title: v.product.title,
      titleEn: v.product.titleEn,
      authorDisplay: v.product.authorDisplay,
      coverImage: v.product.coverImage,
      coverPattern: v.product.coverPattern,
      formatType: v.formatType as FormatType,
      unitPriceMinor: v.priceMinor,
      compareAtPriceMinor: v.compareAtPriceMinor,
      quantity: item.quantity,
      lineSubtotalMinor: v.priceMinor * item.quantity,
      inStock: issue === null,
      stockOnHand: stock,
      hasIssue: issue,
    });
  }
  return lines;
}

/**
 * Server-side cart quote. The browser can NEVER set totals, everything here is
 * recomputed from the database (prices, stock, coupon, shipping).
 */
export async function quoteCart(cartId: string | null, opts?: { shippingZone?: string | null }): Promise<CartQuote> {
  const lines = await getCartLines(cartId);
  const settings = await getSettings();

  const purchasable = lines.filter((l) => l.hasIssue === null);
  const subtotalMinor = purchasable.reduce((s, l) => s + l.lineSubtotalMinor, 0);
  const hasPhysical = lines.some((l) => l.formatType === "physical" || l.formatType === "bundle");
  const hasDigital = lines.some((l) => l.formatType === "digital");
  const formats = [...new Set(lines.map((l) => l.formatType))];
  const allPhysicalAvailable = lines.filter((l) => l.formatType !== "digital").every((l) => l.hasIssue === null);

  const cart = cartId ? await db.cart.findUnique({ where: { id: cartId } }) : null;
  let discountMinor = 0;
  let couponMessage: string | null = null;
  let couponError: string | null = null;
  if (cart?.couponCode && subtotalMinor > 0) {
    const res = await validateCoupon(cart.couponCode, subtotalMinor, formats);
    if (res.ok) {
      discountMinor = res.discountMinor;
      couponMessage = res.message;
    } else {
      couponError = res.reason;
    }
  }

  const zones = [
    { id: "inside_dhaka", label: "ঢাকার ভিতরে", feeMinor: settings.shippingInsideDhaka, estimate: settings.deliveryEstimateInside },
    { id: "outside_dhaka", label: "ঢাকার বাইরে", feeMinor: settings.shippingOutsideDhaka, estimate: settings.deliveryEstimateOutside },
  ];
  const shippingEstimateMinor = hasPhysical && opts?.shippingZone ? shippingFeeFor(opts.shippingZone, settings) : null;

  let shippingMinor = 0;
  if (hasPhysical && shippingEstimateMinor !== null) {
    shippingMinor = shippingEstimateMinor;
    if (settings.freeShippingThreshold && subtotalMinor - discountMinor >= settings.freeShippingThreshold) {
      shippingMinor = 0;
    }
  }

  const codEligible =
    settings.codEnabled &&
    hasPhysical &&
    !hasDigital &&
    lines.length > 0 &&
    allPhysicalAvailable;

  return {
    lines,
    subtotalMinor,
    discountMinor,
    couponCode: cart?.couponCode ?? null,
    couponMessage,
    couponError,
    hasPhysical,
    hasDigital,
    allPhysicalAvailable,
    codEligible,
    requiresOnlinePayment: hasDigital || (!hasPhysical && lines.length > 0),
    shippingEstimateMinor,
    shippingZones: hasPhysical ? [...zones] : [],
    totalMinorWithShippingEstimate: shippingEstimateMinor !== null ? Math.max(0, subtotalMinor - discountMinor) + shippingMinor : subtotalMinor - discountMinor,
    itemCount: lines.reduce((s, l) => s + l.quantity, 0),
  };
}

export async function addToCart(variantId: string, quantity: number): Promise<{ ok: boolean; error?: string }> {
  const qty = clampQty(quantity);
  const variant = await db.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || !variant.isActive || variant.product.status !== "published") {
    return { ok: false, error: "এই ফরম্যাটটি বর্তমানে কেনা যাচ্ছে না।" };
  }
  if (variant.formatType !== "digital") {
    const stock = variant.stockOnHand ?? 0;
    if (stock <= 0) return { ok: false, error: "দুঃখিত, স্টক শেষ।" };
  } else if (!variant.digitalAssetId || !variant.rightsConfirmedAt) {
    return { ok: false, error: "ডিজিটাল ফাইলটি এখনও প্রকাশযোগ্য নয়।" };
  }
  const { id } = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({ where: { cartId_variantId: { cartId: id, variantId } } });
  if (existing) {
    if (variant.formatType === "digital") {
      return { ok: true }; // digital already in cart, idempotent add
    }
    const maxQty = variant.stockOnHand ?? 0;
    const nextQty = Math.min(existing.quantity + qty, maxQty, 99);
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } });
  } else {
    const qtyFinal = variant.formatType === "digital" ? 1 : Math.min(qty, variant.stockOnHand ?? 0, 99);
    if (variant.formatType !== "digital" && qtyFinal < 1) return { ok: false, error: "দুঃখিত, স্টক শেষ।" };
    await db.cartItem.create({ data: { cartId: id, variantId, quantity: qtyFinal } });
  }
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number): Promise<{ ok: boolean; error?: string }> {
  const item = await db.cartItem.findUnique({ where: { id: itemId }, include: { variant: true } });
  if (!item) return { ok: false, error: "কার্ট আইটেম পাওয়া যায়নি।" };
  const cartId = (await getCartIdFromCookies()) ?? "";
  if (item.cartId !== cartId) return { ok: false, error: "অনুমতি নেই।" };
  const qty = clampQty(quantity);
  if (qty <= 0) {
    await db.cartItem.delete({ where: { id: itemId } });
    return { ok: true };
  }
  if (item.variant.formatType !== "digital") {
    const stock = item.variant.stockOnHand ?? 0;
    if (qty > stock) return { ok: false, error: `স্টকে মাত্র ${stock}টি আছে।` };
  } else if (qty > 1) {
    return { ok: false, error: "ডিজিটাল আইটেমের পরিমাণ ১-এর বেশি হয় না।" };
  }
  await db.cartItem.update({ where: { id: itemId }, data: { quantity: qty } });
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<{ ok: boolean; error?: string }> {
  const item = await db.cartItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: true };
  const cartId = (await getCartIdFromCookies()) ?? "";
  if (item.cartId !== cartId) return { ok: false, error: "অনুমতি নেই।" };
  await db.cartItem.delete({ where: { id: itemId } });
  return { ok: true };
}

export async function setCartCoupon(code: string | null): Promise<{ ok: boolean; error?: string }> {
  const { id } = await getOrCreateCart();
  if (!code) {
    await db.cart.update({ where: { id }, data: { couponCode: null } });
    return { ok: true };
  }
  const lines = await getCartLines(id);
  const formats = [...new Set(lines.map((l) => l.formatType))];
  const subtotal = lines.filter((l) => l.hasIssue === null).reduce((s, l) => s + l.lineSubtotalMinor, 0);
  const res = await validateCoupon(code, subtotal, formats);
  if (!res.ok) return { ok: false, error: res.reason };
  await db.cart.update({ where: { id }, data: { couponCode: res.coupon.code } });
  return { ok: true };
}
