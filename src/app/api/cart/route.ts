import { NextResponse } from "next/server";
import { getCartIdFromCookies, quoteCart, addToCart, updateCartItem, removeCartItem, getOrCreateCart } from "@/lib/cart";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const zone = url.searchParams.get("zone");
  const cartId = await getCartIdFromCookies();
  const quote = await quoteCart(cartId, { shippingZone: zone });
  return NextResponse.json({ ok: true, quote });
}

export async function POST(req: Request) {
  const rl = rateLimit(`cart-add:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "অনেক দ্রুত অনুরোধ। একটু পরে চেষ্টা করুন।" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const variantId = typeof body?.variantId === "string" ? body.variantId : null;
  const quantity = Number(body?.quantity ?? 1);
  if (!variantId) return NextResponse.json({ ok: false, error: "ভ্যারিয়েন্ট নির্বাচন করুন।" }, { status: 400 });
  const res = await addToCart(variantId, quantity);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  const { id } = await getOrCreateCart();
  const quote = await quoteCart(id);
  return NextResponse.json({ ok: true, quote });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const itemId = typeof body?.itemId === "string" ? body.itemId : null;
  const quantity = Number(body?.quantity ?? 1);
  if (!itemId) return NextResponse.json({ ok: false, error: "আইটেম আইডি প্রয়োজন।" }, { status: 400 });
  const res = await updateCartItem(itemId, quantity);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  const cartId = await getCartIdFromCookies();
  const quote = await quoteCart(cartId);
  return NextResponse.json({ ok: true, quote });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const itemId = typeof body?.itemId === "string" ? body.itemId : null;
  if (!itemId) return NextResponse.json({ ok: false, error: "আইটেম আইডি প্রয়োজন।" }, { status: 400 });
  const res = await removeCartItem(itemId);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  const cartId = await getCartIdFromCookies();
  const quote = await quoteCart(cartId);
  return NextResponse.json({ ok: true, quote });
}
