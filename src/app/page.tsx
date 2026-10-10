import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  FileText,
  Package,
  Phone,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { homeModules } from "@/lib/catalog";
import { BookCover } from "@/components/book-cover";
import { ProductGrid } from "@/components/product-card";
import { bnNum } from "@/components/catalog-shared";
import type { ProductCardDTO } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const FORMAT_CARDS = [
  {
    Icon: BookOpen,
    title: "হার্ড কপি",
    text: "কাগজে ছাপা মূল বই, সারা দেশে ডেলিভারি, সাবধানে মোড়ানো প্যাকেজিংয়ে।",
    card: "border-oxblood/20 bg-oxblood-soft/50 hover:border-oxblood/45",
    icon: "bg-oxblood text-primary-foreground",
    titleCls: "text-oxblood",
  },
  {
    Icon: FileText,
    title: "PDF ই-বুক",
    text: "পেমেন্ট যাচাইয়ের পর সঙ্গে সঙ্গে ডাউনলোড অ্যাক্সেস; লাইব্রেরি থেকে বারবার পড়ুন।",
    card: "border-teal-deep/20 bg-teal-soft/60 hover:border-teal-deep/45",
    icon: "bg-teal-deep text-white",
    titleCls: "text-teal-deep",
  },
  {
    Icon: Package,
    title: "বান্ডেল",
    text: "হার্ড কপি ও PDF একসাথে, ঘরে বই, পকেটে ই-বুক; দুটোই এক অর্ডারে।",
    card: "border-marigold/25 bg-marigold-soft/60 hover:border-marigold/50",
    icon: "bg-marigold text-white",
    titleCls: "text-marigold-deep",
  },
] as const;

const HERO_BADGES = [
  { Icon: Truck, label: "সারা দেশে ডেলিভারি" },
  { Icon: ShieldCheck, label: "নিরাপদ চেকআউট" },
  { Icon: BadgeCheck, label: "যাচাইকৃত পেমেন্টে তাৎক্ষণিক ডাউনলোড" },
] as const;

const TRUST_ITEMS = [
  { Icon: ShieldCheck, label: "নিরাপদ চেকআউট" },
  { Icon: Package, label: "সাবধানে মোড়ানো প্যাকেজিং" },
  { Icon: BadgeCheck, label: "যাচাইকৃত পেমেন্টের পর ডিজিটাল অ্যাক্সেস" },
  { Icon: Phone, label: "চ্যাট/ফোন সাপোর্ট" },
] as const;

/* Rotating tints so each chip and panel gets its own color */
const CAT_TINTS = [
  "bg-oxblood-soft text-oxblood hover:bg-oxblood hover:text-primary-foreground",
  "bg-teal-soft text-teal-deep hover:bg-teal-deep hover:text-white",
  "bg-marigold-soft text-marigold-deep hover:bg-marigold hover:text-white",
  "bg-sage-soft text-[#46513e] hover:bg-sage hover:text-white",
  "bg-clay-soft text-[#8a4a26] hover:bg-clay hover:text-white",
  "bg-plum-soft text-plum hover:bg-plum hover:text-white",
] as const;

const COL_TINTS = [
  "border-sage/25 bg-sage-soft/70",
  "border-marigold/25 bg-marigold-soft/60",
  "border-clay/25 bg-clay-soft/60",
  "border-teal-deep/20 bg-teal-soft/70",
] as const;

function ModuleHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkText,
  eyebrowClass = "text-oxblood",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  href: string;
  linkText: string;
  eyebrowClass?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${eyebrowClass}`}>
          <span className="h-px w-7 bg-current opacity-50" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      <Link
        href={href}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-card px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {linkText}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}

/** Decorative hero cover, links exist but are hidden from assistive tech (title appears once). */
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
      className={`block overflow-hidden rounded-[3px] shadow-2xl shadow-black/45 ring-1 ring-white/25 ${className ?? ""}`}
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
      <section className="relative overflow-hidden bg-hero text-[#f8f1e1]">
        <div className="pointer-events-none absolute inset-0 pattern-dots opacity-50" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-6 lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eecb84]/35 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-[#f0cf8d]">
              <Sparkles aria-hidden className="size-3.5" />
              স্বাধীন বইয়ের দোকান
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.15] text-[#fdf8ec] md:text-6xl">
              এক বই, আপনার পছন্দের ফরম্যাটে
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#f3e6cd]/85 md:text-lg">
              হার্ড কপি, PDF ই-বুক কিংবা বান্ডেল, বেছে নিন আরামের পড়ার ধরন; আমরা পৌঁছে দিই সারা
              বাংলাদেশে।
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center rounded-md bg-[#fdf7ea] px-7 text-base font-semibold text-oxblood shadow-lg shadow-black/25 transition hover:bg-white"
              >
                সব বই দেখুন
                <ArrowRight aria-hidden className="ml-2 size-4" />
              </Link>
              <Link
                href="/shop?format=digital"
                className="inline-flex h-12 items-center rounded-md border border-[#f3e6cd]/40 px-7 text-base font-medium text-[#fdf8ec] transition hover:bg-white/10"
              >
                ই-বুক
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {HERO_BADGES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm text-[#f3e6cd]/75">
                  <Icon aria-hidden className="size-4 text-[#eecb84]" />
                  {label}
                </li>
              ))}
            </ul>
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
              {modules.categories.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className={`inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors ${CAT_TINTS[i % CAT_TINTS.length]}`}
                >
                  {c.name}
                  <span className="text-xs opacity-70">{bnNum(c.productCount)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isEmpty ? (
        /* ── Catalog empty state ────────────────────────────────────────── */
        <section className="mx-auto w-full max-w-7xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-oxblood-soft text-oxblood">
            <BookOpen aria-hidden className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold">ক্যাটালগ এখনও প্রস্তুত নয়</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            আমরা এই মুহূর্তে দোকান সাজাচ্ছি। বইগুলো যোগ হওয়ার সঙ্গে সঙ্গে এখানে দেখতে পাবেন।
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-12 items-center rounded-md bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-oxblood-deep"
          >
            দোকানে যান
          </Link>
        </section>
      ) : (
        <>
          {/* ── Editor / shop picks ──────────────────────────────────────── */}
          {modules.featured.length > 0 ? (
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
              <ModuleHeader
                eyebrow="দোকানের বাছাই"
                title="সম্পাদক ও দোকানের পছন্দ"
                subtitle="দোকান থেকে বেছে নেওয়া"
                href="/shop"
                linkText="সব দেখুন"
              />
              <ProductGrid products={modules.featured} className="mt-6" />
            </section>
          ) : null}

          {/* ── New arrivals (sage band) ─────────────────────────────────── */}
          {modules.newArrivals.length > 0 ? (
            <section className="hairline-t hairline-b bg-secondary/60">
              <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
                <ModuleHeader
                  eyebrow="সদ্য যোগ হয়েছে"
                  title="নতুন প্রকাশনা"
                  subtitle="সদ্য দোকানে যোগ হওয়া বই"
                  href="/shop?sort=newest"
                  linkText="নতুনগুলো দেখুন"
                  eyebrowClass="text-teal-deep"
                />
                <ProductGrid products={modules.newArrivals} className="mt-6" />
              </div>
            </section>
          ) : null}

          {/* ── Format explainer ─────────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-marigold-deep">
              <span className="h-px w-7 bg-current opacity-50" aria-hidden />
              ফরম্যাট
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">এক বই, তিন ফরম্যাটে</h2>
            <p className="mt-1 text-sm text-muted-foreground">যেভাবে পড়তে চান, সেভাবেই কিনুন।</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
              {FORMAT_CARDS.map(({ Icon, title, text, card, icon, titleCls }) => (
                <div
                  key={title}
                  className={`rounded-xl border p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${card}`}
                >
                  <div className={`flex size-11 items-center justify-center rounded-lg shadow-sm ${icon}`}>
                    <Icon aria-hidden className="size-5" />
                  </div>
                  <h3 className={`mt-3 font-semibold ${titleCls}`}>{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/75">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Collections (tinted panels) ──────────────────────────────── */}
          {modules.collections.length > 0 ? (
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-plum">
                <span className="h-px w-7 bg-current opacity-50" aria-hidden />
                সংগ্রহ
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">বাছাই করা সংগ্রহ</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                এক সুতোয় গাঁথা বইয়ের তাক, পুরো সংগ্রহটাও ঘুরে দেখতে পারেন।
              </p>
              <div className="mt-8 space-y-6">
                {modules.collections.map((col, i) => (
                  <article
                    key={col.slug}
                    className={`rounded-2xl border p-5 md:p-7 ${COL_TINTS[i % COL_TINTS.length]}`}
                  >
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl font-semibold md:text-2xl">{col.title}</h3>
                        {col.description ? (
                          <p className="mt-1 max-w-xl text-sm text-foreground/70">{col.description}</p>
                        ) : null}
                      </div>
                      <Link
                        href={`/collections/${col.slug}`}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 bg-card/80 px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
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
                          className="group block overflow-hidden rounded-[3px] bg-card shadow-md shadow-ink/10 transition-transform duration-200 hover:-translate-y-0.5"
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

          {/* ── CTA band ─────────────────────────────────────────────────── */}
          <section className="mx-auto w-full max-w-7xl px-4 pb-4 pt-6 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-ember px-6 py-10 text-[#fdf4e0] md:px-12 md:py-12">
              <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" aria-hidden />
              <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#fdf8ec] md:text-3xl">
                    আজই পড়া শুরু করুন
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-[#f3e2bd]/85 md:text-base">
                    নতুন প্রকাশনা থেকে চিরচেনা নাম, সব এক ছাদের নিচে; পছন্দের ফরম্যাটে পৌঁছে যাবে ঘরে।
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex h-12 shrink-0 items-center gap-2 rounded-md bg-marigold px-7 text-base font-semibold text-white shadow-lg shadow-black/25 transition hover:bg-marigold-deep"
                >
                  কেনাকাটা শুরু করুন
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ── Trust strip (marigold band) ──────────────────────────────────── */}
      <section aria-label="আমাদের প্রতিশ্রুতি" className="mt-8 bg-marigold-soft/60">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-marigold/25 bg-white text-oxblood shadow-sm">
                <Icon aria-hidden className="size-5" />
              </span>
              <p className="pt-2 text-sm font-medium leading-snug text-[#5c430e]">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
