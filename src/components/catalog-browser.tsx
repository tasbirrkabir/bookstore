"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductGrid } from "@/components/product-card";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/lib/catalog";
import {
  FORMAT_FILTER_OPTIONS,
  LANGUAGE_FILTER_OPTIONS,
  SORT_OPTIONS,
  bnNum,
  type CatalogBrowserState,
} from "@/components/catalog-shared";

type CatalogResult = {
  items: ProductCardDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type CategoryOption = { slug: string; name: string; productCount: number };

type Overrides = Record<string, string | null>;

const MANAGED_KEYS = [
  "q",
  "category",
  "format",
  "language",
  "price_min",
  "price_max",
  "inStock",
  "sort",
  "page",
] as const;

/** Build a /shop-style href from the current params + overrides. Filter changes reset the page. */
function hrefFor(basePath: string, sp: URLSearchParams, overrides: Overrides): string {
  const next = new URLSearchParams();
  for (const key of MANAGED_KEYS) {
    const value = key in overrides ? overrides[key] : sp.get(key);
    if (value) next.set(key, value);
  }
  if (!("page" in overrides)) next.delete("page");
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function parsePriceInput(v: string): number | null {
  const t = v.trim().replace(/[^\d.]/g, "");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function RadioRow({
  selected,
  label,
  onSelect,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full min-h-11 items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
        selected && "font-medium"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-input"
        )}
      >
        {selected ? <span className="size-2 rounded-full bg-primary" /> : null}
      </span>
      {label}
    </button>
  );
}

function FilterGroupHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
}

/* ─── Filter panel (shared by desktop sidebar and mobile sheet) ─────────────── */

function PriceFilter({
  priceMin,
  priceMax,
  onApply,
}: {
  priceMin: string;
  priceMax: string;
  onApply: (min: string | null, max: string | null) => void;
}) {
  const [minV, setMinV] = useState(priceMin);
  const [maxV, setMaxV] = useState(priceMax);
  const parsedMin = parsePriceInput(minV);
  const parsedMax = parsePriceInput(maxV);
  const dirty = parsedMin !== null || parsedMax !== null;

  return (
    <form
      className="mt-2.5 space-y-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(parsedMin === null ? null : String(parsedMin), parsedMax === null ? null : String(parsedMax));
      }}
    >
      <div className="flex items-end gap-2">
        <div className="w-full">
          <Label htmlFor="price-min" className="text-xs text-muted-foreground">
            সর্বনিম্ন (৳)
          </Label>
          <Input
            id="price-min"
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            placeholder="০"
            value={minV}
            onChange={(e) => setMinV(e.target.value)}
            className="h-11 bg-card"
          />
        </div>
        <div className="w-full">
          <Label htmlFor="price-max" className="text-xs text-muted-foreground">
            সর্বোচ্চ (৳)
          </Label>
          <Input
            id="price-max"
            type="number"
            inputMode="decimal"
            min={0}
            step={1}
            placeholder="০"
            value={maxV}
            onChange={(e) => setMaxV(e.target.value)}
            className="h-11 bg-card"
          />
        </div>
      </div>
      <Button type="submit" variant="outline" disabled={!dirty} className="h-11 w-full bg-card">
        প্রয়োগ করুন
      </Button>
    </form>
  );
}

