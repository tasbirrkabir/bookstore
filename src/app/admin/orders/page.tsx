"use client";

// Orders list: search + status/payment filters (Bengali labels), badges and
// per-row detail links. Initial filters can come from query strings
// (e.g. /admin/orders?paymentStatus=cod_due quick links).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  EmptyState,
  fmtDateTime,
  formatBdt,
  OrderStatusBadge,
  PageHeader,
  PaymentStatusBadge,
  Spinner,
  type OrdersResponse,
} from "@/components/admin/admin-shared";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-ui";

const STATUS_KEYS = Object.keys(ORDER_STATUS_LABELS) as (keyof typeof ORDER_STATUS_LABELS)[];
const PAYMENT_KEYS = Object.keys(PAYMENT_STATUS_LABELS) as (keyof typeof PAYMENT_STATUS_LABELS)[];

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const statusKey = searchParams.get("status") ?? "";
  const paymentKey = searchParams.get("paymentStatus") ?? "";
  // Keyed view: quick-link param changes remount the view with fresh filters.
  return (
    <OrdersView
      key={`${statusKey}|${paymentKey}`}
      initialStatus={statusKey || "all"}
      initialPayment={paymentKey || "all"}
    />
  );
}

function OrdersView({ initialStatus, initialPayment }: { initialStatus: string; initialPayment: string }) {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPayment);

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-orders", q, status, paymentStatus],
    queryFn: () => {
      const p = new URLSearchParams({ resource: "orders" });
      if (q) p.set("q", q);
      if (status !== "all") p.set("status", status);
      if (paymentStatus !== "all") p.set("paymentStatus", paymentStatus);
      return adminApi<OrdersResponse>(`/api/admin?${p.toString()}`);
    },
  });

  const rows = data?.orders ?? [];

  return (
    <div className="space-y-5">
      <PageHeader title="অর্ডার" description="সব অর্ডার — ফিল্টার করে বিস্তারিত দেখুন।" />

      <div className="grid gap-3 rounded-lg border border-hairline bg-card p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
        <div className="space-y-1.5 lg:col-span-1">
          <Label htmlFor="order-q">খুঁজুন</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="order-q"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="অর্ডার নং, নাম বা ফোন…"
              className="min-h-[44px] pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order-status">অর্ডার স্ট্যাটাস</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="order-status" className="min-h-[44px]">
              <SelectValue placeholder="সব" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
              {STATUS_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {ORDER_STATUS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="order-pay">পেমেন্ট স্ট্যাটাস</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger id="order-pay" className="min-h-[44px]">
              <SelectValue placeholder="সব" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সব পেমেন্ট</SelectItem>
              {PAYMENT_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {PAYMENT_STATUS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        {isLoading ? (
          <Spinner label="অর্ডার লোড হচ্ছে…" />
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>অর্ডার নং</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>গ্রাহক</TableHead>
                  <TableHead className="text-right">আইটেম</TableHead>
                  <TableHead>পেমেন্ট</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right"> </TableHead>
                </TableRow>
              </TableHeader>
              {rows.length === 0 ? (
                <TableBody>
                  <EmptyState colSpan={8} title="কোনো অর্ডার পাওয়া যায়নি" hint="ফিল্টার বদলে আবার দেখুন।" />
                </TableBody>
              ) : (
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/admin/orders/${o.id}`} className="font-mono text-sm font-medium hover:text-primary hover:underline">
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</TableCell>
                      <TableCell>
                        <p className="font-medium">{o.contactName}</p>
                        <p className="text-xs text-muted-foreground">{o.contactPhone}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="tabular-nums">{o.itemCount}</span>
                        {o.hasDigital ? (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-sm border border-hairline bg-muted px-1 py-0.5 text-[10px] text-muted-foreground" title="ডিজিটাল আইটেম আছে">
                            <FileText className="size-3" aria-hidden />
                            PDF
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={o.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatBdt(o.totalMinor)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/orders/${o.id}`} className="inline-flex min-h-[44px] items-center text-sm font-medium text-primary hover:underline">
                          বিস্তারিত
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
        )}
      </div>
      {!isLoading && data ? <p className="text-xs text-muted-foreground">সর্বশেষ ১০০টি অর্ডার দেখানো হচ্ছে।</p> : null}
    </div>
  );
}
