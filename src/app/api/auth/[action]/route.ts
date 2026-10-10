import { NextResponse } from "next/server";
import { registerUser, loginUser, issueSessionCookie, clearSessionCookie, AuthError } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;
  const rl = rateLimit(`auth:${action}:${clientIp(req)}`, action === "register" ? 5 : 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ ok: false, error: "অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।" }, { status: 429 });

  if (action === "logout") {
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "সঠিক ইমেইল দিন।" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ ok: false, error: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" }, { status: 400 });

  try {
    if (action === "register") {
      const name = typeof body?.name === "string" ? body.name.trim() : "";
      const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
      if (!name) return NextResponse.json({ ok: false, error: "নাম দিন।" }, { status: 400 });
      const user = await registerUser({ email, password, name, phone });
      await issueSessionCookie(user);
      return NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
    }
    if (action === "login") {
      const user = await loginUser({ email, password });
      await issueSessionCookie(user);
      return NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
    }
    return NextResponse.json({ ok: false, error: "অজানা অনুরোধ।" }, { status: 404 });
  } catch (e) {
    if (e instanceof AuthError) {
      const messages: Record<string, string> = {
        EMAIL_TAKEN: "এই ইমেইল দিয়ে অ্যাকাউন্ট আছে। লগইন করুন।",
        BAD_CREDENTIALS: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।",
      };
      return NextResponse.json({ ok: false, error: messages[e.message] ?? "সমস্যা হয়েছে।" }, { status: e.status });
    }
    throw e;
  }
}
