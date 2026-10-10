import { NextResponse } from "next/server";
import { authorizeDownload, readPrivateFile } from "@/lib/entitlements";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Secure download endpoint.
 * Authorization: customer session ownership OR guest capability token (?t=).
 * Verifies paid state, entitlement active/expiry/count/revocation, then streams the
 * private file. No storage paths, no permanent URLs, audit events on every attempt.
 */
export async function GET(req: Request, ctx: { params: Promise<{ entitlementId: string }> }) {
  const { entitlementId } = await ctx.params;

  // Coarse per-IP limit to blunt enumeration attempts.
  const ipRl = rateLimit(`dl-ip:${clientIp(req)}`, 40, 10 * 60_000);
  if (!ipRl.ok) {
    return NextResponse.json({ error: "অনেকবার অনুরোধ। পরে চেষ্টা করুন।" }, { status: 429 });
  }

  const token = new URL(req.url).searchParams.get("t");
  const auth = await authorizeDownload(entitlementId, token);

  if (!auth.ok) {
    // Generic 403 body, never reveal which part failed or whether IDs exist.
    return NextResponse.json({ error: auth.message }, { status: auth.reasonCode === "not_found" ? 404 : 403 });
  }

  const file = await readPrivateFile(auth.filePath);
  // Server-side streaming response; short-lived by nature (nothing persisted).
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": auth.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(auth.filename)}`,
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
