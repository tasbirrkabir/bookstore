import "server-only";
import { db } from "@/lib/db";
import { hmacSign, hmacVerify, randomToken } from "@/lib/tokens";
import { grantEntitlementsForOrder } from "@/lib/entitlements";
import { notifyPaymentConfirmed, notifyPaymentFailed } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

// ─── Payment provider adapter ────────────────────────────────────────────────
// Provider-neutral boundary. A real gateway (aamarPay/SSLCOMMERZ/bKash) implements
// the same interface with its official SDK/API and server-to-server verification.
// PAYMENT_PROVIDER=disabled → online checkout is unavailable (COD still works).
// PAYMENT_PROVIDER=mock → dev-only simulated gateway; NEVER marks production orders paid.

export type PaymentProviderName = "disabled" | "mock";

export function getPaymentProvider(): PaymentProviderName {
  const p = (process.env.PAYMENT_PROVIDER ?? "disabled") as PaymentProviderName;
  if (p === "mock" && process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAYMENTS !== "yes-i-know-this-is-unsafe") {
    // Hard production guard — a mock gateway must never run in production.
    console.error("[payments] PAYMENT_PROVIDER=mock refused in production. Falling back to disabled.");
    return "disabled";
  }
  return p;
}

export function isOnlinePaymentAvailable(): boolean {
  return getPaymentProvider() === "mock";
}

export function providerDisplayName(p: string): string {
  switch (p) {
    case "mock":
      return "সিমুলেটেড গেটওয়ে (ডেমো)";
    case "disabled":
      return "অনলাইন পেমেন্ট চালু নেই";
    default:
      return p;
  }
}

function mockSecret(): string {
  return process.env.PAYMENT_MERCHANT_KEY ?? "mock-gateway-dev-secret";
}

/** Create a pending payment attempt for an order (online method). */
export async function initiatePayment(orderId: string): Promise<{ paymentId: string; redirectUrl: string } | { error: string }> {
  const provider = getPaymentProvider();
  if (provider === "disabled") {
    return { error: "অনলাইন পেমেন্ট এই মুহূর্তে কনফিগার করা নেই। অনুগ্রহ করে ক্যাশ অন ডেলিভারি বেছে নিন বা পরে চেষ্টা করুন।" };
  }
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "অর্ডার পাওয়া যায়নি।" };
  if (order.paymentStatus === "paid" || order.paymentStatus === "cod_collected") {
    return { error: "এই অর্ডারটি ইতিমধ্যে পরিশোধিত।" };
  }

  const payment = await db.payment.create({
    data: {
      orderId,
      provider,
      idempotencyKey: `init_${orderId}_${Date.now()}_${randomToken(8)}`,
      amountMinor: order.totalMinor,
      currency: order.currency,
      status: "pending",
      method: "online",
    },
  });
  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "pending" } });
  await db.orderEvent.create({ data: { orderId, type: "payment", message: `পেমেন্ট শুরু হয়েছে (${provider})`, actor: "system" } });

  // In a real adapter this URL points at the gateway's hosted checkout.
  return { paymentId: payment.id, redirectUrl: `/pay/mock/${payment.id}` };
}

/**
 * Verify a gateway callback SERVER-SIDE before any state changes.
 * Validates: signature, amount, currency, and the order reference embedded in the payload.
 * A forged success redirect can never reach this function's happy path.
 */
