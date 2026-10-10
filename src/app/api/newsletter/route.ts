import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
});

/** Home page newsletter signup. Stores the email, idempotent on duplicates. */
export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "অনুরোধটি পড়া যায়নি।" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "সঠিক ইমেইল ঠিকানা লিখুন।" }, { status: 400 });
  }

  try {
    await db.newsletterSignup.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });
  } catch {
    return NextResponse.json({ error: "এই মুহূর্তে সাবস্ক্রিপশন নেওয়া যাচ্ছে না, একটু পরে চেষ্টা করুন।" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
