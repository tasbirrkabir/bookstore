"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FileText, Minus, Package, Plus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { BookCover } from "@/components/book-cover";
import { FORMAT_LABELS } from "@/lib/order-ui";
import { clampQty, formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductDetailDTO, VariantDTO } from "@/lib/catalog";

const bnNum = (n: number) => n.toLocaleString("bn-BD");

type PurchaseSettings = {
  deliveryEstimateInside: string;
  deliveryEstimateOutside: string;
  returnWindowDays: number;
};

/** A variant can be bought only if it can actually be fulfilled. */
function canBuy(v: VariantDTO): boolean {
  if (v.formatType === "digital") return v.hasDigitalFile;
  return v.inStock;
}

function availabilityText(v: VariantDTO): string {
  switch (v.formatType) {
    case "physical":
      return v.inStock ? `স্টকে ${bnNum(v.stockOnHand ?? 0)}টি` : "স্টক শেষ";
    case "digital":
      return v.hasDigitalFile
        ? "পেমেন্ট যাচাইয়ের পর ডাউনলোড"
        : "ডাউনলোড ফাইল প্রস্তুত নয়";
    case "bundle": {
      const phys = v.inStock ? `স্টকে ${bnNum(v.stockOnHand ?? 0)}টি` : "স্টক শেষ";
      const dig = v.hasDigitalFile ? "PDF সহ" : "PDF ফাইল প্রস্তুত নয়";
      return `${phys} · ${dig}`;
    }
    default:
      return "";
  }
}

/**
 * Purchase column for the product page: format radio-cards, quantity stepper,
 * add-to-cart action, per-format info blocks, plus the sticky mobile buy bar
 * that appears once the panel itself has been scrolled past.
 */
