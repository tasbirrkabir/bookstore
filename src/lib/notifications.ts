import "server-only";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatBdt } from "@/lib/money";

// Transactional email is written to a durable outbox. With no provider configured,
// messages are stored with status `skipped_no_provider` so the admin can see exactly
// what would have been sent, the system never pretends email was delivered.

export function isEmailConfigured(): boolean {
  return !!(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}

async function enqueue(kind: string, toEmail: string, toName: string | null, subject: string, body: string, orderId?: string) {
  const configured = isEmailConfigured();
  await db.notificationOutbox.create({
    data: {
      orderId,
      kind,
      toEmail,
      toName,
      subject,
      body,
      status: configured ? "pending" : "skipped_no_provider",
      statusDetail: configured ? null : "ইমেইল প্রোভাইডার কনফিগার করা নেই (EMAIL_PROVIDER_API_KEY / EMAIL_FROM_ADDRESS অনুপস্থিত)।",
    },
  });
  // Real provider send would happen here (Resend/SendGrid adapter) with retry logic.
  // Intentionally not implemented until credentials exist, disclosed in setup docs.
}

export async function notifyOrderPlaced(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || !order.contactEmail) return;
  const s = await getSettings();
  const lines = order.items.map((i) => `• ${i.productTitle} (${i.formatType === "physical" ? "হার্ড কপি" : i.formatType === "digital" ? "PDF" : "বান্ডেল"}) × ${i.quantity}, ${formatBdt(i.lineTotalMinor)}`).join("\n");
  await enqueue(
    "order_placed",
    order.contactEmail,
    order.contactName,
    `${s.storeName}, আপনার অর্ডার ${order.orderNumber} গৃহীত হয়েছে`,
    `প্রিয় ${order.contactName},\n\nআপনার অর্ডার গৃহীত হয়েছে।\n\nঅর্ডার নম্বর: ${order.orderNumber}\n\n${lines}\n\nমোট: ${formatBdt(order.totalMinor)}\nপেমেন্ট: ${order.paymentStatus === "cod_due" ? "ক্যাশ অন ডেলিভারি" : "অনলাইন"}\n\nঅর্ডার স্ট্যাটাস দেখুন: /order/${order.orderNumber}\n\nধন্যবাদ,\n${s.storeName}`,
    orderId
  );
}

export async function notifyPaymentConfirmed(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || !order.contactEmail) return;
  const s = await getSettings();
  const hasDigital = order.items.some((i) => i.digitalAssetId);
  await enqueue(
    "payment_confirmed",
    order.contactEmail,
    order.contactName,
    `${s.storeName}, পেমেন্ট নিশ্চিত হয়েছে (${order.orderNumber})`,
    `প্রিয় ${order.contactName},\n\nআপনার পেমেন্ট যাচাই ও নিশ্চিত হয়েছে।\nঅর্ডার: ${order.orderNumber}\nমোট: ${formatBdt(order.totalMinor)}${hasDigital ? "\n\nআপনার ডিজিটাল বই এখন ডাউনলোড করার জন্য প্রস্তুত, অর্ডার পেজ থেকে ডাউনলোড করুন।" : ""}\n\nধন্যবাদ,\n${s.storeName}`,
    orderId
  );
  if (hasDigital) {
    await enqueue(
      "digital_ready",
      order.contactEmail,
      order.contactName,
      `${s.storeName}, ডিজিটাল বই ডাউনলোডের জন্য প্রস্তুত`,
      `প্রিয় ${order.contactName},\n\nপেমেন্ট যাচাই সম্পন্ন হয়েছে। অর্ডার পেজ (/order/${order.orderNumber}) থেকে আপনার PDF ডাউনলোড করুন।\n\nনিরাপত্তা নোট: ডাউনলোড লিঙ্ক সাময়িক ও সীমিত, ফাইলের স্থায়ী লিঙ্ক কখনও শেয়ার করা হয় না।\n\n${s.storeName}`,
      orderId
    );
  }
}

export async function notifyPaymentFailed(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || !order.contactEmail) return;
  const s = await getSettings();
  await enqueue(
    "payment_failed",
    order.contactEmail,
    order.contactName,
    `${s.storeName}, পেমেন্ট সফল হয়নি (${order.orderNumber})`,
    `প্রিয় ${order.contactName},\n\nদুঃখিত, আপনার পেমেন্ট সফল হয়নি। চাইলে অর্ডার পেজ থেকে আবার চেষ্টা করতে পারেন।\n\n${s.storeName}`,
    orderId
  );
}

export async function notifyOrderShipped(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || !order.contactEmail) return;
  const s = await getSettings();
  await enqueue(
    "shipped",
    order.contactEmail,
    order.contactName,
    `${s.storeName}, অর্ডার পাঠানো হয়েছে (${order.orderNumber})`,
    `প্রিয় ${order.contactName},\n\nআপনার অর্ডার কুরিয়ারে পাঠানো হয়েছে।${order.trackingId ? `\nট্র্যাকিং আইডি: ${order.trackingId}` : ""}\n\n${s.storeName}`,
    orderId
  );
}

export async function adminLowStockAlert(variantTitle: string, stock: number) {
  const s = await getSettings();
  await enqueue("admin_alert", s.supportEmail, null, `${s.storeName}, কম স্টক সতর্কতা: ${variantTitle}`, `"${variantTitle}" বইয়ের স্টক এখন ${stock}টি। দ্রুত রিস্টক করুন।`);
}
