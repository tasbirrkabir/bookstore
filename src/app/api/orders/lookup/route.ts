import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Guest order lookup: order number + contact evidence (email OR phone) issues a
 * short-lived signed tracking link. Order number alone is never sufficient.
 * Responses are deliberately identical whether or not the order exists.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`order-lookup:${clientIp(req)}`, 6, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "অনেকবার চেষ্টা হয়েছে। পরে আবার চেষ্টা করুন।" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const orderNumber = typeof body?.orderNumber === "string" ? body.orderNumber.trim().toUpperCase() : "";
  const contact = typeof body?.contact === "string" ? body.contact.trim().toLowerCase() : "";
  if (!orderNumber || !contact) {
    return NextResponse.json({ ok: false, error: "অর্ডার নম্বর ও ইমেইল/মোবাইল, দুটোই দিন।" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { orderNumber } });
  const genericError = { ok: false, error: "এই তথ্যে কোনো অর্ডার মেলেনি। অর্ডার নম্বর ও যোগাযোগের তথ্য যাচাই করুন।" };
  if (!order) return NextResponse.json(genericError, { status: 404 });

  const matchesEmail = !!order.contactEmail && contact === order.contactEmail.toLowerCase();
  const matchesGuestEmail = !!order.guestEmail && contact === order.guestEmail.toLowerCase();
  const matchesPhone = contact === order.contactPhone || contact === order.guestPhone;
  if (!matchesEmail && !matchesGuestEmail && !matchesPhone) {
    return NextResponse.json(genericError, { status: 404 });
  }

  // Issue a fresh short-lived capability token (hashed at rest).
  const token = randomToken(32);
  await db.order.update({
    where: { id: order.id },
    data: {
      guestTokenHash: sha256(token),
      guestTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, redirectUrl: `/order/${order.orderNumber}?t=${encodeURIComponent(token)}` });
}
