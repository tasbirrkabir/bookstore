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
    <footer className="mt-auto hairline-t bg-card">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold text-foreground">{settings.storeName}</p>
            <p className="mt-2 text-sm text-muted-foreground">{settings.tagline}</p>
            <p className="mt-3 text-sm text-muted-foreground">{settings.addressLine}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.supportPhone} · {settings.supportEmail}
            </p>
          </div>
          <nav aria-label="বিভাগসমূহ">
            <p className="text-sm font-semibold text-foreground">বিভাগসমূহ</p>
            <ul className="mt-3 space-y-2">
              {categories.slice(0, 6).map((c) => (
                <li key={c.slug}>
                  <Link href={`/category/${c.slug}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="সহায়তা ও নীতিমালা">
            <p className="text-sm font-semibold text-foreground">সহায়তা ও নীতিমালা</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">আমাদের কথা</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">যোগাযোগ</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">সাধারণ প্রশ্ন</Link></li>
              <li><Link href="/policies/delivery" className="hover:text-primary transition-colors">ডেলিভারি নীতি</Link></li>
              <li><Link href="/policies/returns" className="hover:text-primary transition-colors">রিটার্ন ও রিফান্ড</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-primary transition-colors">গোপনীয়তা নীতি</Link></li>
              <li><Link href="/policies/terms" className="hover:text-primary transition-colors">শর্তাবলি</Link></li>
            </ul>
          </nav>
          <div>
            <p className="text-sm font-semibold text-foreground">অর্ডার ও পেমেন্ট</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="/track" className="hover:text-primary transition-colors">অর্ডার ট্র্যাক করুন</Link></li>
              <li><Link href="/account" className="hover:text-primary transition-colors">আমার অর্ডারসমূহ</Link></li>
              <li><Link href="/library" className="hover:text-primary transition-colors">ডিজিটাল লাইব্রেরি</Link></li>
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              পেমেন্ট: ক্যাশ অন ডেলিভারি (শারীরিক বই) · {payLabel}
              {isOnlinePaymentAvailable() ? " — ডেমো মোড" : " — গেটওয়ে কনফিগারের অপেক্ষায়"}
            </p>
          </div>
        </div>
        <div className="mt-8 hairline-t pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {settings.storeName} / {settings.storeNameEn}। সকল অধিকার সংরক্ষিত।
          </p>
          <p className="text-xs text-muted-foreground">ডেমো ক্যাটালগ — বই ও মূল্যগুলো নমুনা হিসেবে দেখানো হচ্ছে।</p>
        </div>
      </div>
    </footer>
  );
}
