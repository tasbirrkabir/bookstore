"use client";

// Admin overview: KPI cards, configuration warnings, low-stock table, quick links.

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  BookX,
  CircleDollarSign,
  MailX,
  Plus,
  ReceiptText,
  ShoppingCart,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminApi,
  formatBdt,
  formatLabel,
  PageHeader,
  Panel,
  Spinner,
  type StatsResponse,
} from "@/components/admin/admin-shared";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  sub,
  href,
  warn,
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  warn?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 font-display text-2xl font-semibold tabular-nums", warn ? "text-amber-700" : "text-foreground")}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </>
  );
  const cls =
    "block rounded-lg border border-hairline bg-card p-4 transition-colors sm:p-5" +
    (href ? " hover:border-oxblood/40" : "");
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function ConfigAlert({
  id,
  dismissed,
  onDismiss,
  tone,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  dismissed: Record<string, boolean>;
  onDismiss: (id: string) => void;
  tone: "warning" | "danger" | "info";
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  if (dismissed[id]) return null;
  const toneCls =
    tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-700"
      : tone === "danger"
        ? "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-700"
        : "border-hairline bg-secondary text-secondary-foreground [&>svg]:text-sage";
  return (
    <Alert className={cn("relative pr-10", toneCls)}>
      <Icon className="size-4" aria-hidden />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="সতর্কবার্তা বন্ধ করুন"
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md hover:bg-black/5"
      >
        <X className="size-4" aria-hidden />
      </button>
    </Alert>
  );
}

export default function AdminOverviewPage() {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const dismiss = (id: string) => {
    setDismissed((d) => ({ ...d, [id]: true }));
    toast("সতর্কবার্তা এই সেশনের জন্য বন্ধ করা হয়েছে।");
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi<StatsResponse>("/api/admin?resource=stats"),
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="ওভারভিউ"
        description="দোকানের সাম্প্রতিক অবস্থা এক নজরে।"
        actions={
          <>
            <Button asChild className="min-h-[44px]">
              <Link href="/admin/products/new">
                <Plus className="size-4" aria-hidden />
                নতুন পণ্য
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link href="/admin/orders">
                <ReceiptText className="size-4" aria-hidden />
                অর্ডার দেখুন
              </Link>
            </Button>
          </>
        }
      />

      {isLoading ? <Spinner label="পরিসংখ্যান লোড হচ্ছে…" /> : null}
      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>পরিসংখ্যান আনা যায়নি</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
            <KpiCard
              label="প্রকাশিত পণ্য"
              value={data.stats.publishedCount}
              sub={`মোট ${data.stats.productCount}টি পণ্য`}
              href="/admin/products"
            />
            <KpiCard label="মোট অর্ডার" value={data.stats.orderCount} href="/admin/orders" />
            <KpiCard
              label="চলমান অর্ডার"
              value={data.stats.pendingOrders}
              warn={data.stats.pendingOrders > 0}
              href="/admin/orders"
            />
            <KpiCard
              label="পরিশোধিত আয়"
              value={formatBdt(data.stats.paidRevenueMinor)}
            />
            <KpiCard
              label="COD পাওনা"
              value={data.stats.codDueOrders}
              warn={data.stats.codDueOrders > 0}
              sub={data.stats.codDueOrders > 0 ? "ক্যাশ অন ডেলিভারি বাকি" : undefined}
              href="/admin/orders?paymentStatus=cod_due"
            />
            <KpiCard
              label="আউটবক্স অপেক্ষমাণ"
              value={data.stats.outboxPending}
              warn={data.stats.outboxPending > 0}
              href="/admin/audit"
            />
          </div>

          <div className="space-y-3">
            {!data.config.emailConfigured ? (
              <ConfigAlert
                id="email"
                dismissed={dismissed}
                onDismiss={dismiss}
                tone="info"
                icon={MailX}
                title="ইমেইল প্রোভাইডার কনফিগার করা নেই"
              >
                সব নোটিফিকেশন NotificationOutbox-এ জমা হচ্ছে — অডিট ও নোটিফিকেশন পাতায় দেখুন।
              </ConfigAlert>
            ) : null}
            {data.config.paymentProvider === "mock" ? (
              <ConfigAlert
                id="pay-mock"
                dismissed={dismissed}
                onDismiss={dismiss}
                tone="warning"
                icon={AlertTriangle}
                title="পেমেন্ট প্রোভাইডার: ডেমো মোড (mock)"
              >
                প্রোডাকশনে আসল গেটওয়ে কনফিগার করুন।
              </ConfigAlert>
            ) : null}
            {data.config.paymentProvider === "disabled" ? (
              <ConfigAlert
                id="pay-disabled"
                dismissed={dismissed}
                onDismiss={dismiss}
                tone="danger"
                icon={Ban}
                title="অনলাইন পেমেন্ট বন্ধ"
              >
                শুধু COD অর্ডার সম্ভব।
              </ConfigAlert>
            ) : null}
          </div>

          <Panel
            title="কম স্টক"
            description="হার্ড কপি/বান্ডেল ভ্যারিয়েন্ট যেখানে স্টক ৩ বা তার কম।"
            actions={
              <Button asChild variant="ghost" size="sm" className="min-h-[44px] text-primary">
                <Link href="/admin/products">সব পণ্য</Link>
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>বই</TableHead>
                    <TableHead>ফরম্যাট</TableHead>
                    <TableHead className="text-right">স্টক</TableHead>
                  </TableRow>
                </TableHeader>
                {data.stats.lowStock.length === 0 ? (
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={3} className="py-10 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5 text-muted-foreground">
                          <CircleDollarSign className="size-6 opacity-60" aria-hidden />
                          <p className="text-sm font-medium text-foreground">সব ঠিক আছে</p>
                          <p className="text-xs">কোনো ভ্যারিয়েন্টের স্টক কম নয়।</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                ) : (
                  <TableBody>
                    {data.stats.lowStock.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="max-w-60 truncate font-medium">{v.title}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 rounded-sm border border-hairline bg-muted px-1.5 py-0.5 text-xs">
                            <BookX className="size-3" aria-hidden />
                            {formatLabel(v.formatType)}
                          </span>
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold tabular-nums", v.stockOnHand === 0 ? "text-destructive" : "text-amber-700")}>
                          {v.stockOnHand}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
            </div>
          </Panel>

          <Panel title="দ্রুত কাজ" description="প্রতিদিনের সাধারণ কাজগুলোর শর্টকাট।">
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin/products/new">
                  <Plus className="size-4" aria-hidden />
                  নতুন পণ্য যোগ করুন
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin/orders?status=confirmed">
                  <ShoppingCart className="size-4" aria-hidden />
                  নিশ্চিত অর্ডার দেখুন
                </Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin/orders?paymentStatus=cod_due">COD পাওনা অর্ডার</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link href="/admin/audit">আউটবক্স দেখুন</Link>
              </Button>
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  );
}
