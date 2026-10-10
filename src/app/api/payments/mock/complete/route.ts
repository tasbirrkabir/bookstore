import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAndMarkPaid, getPaymentProvider } from "@/lib/payments";
import { randomToken } from "@/lib/tokens";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * DEV-ONLY simulated gateway "checkout completion".
 * This endpoint plays the role of the gateway's server: it builds the payment
 * result payload, signs it with the gateway secret, and submits it to the
 * verification pipeline — exactly what a real gateway's server-to-server
 * verification would do. The verifier still validates signature, amount,
 * currency and order reference, so forged callback requests fail.
 * Guarded: refuses to run in production or when PAYMENT_PROVIDER !== "mock".
 */
export async function POST(req: Request) {
  if (getPaymentProvider() !== "mock") {
    return NextResponse.json({ ok: false, error: "Mock gateway is not enabled." }, { status: 403 });
  }
  const rl = rateLimit(`mock-complete:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
  const outcome = body?.outcome === "success" ? "success" : body?.outcome === "fail" ? "fail" : body?.outcome === "cancel" ? "cancel" : null;
  if (!paymentId || !outcome) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: true } });
  if (!payment || payment.provider !== "mock") {
    return NextResponse.json({ ok: false, error: "পেমেন্ট রেকর্ড পাওয়া যায়নি।" }, { status: 404 });
  }

  const { hmacSign } = await import("@/lib/tokens");
  const secret = process.env.PAYMENT_MERCHANT_KEY ?? "mock-gateway-dev-secret";

  const payload = {
    paymentId: payment.id,
    providerTxnId: `MOCKTXN-${randomToken(6).toUpperCase()}`,
    orderNumber: payment.order.orderNumber,
    amountMinor: payment.order.totalMinor,
    currency: payment.order.currency,
    status: outcome === "success" ? "success" : "failed",
    method: typeof body?.method === "string" && body.method ? body.method : "bkash",
  };
  const canonical = `${payload.paymentId}|${payload.providerTxnId}|${payload.orderNumber}|${payload.amountMinor}|${payload.currency}|${payload.status}`;

  const result = await verifyAndMarkPaid({
    ...payload,
    signature: hmacSign(canonical, secret),
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, code: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderNumber: result.orderNumber, redirectUrl: `/order/${result.orderNumber}` });
}
