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
    <header className="hairline-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 sticky top-0 z-50">
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
    <footer className="mt-auto bg-forest-deep text-[#f0ead6]">
      <div className="h-px bg-[#dfc07c]/35" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-[#dfc07c]/15 text-[#e3c06b] ring-1 ring-[#dfc07c]/35"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 6c-1.5-1.2-3.6-2-6-2v14c2.4 0 4.5.8 6 2 1.5-1.2 3.6-2 6-2V4c-2.4 0-4.5.8-6 2Z" />
                  <path d="M12 6v14" />
                </svg>
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-2xl font-semibold tracking-tight text-[#faf5e4]">{settings.storeName}</span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.26em] text-[#dfc07c]">{settings.storeNameEn}</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#f0ead6]/65">{settings.tagline}</p>
            <ul className="mt-5 space-y-2 text-sm text-[#f0ead6]/70">
              <li className="flex items-center gap-2.5">
                <Phone aria-hidden className="size-4 text-[#dfc07c]" />
                <a href={`tel:${settings.supportPhone}`} className="hover:text-white transition-colors">{settings.supportPhone}</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail aria-hidden className="size-4 text-[#dfc07c]" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-white transition-colors">{settings.supportEmail}</a>
              </li>
              {settings.facebookUrl ? (
                <li className="flex items-center gap-2.5">
                  <Facebook aria-hidden className="size-4 text-[#dfc07c]" />
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    ফেসবুক পেজ
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <nav aria-label="বিভাগসমূহ">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dfc07c]">বিভাগসমূহ</p>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-[#f0ead6]/70 transition-colors hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="সহায়তা ও নীতিমালা">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dfc07c]">সহায়তা</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#f0ead6]/70">
              <li><Link href="/about" className="transition-colors hover:text-white">আমাদের কথা</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-white">যোগাযোগ</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-white">সাধারণ প্রশ্ন</Link></li>
              <li><Link href="/track" className="transition-colors hover:text-white">অর্ডার ট্র্যাক</Link></li>
              <li><Link href="/policies/delivery" className="transition-colors hover:text-white">ডেলিভারি নীতি</Link></li>
              <li><Link href="/policies/returns" className="transition-colors hover:text-white">রিটার্ন ও রিফান্ড</Link></li>
              <li><Link href="/policies/privacy" className="transition-colors hover:text-white">গোপনীয়তা নীতি</Link></li>
            </ul>
          </nav>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#dfc07c]">আমার অ্যাকাউন্ট</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#f0ead6]/70">
              <li><Link href="/account" className="transition-colors hover:text-white">আমার অর্ডারসমূহ</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-white">ডিজিটাল লাইব্রেরি</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-white">লগইন</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-white">কার্ট দেখুন</Link></li>
            </ul>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-[#dfc07c]">পেমেন্ট</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-[#f0ead6]/75">ক্যাশ অন ডেলিভারি</span>
              <span className="rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-[#f0ead6]/75">{payLabel}</span>
            </div>
            <p className="mt-3">
              <span className="inline-flex items-center rounded-full border border-[#dfc07c]/40 bg-[#dfc07c]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#dfc07c]">
                {isOnlinePaymentAvailable() ? "ডেমো মোড" : "গেটওয়ে কনফিগারের অপেক্ষায়"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#f0ead6]/55">
            © {year} {settings.storeName} / {settings.storeNameEn}। সকল অধিকার সংরক্ষিত।
          </p>
          <p className="text-xs text-[#f0ead6]/55">ডেমো ক্যাটালগ, বই ও মূল্যগুলো নমুনা হিসেবে দেখানো হচ্ছে।</p>
        </div>
      </div>
    </footer>
  );
}