export function ProductPurchaseSection({
  product,
  settings,
}: {
  product: ProductDetailDTO;
  settings: PurchaseSettings;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const variants = product.variants;
  const defaultVariant = variants.find((v) => canBuy(v)) ?? variants[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultVariant?.id ?? null);
  const selected = variants.find((v) => v.id === selectedId) ?? defaultVariant;
  const isDigital = selected?.formatType === "digital";
  const maxQty = selected && !isDigital ? (selected.stockOnHand ?? 99) : 1;
  const [stepperQty, setStepperQty] = useState(1);
  const effectiveQty = clampQty(stepperQty, maxQty);

  // Sticky mobile bar: visible only after the purchase panel is fully above the viewport.
  const panelRef = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);
  useEffect(() => {
    const el = panelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        const passed = !e.isIntersecting && e.boundingClientRect.bottom < (e.rootBounds?.top ?? 0);
        setBarVisible(passed);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function addSelected() {
    if (!selected || !canBuy(selected) || pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: selected.id, quantity: selected.formatType === "digital" ? 1 : effectiveQty }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        toast.error(data?.error || "কার্টে যোগ করা যায়নি।");
        return;
      }
      toast.success("কার্টে যোগ হয়েছে");
      router.refresh();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা, আবার চেষ্টা করুন।");
    } finally {
      setPending(false);
    }
  }

  const ctaDisabled = !selected || !canBuy(selected) || pending;
  const ctaLabel = !selected
    ? "বিক্রয়ের জন্য প্রস্তুত নয়"
    : !canBuy(selected)
      ? "এই মুহূর্তে সরবরাহ করা যাচ্ছে না"
      : pending
        ? "যোগ করা হচ্ছে…"
        : "কার্টে যোগ করুন";

  return (
    <div ref={panelRef} className="rounded-lg border border-hairline bg-card p-4 sm:p-5">
      {variants.length > 0 ? (
        <>
          <p className="text-sm font-semibold" id="format-chooser-label">
            ফরম্যাট বেছে নিন
          </p>
          <div role="radiogroup" aria-labelledby="format-chooser-label" className="mt-2.5 grid gap-2">
            {variants.map((v) => {
              const active = selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setSelectedId(v.id);
                    setStepperQty(1);
                  }}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-md border p-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/[0.04]"
                      : "border-hairline bg-card hover:border-primary/40"
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{FORMAT_LABELS[v.formatType]}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {availabilityText(v)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-semibold">{formatBdt(v.priceMinor)}</span>
                    {active ? <Check aria-hidden className="size-4 text-primary" /> : null}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Price driven by the selected variant */}
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-display text-3xl font-semibold">
              {selected ? formatBdt(selected.priceMinor) : "-"}
            </p>
            {selected?.compareAtPriceMinor && selected.compareAtPriceMinor > selected.priceMinor ? (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatBdt(selected.compareAtPriceMinor)}
                </p>
                <p className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-accent-foreground">
                  {formatBdt(selected.compareAtPriceMinor - selected.priceMinor)} সাশ্রয়
                </p>
              </>
            ) : null}
          </div>

          {/* Quantity stepper (digital locked at 1) */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">পরিমাণ</span>
            <div className="flex items-center rounded-md border border-hairline">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-none"
                disabled={isDigital || effectiveQty <= 1}
                aria-label="পরিমাণ কমান"
                onClick={() => setStepperQty((q) => clampQty(q - 1, maxQty))}
              >
                <Minus aria-hidden className="size-4" />
              </Button>
              <span aria-live="polite" className="w-10 text-center text-sm font-medium">
                {bnNum(effectiveQty)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-none"
                disabled={isDigital || effectiveQty >= maxQty}
                aria-label="পরিমাণ বাড়ান"
                onClick={() => setStepperQty((q) => clampQty(q + 1, maxQty))}
              >
                <Plus aria-hidden className="size-4" />
              </Button>
            </div>
            {isDigital ? (
              <span className="text-xs text-muted-foreground">ডিজিটাল আইটেম সর্বোচ্চ ১টি</span>
            ) : null}
          </div>

          <Button
            size="lg"
            disabled={ctaDisabled}
            onClick={addSelected}
            className="mt-5 h-12 w-full text-base font-semibold"
          >
            <ShoppingCart aria-hidden className="size-4" />
            {ctaLabel}
          </Button>
          <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden className="size-3.5 text-sage" />
            নিরাপদ চেকআউট, যাচাইকৃত পেমেন্টের পরেই ডিজিটাল অ্যাক্সেস
          </p>

          {/* Per-format info blocks */}
          {selected && selected.formatType !== "digital" ? (
            <div className="mt-4 space-y-2 rounded-md bg-secondary/60 p-3.5 text-sm">
              <p className="flex items-start gap-2">
                <Truck aria-hidden className="mt-0.5 size-4 shrink-0 text-sage" />
                <span>
                  ডেলিভারি: {settings.deliveryEstimateInside}; {settings.deliveryEstimateOutside}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Package aria-hidden className="mt-0.5 size-4 shrink-0 text-sage" />
                <span>সাবধানে মোড়ানো প্যাকেজিংয়ে পাঠানো হয়।</span>
              </p>
              <p>
                <Link
                  href="/policies/returns"
                  className="font-medium underline underline-offset-4 hover:text-primary"
                >
                  রিটার্ন নীতি, {bnNum(settings.returnWindowDays)} দিনের সময়সীমা
                </Link>
              </p>
            </div>
          ) : null}

          {selected && selected.formatType !== "physical" ? (
            <div className="mt-3 space-y-1.5 rounded-md border border-hairline p-3.5 text-sm">
              <p className="flex items-start gap-2">
                <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-sage" />
                <span>
                  PDF ফাইল
                  {selected.downloadLimit
                    ? ` · সর্বোচ্চ ${bnNum(selected.downloadLimit)} বার ডাউনলোড`
                    : ""}
                  {selected.downloadExpiryDays
                    ? ` · কেনার ${bnNum(selected.downloadExpiryDays)} দিন পর্যন্ত ডাউনলোড চলবে`
                    : ""}
                </span>
              </p>
              <p className="text-muted-foreground">
                পেমেন্ট যাচাইয়ের পর ডাউনলোড অ্যাক্সেস পাবেন, ডিজিটাল লাইব্রেরি থেকে বারবার পড়তে
                পারবেন।
              </p>
            </div>
          ) : null}

          {selected && selected.formatType === "bundle" ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              বান্ডেলে হার্ড কপি ও PDF দুটোই থাকছে, এক অর্ডারেই ডেলিভারি ও ডাউনলোড অ্যাক্সেস।
            </p>
          ) : null}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            এই বইয়ের কোনো সংস্করণ এখন বিক্রয়ের জন্য প্রস্তুত নয়।
          </p>
          <Button size="lg" disabled className="h-12 w-full text-base">
            <ShoppingCart aria-hidden className="size-4" />
            বিক্রয়ের জন্য প্রস্তুত নয়
          </Button>
        </div>
      )}

      {/* Sticky mobile buy bar, appears after the panel scrolls out of view */}
      <div
        aria-hidden={!barVisible}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-card px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] transition-transform duration-200 lg:hidden",
          barVisible ? "translate-y-0" : "pointer-events-none translate-y-full"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
          <BookCover
            title={product.title}
            author={product.authorDisplay}
            coverImage={product.coverImage}
            coverPattern={product.coverPattern}
            size="sm"
            className="w-10 shrink-0"
          />
          <div className="min-w-0 flex-1">
            {selected ? (
              <p className="truncate text-sm font-semibold">
                {formatBdt(selected.priceMinor)}
                {product.formats.length > 1 ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    · {FORMAT_LABELS[selected.formatType]}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">বিক্রয়ের জন্য প্রস্তুত নয়</p>
            )}
          </div>
          <Button className="h-11 shrink-0" disabled={ctaDisabled} onClick={addSelected}>
            {pending ? "যোগ করা হচ্ছে…" : "কার্টে যোগ করুন"}
          </Button>
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}
