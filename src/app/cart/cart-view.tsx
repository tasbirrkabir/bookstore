"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgePercent,
  BookOpen,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { BookCover } from "@/components/book-cover";
import { ToastHost } from "@/components/toast-host";
import { bnNumber } from "@/components/bn-format";
import { FORMAT_LABELS } from "@/lib/order-ui";
import { formatBdt } from "@/lib/money";
import type { CartLine, CartQuote } from "@/components/commerce-types";

const ISSUE_TEXT: Record<string, string> = {
  unavailable: "এই আইটেমটি এখন আর কেনা যাচ্ছে না (সরিয়ে বা আর্কাইভ করা হয়েছে)।",
  out_of_stock: "এই বইটির স্টক এই মুহূর্তে শেষ।",
  qty_over_stock: "কার্টের পরিমাণ বর্তমান স্টকের চেয়ে বেশি।",
};

export function CartView() {
  const router = useRouter();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyLine, setBusyLine] = useState<string | null>(null);
  const [zone, setZone] = useState<string>("");
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const loadQuote = useCallback(async (zoneArg?: string) => {
    try {
      const qs = zoneArg ? `?zone=${encodeURIComponent(zoneArg)}` : "";
      const res = await fetch(`/api/cart${qs}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; quote?: CartQuote; error?: string };
      if (data.ok && data.quote) {
        setQuote(data.quote);
      } else {
        toast.error(data.error ?? "কার্ট লোড করা যায়নি। পেজটি রিফ্রেশ করুন।");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, কার্ট লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  /* ── mutations: optimistic-disable → API → update quote → toast errors ── */

  async function changeQty(line: CartLine, nextQty: number) {
    if (busyLine) return;
    setBusyLine(line.id);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: line.id, quantity: nextQty }),
      });
      const data = (await res.json()) as { ok: boolean; quote?: CartQuote; error?: string };
      if (res.ok && data.ok && data.quote) {
        setQuote(data.quote);
        router.refresh();
      } else {
        toast.error(data.error ?? "পরিমাণ পরিবর্তন করা যায়নি।");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, পরিমাণ পরিবর্তন হয়নি।");
    } finally {
      setBusyLine(null);
    }
  }

  async function removeLine(line: CartLine) {
    if (busyLine) return;
    setBusyLine(line.id);
    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: line.id }),
      });
      const data = (await res.json()) as { ok: boolean; quote?: CartQuote; error?: string };
      if (res.ok && data.ok && data.quote) {
        setQuote(data.quote);
        toast.success(`“${line.title}” কার্ট থেকে সরানো হয়েছে।`);
        router.refresh();
      } else {
        toast.error(data.error ?? "আইটেম সরানো যায়নি।");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, আইটেম সরানো হয়নি।");
    } finally {
      setBusyLine(null);
    }
  }

  async function applyCoupon(code: string | null) {
    if (couponBusy) return;
    setCouponBusy(true);
    try {
      const res = await fetch("/api/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        await loadQuote(zone || undefined);
        if (code) toast.success("কুপন প্রয়োগ হয়েছে।");
        else toast.success("কুপন সরানো হয়েছে।");
        router.refresh();
      } else {
        toast.error(data.error ?? "কুপন প্রয়োগ করা যায়নি।");
      }
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, কুপন প্রয়োগ হয়নি।");
    } finally {
      setCouponBusy(false);
    }
  }

  function changeZone(value: string) {
    setZone(value);
    void loadQuote(value);
  }

  /* ── derived state ── */

  const lines = quote?.lines ?? [];
  const hasLines = lines.length > 0;
  const issueLines = lines.filter((l) => l.hasIssue !== null);
  const anyIssue = issueLines.length > 0;
  const purchasableTotal = quote ? Math.max(0, quote.subtotalMinor - quote.discountMinor) : 0;
  const shippingKnown = !!quote?.hasPhysical && quote.shippingEstimateMinor !== null;
  const totalMinor = purchasableTotal + (shippingKnown ? (quote?.shippingEstimateMinor ?? 0) : 0);
  const activeZone = quote?.shippingZones.find((z) => z.id === zone) ?? null;

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <ToastHost />

      <header className="hairline-b pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">আপনার কার্ট</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {loading ? "কার্ট লোড হচ্ছে…" : hasLines ? (
            <>মোট {bnNumber(quote?.itemCount ?? 0)}টি আইটেম, মূল্য ও স্টক প্রতিবার সর্বশেষ যাচাই করা হয়।</>
          ) : (
            "কেনাকাটা শুরু করতে নিচের বাটনে চাপ দিন।"
          )}
        </p>
      </header>

      {loading ? <CartSkeleton /> : null}

      {!loading && quote && !hasLines ? <EmptyCart /> : null}

      {!loading && quote && hasLines ? (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
          {/* ── Lines ── */}
          <div>
            {anyIssue ? (
              <Alert className="mb-5 border-warning/40 bg-warning/5 text-warning-foreground">
                <AlertTriangle className="text-warning" aria-hidden />
                <AlertTitle>কিছু আইটেম ঠিক করা প্রয়োজন</AlertTitle>
                <AlertDescription>
                  নিচের চিহ্নিত আইটেমগুলো সরিয়ে ফেলুন বা পরিমাণ ঠিক করুন, এগুলো ঠিক না হওয়া পর্যন্ত চেকআউট করা যাবে না।
                </AlertDescription>
              </Alert>
            ) : null}

            <ul className="space-y-4" aria-label="কার্টের আইটেমসমূহ">
              {lines.map((line) => (
                <CartLineRow
                  key={line.id}
                  line={line}
                  busy={busyLine === line.id}
                  disabled={busyLine !== null}
                  onQty={(q) => void changeQty(line, q)}
                  onRemove={() => void removeLine(line)}
                />
              ))}
            </ul>
          </div>

          {/* ── Coupon + totals ── */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            {/* Coupon */}
            <section aria-label="কুপন" className="rounded-lg border border-hairline bg-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <BadgePercent className="size-4 text-sage" aria-hidden />
                কুপন কোড
              </h2>
              {quote.couponCode ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2 rounded-md bg-sage-soft px-3 py-2">
                    <span className="font-mono text-sm font-semibold text-foreground">{quote.couponCode}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`কুপন ${quote.couponCode} সরান`}
                      disabled={couponBusy}
                      onClick={() => void applyCoupon(null)}
                    >
                      {couponBusy ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" aria-hidden />}
                    </Button>
                  </div>
                  {quote.couponMessage ? (
                    <p className="mt-2 text-xs font-medium text-success">{quote.couponMessage}</p>
                  ) : null}
                  {quote.couponError ? (
                    <p className="mt-2 text-xs font-medium text-destructive">{quote.couponError}, কুপনটি সরিয়ে অন্যটি চেষ্টা করুন।</p>
                  ) : null}
                </div>
              ) : (
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const code = couponInput.trim();
                    if (!code) return;
                    void applyCoupon(code);
                    setCouponInput("");
                  }}
                >
                  <Label htmlFor="coupon-code" className="sr-only">কুপন কোড</Label>
                  <Input
                    id="coupon-code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="যেমন WELCOME10"
                    autoComplete="off"
                    className="h-10 font-mono uppercase"
                  />
                  <Button type="submit" variant="secondary" className="h-10" disabled={couponBusy || !couponInput.trim()}>
                    {couponBusy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "প্রয়োগ"}
                  </Button>
                </form>
              )}
            </section>

            {/* Totals */}
            <section aria-label="মূল্যের হিসাব" className="rounded-lg border border-hairline bg-card p-4">
              <h2 className="text-sm font-semibold">মূল্যের হিসাব</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">সাবটোটাল</dt>
                  <dd className="font-medium">{formatBdt(quote.subtotalMinor)}</dd>
                </div>
                {quote.discountMinor > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">ছাড় {quote.couponCode ? `(${quote.couponCode})` : ""}</dt>
                    <dd className="font-medium text-success">−{formatBdt(quote.discountMinor)}</dd>
                  </div>
                ) : null}

                {quote.hasPhysical ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">ডেলিভারি ফি</dt>
                      <dd className="font-medium">
                        {shippingKnown ? (
                          (quote.shippingEstimateMinor ?? 0) === 0 ? (
                            <span className="text-success">ফ্রি</span>
                          ) : (
                            formatBdt(quote.shippingEstimateMinor ?? 0)
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">চেকআউটে হিসাব হবে</span>
                        )}
                      </dd>
                    </div>
                    {quote.shippingZones.length > 0 ? (
                      <div>
                        <Label htmlFor="zone" className="mb-1.5 block text-xs text-muted-foreground">
                          ডেলিভারি জোন (আনুমানিক ফি দেখতে)
                        </Label>
                        <Select value={zone} onValueChange={changeZone}>
                          <SelectTrigger id="zone" className="h-10 w-full" aria-label="ডেলিভারি জোন নির্বাচন করুন">
                            <SelectValue placeholder="জোন নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {quote.shippingZones.map((z) => (
                              <SelectItem key={z.id} value={z.id}>
                                {z.label}, {formatBdt(z.feeMinor)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {activeZone ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">আনুমানিক সময়: {activeZone.estimate}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">ডেলিভারি ফি</dt>
                    <dd className="text-xs text-muted-foreground">প্রযোজ্য নয় (ডিজিটাল)</dd>
                  </div>
                )}

                <Separator className="bg-hairline" />

                <div className="flex items-center justify-between gap-3">
                  <dt className="font-semibold">সর্বমোট</dt>
                  <dd className="font-display text-xl font-semibold">{formatBdt(totalMinor)}</dd>
                </div>
              </dl>
              {quote.hasPhysical && !shippingKnown ? (
                <p className="mt-2 text-xs text-muted-foreground">ডেলিভারি ফি চেকআউটে হিসাব হবে, জোন নির্বাচন করে আনুমানিক ফি দেখতে পারেন।</p>
              ) : null}
            </section>

            {/* Honest payment notice */}
            {quote.requiresOnlinePayment ? (
              <Alert className="border-hairline bg-sage-soft/60">
                <CreditCard className="text-sage" aria-hidden />
                <AlertTitle>অনলাইন পেমেন্ট প্রয়োজন</AlertTitle>
                <AlertDescription>
                  কার্টে ডিজিটাল আইটেম আছে, অর্ডার নিশ্চিত করতে অনলাইন পেমেন্ট প্রয়োজন। ক্যাশ অন ডেলিভারি শুধু শারীরিক বইয়ের অর্ডারে প্রযোজ্য।
                </AlertDescription>
              </Alert>
            ) : null}
          </aside>
        </div>
      ) : null}
      </div>

      {/* ── Sticky checkout bar (in-flow: rests above the footer, never covers it) ── */}
      {!loading && quote && hasLines ? (
        <div className="sticky bottom-0 z-40 hairline-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">সর্বমোট (আনুমানিক)</p>
              <p className="font-display text-lg font-semibold leading-tight">{formatBdt(totalMinor)}</p>
            </div>
            {anyIssue ? (
              <Button size="lg" className="h-11 min-w-40" disabled aria-describedby="checkout-blocked-reason">
                চেকআউটে যান
              </Button>
            ) : (
              <Button asChild size="lg" className="h-11 min-w-40">
                <Link href="/checkout">চেকআউটে যান</Link>
              </Button>
            )}
          </div>
          {anyIssue ? (
            <p id="checkout-blocked-reason" role="status" className="mx-auto max-w-6xl px-4 pb-2 text-xs text-warning sm:px-6">
              কার্টে সমস্যাযুক্ত আইটেম আছে, সেগুলো সরানো বা ঠিক করার পর চেকআউট চালু হবে।
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/* ── Single cart line ── */

function CartLineRow({
  line,
  busy,
  disabled,
  onQty,
  onRemove,
}: {
  line: CartLine;
  busy: boolean;
  disabled: boolean;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  const isDigital = line.formatType === "digital";
  const maxQty = line.stockOnHand ?? 99;

  return (
    <li className={`rounded-lg border border-hairline bg-card p-4 ${line.hasIssue ? "border-warning/50" : ""}`}>
      <div className="flex gap-4">
        <div className="w-16 shrink-0 sm:w-20">
          <BookCover
            title={line.title}
            author={line.authorDisplay}
            coverImage={line.coverImage}
            coverPattern={line.coverPattern}
            size="sm"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold leading-snug text-foreground">{line.title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{line.authorDisplay}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatBdt(line.lineSubtotalMinor)}</p>
              {line.compareAtPriceMinor && line.compareAtPriceMinor > line.unitPriceMinor ? (
                <p className="text-xs text-muted-foreground line-through">{formatBdt(line.compareAtPriceMinor * line.quantity)}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal">{FORMAT_LABELS[line.formatType]}</Badge>
            {isDigital ? (
              <Badge className="border-transparent bg-sage-soft text-sage hover:bg-sage-soft">
                <BookOpen className="size-3" aria-hidden /> ডিজিটাল
              </Badge>
            ) : (
              <Badge className="border-transparent bg-secondary text-secondary-foreground hover:bg-secondary">
                <Truck className="size-3" aria-hidden /> কুরিয়ার ডেলিভারি
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              একক মূল্য: {formatBdt(line.unitPriceMinor)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {isDigital ? (
              <p className="text-sm text-muted-foreground">পরিমাণ: ১ (ডিজিটাল আইটেম)</p>
            ) : (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label={`${line.title}, পরিমাণ কমান`}
                  disabled={disabled || busy || line.quantity <= 1}
                  onClick={() => onQty(line.quantity - 1)}
                >
                  {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Minus className="size-4" aria-hidden />}
                </Button>
                <span
                  className="min-w-9 text-center font-semibold"
                  aria-live="polite"
                  aria-label={`পরিমাণ ${bnNumber(line.quantity)}`}
                >
                  {bnNumber(line.quantity)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-11"
                  aria-label={`${line.title}, পরিমাণ বাড়ান`}
                  disabled={disabled || busy || line.quantity >= maxQty}
                  onClick={() => onQty(line.quantity + 1)}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-11 gap-1.5 px-3 text-muted-foreground hover:text-destructive"
              disabled={disabled || busy}
              onClick={onRemove}
              aria-label={`${line.title}, কার্ট থেকে সরান`}
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
              সরান
            </Button>
          </div>

          {line.hasIssue ? (
            <Alert className="mt-3 border-warning/40 bg-warning/5">
              <AlertTriangle className="text-warning" aria-hidden />
              <AlertTitle className="text-warning">{ISSUE_TEXT[line.hasIssue]}</AlertTitle>
              <AlertDescription>
                {line.hasIssue === "qty_over_stock" && line.stockOnHand !== null && line.stockOnHand > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    disabled={disabled || busy}
                    onClick={() => onQty(line.stockOnHand ?? 1)}
                  >
                    স্টক অনুযায়ী ঠিক করুন ({bnNumber(line.stockOnHand)}টি)
                  </Button>
                ) : (
                  <span>চেকআউট করতে হলে এই আইটেমটি সরিয়ে ফেলুন।</span>
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/* ── Empty state ── */

function EmptyCart() {
  return (
    <div className="mt-12 flex flex-col items-center rounded-lg border border-dashed border-hairline bg-card px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-sage-soft">
        <ShoppingCart className="size-6 text-sage" aria-hidden />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">কার্ট এখনো খালি</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        পছন্দের বইগুলো কার্টে যোগ করুন, হার্ড কপি, PDF/ই-বুক বা বান্ডেল, আপনার পছন্দমতো ফরম্যাটে।
      </p>
      <Button asChild size="lg" className="mt-6 h-11">
        <Link href="/shop">বই খুঁজে দেখুন</Link>
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        ই-বুক খুঁজছেন? <Link href="/shop?format=digital" className="text-primary underline-offset-4 hover:underline">ডিজিটাল বইয়ের সংগ্রহ দেখুন</Link>
      </p>
    </div>
  );
}

/* ── Loading skeleton ── */

function CartSkeleton() {
  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]" aria-busy="true" aria-label="কার্ট লোড হচ্ছে">
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-hairline bg-card p-4">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-16 rounded-md" />
              <div className="flex-1 space-y-2.5 py-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-8 w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-hairline bg-card p-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-10 w-full" />
        <Skeleton className="mt-4 h-3 w-full" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-5 h-6 w-1/2" />
      </div>
    </div>
  );
}
