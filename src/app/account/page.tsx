import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, getCurrentUser } from "@/lib/auth";
import { formatBdt } from "@/lib/money";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { bnDate, bnNumber } from "@/components/bn-format";

export const metadata: Metadata = {
  title: "আমার অ্যাকাউন্ট",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [user, orders] = await Promise.all([
    getCurrentUser(),
    db.order.findMany({
      where: { userId: session.uid },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="hairline-b pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">আমার অ্যাকাউন্ট</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {user?.name ?? session.name ?? "পাঠক"} · <span className="font-mono">{user?.email ?? session.email}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link href="/library">ডিজিটাল লাইব্রেরি</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-10">
            <Link href="/track">অর্ডার ট্র্যাক</Link>
          </Button>
        </div>
      </header>

      <section aria-labelledby="orders-h" className="mt-8">
        <h2 id="orders-h" className="font-display text-xl font-semibold">অর্ডারসমূহ</h2>

        {orders.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-hairline bg-card px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-sage-soft">
              <ShoppingBag className="size-6 text-sage" aria-hidden />
            </div>
            <p className="mt-4 font-display text-xl font-semibold">এখনো কোনো অর্ডার নেই</p>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              প্রথম অর্ডারটি করে ফেলুন, হার্ড কপি, PDF/ই-বুক বা বান্ডেল, সবই এক জায়গা থেকে।
            </p>
            <Button asChild className="mt-5 h-11">
              <Link href="/shop">বই দেখুন</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-4 space-y-3.5">
            {orders.map((order) => {
              const firstTitle = order.items[0]?.productTitle;
              const more = order.items.length - 1;
              return (
                <li key={order.id} className="rounded-lg border border-hairline bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{bnDate(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-foreground/85">
                      {firstTitle ? (
                        <>
                          <span className="font-medium">{firstTitle}</span>
                          {more > 0 ? <span className="text-muted-foreground"> + আরও {bnNumber(more)}টি বই</span> : null}
                        </>
                      ) : (
                        <span className="text-muted-foreground">{bnNumber(order.items.length)}টি আইটেম</span>
                      )}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="font-display text-lg font-semibold">{formatBdt(order.totalMinor)}</p>
                      <Button asChild variant="outline" size="sm" className="h-10 gap-1.5">
                        <Link href={`/order/${order.orderNumber}`}>
                          বিস্তারিত <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