function FilterPanel({
  current,
  categories,
  showCategoryFilter,
  go,
}: {
  current: CatalogBrowserState;
  categories: CategoryOption[];
  showCategoryFilter: boolean;
  go: (overrides: Overrides) => void;
}) {
  return (
    <div className="space-y-7">
      {showCategoryFilter && categories.length > 0 ? (
        <section aria-label="বিভাগ ফিল্টার">
          <FilterGroupHeading>বিভাগ</FilterGroupHeading>
          <div className="mt-2.5 max-h-64 space-y-0.5 overflow-y-auto pr-1 scroll-slim">
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                aria-pressed={current.category === c.slug}
                onClick={() => go({ category: current.category === c.slug ? null : c.slug })}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                  current.category === c.slug
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "text-foreground/85"
                )}
              >
                <span className="truncate">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{bnNum(c.productCount)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="ফরম্যাট ফিল্টার">
        <FilterGroupHeading>ফরম্যাট</FilterGroupHeading>
        <div role="radiogroup" aria-label="ফরম্যাট বেছে নিন" className="mt-1.5">
          {FORMAT_FILTER_OPTIONS.map((o) => (
            <RadioRow
              key={o.value || "all"}
              selected={current.format === o.value}
              label={o.label}
              onSelect={() => go({ format: o.value || null })}
            />
          ))}
        </div>
      </section>

      <section aria-label="ভাষা ফিল্টার">
        <FilterGroupHeading>ভাষা</FilterGroupHeading>
        <div role="radiogroup" aria-label="ভাষা বেছে নিন" className="mt-1.5">
          {LANGUAGE_FILTER_OPTIONS.map((o) => (
            <RadioRow
              key={o.value || "all"}
              selected={current.language === o.value}
              label={o.label}
              onSelect={() => go({ language: o.value || null })}
            />
          ))}
        </div>
      </section>

      <section aria-label="মূল্য ফিল্টার">
        <FilterGroupHeading>মূল্য</FilterGroupHeading>
        <PriceFilter
          key={`${current.priceMin}-${current.priceMax}`}
          priceMin={current.priceMin}
          priceMax={current.priceMax}
          onApply={(min, max) => go({ price_min: min, price_max: max })}
        />
      </section>

      <section aria-label="স্টক ফিল্টার">
        <FilterGroupHeading>স্টক</FilterGroupHeading>
        <label className="mt-1.5 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent">
          <Checkbox
            checked={current.inStock}
            onCheckedChange={(c) => go({ inStock: c === true ? "1" : null })}
            aria-label="শুধু স্টকে আছে"
          />
          শুধু স্টকে আছে
        </label>
      </section>
    </div>
  );
}

/* ─── Browser ───────────────────────────────────────────────────────────────── */

export function CatalogBrowser({
  result,
  categories,
  basePath,
  current,
  showCategoryFilter = false,
}: {
  result: CatalogResult;
  categories: CategoryOption[];
  basePath: string;
  current: CatalogBrowserState;
  showCategoryFilter?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const go = (overrides: Overrides) =>
    startTransition(() => {
      router.push(hrefFor(basePath, searchParams, overrides));
    });

  const clearHref = (key: string) => hrefFor(basePath, searchParams, { [key]: null });

  // Active filter chips (grounded in the current URL params).
  const chips: { label: string; href: string }[] = [];
  if (current.q) chips.push({ label: `খোঁজা: “${current.q}”`, href: clearHref("q") });
  if (current.category) {
    const cat = categories.find((c) => c.slug === current.category);
    chips.push({ label: cat?.name ?? current.category, href: clearHref("category") });
  }
  if (current.format) {
    const fmt = FORMAT_FILTER_OPTIONS.find((o) => o.value === current.format);
    chips.push({ label: fmt?.label ?? current.format, href: clearHref("format") });
  }
  if (current.language) {
    chips.push({
      label: current.language === "bn" ? "বাংলা" : "ইংরেজি",
      href: clearHref("language"),
    });
  }
  if (current.priceMin || current.priceMax) {
    const minT = current.priceMin ? formatBdt(Number(current.priceMin) * 100) : null;
    const maxT = current.priceMax ? formatBdt(Number(current.priceMax) * 100) : null;
    const label = minT && maxT ? `${minT} - ${maxT}` : minT ? `${minT} থেকে` : `${maxT} পর্যন্ত`;
    chips.push({
      label,
      href: hrefFor(basePath, searchParams, { price_min: null, price_max: null }),
    });
  }
  if (current.inStock) chips.push({ label: "শুধু স্টকে আছে", href: clearHref("inStock") });
  const activeCount = chips.length;

  const clearAll = () =>
    go({
      q: null,
      category: null,
      format: null,
      language: null,
      price_min: null,
      price_max: null,
      inStock: null,
      sort: null,
    });

  const page = result.page;
  const totalPages = result.totalPages;
  const pages: (number | "gap")[] = [];
  if (totalPages <= 7) {
    for (let p = 1; p <= totalPages; p++) pages.push(p);
  } else {
    pages.push(1);
    const lo = Math.max(2, page - 1);
    const hi = Math.min(totalPages - 1, page + 1);
    if (lo > 2) pages.push("gap");
    for (let p = lo; p <= hi; p++) pages.push(p);
    if (hi < totalPages - 1) pages.push("gap");
    pages.push(totalPages);
  }

  const filterPanel = (
    <FilterPanel
      current={current}
      categories={categories}
      showCategoryFilter={showCategoryFilter}
      go={go}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" aria-label="ফিল্টার">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 scroll-slim">
            {filterPanel}
          </div>
        </aside>

        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {bnNum(result.total)}টি বই
              {totalPages > 1 ? (
                <span>
                  {" "}
                  · পৃষ্ঠা {bnNum(page)}/{bnNum(totalPages)}
                </span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-11 gap-2 bg-card lg:hidden">
                    <SlidersHorizontal className="size-4" aria-hidden />
                    ফিল্টার
                    {activeCount > 0 ? (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        {activeCount.toLocaleString("bn-BD")}
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="px-4 pt-5">
                    <SheetTitle>ফিল্টার</SheetTitle>
                    <SheetDescription className="sr-only">
                      বিভাগ, ফরম্যাট, ভাষা ও মূল্য অনুযায়ী বই ফিল্টার করুন
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4 pb-4 scroll-slim">{filterPanel}</div>
                  <div className="hairline-t flex items-center gap-2 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                    <SheetClose asChild>
                      <Button className="h-11 flex-1">ফলাফল দেখুন</Button>
                    </SheetClose>
                    <Button
                      variant="outline"
                      className="h-11 bg-card"
                      onClick={() =>
                        go({
                          q: null,
                          category: null,
                          format: null,
                          language: null,
                          price_min: null,
                          price_max: null,
                          inStock: null,
                        })
                      }
                    >
                      সব মুছুন
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              {/* Native select: renders its label correctly in server HTML (Radix
                  SelectValue renders empty until hydrated) and stays fully accessible. */}
              <div className="relative">
                <select
                  aria-label="বই সাজানোর নিয়ম"
                  value={current.sort || "newest"}
                  onChange={(e) => go({ sort: e.target.value === "newest" ? null : e.target.value })}
                  className="h-11 w-[172px] appearance-none rounded-md border border-input bg-card pl-3 pr-9 text-sm outline-none transition-colors hover:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex h-9 items-center gap-1 rounded-full border border-hairline bg-card pl-3 pr-1.5 text-xs"
                >
                  {chip.label}
                  <Link
                    href={chip.href}
                    aria-label={`${chip.label} ফিল্টার মুছুন`}
                    className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden />
                  </Link>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-9 items-center rounded-full px-3 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                সব মুছুন
              </button>
            </div>
          ) : null}

          {/* Grid */}
          {result.items.length > 0 ? (
            <div
              className={cn(
                "mt-5 transition-opacity duration-200",
                isPending && "pointer-events-none opacity-60"
              )}
            >
              <ProductGrid products={result.items} />
            </div>
          ) : (
            <div className="mt-6 rounded-md border border-hairline bg-card px-6 py-14 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary text-accent-foreground">
                <SearchX className="size-5" aria-hidden />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">কোনো বই মেলেনি</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                ফিল্টার বদলে দেখুন
                {current.q ? ", অন্যভাবে বানিয়ে খুঁজেও দেখতে পারেন" : ""}। নতুন বই নিয়মিত যোগ করা
                হয়।
              </p>
              <Button asChild variant="outline" className="mt-5 h-11 bg-card px-6">
                <Link href={basePath}>সব ফিল্টার মুছুন</Link>
              </Button>
            </div>
          )}

          {/* Pagination */}
          {result.items.length > 0 && totalPages > 1 ? (
            <nav aria-label="পেজিনেশন" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {page > 1 ? (
                <Button asChild variant="outline" className="h-11 gap-1.5 bg-card">
                  <Link href={hrefFor(basePath, searchParams, { page: String(page - 1) })} rel="prev">
                    <ChevronLeft className="size-4" aria-hidden />
                    পূর্ববর্তী
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled className="h-11 gap-1.5">
                  <ChevronLeft className="size-4" aria-hidden />
                  পূর্ববর্তী
                </Button>
              )}
              {pages.map((p, i) =>
                p === "gap" ? (
                  <span key={`gap-${i}`} aria-hidden className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : p === page ? (
                  <span
                    key={p}
                    aria-current="page"
                    className="inline-flex h-11 min-w-11 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground"
                  >
                    {bnNum(p)}
                  </span>
                ) : (
                  <Button
                    key={p}
                    asChild
                    variant="outline"
                    className="h-11 min-w-11 bg-card px-3"
                  >
                    <Link
                      href={hrefFor(basePath, searchParams, { page: String(p) })}
                      aria-label={`পৃষ্ঠা ${bnNum(p)}`}
                    >
                      {bnNum(p)}
                    </Link>
                  </Button>
                )
              )}
              {page < totalPages ? (
                <Button asChild variant="outline" className="h-11 gap-1.5 bg-card">
                  <Link href={hrefFor(basePath, searchParams, { page: String(page + 1) })} rel="next">
                    পরবর্তী
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled className="h-11 gap-1.5">
                  পরবর্তী
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
