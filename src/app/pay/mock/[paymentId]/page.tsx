import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { PayMockClient } from "./pay-mock-client";

export const metadata: Metadata = {
  title: "সিমুলেটেড পেমেন্ট গেটওয়ে (ডেমো)",
  robots: { index: false, follow: false },
};

/**
 * DEV-ONLY simulated gateway page. Renders a clearly-marked, visually distinct
 * panel so nobody mistakes it for real commerce. Loads the payment attempt and
 * its order; anything that is not a mock payment is a 404.
 */
export default async function PayMockPage({ params }: { params: Promise<{ paymentId: string }> }) {
  const { paymentId } = await params;
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });
  if (!payment || payment.provider !== "mock") notFound();

  const settings = await getSettings();

  return (
    <PayMockClient
      paymentId={payment.id}
      paymentStatus={payment.status}
      orderNumber={payment.order.orderNumber}
      amountMinor={payment.order.totalMinor}
      currency={payment.order.currency}
      merchantName={settings.storeName}
    />
  );
}
