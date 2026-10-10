import { NextResponse } from "next/server";
import { setCartCoupon } from "@/lib/cart";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = rateLimit(`coupon:${clientIp(req)}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "অনেকবার চেষ্টা হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" && body.code.trim() ? body.code.trim() : null;
  const res = await setCartCoupon(code);
  if (!res.ok) return NextResponse.json(res, { status: 400 });
  return NextResponse.json({ ok: true });
}
