import Link from "next/link";
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
  return (
    <footer className="mt-auto bg-ink-deep text-[#f0e7d3]">
      {/* Ember top edge */}
      <div className="h-1 bg-gradient-to-r from-oxblood via-clay to-marigold" aria-hidden />
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold text-[#faf3e2]">{settings.storeName}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#f0e7d3]/65">{settings.tagline}</p>
            <p className="mt-4 text-sm text-[#f0e7d3]/65">{settings.addressLine}</p>
            <p className="mt-1.5 text-sm text-[#f0e7d3]/65">
              {settings.supportPhone} · {settings.supportEmail}
            </p>
          </div>
          <nav aria-label="বিভাগসমূহ">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e3b45f]">বিভাগসমূহ</p>
            <ul className="mt-4 space-y-2.5">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-[#f0e7d3]/70 hover:text-white transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="সহায়তা ও নীতিমালা">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e3b45f]">সহায়তা ও নীতিমালা</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#f0e7d3]/70">
              <li><Link href="/about" className="hover:text-white transition-colors">আমাদের কথা</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">সাধারণ প্রশ্ন</Link></li>
              <li><Link href="/policies/delivery" className="hover:text-white transition-colors">ডেলিভারি নীতি</Link></li>
              <li><Link href="/policies/returns" className="hover:text-white transition-colors">রিটার্ন ও রিফান্ড</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-white transition-colors">গোপনীয়তা নীতি</Link></li>
              <li><Link href="/policies/terms" className="hover:text-white transition-colors">শর্তাবলি</Link></li>
            </ul>
          </nav>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#e3b45f]">অর্ডার ও পেমেন্ট</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#f0e7d3]/70">
              <li><Link href="/track" className="hover:text-white transition-colors">অর্ডার ট্র্যাক করুন</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">আমার অর্ডারসমূহ</Link></li>
              <li><Link href="/library" className="hover:text-white transition-colors">ডিজিটাল লাইব্রেরি</Link></li>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-[#f0e7d3]/55">
              পেমেন্ট: ক্যাশ অন ডেলিভারি (শারীরিক বই), {payLabel}
            </p>
            <p className="mt-2">
              <span className="inline-flex items-center rounded-full border border-[#e3b45f]/40 bg-[#e3b45f]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#e3b45f]">
                {isOnlinePaymentAvailable() ? "ডেমো মোড" : "গেটওয়ে কনফিগারের অপেক্ষায়"}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-[#f0e7d3]/55">
            © {new Date().getFullYear()} {settings.storeName} / {settings.storeNameEn}। সকল অধিকার সংরক্ষিত।
          </p>
          <p className="text-xs text-[#f0e7d3]/55">ডেমো ক্যাটালগ, বই ও মূল্যগুলো নমুনা হিসেবে দেখানো হচ্ছে।</p>
        </div>
      </div>
    </footer>
  );
}
