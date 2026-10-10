import { NextResponse } from "next/server";
import { createOrderFromCart } from "@/lib/orders";
import { initiatePayment } from "@/lib/payments";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const PHONE_RE = /^01[3-9]\d{8}$/; // BD mobile numbers

export async function POST(req: Request) {
  // Rate limit checkout attempts per IP.
  const rl = rateLimit(`checkout:${clientIp(req)}`, 8, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার চেষ্টা করুন।" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "অনুরোধ সঠিক নয়।" }, { status: 400 });
  }

  // Server-side validation of every field. Nothing from the browser is trusted
  // except validated contact/address strings and the chosen payment method.
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.replace(/[\s-]/g, "") : "";
  const contactEmail = typeof body.contactEmail === "string" && body.contactEmail.trim() ? body.contactEmail.trim().toLowerCase() : null;
  const paymentMethod = body.paymentMethod === "cod" ? "cod" : body.paymentMethod === "online" ? "online" : null;
  const shippingZone = body.shippingZone === "inside_dhaka" || body.shippingZone === "outside_dhaka" ? body.shippingZone : null;
  const customerNote = typeof body.customerNote === "string" ? body.customerNote.trim().slice(0, 500) : null;

  if (contactName.length < 3) return NextResponse.json({ ok: false, error: "পুরো নাম লিখুন (কমপক্ষে ৩ অক্ষর)।" }, { status: 400 });
  if (!PHONE_RE.test(contactPhone)) return NextResponse.json({ ok: false, error: "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)।" }, { status: 400 });
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail)) {
    return NextResponse.json({ ok: false, error: "সঠিক ইমেইল দিন।" }, { status: 400 });
  }
  if (!paymentMethod) return NextResponse.json({ ok: false, error: "পেমেন্ট পদ্ধতি নির্বাচন করুন।" }, { status: 400 });

  let shipping: Parameters<typeof createOrderFromCart>[0]["shipping"] = null;
  if (body.shipping && typeof body.shipping === "object") {
    const s = body.shipping;
    const district = typeof s.district === "string" ? s.district.trim() : "";
    const area = typeof s.area === "string" ? s.area.trim() : "";
    const address = typeof s.address === "string" ? s.address.trim() : "";
    const recipientName = typeof s.recipientName === "string" ? s.recipientName.trim() : contactName;
    const recipientPhone = typeof s.recipientPhone === "string" ? s.recipientPhone.replace(/[\s-]/g, "") : contactPhone;
    const postcode = typeof s.postcode === "string" ? s.postcode.trim().slice(0, 10) : null;
    const note = typeof s.note === "string" ? s.note.trim().slice(0, 300) : null;
    if (!district || !area || address.length < 10) {
      return NextResponse.json({ ok: false, error: "জেলা, এলাকা ও বিস্তারিত ঠিকানা পূরণ করুন।" }, { status: 400 });
    }
    if (!PHONE_RE.test(recipientPhone)) return NextResponse.json({ ok: false, error: "প্রাপকের সঠিক মোবাইল নম্বর দিন।" }, { status: 400 });
    shipping = { recipientName, recipientPhone, district, area, address, postcode, note };
  }

  // Consent is required by the UI; enforce server-side too.
  if (body.consent !== true) {
    return NextResponse.json({ ok: false, error: "শর্তাবলি ও রিটার্ন নীতিতে সম্মতি প্রয়োজন।" }, { status: 400 });
  }

  let result;
  try {
    result = await createOrderFromCart({
      contactName,
      contactPhone,
      contactEmail,
      paymentMethod,
      shippingZone,
      shipping,
      customerNote,
    });
  } catch (e) {
    console.error("[checkout] order creation failed", e);
    return NextResponse.json({ ok: false, error: "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।" }, { status: 500 });
  }

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, code: result.code }, { status: 409 });
  }

  // For online payment, create the provider transaction now.
  if (paymentMethod === "online") {
    const pay = await initiatePayment(result.orderId);
    if ("error" in pay) {
      // Order stays pending_payment; customer can retry payment from the order page.
      return NextResponse.json({ ok: true, orderNumber: result.orderNumber, guestToken: result.guestToken, paymentError: pay.error, redirectUrl: null }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      orderNumber: result.orderNumber,
      guestToken: result.guestToken,
      redirectUrl: pay.redirectUrl,
      paymentId: pay.paymentId,
    });
  }

  return NextResponse.json({ ok: true, orderNumber: result.orderNumber, guestToken: result.guestToken, redirectUrl: null });
}
