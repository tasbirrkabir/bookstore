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
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/85 backdrop-blur-md">
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
    <footer className="mt-auto bg-forest-deep text-[#dfe7da]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Top: wordmark + contact */}
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-bengali-serif text-3xl font-semibold tracking-tight text-[#f2f4ea]">
              {settings.storeName}
              <span className="text-[#9dc3a8]">।</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#dfe7da]/70">{settings.tagline}</p>
          </div>
          <ul className="space-y-2.5 text-sm text-[#dfe7da]/75">
            <li className="flex items-center gap-2.5">
              <Phone aria-hidden className="size-4 text-[#9dc3a8]" />
              <a href={`tel:${settings.supportPhone}`} className="transition-colors hover:text-white">{settings.supportPhone}</a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail aria-hidden className="size-4 text-[#9dc3a8]" />
              <a href={`mailto:${settings.supportEmail}`} className="transition-colors hover:text-white">{settings.supportEmail}</a>
            </li>
            {settings.facebookUrl ? (
              <li className="flex items-center gap-2.5">
                <Facebook aria-hidden className="size-4 text-[#9dc3a8]" />
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  ফেসবুক পেজ
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 py-10 sm:grid-cols-3">
          <nav aria-label="বিভাগসমূহ">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9dc3a8]">বিভাগসমূহ</p>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-[#dfe7da]/75 transition-colors hover:text-white">{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="সহায়তা ও নীতিমালা">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9dc3a8]">সহায়তা</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#dfe7da]/75">
              <li><Link href="/about" className="transition-colors hover:text-white">আমাদের কথা</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-white">যোগাযোগ</Link></li>
              <li><Link href="/faq" className="transition-colors hover:text-white">সাধারণ প্রশ্ন</Link></li>
              <li><Link href="/track" className="transition-colors hover:text-white">অর্ডার ট্র্যাক</Link></li>
              <li><Link href="/policies/delivery" className="transition-colors hover:text-white">ডেলিভারি নীতি</Link></li>
              <li><Link href="/policies/returns" className="transition-colors hover:text-white">রিটার্ন ও রিফান্ড</Link></li>
            </ul>
          </nav>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#9dc3a8]">অ্যাকাউন্ট</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#dfe7da]/75">
              <li><Link href="/account" className="transition-colors hover:text-white">আমার অর্ডারসমূহ</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-white">ডিজিটাল লাইব্রেরি</Link></li>
              <li><Link href="/login" className="transition-colors hover:text-white">লগইন</Link></li>
              <li><Link href="/cart" className="transition-colors hover:text-white">কার্ট দেখুন</Link></li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-[#dfe7da]/80">ক্যাশ অন ডেলিভারি</span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-[#dfe7da]/80">{payLabel}</span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-[#dfe7da]/55">
                {isOnlinePaymentAvailable() ? "ডেমো মোড" : "গেটওয়ে কনফিগারের অপেক্ষায়"}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#dfe7da]/55">
            © {year} {settings.storeName} / {settings.storeNameEn}। সকল অধিকার সংরক্ষিত।
          </p>
          <p className="text-[12px] text-[#dfe7da]/45">ডেমো ক্যাটালগ, বই ও মূল্যগুলো নমুনা হিসেবে দেখানো হচ্ছে।</p>
        </div>
      </div>
    </footer>
  );
}
