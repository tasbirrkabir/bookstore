import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { authorizeOrderAccess, publicOrderProjection } from "@/lib/orders";
import { getSettings } from "@/lib/settings";
import { formatBdt } from "@/lib/money";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, FORMAT_LABELS } from "@/lib/order-ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/status-badges";
import { BookCover } from "@/components/book-cover";
import { ToastHost } from "@/components/toast-host";
import { bnDate, bnDateTime, actorLabel, bnNumber } from "@/components/bn-format";
import { CopyOrderLink } from "./copy-link";
import { OrderLockedState } from "./locked-state";

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params;
  return {
    title: `অর্ডার ${orderNumber}`,
    robots: { index: false, follow: false },
  };
}

type EntRow = {
  id: string;
  orderItemId: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: Date | null;
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const token = typeof sp.t === "string" ? sp.t : null;

  const result = await authorizeOrderAccess(orderNumber, token);
  if (!result.ok) {
    if (result.error === "not_found") notFound();
    return <OrderLockedState orderNumber={orderNumber} />;
  }

  const order = publicOrderProjection(result.order);
  const settings = await getSettings();

  // Digital download entitlements for this order's items.
  const itemIds = order.items.map((i) => i.id);
  const entitlementRows: EntRow[] = itemIds.length
    ? await db.downloadEntitlement.findMany({
        where: { orderItemId: { in: itemIds } },
        select: { id: true, orderItemId: true, status: true, downloadCount: true, maxDownloads: true, expiresAt: true },
      })
    : [];
  const entByItem = new Map(entitlementRows.map((e) => [e.orderItemId, e]));

  const paid = order.paymentStatus === "paid" || order.paymentStatus === "cod_collected";
  const now = Date.now();
  const needsPayment =
    order.status === "pending_payment" &&
    (order.paymentStatus === "unpaid" || order.paymentStatus === "pending" || order.paymentStatus === "failed");
  const mockAttempt = order.payments.find((p) => p.provider === "mock" && (p.status === "pending" || p.status === "failed")) ?? null;
  const hasShipping = !!(order.shippingName || order.shippingDistrict || order.shippingAddress);

  const orderUrlPath = `/order/${order.orderNumber}${token ? `?t=${encodeURIComponent(token)}` : ""}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <ToastHost />

      {token ? (
        <div role="status" className="mb-6 rounded-md border border-hairline bg-sage-soft/70 px-4 py-3 text-sm leading-6 text-accent-foreground">
          <span className="font-semibold">এই লিঙ্কটি সংরক্ষণ করুন, অর্ডার দেখতে এটি প্রয়োজন হবে।</span>{" "}
          ইমেইল/মোবাইল দিয়ে <a href="/track" className="font-medium underline underline-offset-4">/track</a> থেকেও নতুন লিঙ্ক নেওয়া যাবে।
        </div>
      ) : null}

      {/* ── Header ── */}
      <header className="hairline-b pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">অর্ডার নম্বর</p>
            <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-muted-foreground">স্থাপিত: {bnDateTime(order.createdAt)}</p>
          </div>
          <CopyOrderLink path={orderUrlPath} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </header>

      {/* ── Payment pending block ── */}
      {needsPayment ? (
        <section aria-labelledby="pay-pending" className="mt-6 rounded-lg border border-warning/50 bg-warning/5 p-4 sm:p-5">
          <h2 id="pay-pending" className="font-display text-lg font-semibold text-warning-foreground">
            পেমেন্ট সম্পন্ন করুন
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-foreground/85">
            অর্ডারটি নিশ্চিত হতে পেমেন্ট যাচাই হওয়া প্রয়োজন। ডেমো গেটওয়েতে পেমেন্ট সফল করলে সার্ভার সিগনেচার যাচাই করে অর্ডার নিশ্চিত করবে এবং ডিজিটাল অ্যাক্সেস তাৎক্ষণিক চালু হবে।
          </p>
          {mockAttempt ? (
            <div className="mt-3">
              <a
                href={`/pay/mock/${mockAttempt.id}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {mockAttempt.status === "failed" ? "আবার চেষ্টা করুন" : "গেটওয়েতে ফিরে যান"}
              </a>
              <p className="mt-2 text-xs text-muted-foreground">
                পেমেন্টের অবস্থা: {PAYMENT_STATUS_LABELS[order.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] ?? order.paymentStatus}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-foreground/85">
              পেমেন্ট শুরু করা যায়নি। সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন:{" "}
              <a href={`mailto:${settings.supportEmail}`} className="font-medium underline underline-offset-4">{settings.supportEmail}</a>
            </p>
          )}
        </section>
      ) : null}

      {/* ── Items ── */}
      <section aria-labelledby="items-h" className="mt-8">
        <h2 id="items-h" className="font-display text-xl font-semibold">বইসমূহ</h2>
        <ul className="mt-4 space-y-4">
          {order.items.map((item) => {
            const ent = entByItem.get(item.id);
            const digitalCapable = item.formatType === "digital" || item.formatType === "bundle";
            let downloadState: { enabled: boolean; href?: string; label: string; reason?: string; counts?: string } = {
              enabled: false,
              label: "ডাউনলোড",
            };
            if (digitalCapable) {
              if (ent) {
                const expired = ent.expiresAt ? ent.expiresAt.getTime() < now : false;
                const limitLeft = ent.downloadCount < ent.maxDownloads;
                if (!paid) {
                  downloadState = { enabled: false, label: "ডাউনলোড", reason: "পেমেন্ট যাচাইয়ের অপেক্ষায়" };
                } else if (ent.status === "revoked") {
                  downloadState = { enabled: false, label: "ডাউনলোড", reason: "অ্যাক্সেস বাতিল" };
                } else if (ent.status === "expired" || expired) {
                  downloadState = { enabled: false, label: "ডাউনলোড", reason: "মেয়াদ শেষ" };
                } else if (!limitLeft) {
                  downloadState = { enabled: false, label: "ডাউনলোড", reason: "ডাউনলোড সীমা শেষ" };
                } else {
                  downloadState = {
                    enabled: true,
                    href: `/api/download/${ent.id}${token ? `?t=${encodeURIComponent(token)}` : ""}`,
                    label: "ডাউনলোড",
                    counts: `${bnNumber(ent.downloadCount)}/${bnNumber(ent.maxDownloads)} ব্যবহৃত`,
                  };
                }
              } else if (!paid) {
                downloadState = { enabled: false, label: "ডাউনলোড", reason: "পেমেন্ট যাচাইয়ের অপেক্ষায়" };
              } else {
                downloadState = { enabled: false, label: "ডাউনলোড", reason: "প্রস্তুত হচ্ছে…" };
              }
            }

            return (
              <li key={item.id} className="flex gap-4 rounded-lg border border-hairline bg-card p-4">
                <div className="w-14 shrink-0">
                  <BookCover
                    title={item.productTitle}
                    author={item.authorDisplay}
                    coverImage={item.coverImage}
                    coverPattern={item.coverPattern ?? "oxblood"}
                    size="sm"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold leading-snug">{item.productTitle}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.authorDisplay}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {FORMAT_LABELS[item.formatType as keyof typeof FORMAT_LABELS] ?? item.formatType} · × {bnNumber(item.quantity)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">{formatBdt(item.lineTotalMinor)}</p>
                  </div>

                  {digitalCapable ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {downloadState.enabled && downloadState.href ? (
                        <a
                          href={downloadState.href}
                          download
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                          {downloadState.label}
                        </a>
                      ) : (
                        <span className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-input bg-muted px-4 text-sm font-medium text-muted-foreground opacity-80">
                          {downloadState.label}
                        </span>
                      )}
                      {downloadState.reason ? (
                        <span className="text-xs text-muted-foreground">{downloadState.reason}</span>
                      ) : null}
                      {downloadState.counts ? (
                        <span className="text-xs text-muted-foreground">({downloadState.counts})</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Physical delivery ── */}
      {hasShipping ? (
        <section aria-labelledby="delivery-h" className="mt-8 rounded-lg border border-hairline bg-card p-4 sm:p-5">
          <h2 id="delivery-h" className="font-display text-xl font-semibold">ডেলিভারি</h2>
          <dl className="mt-3 space-y-1.5 text-sm leading-6">
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">প্রাপক:</dt>
              <dd className="font-medium">
                {order.shippingName} {order.shippingPhone ? <span className="font-normal text-muted-foreground">· {order.shippingPhone}</span> : null}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">ঠিকানা:</dt>
              <dd>
                {order.shippingAddress}
                {order.shippingArea ? `, ${order.shippingArea}` : ""}
                {order.shippingDistrict ? `, ${order.shippingDistrict}` : ""}
                {order.shippingPostcode ? `, ${order.shippingPostcode}` : ""}
              </dd>
            </div>
            {order.shippingNote ? (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">নোট:</dt>
                <dd>{order.shippingNote}</dd>
              </div>
            ) : null}
            {order.courierProvider ? (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">কুরিয়ার:</dt>
                <dd className="font-medium">
                  {order.courierProvider}
                  {order.trackingId ? <span className="ml-2 font-mono text-xs">ট্র্যাকিং: {order.trackingId}</span> : null}
                </dd>
              </div>
            ) : (
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted-foreground">কুরিয়ার:</dt>
                <dd>পাঠানো হলে এখানে কুরিয়ার ও ট্র্যাকিং তথ্য যোগ করা হবে।</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted-foreground">সময়সীমা:</dt>
              <dd>{order.shippingZone === "outside_dhaka" ? settings.deliveryEstimateOutside : settings.deliveryEstimateInside}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {/* ── Totals ── */}
      <section aria-labelledby="totals-h" className="mt-8 rounded-lg border border-hairline bg-card p-4 sm:p-5">
        <h2 id="totals-h" className="font-display text-xl font-semibold">মূল্যের হিসাব</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">সাবটোটাল</dt>
            <dd className="font-medium">{formatBdt(order.subtotalMinor)}</dd>
          </div>
          {order.discountMinor > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">ছাড় {order.couponCode ? `(${order.couponCode})` : ""}</dt>
              <dd className="font-medium text-success">−{formatBdt(order.discountMinor)}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">ডেলিভারি ফি</dt>
            <dd className="font-medium">{order.shippingMinor === 0 ? "৳0" : formatBdt(order.shippingMinor)}</dd>
          </div>
          <div className="hairline-t pt-2.5">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold">সর্বমোট</dt>
              <dd className="font-display text-xl font-semibold">{formatBdt(order.totalMinor)}</dd>
            </div>
          </div>
        </dl>
      </section>

      {/* ── Timeline ── */}
      <section aria-labelledby="timeline-h" className="mt-8">
        <h2 id="timeline-h" className="font-display text-xl font-semibold">অর্ডারের ইতিহাস</h2>
        <ol className="mt-4 space-y-0 border-l border-hairline pl-5">
          {order.events.map((ev, idx) => (
            <li key={ev.id} className={`relative pb-5 ${idx === order.events.length - 1 ? "pb-0" : ""}`}>
              <span
                className="absolute -left-[26px] top-1 size-2.5 rounded-full border-2 border-card bg-primary"
                aria-hidden
              />
              <p className="text-sm font-medium leading-6">{ev.message ?? "অর্ডার হালনাগাদ"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {bnDateTime(ev.createdAt)} · {actorLabel(ev.actor)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
        স্থাপিত: {bnDate(order.createdAt)} · কোনো প্রশ্ন থাকলে{" "}
        <a href={`mailto:${settings.supportEmail}`} className="underline underline-offset-4">{settings.supportEmail}</a>-এ লিখুন।
      </p>
    </div>
  );
}
