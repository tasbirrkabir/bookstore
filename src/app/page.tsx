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

/** Two-digit Bengali numeral for the why-section indices. */
function bnPad(n: number) {
  return String(n).padStart(2, "0").replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/* Quiet section header: calm serif title, optional link. */
function SectionHead({
  title,
  link,
}: {
  title: string;
  link?: { href: string; text: string };
}) {
  return (
    <div className="mb-10 border-t border-hairline pt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h2 className="font-bengali-serif text-[1.65rem] font-semibold leading-tight tracking-tight md:text-[1.9rem]">
          {title}
        </h2>
        {link ? (
          <Link
            href={link.href}
            className="link-press inline-flex items-center gap-1.5 pb-1 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            {link.text}
            <ArrowRight aria-hidden className="size-4" />
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
  const totalTitles = modules.categories.reduce((n, c) => n + c.productCount, 0);

  return (
    <div>
      {/* ── Hero: generous whitespace, calm serif, clean photography ─────── */}
      <section className="overflow-x-clip">
        <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-14 sm:px-6 md:pb-10 md:pt-24 lg:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-6">
              <h1 className="font-bengali-serif text-[2.35rem] font-semibold leading-[1.22] tracking-tight text-foreground md:text-[3.1rem] lg:text-[3.5rem] lg:leading-[1.18]">
                ভালো বইয়ের খোঁজ,
                <span className="block">
                  শেষ হোক <span className="text-forest">এখানেই।</span>
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-[15px] leading-[1.9] text-muted-foreground md:text-base">
                হার্ড কপি, PDF ই-বুক আর বান্ডেল, সব এক জায়গায়। পছন্দের বইটা যত্নে পৌঁছে যাবে ঘরে,
                আর ই-বুক পড়া শুরু হবে সঙ্গে সঙ্গে।
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-6">
                <Link
                  href="/shop"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-forest-deep"
                >
                  ক্যাটালগ দেখুন
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
                <Link href="/shop?format=digital" className="link-press text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground">
                  ই-বুক কালেকশন
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src="/images/hero-books.jpg"
                    alt="গাঢ় সবুজ দেয়ালের সামনে কাঠের টেবিলে সাজানো পুরনো হার্ডকভার বইয়ের স্তূপ আর সাদা প্রতিমা"
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 46vw"
                    className="object-cover"
                  />
                </figure>
                <figure className="absolute -bottom-9 -left-3 w-32 overflow-hidden rounded-xl border-[6px] border-background shadow-soft sm:w-40 lg:-left-8">
                  <div className="relative aspect-[3/4]">
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

          {/* Grounded stats, quiet row */}
          <dl className="mt-20 grid grid-cols-3 gap-6 border-y border-hairline py-7 md:mt-24">
            {[
              { v: bnNum(totalTitles), l: "শিরোনাম" },
              { v: bnNum(modules.categories.length), l: "বিভাগ" },
              { v: "৩", l: "ফরম্যাট" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center gap-1 text-center">
                <dd className="font-bengali-serif text-2xl font-semibold text-foreground md:text-[1.85rem]">{s.v}</dd>
                <dt className="text-[11px] font-medium text-muted-foreground md:text-xs">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Browse by category, soft plate cards ─────────────────────────── */}
      {modules.categories.length > 0 ? (
        <section aria-labelledby="home-categories" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <div id="home-categories" className="scroll-mt-24">
            <SectionHead title="যা খুঁজছেন, বেছে নিন" link={{ href: "/shop", text: "সব বই" }} />
          </div>
          <ul className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-3">
            {modules.categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/category/${c.slug}`}
                  className="group flex h-full flex-col justify-between gap-10 rounded-2xl bg-sand p-5 transition-colors duration-300 hover:bg-[#eae7db] md:p-6"
                >
                  <span className="font-mono text-[11px] text-muted-foreground">{bnNum(c.productCount)} বই</span>
                  <span className="flex items-end justify-between gap-3">
                    <span className="font-bengali-serif text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-forest md:text-xl">
                      {c.name}
                    </span>
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-foreground/50 transition-all duration-300 group-hover:border-forest group-hover:bg-forest group-hover:text-primary-foreground"
                    >
                      <ArrowRight className="size-4" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isEmpty ? (
        /* ── Catalog empty state ────────────────────────────────────────── */
        <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-bengali-serif text-3xl font-semibold">ক্যাটালগ এখনও প্রস্তুত নয়</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            আমরা এই মুহূর্তে দোকান সাজাচ্ছি। বইগুলো যোগ হওয়ার সঙ্গে সঙ্গে এখানে দেখতে পাবেন।
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-forest px-7 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-forest-deep"
          >
            দোকানে যান
          </Link>
        </section>
      ) : (
        <>
          {/* ── Bestsellers ────────────────────────────────────────────────── */}
          {modules.featured.length > 0 ? (
            <section aria-labelledby="home-featured" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
              <div id="home-featured" className="scroll-mt-24">
                <SectionHead title="পাঠকের হাতে যা আছে" link={{ href: "/shop", text: "সব বই" }} />
              </div>
              <ProductGrid products={modules.featured} colsClass="grid-cols-2 md:grid-cols-3 xl:grid-cols-6" />
            </section>
          ) : null}

          {/* ── Deal of the week, soft band with a real discount ───────────── */}
          <section aria-labelledby="home-deal" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
            <div id="home-deal" className="sr-only">সাপ্তাহিক ডিল</div>
            <div className="grid overflow-hidden rounded-2xl bg-sand md:grid-cols-[1.05fr_1fr]">
              <div className="p-8 md:p-12">
                {deal ? (
                  <>
                    <h3 className="font-bengali-serif text-xl font-semibold leading-snug tracking-tight text-forest md:text-[1.35rem]">
                      এই সপ্তাহের ডিল
                    </h3>
                    <p className="mt-4 font-bengali-serif text-2xl font-semibold leading-snug tracking-tight md:text-[1.75rem]">
                      {deal.card.title}
                    </p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{deal.card.authorDisplay}</p>
                    <p className="mt-5 flex flex-wrap items-baseline gap-3">
                      <span className="font-bengali-serif text-[2.1rem] font-semibold text-foreground">
                        {formatBdt(deal.priceMinor)}
                      </span>
                      <span className="text-base text-muted-foreground line-through">
                        {formatBdt(deal.compareAtMinor)}
                      </span>
                      <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-press">
                        {bnNum(deal.discountPercent)}% ছাড়
                      </span>
                    </p>
                    <p className="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {deal.card.formats.length > 1 ? "একাধিক ফরম্যাটে পাওয়া যাচ্ছে," : "পছন্দের ফরম্যাটে"} অফারটি চলছে।
                      স্টক শেষ হওয়ার আগেই নিয়ে নিন।
                    </p>
                    <Link
                      href={`/product/${deal.card.slug}`}
                      className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-deep"
                    >
                      অফারটি দেখুন
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="font-bengali-serif text-xl font-semibold leading-snug tracking-tight text-forest md:text-[1.35rem]">
                      এই সপ্তাহের বাছাই
                    </h3>
                    <p className="mt-4 font-bengali-serif text-2xl font-semibold leading-snug tracking-tight md:text-[1.75rem]">
                      পড়ার তালিকা তৈরি হোক এখানেই
                    </p>
                    <p className="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                      সম্পাদকদের হাত ঘুরে আসা বইগুলো এক নজরে দেখে নিন, পছন্দের ফরম্যাট আপনি বেছে নিন।
                    </p>
                    <Link
                      href="/shop"
                      className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-deep"
                    >
                      দোকানে যান
                      <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </>
                )}
              </div>
              <figure className="relative min-h-56 md:min-h-full">
                <Image
                  src="/images/plate-open-book.jpg"
                  alt="খোলা বইয়ের ওপর চশমা আর ধোঁয়া ওঠা চায়ের কাপ, ওপর থেকে তোলা"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover"
                />
              </figure>
            </div>
          </section>

          {/* ── Quote band, a page from Bengali literature ─────────────────── */}
          <section aria-label="পাঠের উদ্ধৃতি" className="border-y border-hairline bg-ivory">
            <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 md:py-20">
              <figure>
                <blockquote className="font-bengali-serif text-[1.35rem] font-medium leading-[1.85] text-foreground md:text-[1.65rem]">
                  আবার আসিব ফিরে ধানসিড়িটির তীরে,
                  <br />
                  এই দেশে জন্ম যদি নিই।
                </blockquote>
                <figcaption className="mt-7 flex items-center justify-center gap-3 text-xs tracking-[0.14em] text-muted-foreground">
                  <span aria-hidden className="h-px w-8 bg-hairline" />
                  জীবনানন্দ দাশ, বনলতা সেন
                  <span aria-hidden className="h-px w-8 bg-hairline" />
                </figcaption>
              </figure>
            </div>
          </section>

          {/* ── Collections, quiet white cards ─────────────────────────────── */}
          {modules.collections.length > 0 ? (
            <section aria-labelledby="home-collections" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
              <div id="home-collections" className="scroll-mt-24">
                <SectionHead title="এক সুতোয় গাঁথা বইয়ের তাক" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                {modules.collections.map((col) => (
                  <article
                    key={col.slug}
                    className="flex flex-col rounded-2xl border border-hairline bg-card p-6 transition-shadow duration-300 hover:shadow-lift md:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bengali-serif text-xl font-semibold tracking-tight">{col.title}</h3>
                        {col.description ? (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{col.description}</p>
                        ) : null}
                      </div>
                      <Link
                        href={`/collections/${col.slug}`}
                        aria-label={`${col.title} সংগ্রহ দেখুন`}
                        className="group mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:border-forest hover:bg-forest hover:text-primary-foreground"
                      >
                        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                    <div className="mt-6 grid grid-cols-4 gap-3">
                      {col.products.slice(0, 4).map((p) => (
                        <Link key={p.id} href={`/product/${p.slug}`} className="block transition-transform duration-300 hover:-translate-y-1">
                          <BookCover
                            title={p.title}
                            author={p.authorDisplay}
                            coverImage={p.coverImage}
                            coverPattern={p.coverPattern}
                            size="sm"
                            className="rounded-md shadow-whisper"
                          />
                        </Link>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Why Pata, quiet ruled columns ──────────────────────────────── */}
          <section aria-labelledby="home-why" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
            <h2 id="home-why" className="sr-only">কেন পাতা</h2>
            <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "বিস্তৃত সংগ্রহ", text: "উপন্যাস থেকে রান্নার বই, প্রতিটি বিভাগে বাছাই করা শিরোনাম।" },
                { title: "সারা দেশে ডেলিভারি", text: "ঢাকার ভেতরে ও বাইরে, নির্ভরযোগ্য কুরিয়ারে যত্নে মোড়ানো প্যাকেজ।" },
                { title: "নিরাপদ পেমেন্ট", text: "ক্যাশ অন ডেলিভারি কিংবা অনলাইন, প্রতিটি লেনদেন যাচাই করা।" },
                { title: "মানুষের সাপোর্ট", text: "অর্ডারের আগে পরে ফোন বা চ্যাটে আমরা পাশেই থাকি।" },
              ].map((w, i) => (
                <div key={w.title} className="border-t border-hairline pt-5">
                  <span aria-hidden className="font-mono text-xs text-forest">{bnPad(i + 1)}</span>
                  <h3 className="mt-2.5 text-[15px] font-semibold text-foreground">{w.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{w.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Newsletter, one quiet deep green band ──────────────────────── */}
          <section aria-labelledby="home-newsletter" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 md:pb-20 lg:px-8">
            <div id="home-newsletter" className="sr-only">নিউজলেটার</div>
            <div className="grid overflow-hidden rounded-2xl bg-forest-deep lg:grid-cols-[1.05fr_1fr]">
              <div className="p-8 md:p-12">
                <h3 className="font-bengali-serif text-2xl font-semibold leading-snug tracking-tight text-[#f2f4ea] md:text-[1.75rem]">
                  নতুন বইয়ের খবর সবার আগে।
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-[#dfe7da]/70">
                  সাপ্তাহিক ডিল, নতুন প্রকাশনা আর পড়ার বাছাই, সব সরাসরি আপনার ইনবক্সে।
                </p>
                <div className="mt-7 max-w-md">
                  <NewsletterForm tone="onDark" />
                </div>
              </div>
              <figure className="relative min-h-56 lg:min-h-full">
                <Image
                  src="/images/plate-shelf.jpg"
                  alt="পুরনো বইয়ের দোকানের কাঠের তাকে সারি সারি রঙিন বই, উষ্ণ আলো"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </figure>
            </div>
          </section>

          {/* ── New arrivals shelf ─────────────────────────────────────────── */}
          {modules.newArrivals.length > 0 ? (
            <section aria-labelledby="home-arrivals" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-2 sm:px-6 lg:px-8">
              <div id="home-arrivals" className="scroll-mt-24">
                <SectionHead
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
