import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  FileText,
  Package,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { homeModules } from "@/lib/catalog";
import { BookCover } from "@/components/book-cover";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { bnNum } from "@/components/catalog-shared";
import type { ProductCardDTO } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const FORMAT_CARDS = [
  {
    Icon: BookOpen,
    title: "হার্ড কপি",
    text: "কাগজে ছাপা মূল বই — সারা দেশে ডেলিভারি, সাবধানে মোড়ানো প্যাকেজিংয়ে।",
  },
  {
    Icon: FileText,
    title: "PDF ই-বুক",
    text: "পেমেন্ট যাচাইয়ের পর সঙ্গে সঙ্গে ডাউনলোড অ্যাক্সেস; লাইব্রেরি থেকে বারবার পড়ুন।",
  },
  {
    Icon: Package,
    title: "বান্ডেল",
    text: "হার্ড কপি ও PDF একসাথে — ঘরে বই, পকেটে ই-বুক; দুটোই এক অর্ডারে।",
  },
] as const;

const TRUST_ITEMS = [
  { Icon: ShieldCheck, label: "নিরাপদ চেকআউট" },
  { Icon: Package, label: "সাবধানে মোড়ানো প্যাকেজিং" },
  { Icon: BadgeCheck, label: "যাচাইকৃত পেমেন্টের পর ডিজিটাল অ্যাক্সেস" },
  { Icon: Phone, label: "চ্যাট/ফোন সাপোর্ট" },
] as const;

function ModuleHeader({
  title,
  subtitle,
  href,
  linkText,
}: {
  title: string;
  subtitle?: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-semibold md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <Link
        href={href}
        className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {linkText}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

/** Decorative hero cover — links exist but are hidden from assistive tech (title appears once). */
function HeroCover({
  product,
  className,
  decorative = false,
  priority = false,
}: {
  product: ProductCardDTO;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className={`block overflow-hidden rounded-[3px] shadow-lg shadow-ink/15 ${className ?? ""}`}
    >
      <BookCover
        title={product.title}
        author={product.authorDisplay}
        coverImage={product.coverImage}
        coverPattern={product.coverPattern}
        size="lg"
        priority={priority}
      />
    </Link>
  );
}

export default async function HomePage() {
  const modules = await homeModules();
  const heroCovers = [...modules.featured, ...modules.newArrivals].slice(0, 3);
  const isEmpty =
    modules.featured.length === 0 &&
    modules.newArrivals.length === 0 &&
    modules.collections.length === 0;

  return (
    <div className="pb-0">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="hairline-b bg-secondary/70">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-accent-foreground">
              স্বাধীন বইয়ের দোকান
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.18] md:text-5xl">
              এক বই, আপনার পছন্দের ফরম্যাটে
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              হার্ড কপি, PDF ই-বুক কিংবা বান্ডেল — বেছে নিন আরামের পড়ার ধরন; আমরা পৌঁছে দিই সারা
              বাংলাদেশে।
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-12 px-7 text-base font-semibold">
                <Link href="/shop">সব বই দেখুন</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-ink/15 bg-card px-7 text-base"
              >
                <Link href="/shop?format=digital">ই-বুক</Link>
              </Button>
            </div>
          </div>

          {heroCovers.length > 0 ? (
            <div className="hidden items-center justify-center md:flex lg:justify-end">
              <div className="flex items-center py-6">
                {heroCovers[0] ? (
                  <HeroCover product={heroCovers[0]} className="z-0 w-36 rotate-[-7deg] translate-y-5 xl:w-40" decorative />
                ) : null}
                {heroCovers[1] ? (
                  <HeroCover product={heroCovers[1]} className="z-10 -mx-5 w-44 xl:w-52" priority />
                ) : null}
                {heroCovers[2] ? (
                  <HeroCover product={heroCovers[2]} className="z-0 w-36 rotate-[7deg] translate-y-5 xl:w-40" decorative />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Category quick row ───────────────────────────────────────────── */}
      {modules.categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="hairline-b">
          <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <h2 id="home-categories" className="sr-only">
              বিভাগসমূহ
            </h2>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scroll-slim">
              {modules.categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-hairline bg-card px-4 text-sm transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {c.name}
                  <span className="text-xs text-muted-foreground">{bnNum(c.productCount)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isEmpty ? (
        /* ── Catalog empty state ────────────────────────────────────────── */
        <section className="mx-auto w-full max-w-7xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-accent-foreground">
            <BookOpen aria-hidden className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold">ক্যাটালগ এখনও প্রস্তুত নয়</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            আমরা এই মুহূর্তে দোকান সাজাচ্ছি। বইগুলো যোগ হওয়ার সঙ্গে সঙ্গে এখানে দেখতে পাবেন।
          </p>
          <Button asChild size="lg" className="mt-6 h-12 px-7 text-base">
            <Link href="/shop">দোকানে যান</Link>
          </Button>
        </section>
      ) : (
        <>
          {/* ── Editor / shop picks ──────────────────────────────────────── */}
          {modules.featured.length > 0 ? (
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
              <ModuleHeader
                title="সম্পাদক ও দোকানের বাছাই"
                subtitle="দোকান থেকে বেছে নেওয়া"
                href="/shop"
                linkText="সব দেখুন"
              />
              <ProductGrid products={modules.featured} className="mt-6" />
            </section>
          ) : null}

          {/* ── New arrivals ─────────────────────────────────────────────── */}
          {modules.newArrivals.length > 0 ? (
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
              <ModuleHeader
                title="নতুন প্রকাশনা"
                subtitle="সদ্য দোকানে যোগ হওয়া বই"
                href="/shop?sort=newest"
                linkText="নতুনগুলো দেখুন"
              />
              <ProductGrid products={modules.newArrivals} className="mt-6" />
            </section>
          ) : null}

          {/* ── Format explainer ─────────────────────────────────────────── */}
          <section className="hairline-t hairline-b bg-secondary/60">
            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">
                এক বই, তিন ফরম্যাটে
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                যেভাবে পড়তে চান, সেভাবেই কিনুন।
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
                {FORMAT_CARDS.map(({ Icon, title, text }) => (
                  <div key={title} className="rounded-md border border-hairline bg-card p-5">
                    <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-accent-foreground">
                      <Icon aria-hidden className="size-5" />
                    </div>
                    <h3 className="mt-3 font-medium">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Collections ──────────────────────────────────────────────── */}
          {modules.collections.length > 0 ? (
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">বাছাই করা সংগ্রহ</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                এক সুতোয় গাঁথা বইয়ের তাক — পুরো সংগ্রহটাও ঘুরে দেখতে পারেন।
              </p>
              <div className="mt-8 space-y-12">
                {modules.collections.map((col) => (
                  <article key={col.slug}>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold md:text-2xl">
                          {col.title}
                        </h3>
                        {col.description ? (
                          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                            {col.description}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        href={`/collections/${col.slug}`}
                        className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        সংগ্রহটি দেখুন
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </div>
                    <div className="mt-5 grid grid-cols-4 gap-2.5 md:gap-5">
                      {col.products.slice(0, 4).map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="group block overflow-hidden rounded-[3px] shadow-md shadow-ink/10 transition-transform duration-200 hover:-translate-y-0.5"
                        >
                          <BookCover
                            title={p.title}
                            author={p.authorDisplay}
                            coverImage={p.coverImage}
                            coverPattern={p.coverPattern}
                            size="sm"
                          />
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <section aria-label="আমাদের প্রতিশ্রুতি" className="hairline-t bg-card">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <p className="pt-1.5 text-sm leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