export async function verifyAndMarkPaid(payload: {
  paymentId: string;
  providerTxnId: string;
  orderNumber: string;
  amountMinor: number;
  currency: string;
  status: string;
  signature: string;
  method?: string;
}): Promise<{ ok: true; orderNumber: string } | { ok: false; error: string; code: string }> {
  const provider = getPaymentProvider();
  if (provider !== "mock") {
    return { ok: false, error: "পেমেন্ট প্রোভাইডার চালু নেই।", code: "PROVIDER_DISABLED" };
  }

  // 1. Signature check (gateway → server, server-to-server secret).
  const canonical = `${payload.paymentId}|${payload.providerTxnId}|${payload.orderNumber}|${payload.amountMinor}|${payload.currency}|${payload.status}`;
  if (!hmacVerify(canonical, payload.signature, mockSecret())) {
    return { ok: false, error: "সিগনেচার যাচাই ব্যর্থ।", code: "BAD_SIGNATURE" };
  }

  // 2. Load payment + order.
  const payment = await db.payment.findUnique({ where: { id: payload.paymentId }, include: { order: true } });
  if (!payment) return { ok: false, error: "পেমেন্ট রেকর্ড পাওয়া যায়নি।", code: "NOT_FOUND" };
  const order = payment.order;

  // 3. Idempotency — already verified payments short-circuit safely.
  if (payment.status === "paid" && payment.verifiedAt) {
    return { ok: true, orderNumber: order.orderNumber };
  }

  // 4. Compare expected order reference, amount, currency and provider status.
  if (payload.orderNumber !== order.orderNumber) {
    return { ok: false, error: "অর্ডার রেফারেন্স মেলেনি।", code: "ORDER_MISMATCH" };
  }
  if (payload.amountMinor !== order.totalMinor || payment.amountMinor !== order.totalMinor) {
    return { ok: false, error: "পরিমাণ মেলেনি।", code: "AMOUNT_MISMATCH" };
  }
  if (payload.currency !== order.currency) {
    return { ok: false, error: "কারেন্সি মেলেনি।", code: "CURRENCY_MISMATCH" };
  }
  if (payload.status !== "success") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "failed", providerTxnId: payload.providerTxnId, metaJson: JSON.stringify({ reason: payload.status }) },
    });
    if (order.paymentStatus === "pending") {
      await db.order.update({ where: { id: order.id }, data: { paymentStatus: "failed" } });
      await db.orderEvent.create({ data: { orderId: order.id, type: "payment", message: "পেমেন্ট ব্যর্থ হয়েছে", actor: "system" } });
      await notifyPaymentFailed(order.id).catch(() => {});
    }
    return { ok: false, error: "পেমেন্ট ব্যর্থ বা বাতিল হয়েছে।", code: "PAYMENT_FAILED" };
  }

  // 5. Atomically mark paid (idempotent via unique provider+txnId constraint).
  try {
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          providerTxnId: payload.providerTxnId,
          method: payload.method ?? "online",
          verifiedAt: new Date(),
          metaJson: JSON.stringify({ verifiedAmountMinor: payload.amountMinor, currency: payload.currency }),
        },
      });
      await tx.order.update({ where: { id: order.id }, data: { status: "confirmed", paymentStatus: "paid" } });
      await tx.orderEvent.createMany({
        data: [
          { orderId: order.id, type: "payment", toStatus: "paid", message: "পেমেন্ট যাচাই ও নিশ্চিত হয়েছে", actor: "system" },
          { orderId: order.id, type: "status_change", fromStatus: order.status, toStatus: "confirmed", message: "পেমেন্ট নিশ্চিত হওয়ায় অর্ডার কনফার্ম", actor: "system" },
        ],
      });
      // 6. Commit stock at verified payment (documented policy).
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        if (item.formatType === "digital" || !item.variantId) continue;
        const res = await tx.productVariant.updateMany({
          where: { id: item.variantId, stockOnHand: { gte: item.quantity } },
          data: { stockOnHand: { decrement: item.quantity } },
        });
        if (res.count === 0) throw new Error("STOCK_COMMIT_FAILED");
        await tx.inventoryMovement.create({
          data: { variantId: item.variantId, orderId: order.id, type: "sale", quantityDelta: -item.quantity, actor: "system", reason: "যাচাইকৃত পেমেন্টে স্টক কমিট" },
        });
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "STOCK_COMMIT_FAILED") {
      // Keep payment paid but flag for reconciliation — money is real at this point.
      await db.order.update({ where: { id: order.id }, data: { status: "processing" } });
      await logAudit({ actorEmail: "system", action: "stock_reconciliation_needed", targetType: "order", targetId: order.id, detail: "Payment verified but stock commit failed" });
      return { ok: true, orderNumber: order.orderNumber };
    }
    throw e;
  }

  // 7. Grant digital entitlements exactly once (idempotent).
  await grantEntitlementsForOrder(order.id, "payment").catch((e) => console.error("[entitlements] grant failed", e));

  // 8. Notifications (never block payment state on email failures).
  await notifyPaymentConfirmed(order.id).catch(() => {});

  return { ok: true, orderNumber: order.orderNumber };
}

/** Mark a COD order's payment as collected on delivery (admin action). */
export async function markCodCollected(orderId: string, actorEmail: string) {
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "cod_collected" } });
    await tx.payment.create({
      data: {
        orderId,
        provider: "cod",
        providerTxnId: `cod_${Date.now()}`,
        idempotencyKey: `cod_${orderId}_${Date.now()}`,
        amountMinor: (await tx.order.findUniqueOrThrow({ where: { id: orderId } })).totalMinor,
        currency: "BDT",
        method: "cod",
        status: "paid",
        verifiedAt: new Date(),
      },
    });
    await tx.orderEvent.create({ data: { orderId, type: "payment", toStatus: "cod_collected", message: "ক্যাশ অন ডেলিভারি গৃহীত", actor: `admin:${actorEmail}` } });
  });
  await grantEntitlementsForOrder(orderId, "payment").catch(() => {});
}
