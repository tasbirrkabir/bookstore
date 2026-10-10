"use client";

// Admin shell: compact top bar ("← দোকানে ফিরুন"), fixed sidebar on lg+ and a
// Sheet-based drawer on smaller screens with active-link highlighting.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  Library,
  Menu,
  ReceiptText,
  ScrollText,
  Settings,
  Tags,
  TicketPercent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "পণ্য", icon: Library, exact: false },
  { href: "/admin/catalogue", label: "বিভাগ ও কালেকশন", icon: Tags, exact: false },
  { href: "/admin/orders", label: "অর্ডার", icon: ReceiptText, exact: false },
  { href: "/admin/coupons", label: "কুপন", icon: TicketPercent, exact: false },
  { href: "/admin/settings", label: "সেটিংস", icon: Settings, exact: false },
  { href: "/admin/audit", label: "অডিট ও নোটিফিকেশন", icon: ScrollText, exact: false },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="অ্যাডমিন মেনু" className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Compact top bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-card px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="size-11 shrink-0 lg:hidden" aria-label="অ্যাডমিন মেনু খুলুন">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="hairline-b px-4 py-3 text-left">
                <SheetTitle className="font-display text-base font-semibold">অ্যাডমিন মেনু</SheetTitle>
              </SheetHeader>
              <div className="scroll-slim max-h-[calc(100dvh-5rem)] overflow-y-auto p-3">
                <AdminNav onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">অ্যাডমিন প্যানেল</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button asChild variant="ghost" className="min-h-[44px] shrink-0 px-3 text-sm">
          <Link href="/">
            <ArrowLeft className="size-4" aria-hidden />
            দোকানে ফিরুন
          </Link>
        </Button>
      </div>

      {/* Sidebar + content */}
      <div className="mt-4 items-start lg:mt-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
        <aside className="sticky top-24 hidden rounded-lg border border-hairline bg-card p-2 lg:block">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
