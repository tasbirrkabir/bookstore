import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { quoteCart, getCartIdFromCookies } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { getSession, getCurrentUser } from "@/lib/auth";
import { isOnlinePaymentAvailable } from "@/lib/payments";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "চেকআউট",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const cartId = await getCartIdFromCookies();
  const quote = await quoteCart(cartId);
  if (quote.lines.length === 0) redirect("/cart");

  const [settings, session] = await Promise.all([getSettings(), getSession()]);
  const user = session ? await getCurrentUser() : null;

  return (
    <CheckoutForm
      quote={quote}
      paymentOnlineAvailable={isOnlinePaymentAvailable()}
      freeShippingThresholdMinor={settings.freeShippingThreshold ?? null}
      deliveryEstimates={{
        inside: settings.deliveryEstimateInside,
        outside: settings.deliveryEstimateOutside,
      }}
      supportEmail={settings.supportEmail}
      user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
    />
  );
}
