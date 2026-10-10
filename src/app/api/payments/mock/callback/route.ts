import { NextResponse } from "next/server";
import { verifyAndMarkPaid } from "@/lib/payments";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Mock gateway → server callback. Simulates what a real gateway's server-to-server
 * verification endpoint does. The payload must carry an HMAC signature computed with
 * the gateway secret; a forged browser request without the signature is rejected.
 * DEV/TEST ONLY — the mock provider refuses to run in production.
 */
export async function POST(req: Request) {
  const rl = rateLimit(`mock-callback:${clientIp(req)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const result = await verifyAndMarkPaid({
    paymentId: String(body.paymentId ?? ""),
    providerTxnId: String(body.providerTxnId ?? ""),
    orderNumber: String(body.orderNumber ?? ""),
    amountMinor: Number(body.amountMinor ?? -1),
    currency: String(body.currency ?? ""),
    status: String(body.status ?? ""),
    signature: String(body.signature ?? ""),
    method: typeof body.method === "string" ? body.method : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, code: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderNumber: result.orderNumber });
}
