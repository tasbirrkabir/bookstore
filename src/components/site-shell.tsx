import Link from "next/link";
import { Facebook, Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { listCategories } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { getCartIdFromCookies, quoteCart } from "@/lib/cart";
import { isOnlinePaymentAvailable, providerDisplayName } from "@/lib/payments";
import { HeaderClient, Announcement } from "@/components/header-client";

export async function SiteHeader() {
  const [settings, categories, session] = await Promise.all([getSettings(), listCategories(), getSession()]);
  const cartId = await getCartIdFromCookies();
  const quote = await quoteCart(cartId);

  return (
    <header className="sticky top-0 z-50 border-b-[1.5px] border-ink bg-card">
      {settings.announcementEnabled && settings.announcement ? (
        <Announcement text={settings.announcement} />
      ) : null}
      <HeaderClient
        storeName={settings.storeName}
        storeNameEn={settings.storeNameEn}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        cartCount={quote.itemCount}
        isLoggedIn={!!session}
        isAdmin={session?.role === "admin"}
        userName={session?.name ?? null}
      />
    </header>
  );
}

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getSettings(), listCategories()]);
  const payLabel = providerDisplayName(isOnlinePaymentAvailable() ? "mock" : "disabled");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-ink text-[#efe8d6]">
      <div className="h-1.5 bg-press" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Giant wordmark row */}
        <div className="flex flex-wrap items-end justify-between gap-6 border-b-[1.5px] border-[#efe8d6]/25 pb-8">
          <div>
            <p className="font-bengali-serif text-5xl font-black leading-none tracking-tight text-[#f6efdc] md:text-6xl">
              {settings.storeName}
              <span className="text-press">।</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#efe8d6]/65">{settings.tagline}</p>
          </div>
          {/* Decorative print barcode */}
          <div aria-hidden className="hidden flex-col items-end gap-1.5 sm:flex">
            <span className="flex h-9 items-end gap-[2.5px]">
              {[3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 1].map((w, i) => (
                <span key={i} className="inline-block h-full bg-[#efe8d6]/70" style={{ width: `${w}px` }} />
              ))}
            </span>
            <span className="font-mono text-[9px] tracking-[0.35em] text-[#efe8d6]/45">PATA / DHAKA</span>
          </div>
        </div>

        {/* Boxed link grid */}
        <div className="mt-8 grid gap-[1.5px] border-[1.5px] border-[#efe8d6]/25 bg-[#efe8d6]/25 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div className="bg-ink p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">যোগাযোগ</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#efe8d6]/75">
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden className="size-4 text-press" />
                <a href={`tel:${settings.supportPhone}`} className="hover:text-white transition-colors">{settings.supportPhone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail aria-hidden className="size-4 text-press" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-white transition-colors">{settings.supportEmail}</a>
              </li>
              {settings.facebookUrl ? (
                <li className="flex items-center gap-2.5">
                  <Facebook aria-hidden className="size-4 text-press" />
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    ফেসবুক পেজ
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <nav aria-label="বিভাগসমূহ" className="bg-ink p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">বিভাগসমূহ</p>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-[#efe8d6]/75 transition-colors hover:text-white">{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="সহায়তা ও নীতিমালা" className="bg-ink p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">সহায়তা</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#efe8d6]/75">
              <li><Link href="/about" className="transition-colors hover:text-white">আমাদের কথা</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-white">যোগাযোগ</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-white">সাধারণ প্রশ্ন</Link></li>
              <li><Link href="/track" className="transition-colors hover:text-white">অর্ডার ট্র্যাক</Link></li>
              <li><Link href="/policies/delivery" className="transition-colors hover:text-white">ডেলিভারি নীতি</Link></li>
              <li><Link href="/policies/returns" className="transition-colors hover:text-white">রিটার্ন ও রিফান্ড</Link></li>
              <li><Link href="/policies/privacy" className="transition-colors hover:text-white">গোপনীয়তা নীতি</Link></li>
            </ul>
          </nav>
          <div className="bg-ink p-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">আমার অ্যাকাউন্ট</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#efe8d6]/75">
              <li><Link href="/account" className="transition-colors hover:text-white">আমার অর্ডারসমূহ</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-white">ডিজিটাল লাইব্রেরি</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-white">লগইন</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-white">কার্ট দেখুন</Link></li>
            </ul>
            <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-press">পেমেন্ট</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border border-[#efe8d6]/25 px-2.5 py-1 text-[11px] font-semibold text-[#efe8d6]/80">ক্যাশ অন ডেলিভারি</span>
              <span className="border border-[#efe8d6]/25 px-2.5 py-1 text-[11px] font-semibold text-[#efe8d6]/80">{payLabel}</span>
            </div>
            <p className="mt-3">
              <span className="inline-flex items-center border border-press/60 bg-press/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#f0b9a4]">
                {isOnlinePaymentAvailable() ? "ডেমো মোড" : "গেটওয়ে কনফিগারের অপেক্ষায়"}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[#efe8d6]/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] tracking-wide text-[#efe8d6]/50">
            © {year} {settings.storeName} / {settings.storeNameEn}। সকল অধিকার সংরক্ষিত।
          </p>
          <p className="font-mono text-[11px] tracking-wide text-[#efe8d6]/50">ডেমো ক্যাটালগ, বই ও মূল্যগুলো নমুনা হিসেবে দেখানো হচ্ছে।</p>
        </div>
      </div>
    </footer>
  );
}
