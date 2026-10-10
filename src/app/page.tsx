import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  BookOpen,
  Briefcase,
  Feather,
  GraduationCap,
  Headphones,
  Landmark,
  Library,
  LibraryBig,
  PenLine,
  ScrollText,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Sprout,
  Truck,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { findDealProduct, homeModules } from "@/lib/catalog";
import { BookCover } from "@/components/book-cover";
import { ProductGrid, ProductShelf } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { formatBdt } from "@/lib/money";
import { bnNum } from "@/components/catalog-shared";

export const dynamic = "force-dynamic";

/* Category icons, keyed by slug with a safe fallback. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  uponnash: BookOpen,
  golpo: ScrollText,
  kobita: PenLine,
  attounnayon: Sprout,
  byabsa: Briefcase,
  itihas: Landmark,
  "shishu-kishor": Blocks,
  academic: GraduationCap,
  ranna: UtensilsCrossed,
};

const HERO_FEATURES = [
  { Icon: Zap, label: "যাচাইয়ের পরই ডাউনলোড" },
  { Icon: Truck, label: "সারা দেশে ডেলিভারি" },
  { Icon: ShieldCheck, label: "নিরাপদ চেকআউট" },
] as const;

const WHY_ITEMS = [
  {
    Icon: Library,
    title: "বিস্তৃত সংগ্রহ",
    text: "উপন্যাস থেকে রান্নার বই, প্রতিটি বিভাগে বাছাই করা শিরোনাম।",
  },
  {
    Icon: Truck,
    title: "সারা দেশে ডেলিভারি",
    text: "ঢাকার ভেতরে ও বাইরে, নির্ভরযোগ্য কুরিয়ারে যত্নে মোড়ানো প্যাকেজ।",
  },
  {
    Icon: ShieldCheck,
    title: "নিরাপদ পেমেন্ট",
    text: "ক্যাশ অন ডেলিভারি কিংবা অনলাইন, প্রতিটি লেনদেন যাচাই করা।",
  },
  {
    Icon: Headphones,
    title: "মানুষের সাপোর্ট",
    text: "অর্ডারের আগে পরে ফোন বা চ্যাটে আমরা পাশেই থাকি।",
  },
] as const;

/** Centered section heading in the classic bookshop style. */
function SectionHeading({
  eyebrow,
  title,
  link,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; text: string };
  dark?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <span className="hidden sm:block" aria-hidden />
      <div className="text-center">
        <p className={`flex items-center justify-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.24em] ${dark ? "text-[#dfc07c]" : "text-gold"}`}>
          <span className="h-px w-6 bg-current opacity-60" aria-hidden />
          {eyebrow}
          <span className="h-px w-6 bg-current opacity-60" aria-hidden />
        </p>
        <h2 className={`mt-2 font-display text-2xl font-semibold md:text-[2rem] ${dark ? "text-[#f8f3e3]" : "text-foreground"}`}>
          {title}
        </h2>
      </div>
      <div className="hidden justify-end sm:flex">
        {link ? (
          <Link
            href={link.href}
            className={`group inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${dark ? "text-[#dfc07c] hover:text-[#f0d79a]" : "text-forest hover:text-gold-deep"}`}
          >
            {link.text}
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [modules, deal] = await Promise.all([homeModules(), findDealProduct()]);
  const isEmpty =
    modules.featured.length === 0 &&
    modules.newArrivals.length === 0 &&
    modules.collections.length === 0;

  return (
    <div>
      {/* ── Photographic hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-forest-deep">
        <Image
          src="/images/hero-books.jpg"
          alt="গাঢ় সবুজ দেয়ালের সামনে কাঠের টেবিলে সাজানো পুরনো হার্ডকভার বইয়ের স্তূপ আর সাদা প্রতিমা"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0e2b1f]/95 via-[#0e2b1f]/72 to-[#0e2b1f]/15" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0e2b1f]/60 via-transparent to-transparent" aria-hidden />

        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dfc07c]/45 bg-[#0e2b1f]/40 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#e8cd8b] backdrop-blur-sm">
              <Sparkles aria-hidden className="size-3.5" />
              স্বাধীন বইয়ের দোকান
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.14] text-[#f9f4e4] md:text-6xl">
              পরের প্রিয় বইটা
              <span className="block text-[#ecd9a4]">এখানেই খুঁজে নিন</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#f3eeda]/85 md:text-lg">
              হার্ড কপি, PDF ই-বুক আর বান্ডেল, সব এক জায়গায়। পছন্দের বইটা যত্নে পৌঁছে যাবে ঘরে,
              আর ই-বুক পড়া শুরু হবে সঙ্গে সঙ্গে।
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#f7f2e2] px-7 text-base font-bold text-forest-deep shadow-lg shadow-black/25 transition hover:bg-white"
              >
                <ShoppingBasket aria-hidden className="size-4.5" />
                বই দেখুন
              </Link>
              <Link
                href="/shop?format=digital"
                className="inline-flex h-12 items-center rounded-md border border-[#f3eeda]/45 px-7 text-base font-semibold text-[#f7f2e2] backdrop-blur-sm transition hover:bg-white/10"
              >
                ই-বুক কালেকশন
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              {HERO_FEATURES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-sm font-medium text-[#f3eeda]/80">
                  <Icon aria-hidden className="size-4.5 text-[#e3c06b]" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Feature strip under the hero ──────────────────────────────────── */}
      <section aria-label="আমাদের সুবিধা" className="hairline-b bg-card">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 divide-y divide-hairline px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:px-8">
          {[
            { Icon: Zap, title: "তাৎক্ষণিক ডাউনলোড", text: "পেমেন্ট যাচাইয়ের পরই ই-বুক" },
            { Icon: Truck, title: "সারা দেশে ডেলিভারি", text: "ঢাকার ভেতরে ও বাইরে" },
            { Icon: BadgeCheck, title: "নিরাপদ পেমেন্ট", text: "যাচাইকৃত নিরাপদ চেকআউট" },
            { Icon: Headphones, title: "ব্যক্তিগত সাপোর্ট", text: "চ্যাট বা ফোনে পাশে আছি" },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 px-2 py-5 lg:px-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-gold-soft/50 text-gold-deep">
                <Icon aria-hidden className="size-5.5" />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Browse by category ────────────────────────────────────────────── */}
      {modules.categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
          <SectionHeading eyebrow="বিভাগ অনুযায়ী" title="যা খুঁজছেন, বেছে নিন" />
          <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4 lg:grid-cols-9">
            {modules.categories.map((c) => {
              const Icon = CATEGORY_ICONS[c.slug] ?? LibraryBig;
              return (
                <Link
                  key={c.slug}
                  href={`/category/${c.slug}`}
                  className="group flex flex-col items-center gap-2.5 text-center"
                >
                  <span className="flex size-14 items-center justify-center rounded-full border border-hairline bg-card text-forest shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-forest group-hover:bg-forest group-hover:text-[#ecd9a4] group-hover:shadow-lg group-hover:shadow-forest/20">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <span className="text-xs font-semibold leading-tight text-foreground group-hover:text-forest">
                    {c.name}
                  </span>
                  <span className="-mt-1.5 text-[10px] text-muted-foreground">
                    {bnNum(c.productCount)} বই
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {isEmpty ? (
        /* ── Catalog empty state ────────────────────────────────────────── */
        <section className="mx-auto w-full max-w-7xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-forest-soft text-forest">
            <BookOpen aria-hidden className="size-6" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold">ক্যাটালগ এখনও প্রস্তুত নয়</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            আমরা এই মুহূর্তে দোকান সাজাচ্ছি। বইগুলো যোগ হওয়ার সঙ্গে সঙ্গে এখানে দেখতে পাবেন।
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex h-12 items-center rounded-md bg-primary px-7 text-base font-semibold text-primary-foreground transition hover:bg-forest-deep"
          >
            দোকানে যান
          </Link>
        </section>
      ) : (
        <>
          {/* ── Bestsellers / shop picks ───────────────────────────────────── */}
          {modules.featured.length > 0 ? (
            <section aria-labelledby="home-featured" className="hairline-t bg-ivory">
              <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
                <div id="home-featured">
                  <SectionHeading
                    eyebrow="বেস্টসেলার"
                    title="পাঠকের পছন্দের তালিকা"
                    link={{ href: "/shop", text: "সব বই দেখুন" }}
                  />
                </div>
                <ProductGrid products={modules.featured} colsClass="md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6" className="mt-8" />
              </div>
            </section>
          ) : null}

          {/* ── Why choose PATA (dark green band) ──────────────────────────── */}
          <section aria-labelledby="home-why" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
            <div className="rounded-2xl bg-forest px-6 py-10 text-center md:px-12 md:py-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#dfc07c]">কেন পাতা</p>
              <h2 id="home-why" className="mt-2 font-display text-2xl font-semibold text-[#f8f3e3] md:text-[2rem]">
                পড়ার অভিজ্ঞতাটাই আমাদের কাজ
              </h2>
              <div className="mt-9 grid grid-cols-1 gap-8 text-left sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                {WHY_ITEMS.map(({ Icon, title, text }) => (
                  <div key={title} className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                    <span className="flex size-12 items-center justify-center rounded-full border border-[#dfc07c]/40 text-[#e3c06b]">
                      <Icon aria-hidden className="size-5.5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#f8f3e3]">{title}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-[#f3eeda]/65">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Deal of the week (photo + real discounted book) ────────────── */}
          <section aria-labelledby="home-deal" className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 md:pb-14 lg:px-8">
            <div id="home-deal" className="sr-only">সাপ্তাহিক ডিল</div>
            <div className="grid overflow-hidden rounded-2xl border border-hairline shadow-lg shadow-ink/5 md:grid-cols-2">
              <div className="relative min-h-60 md:min-h-[21rem]">
                <Image
                  src="/images/reading-cozy.jpg"
                  alt="সবুজ চেয়ারে খোলা বই, কম্বল আর ধোঁয়া ওঠা চায়ের কাপ"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="absolute inset-0 object-cover"
                />
                <span className="absolute left-5 top-5 rounded-full bg-oxblood px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-md">
                  {deal ? `এই সপ্তাহের ডিল, ${bnNum(deal.discountPercent)}% ছাড়` : "এই সপ্তাহের বাছাই"}
                </span>
              </div>
              <div className="flex flex-col justify-center bg-forest px-6 py-9 md:px-10">
                {deal ? (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#dfc07c]">সীমিত সময়ের অফার</p>
                    <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-[#f8f3e3] md:text-[1.75rem]">
                      {deal.card.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#f3eeda]/70">{deal.card.authorDisplay}</p>
                    <p className="mt-4 flex flex-wrap items-baseline gap-2.5">
                      <span className="font-display text-4xl font-bold text-[#ecd9a4]">
                        {formatBdt(deal.priceMinor)}
                      </span>
                      <span className="text-base text-[#f3eeda]/55 line-through">
                        {formatBdt(deal.compareAtMinor)}
                      </span>
                    </p>
                    <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#f3eeda]/65">
                      {deal.card.formats.length > 1 ? "একাধিক ফরম্যাটে পাওয়া যাচ্ছে," : "পছন্দের ফরম্যাটে"}
                      {" "}অফারটি চলছে। স্টক শেষ হওয়ার আগেই নিয়ে নিন।
                    </p>
                    <div className="mt-6">
                      <Link
                        href={`/product/${deal.card.slug}`}
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-[#e3c06b] px-6 text-sm font-bold text-forest-deep shadow-md shadow-black/20 transition hover:bg-[#eed48a]"
                      >
                        অফারটি দেখুন
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#dfc07c]">সাপ্তাহিক বাছাই</p>
                    <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-[#f8f3e3] md:text-[1.75rem]">
                      এই সপ্তাহের পড়ার তালিকা
                    </h3>
                    <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[#f3eeda]/65">
                      সম্পাদকদের হাত ঘুরে আসা বইগুলো এক নজরে দেখে নিন, পছন্দের ফরম্যাট আপনি বেছে নিন।
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/shop"
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-[#e3c06b] px-6 text-sm font-bold text-forest-deep shadow-md shadow-black/20 transition hover:bg-[#eed48a]"
                      >
                        দোকানে যান
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── Collections ────────────────────────────────────────────────── */}
          {modules.collections.length > 0 ? (
            <section aria-labelledby="home-collections" className="hairline-t bg-ivory">
              <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
                <div id="home-collections">
                  <SectionHeading
                    eyebrow="কিউরেটেড সংগ্রহ"
                    title="এক সুতোয় গাঁথা বইয়ের তাক"
                  />
                </div>
                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  {modules.collections.map((col) => (
                    <article
                      key={col.slug}
                      className="flex flex-col rounded-2xl border border-hairline bg-card p-6 transition-shadow duration-200 hover:shadow-lg hover:shadow-ink/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-xl font-semibold md:text-2xl">{col.title}</h3>
                          {col.description ? (
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{col.description}</p>
                          ) : null}
                        </div>
                        <Link
                          href={`/collections/${col.slug}`}
                          aria-label={`${col.title} সংগ্রহ দেখুন`}
                          className="group mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline bg-card text-forest transition-colors hover:border-forest hover:bg-forest hover:text-[#ecd9a4]"
                        >
                          <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                      <div className="mt-5 grid grid-cols-4 gap-3">
                        {col.products.slice(0, 4).map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            className="block overflow-hidden rounded-[3px] shadow-md shadow-ink/10 transition-transform duration-200 hover:-translate-y-0.5"
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
              </div>
            </section>
          ) : null}

          {/* ── Newsletter (gift photo + subscribe form) ───────────────────── */}
          <section aria-labelledby="home-newsletter" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
            <div id="home-newsletter" className="sr-only">নিউজলেটার</div>
            <div className="grid overflow-hidden rounded-2xl shadow-lg shadow-ink/5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative min-h-56 lg:min-h-full">
                <Image
                  src="/images/gift-books.jpg"
                  alt="সবুজ ফিতায় মোড়ানো উপহারের প্যাকেট, পাশে দুটি হার্ডকভার বই"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="absolute inset-0 object-cover"
                />
              </div>
              <div className="bg-forest px-6 py-10 md:px-12 md:py-12">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#dfc07c]">নিউজলেটার</p>
                <h3 className="mt-3 font-display text-2xl font-semibold leading-snug text-[#f8f3e3] md:text-[1.9rem]">
                  নতুন বইয়ের খবর <span className="text-[#ecd9a4]">সবার আগে</span>
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#f3eeda]/70">
                  সাপ্তাহিক ডিল, নতুন প্রকাশনা আর পড়ার বাছাই, সব সরাসরি আপনার ইনবক্সে।
                </p>
                <div className="mt-6 max-w-md">
                  <NewsletterForm />
                </div>
              </div>
            </div>
          </section>

          {/* ── New arrivals shelf ─────────────────────────────────────────── */}
          {modules.newArrivals.length > 0 ? (
            <section aria-labelledby="home-arrivals" className="hairline-t bg-ivory">
              <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
                <div id="home-arrivals">
                  <SectionHeading
                    eyebrow="সদ্য যোগ হয়েছে"
                    title="নতুন প্রকাশনা"
                    link={{ href: "/shop?sort=newest", text: "সব নতুন বই" }}
                  />
                </div>
                <ProductShelf products={modules.newArrivals} className="mt-8" />
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
