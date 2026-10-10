import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { findDealProduct, homeModules } from "@/lib/catalog";
import { BookCover } from "@/components/book-cover";
import { ProductGrid, ProductShelf } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { formatBdt } from "@/lib/money";
import { bnNum } from "@/components/catalog-shared";

export const dynamic = "force-dynamic";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Two-digit Bengali numeral for section and list indices. */
function bnPad(n: number) {
  return String(n).padStart(2, "0").replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/* Editorial section header: thick top rule, mono kicker, index, serif title. */
function SectionHead({
  kicker,
  index,
  title,
  link,
}: {
  kicker: string;
  index: string;
  title: string;
  link?: { href: string; text: string };
}) {
  return (
    <div className="mb-8 border-t-[1.5px] border-ink pt-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">
            <span>{kicker}</span>
            <span aria-hidden className="h-px w-10 bg-press/60" />
            <span>{index}</span>
          </p>
          <h2 className="mt-2.5 font-bengali-serif text-[1.75rem] font-extrabold leading-tight md:text-[2.1rem]">{title}</h2>
        </div>
        {link ? (
          <Link
            href={link.href}
            className="link-press inline-flex items-center gap-1.5 text-sm font-bold text-foreground/80 transition-colors hover:text-press"
          >
            {link.text}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/* Rotating print stamp for the hero plate composition. */
function HeroStamp() {
  return (
    <div aria-hidden className="absolute -top-6 -left-6 z-20 hidden md:block lg:-top-8 lg:-left-9">
      <svg viewBox="0 0 120 120" className="size-28 animate-rotate-slow lg:size-32">
        <circle cx="60" cy="60" r="58" className="fill-card stroke-press" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="33" fill="none" className="stroke-press/70" strokeWidth="1" strokeDasharray="3 4" />
        <defs>
          <path id="stamp-arc" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" fill="none" />
        </defs>
        <text fontSize="12" className="fill-press" style={{ fontFamily: "var(--font-bengali)", fontWeight: 700, letterSpacing: "1px" }}>
          <textPath href="#stamp-arc">স্বাধীন বইয়ের দোকান • পাতা •</textPath>
        </text>
        <text x="60" y="67" textAnchor="middle" fontSize="17" className="fill-press">✦</text>
      </svg>
    </div>
  );
}

/* Ink ticker strip with the shop highlights, loops seamlessly. */
function Ticker({ items }: { items: string[] }) {
  return (
    <div className="marquee-hover overflow-hidden border-b-[1.5px] border-ink bg-ink py-2.5" role="marquee" aria-label="দোকানের হাইলাইট">
      <div className="flex w-max animate-marquee">
        {[false, true].map((hidden) => (
          <ul key={hidden ? "dup" : "main"} aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
            {items.map((t, i) => (
              <li key={i} className="flex items-center">
                <span className="whitespace-nowrap px-7 text-[13px] font-medium tracking-wide text-[#f2ecdb]">{t}</span>
                <span aria-hidden className="text-xs text-press">✦</span>
              </li>
            ))}
          </ul>
        ))}
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
  const totalTitles = modules.categories.reduce((n, c) => n + c.productCount, 0);

  const tickerItems = [
    ...modules.categories.slice(0, 5).map((c) => c.name),
    "ক্যাশ অন ডেলিভারি",
    "সারা দেশে ডেলিভারি",
    "PDF ই-বুক, সঙ্গে সঙ্গে ডাউনলোড",
    "হার্ড কপি যত্নে মোড়া",
  ];

  return (
    <div>
      <Ticker items={tickerItems} />

      {/* ── Editorial hero: giant serif headline, framed photo plates ─────── */}
      <section className="overflow-x-clip">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-press">
                <span aria-hidden className="inline-block size-2 bg-press" />
                স্বাধীন বইয়ের দোকান
                <span aria-hidden className="h-px flex-1 bg-ink/25" />
              </p>
              <h1 className="mt-6 font-bengali-serif text-[2.55rem] font-black leading-[1.14] tracking-tight text-foreground md:text-6xl lg:text-[3.9rem]">
                ভালো বইয়ের খোঁজ,
                <span className="block">
                  শেষ হোক <span className="mark-red">এখানেই।</span>
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground/75 md:text-lg">
                হার্ড কপি, PDF ই-বুক আর বান্ডেল, সব এক জায়গায়। পছন্দের বইটা যত্নে পৌঁছে যাবে ঘরে,
                আর ই-বুক পড়া শুরু হবে সঙ্গে সঙ্গে।
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center gap-2 border-[1.5px] border-ink bg-ink px-7 text-base font-bold text-paper shadow-press-red transition-[transform,box-shadow,background-color] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:bg-press hover:shadow-press-sm"
                >
                  ক্যাটালগ দেখুন
                  <ArrowRight aria-hidden className="size-4.5" />
                </Link>
                <Link href="/shop?format=digital" className="link-press text-base font-bold text-foreground">
                  ই-বুক কালেকশন
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div aria-hidden className="halftone absolute -right-5 -top-5 h-44 w-44 text-press/45" />
                <HeroStamp />
                <figure className="relative z-10 rotate-[1.2deg] border-[1.5px] border-ink bg-card p-2.5 shadow-press">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src="/images/hero-books.jpg"
                      alt="গাঢ় সবুজ দেয়ালের সামনে কাঠের টেবিলে সাজানো পুরনো হার্ডকভার বইয়ের স্তূপ আর সাদা প্রতিমা"
                      fill
                      priority
                      sizes="(max-width: 1024px) 90vw, 40vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="flex items-center justify-between px-1 pb-0.5 pt-2 font-mono text-[10px] tracking-[0.18em] text-ink-muted">
                    <span>প্লেট ০১</span>
                    <span>দোকানের তাক</span>
                  </figcaption>
                </figure>
                <figure className="absolute -bottom-10 -left-2 z-20 w-32 -rotate-[5deg] border-[1.5px] border-ink bg-card p-1.5 shadow-press-sm sm:w-40 lg:-left-10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src="/images/plate-books-red.jpg"
                      alt="লাল সুতায় বাঁধা পুরনো হার্ডকভার বইয়ের স্তূপ, লাল প্রেক্ষাপট"
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>
                </figure>
              </div>
            </div>
          </div>

          {/* Grounded stats table, broadsheet style */}
          <dl className="mt-16 grid grid-cols-3 border-y-[1.5px] border-ink lg:mt-24">
            {[
              { v: bnNum(totalTitles), l: "শিরোনাম" },
              { v: bnNum(modules.categories.length), l: "বিভাগ" },
              { v: "৩", l: "ফরম্যাট" },
            ].map((s, i) => (
              <div
                key={s.l}
                className={`flex flex-col items-center gap-1 px-2 py-5 text-center ${i > 0 ? "border-l-[1.5px] border-ink" : ""}`}
              >
                <dd className="font-bengali-serif text-3xl font-black text-foreground md:text-4xl">{s.v}</dd>
                <dt className="text-[11px] font-medium text-muted-foreground md:text-xs">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Category index, numbered rows instead of icon circles ────────── */}
      {modules.categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div id="home-categories" className="scroll-mt-24">
            <SectionHead kicker="বিভাগ সূচি" index="০১" title="যা খুঁজছেন, বেছে নিন" link={{ href: "/shop", text: "সব বই" }} />
          </div>
          <ul className="grid border-t border-hairline lg:grid-cols-2 lg:gap-x-12">
            {modules.categories.map((c, i) => (
              <li key={c.slug} className="border-b border-hairline">
                <Link href={`/category/${c.slug}`} className="group flex items-center gap-4 py-4 pr-2 transition-colors hover:bg-card">
                  <span aria-hidden className="w-9 shrink-0 font-mono text-sm font-semibold text-press">{bnPad(i + 1)}</span>
                  <span className="flex-1 font-bengali-serif text-lg font-bold leading-snug transition-colors group-hover:text-press md:text-xl">
                    {c.name}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{bnNum(c.productCount)} বই</span>
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center border-[1.5px] border-ink/25 text-foreground/60 transition-colors group-hover:border-press group-hover:bg-press group-hover:text-paper"
                  >
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isEmpty ? (
        /* ── Catalog empty state ────────────────────────────────────────── */
        <section className="mx-auto w-full max-w-7xl px-4 py-20 text-center sm:px-6">
          <p className="font-mono text-xs font-semibold tracking-[0.3em] text-press">খালি তাক</p>
          <h2 className="mt-3 font-bengali-serif text-3xl font-extrabold">ক্যাটালগ এখনও প্রস্তুত নয়</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            আমরা এই মুহূর্তে দোকান সাজাচ্ছি। বইগুলো যোগ হওয়ার সঙ্গে সঙ্গে এখানে দেখতে পাবেন।
          </p>
          <Link
            href="/shop"
            className="mt-7 inline-flex h-12 items-center border-[1.5px] border-ink bg-ink px-7 text-base font-bold text-paper transition-colors hover:bg-press"
          >
            দোকানে যান
          </Link>
        </section>
      ) : (
        <>
          {/* ── Bestsellers on the print card grid ─────────────────────────── */}
          {modules.featured.length > 0 ? (
            <section aria-labelledby="home-featured" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
              <div id="home-featured" className="scroll-mt-24">
                <SectionHead kicker="বেস্টসেলার" index="০২" title="পাঠকের হাতে যা আছে" link={{ href: "/shop", text: "সব বই" }} />
              </div>
              <ProductGrid products={modules.featured} colsClass="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
            </section>
          ) : null}

          {/* ── Deal ticket, coupon style with perforation + real discount ─── */}
          <section aria-labelledby="home-deal" className="mx-auto w-full max-w-7xl px-4 pb-4 pt-12 sm:px-6 md:pb-6 md:pt-16 lg:px-8">
            <div id="home-deal" className="sr-only">সাপ্তাহিক ডিল</div>
            <SectionHead kicker="ডিল" index="০৩" title="এই সপ্তাহের চুক্তি" />
            <div className="relative border-[1.5px] border-dashed border-ink bg-card">
              <span aria-hidden className="absolute -left-[13px] top-1/2 hidden size-6 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-background md:block" />
              <span aria-hidden className="absolute -right-[13px] top-1/2 hidden size-6 -translate-y-1/2 rounded-full border-[1.5px] border-ink bg-background md:block" />
              <div className="grid items-center md:grid-cols-[1fr_auto]">
                <div className="p-6 md:p-10">
                  {deal ? (
                    <>
                      <span className="inline-block -rotate-2 border border-ink/30 bg-press px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-paper shadow-press-xs">
                        {bnNum(deal.discountPercent)}% ছাড়
                      </span>
                      <h3 className="mt-5 font-bengali-serif text-2xl font-extrabold leading-snug md:text-[1.9rem]">
                        {deal.card.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{deal.card.authorDisplay}</p>
                      <p className="mt-4 flex flex-wrap items-baseline gap-3">
                        <span className="font-bengali-serif text-4xl font-black text-press-deep">
                          {formatBdt(deal.priceMinor)}
                        </span>
                        <span className="font-mono text-lg text-muted-foreground line-through">
                          {formatBdt(deal.compareAtMinor)}
                        </span>
                      </p>
                      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                        {deal.card.formats.length > 1 ? "একাধিক ফরম্যাটে পাওয়া যাচ্ছে," : "পছন্দের ফরম্যাটে"} অফারটি চলছে।
                        স্টক শেষ হওয়ার আগেই নিয়ে নিন।
                      </p>
                      <Link
                        href={`/product/${deal.card.slug}`}
                        className="mt-6 inline-flex h-12 items-center gap-2 border-[1.5px] border-ink bg-ink px-7 text-sm font-bold text-paper transition-colors hover:bg-press"
                      >
                        অফারটি দেখুন
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="inline-block -rotate-2 border border-ink/30 bg-ink px-2.5 py-1 font-mono text-xs font-bold tracking-wide text-paper">
                        সাপ্তাহিক বাছাই
                      </span>
                      <h3 className="mt-5 font-bengali-serif text-2xl font-extrabold leading-snug md:text-[1.9rem]">
                        এই সপ্তাহের পড়ার তালিকা
                      </h3>
                      <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                        সম্পাদকদের হাত ঘুরে আসা বইগুলো এক নজরে দেখে নিন, পছন্দের ফরম্যাট আপনি বেছে নিন।
                      </p>
                      <Link
                        href="/shop"
                        className="mt-6 inline-flex h-12 items-center gap-2 border-[1.5px] border-ink bg-ink px-7 text-sm font-bold text-paper transition-colors hover:bg-press"
                      >
                        দোকানে যান
                        <ArrowRight aria-hidden className="size-4" />
                      </Link>
                    </>
                  )}
                </div>
                <div className="relative hidden p-4 md:block">
                  <div className="relative w-60 rotate-[2deg] border-[1.5px] border-ink bg-card p-1.5 shadow-press-sm lg:w-72">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src="/images/plate-open-book.jpg"
                        alt="খোলা বইয়ের ওপর চশমা আর ধোঁয়া ওঠা চায়ের কাপ, ওপর থেকে তোলা"
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quote band, a page from Bengali literature ─────────────────── */}
          <section aria-label="পাঠের উদ্ধৃতি" className="border-y-[1.5px] border-ink bg-ink text-[#f2ecdb]">
            <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 md:py-16 lg:px-8">
              <figure className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
                <span aria-hidden className="font-display text-[5rem] leading-[0.55] text-press md:text-[7.5rem]">
                  &ldquo;
                </span>
                <div>
                  <blockquote className="max-w-3xl font-bengali-serif text-[1.5rem] font-semibold leading-[1.55] md:text-[2.15rem] md:leading-[1.5]">
                    আবার আসিব ফিরে ধানসিড়িটির তীরে,
                    <br />
                    এই দেশে জন্ম যদি নিই।
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-[#f2ecdb]/60">
                    <span aria-hidden className="h-px w-10 bg-press" />
                    জীবনানন্দ দাশ, বনলতা সেন
                  </figcaption>
                </div>
              </figure>
            </div>
          </section>

          {/* ── Collections as numbered print cards ────────────────────────── */}
          {modules.collections.length > 0 ? (
            <section aria-labelledby="home-collections" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
              <div id="home-collections" className="scroll-mt-24">
                <SectionHead kicker="কিউরেটেড সংগ্রহ" index="০৪" title="এক সুতোয় গাঁথা বইয়ের তাক" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {modules.collections.map((col, ci) => (
                  <article
                    key={col.slug}
                    className="flex flex-col border-[1.5px] border-ink bg-card p-6 transition-[transform,box-shadow] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-press-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">
                          সংগ্রহ, {bnPad(ci + 1)}
                        </p>
                        <h3 className="mt-2 font-bengali-serif text-xl font-extrabold md:text-2xl">{col.title}</h3>
                        {col.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{col.description}</p>
                        ) : null}
                      </div>
                      <Link
                        href={`/collections/${col.slug}`}
                        aria-label={`${col.title} সংগ্রহ দেখুন`}
                        className="group mt-1 grid size-10 shrink-0 place-items-center border-[1.5px] border-ink text-foreground transition-colors hover:bg-press hover:text-paper"
                      >
                        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                    <div className="mt-5 grid grid-cols-4 gap-3 border-t border-hairline pt-5">
                      {col.products.slice(0, 4).map((p) => (
                        <Link
                          key={p.id}
                          href={`/product/${p.slug}`}
                          className="block border border-ink/20 transition-transform hover:-translate-y-1"
                        >
                          <BookCover
                            title={p.title}
                            author={p.authorDisplay}
                            coverImage={p.coverImage}
                            coverPattern={p.coverPattern}
                            size="sm"
                            className="rounded-none"
                          />
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Why Pata, numbered ruled columns, no icons ─────────────────── */}
          <section aria-labelledby="home-why" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <h2 id="home-why" className="sr-only">কেন পাতা</h2>
            <div className="grid gap-[1.5px] border-[1.5px] border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "বিস্তৃত সংগ্রহ", text: "উপন্যাস থেকে রান্নার বই, প্রতিটি বিভাগে বাছাই করা শিরোনাম।" },
                { title: "সারা দেশে ডেলিভারি", text: "ঢাকার ভেতরে ও বাইরে, নির্ভরযোগ্য কুরিয়ারে যত্নে মোড়ানো প্যাকেজ।" },
                { title: "নিরাপদ পেমেন্ট", text: "ক্যাশ অন ডেলিভারি কিংবা অনলাইন, প্রতিটি লেনদেন যাচাই করা।" },
                { title: "মানুষের সাপোর্ট", text: "অর্ডারের আগে পরে ফোন বা চ্যাটে আমরা পাশেই থাকি।" },
              ].map((w, i) => (
                <div key={w.title} className="bg-card p-6">
                  <span aria-hidden className="font-mono text-sm font-semibold text-press">{bnPad(i + 1)}</span>
                  <h3 className="mt-3 font-bengali-serif text-lg font-extrabold">{w.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{w.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Newsletter, boxed card with shelf plate ────────────────────── */}
          <section aria-labelledby="home-newsletter" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <div id="home-newsletter" className="sr-only">নিউজলেটার</div>
            <div className="grid overflow-hidden border-[1.5px] border-ink bg-card lg:grid-cols-[1fr_1.05fr]">
              <figure className="relative min-h-60 border-b-[1.5px] border-ink lg:border-b-0 lg:border-r-[1.5px]">
                <Image
                  src="/images/plate-shelf.jpg"
                  alt="পুরনো বইয়ের দোকানের কাঠের তাকে সারি সারি রঙিন বই, উষ্ণ আলো"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </figure>
              <div className="p-7 md:p-10">
                <p className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">
                  <span>নিউজলেটার</span>
                  <span aria-hidden className="h-px w-10 bg-press/60" />
                  <span>০৬</span>
                </p>
                <h3 className="mt-2.5 font-bengali-serif text-2xl font-extrabold leading-snug md:text-[1.9rem]">
                  নতুন বইয়ের খবর <span className="text-press">সবার আগে</span>।
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
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
            <section aria-labelledby="home-arrivals" className="mx-auto w-full max-w-7xl px-4 pb-14 pt-2 sm:px-6 lg:px-8">
              <div id="home-arrivals" className="scroll-mt-24">
                <SectionHead
                  kicker="সদ্য যোগ হয়েছে"
                  index="০৭"
                  title="নতুন প্রকাশনা"
                  link={{ href: "/shop?sort=newest", text: "সব নতুন বই" }}
                />
              </div>
              <ProductShelf products={modules.newArrivals} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
