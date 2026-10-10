"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X, User, LayoutDashboard, LogIn, BookOpen, Sparkles, Tag, ArrowRight as ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Cat = { slug: string; name: string };

export function HeaderClient({
  storeName,
  storeNameEn,
  categories,
  cartCount,
  isLoggedIn,
  isAdmin,
  userName,
}: {
  storeName: string;
  storeNameEn: string;
  categories: Cat[];
  cartCount: number;
  isLoggedIn: boolean;
  isAdmin: boolean;
  userName: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, startTransition] = useTransition();

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    startTransition(() => {
      router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
      setMobileOpen(false);
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex h-16 items-center gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden -ml-2" aria-label="মেনু খুলুন">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 rounded-none border-ink">
            <SheetTitle className="sr-only">নেভিগেশন মেনু</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="hairline-b flex items-center gap-3 px-4 py-4">
                <span aria-hidden className="flex size-9 items-center justify-center bg-ink font-bengali-serif text-lg font-extrabold text-paper">
                  পা
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-bengali-serif text-xl font-extrabold">{storeName}</span>
                  <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{storeNameEn}</span>
                </span>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 py-3 scroll-slim" aria-label="মোবাইল নেভিগেশন">
                <form onSubmit={submitSearch} className="mb-4 flex gap-2 px-2">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="বই, লেখক, ISBN খুঁজুন…"
                    aria-label="বই খুঁজুন"
                    className="h-10 w-full border-[1.5px] border-ink bg-card px-3 text-sm placeholder:text-muted-foreground"
                  />
                  <Button type="submit" size="icon" aria-label="খুঁজুন" className="rounded-none bg-ink text-paper hover:bg-press">
                    <Search className="size-4" />
                  </Button>
                </form>
                <MobileLink href="/shop" onClick={() => setMobileOpen(false)}>সব বই</MobileLink>
                <MobileLink href="/shop?format=digital" onClick={() => setMobileOpen(false)}>ই-বুক / PDF</MobileLink>
                <MobileLink href="/shop?sort=newest" onClick={() => setMobileOpen(false)}>নতুন বই</MobileLink>
                <MobileLink href="/about" onClick={() => setMobileOpen(false)}>আমাদের কথা</MobileLink>
                <p className="mt-4 mb-1 px-2 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-press">বিভাগ</p>
                {categories.map((c) => (
                  <MobileLink key={c.slug} href={`/category/${c.slug}`} onClick={() => setMobileOpen(false)}>
                    {c.name}
                  </MobileLink>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>

        {/* Masthead wordmark */}
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label={`${storeName}, হোম`}>
          <span
            aria-hidden
            className="flex size-10 items-center justify-center bg-ink font-bengali-serif text-xl font-extrabold text-paper shadow-press-xs"
          >
            পা
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-bengali-serif text-[1.65rem] font-extrabold tracking-tight text-foreground">
              {storeName}
              <span className="text-press">।</span>
            </span>
            <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-[0.32em] text-ink-muted">{storeNameEn}</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-8 hidden lg:flex items-center gap-6 text-[15px] font-medium" aria-label="প্রধান নেভিগেশন">
          <Link href="/shop" className="link-press text-foreground/85 transition-colors hover:text-press">বইসমূহ</Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="link-press text-foreground/85 hover:text-press transition-colors data-[state=open]:text-press outline-none">
              বিভাগ
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-80 overflow-y-auto scroll-slim rounded-none border-[1.5px] border-ink">
              {categories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">এখনও কোনো বিভাগ নেই</div>
              ) : (
                categories.map((c) => (
                  <DropdownMenuItem key={c.slug} asChild>
                    <Link href={`/category/${c.slug}`}>{c.name}</Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/shop?sort=newest" className="link-press text-foreground/85 transition-colors hover:text-press">নতুন বই</Link>
          <Link href="/shop?format=digital" className="link-press text-foreground/85 transition-colors hover:text-press">ই-বুক</Link>
          <Link href="/about" className="link-press text-foreground/85 transition-colors hover:text-press">আমাদের কথা</Link>
        </nav>

        {/* Search (desktop) */}
        <form onSubmit={submitSearch} className="ml-auto hidden md:flex w-52 lg:w-72 items-center" role="search">
          <div className="relative w-full">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="বই, লেখক, ISBN খুঁজুন…"
              aria-label="বই খুঁজুন"
              className="h-10 w-full border-[1.5px] border-ink bg-card pl-9 pr-11 text-sm placeholder:text-muted-foreground focus:shadow-press-xs outline-none transition-shadow"
            />
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <button
              type="submit"
              aria-label="সার্চ করুন"
              className="absolute right-0 top-0 flex h-full w-10 items-center justify-center bg-ink text-paper transition-colors hover:bg-press"
            >
              <ArrowRightIcon className="size-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-0.5 md:ml-2 ml-auto md:ml-0">
          {/* Mobile search */}
          <Link
            href="/shop"
            aria-label="বই খুঁজুন"
            className="inline-flex size-10 items-center justify-center text-foreground/80 hover:text-press md:hidden"
          >
            <Search className="size-5" />
          </Link>

          {/* Account */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="অ্যাকাউন্ট" className="hover:bg-press-soft/60">
                <User className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-[1.5px] border-ink">
              {isLoggedIn ? (
                <>
                  <DropdownMenuLabel>{userName ?? "অ্যাকাউন্ট"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/account"><BookOpen className="mr-2 size-4" /> আমার অর্ডারসমূহ</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/library"><Sparkles className="mr-2 size-4" /> ডিজিটাল লাইব্রেরি</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin"><LayoutDashboard className="mr-2 size-4" /> অ্যাডমিন প্যানেল</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LogoutButton />
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>অ্যাকাউন্ট</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login"><LogIn className="mr-2 size-4" /> লগইন</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register"><User className="mr-2 size-4" /> রেজিস্ট্রেশন</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/track"><Tag className="mr-2 size-4" /> অর্ডার ট্র্যাক</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label={`কার্ট, ${cartCount}টি আইটেম`}
            className="relative inline-flex size-10 items-center justify-center text-foreground/80 hover:text-press"
          >
            <ShoppingCart className="size-5" />
            {cartCount > 0 && (
              <span
                className="absolute top-0.5 right-0 flex h-4.5 min-w-4.5 items-center justify-center bg-press px-1 font-mono text-[10px] font-semibold text-paper"
                aria-hidden
              >
                {cartCount > 9 ? "৯+" : cartCount.toLocaleString("bn-BD")}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block border-b border-hairline px-2 py-3 text-[15px] text-foreground/85 hover:bg-press-soft/40 hover:text-press"
    >
      {children}
    </Link>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="w-full flex items-center px-2 py-1.5 text-sm rounded-sm outline-none hover:bg-accent disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      <X className="mr-2 size-4" /> {busy ? "লগআউট হচ্ছে…" : "লগআউট"}
    </button>
  );
}

/** Dismissible announcement strip, styled as a print notice. */
export function Announcement({ text }: { text: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="bg-ink text-[#f2ecdb]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-2 text-center">
        <span className="hidden sm:inline-block shrink-0 bg-press px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-paper">
          নোটিশ
        </span>
        <p className="flex-1 text-xs sm:text-[13px]">{text}</p>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="ঘোষণা বন্ধ করুন"
          className="shrink-0 p-1 text-[#f2ecdb]/70 hover:text-paper"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
