"use client";

// Order detail: items + entitlements (+ comp grant), customer/shipping snapshot,
// private admin note, payments, event timeline — with an actions column for
// status transitions and payment actions.

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Download,
  Gift,
  Loader2,
  NotebookPen,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  adminAction,
  adminApi,
  fmtDate,
  fmtDateTime,
  formatBdt,
  formatLabel,
  OrderStatusBadge,
  PageHeader,
  Panel,
  PaymentStatusBadge,
  Spinner,
  ToneBadge,
  type AdminOrderDetail,
  type OrderResponse,
} from "@/components/admin/admin-shared";
import { ALLOWED_TRANSITIONS, ORDER_STATUS_LABELS } from "@/lib/order-ui";
import { cn } from "@/lib/utils";

function mapCompError(e: Error): string {
  if (e.message === "REASON_REQUIRED") return "কারণ লিখুন।";
  if (e.message === "NO_DIGITAL_ASSET") return "এই আইটেমে ডিজিটাল ফাইল নেই।";
  return e.message;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  status_change: "স্ট্যাটাস পরিবর্তন",
  payment: "পেমেন্ট",
  note: "নোট",
  tracking: "ট্র্যাকিং",
};

const ZONE_LABELS: Record<string, string> = {
  inside_dhaka: "ঢাকার ভিতরে",
  outside_dhaka: "ঢাকার বাইরে",
};

const PAYMENT_RECORD_TONE: Record<string, "green" | "amber" | "red" | "gray" | "sage"> = {
  paid: "green",
  failed: "red",
  pending: "sage",
  initiated: "gray",
  refunded: "gray",
};

// ─── Comp grant dialog ───────────────────────────────────────────────────────

function CompDialog({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const grant = useMutation({
    mutationFn: () => adminAction({ action: "entitlement_comp", orderItemId: itemId, reason }),
    onSuccess: () => {
      toast.success("কম্প গ্রান্ট সম্পন্ন হয়েছে।");
      setOpen(false);
      setReason("");
      onDone();
    },
    onError: (e: Error) => toast.error(mapCompError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setReason(""); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] gap-1.5 px-3 text-xs">
          <Gift className="size-3.5" aria-hidden />
          কম্প গ্রান্ট
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>কম্প গ্রান্ট — ডিজিটাল অ্যাক্সেস</DialogTitle>
          <DialogDescription>
            যাচাইকৃত পেমেন্ট ছাড়া ডিজিটাল অ্যাক্সেস মঞ্জুর করছেন। কারণ অডিট লগে সংরক্ষিত হবে।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="comp-reason">কারণ *</Label>
          <Textarea
            id="comp-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="যেমন: পেমেন্ট সফল হয়েও গ্রান্ট হয়নি — রসিদ #XYZ যাচাইকৃত"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)} disabled={grant.isPending}>
            বাতিল
          </Button>
          <Button
            className="min-h-[44px]"
            disabled={grant.isPending || !reason.trim()}
            onClick={() => grant.mutate()}
          >
            {grant.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            গ্রান্ট করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status transition panel ─────────────────────────────────────────────────

function StatusPanel({ order, onDone }: { order: AdminOrderDetail; onDone: () => void }) {
  const targets = ALLOWED_TRANSITIONS[order.status] ?? [];
  // Parent remounts this panel with key={order.status} — state resets naturally.
  const [toStatus, setToStatus] = useState("");
  const [note, setNote] = useState("");
  const [trackingId, setTrackingId] = useState(order.trackingId ?? "");
  const [courierProvider, setCourierProvider] = useState(order.courierProvider ?? "");

  const apply = useMutation({
    mutationFn: () =>
      adminAction({
        action: "order_status",
        orderId: order.id,
        toStatus,
        note: note.trim() || undefined,
        ...(toStatus === "shipped" ? { trackingId: trackingId.trim(), courierProvider: courierProvider.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success(`স্ট্যাটাস আপডেট: ${ORDER_STATUS_LABELS[toStatus as keyof typeof ORDER_STATUS_LABELS] ?? toStatus}`);
      setNote("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (targets.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        এই স্ট্যাটাস থেকে আর কোনো পরিবর্তন সম্ভব নয়।
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="st-target">নতুন স্ট্যাটাস</Label>
        <Select value={toStatus} onValueChange={setToStatus}>
          <SelectTrigger id="st-target" className="min-h-[44px]">
            <SelectValue placeholder="বেছে নিন…" />
          </SelectTrigger>
          <SelectContent>
            {targets.map((t) => (
              <SelectItem key={t} value={t}>
                {ORDER_STATUS_LABELS[t as keyof typeof ORDER_STATUS_LABELS] ?? t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {toStatus === "shipped" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="st-tracking">ট্র্যাকিং আইডি</Label>
            <Input id="st-tracking" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="min-h-[44px]" placeholder="কুরিয়ার ট্র্যাকিং নম্বর" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-courier">কুরিয়ার প্রোভাইডার</Label>
            <Input id="st-courier" value={courierProvider} onChange={(e) => setCourierProvider(e.target.value)} className="min-h-[44px]" placeholder="যেমন: Pathao / Sundarban" />
          </div>
        </>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="st-note">নোট (ঐচ্ছিক)</Label>
        <Input id="st-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-[44px]" placeholder="ইভেন্টে যুক্ত হবে" />
      </div>
      <Button className="min-h-[44px] w-full" disabled={!toStatus || apply.isPending} onClick={() => apply.mutate()}>
        {apply.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
        প্রয়োগ করুন
      </Button>
    </div>
  );
}

// ─── Payment actions ─────────────────────────────────────────────────────────

function PaymentActions({ order, onDone }: { order: AdminOrderDetail; onDone: () => void }) {
  const cod = useMutation({
    mutationFn: () => adminAction({ action: "order_payment", orderId: order.id, paymentAction: "mark_cod_collected" }),
    onSuccess: () => {
      toast.success("COD গৃহীত হিসেবে রেকর্ড হয়েছে।");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refund = useMutation({
    mutationFn: () => adminAction({ action: "order_payment", orderId: order.id, paymentAction: "mark_refunded" }),
    onSuccess: () => {
      toast.success("রিফান্ড রেকর্ড হয়েছে।");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (order.paymentStatus === "cod_due") {
    return (
      <Button className="min-h-[44px] w-full" disabled={cod.isPending} onClick={() => cod.mutate()}>
        {cod.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BadgeCheck className="size-4" aria-hidden />}
        COD গৃহীত
      </Button>
    );
  }

  if (order.paymentStatus === "paid" || order.paymentStatus === "cod_collected") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="min-h-[44px] w-full text-destructive hover:text-destructive" disabled={refund.isPending}>
            {refund.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Undo2 className="size-4" aria-hidden />}
            রিফান্ড রেকর্ড
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>রিফান্ড রেকর্ড করবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              অর্ডারের পেমেন্ট স্ট্যাটাস “রিফান্ড” হবে এবং অর্ডার স্ট্যাটাসও রিফান্ড হিসেবে চিহ্নিত হবে। টাকা ফেরতের প্রকৃত লেনদেন আপনার গেটওয়ে/ব্যাংকে আলাদাভাবে করতে হবে।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">বাতিল</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                refund.mutate();
              }}
            >
              হ্যাঁ, রিফান্ড রেকর্ড করুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return <p className="text-xs text-muted-foreground">এই পেমেন্ট স্ট্যাটাসে কোনো অ্যাকশন প্রযোজ্য নয়।</p>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="shrink-0 text-xs text-muted-foreground sm:w-36 sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{value}</dd>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => adminApi<OrderResponse>(`/api/admin?resource=order&id=${encodeURIComponent(id)}`),
  });

  const [adminNote, setAdminNote] = useState<string | null>(null);
  const noteMutation = useMutation({
    mutationFn: (note: string) => adminAction({ action: "order_admin_note", orderId: id, note }),
    onSuccess: () => {
      toast.success("প্রাইভেট নোট সংরক্ষিত হয়েছে।");
      setAdminNote(null);
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refetch = () => qc.invalidateQueries({ queryKey: ["admin-order", id] });

  if (isLoading) return <Spinner label="অর্ডার লোড হচ্ছে…" />;
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden />
        <AlertTitle>অর্ডার আনা যায়নি</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  const order = data!.order;
  const noteValue = adminNote ?? order.adminNote ?? "";

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{order.orderNumber}</span>
            {order.isDemo ? <ToneBadge tone="sage">ডেমো</ToneBadge> : null}
          </span>
        }
        description={`তৈরি: ${fmtDateTime(order.createdAt)} · সর্বশেষ আপডেট: ${fmtDateTime(order.updatedAt)}`}
        actions={
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link href="/admin/orders">সব অর্ডার</Link>
          </Button>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-2">
          <Panel title="অর্ডার আইটেমসমূহ">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>বই</TableHead>
                    <TableHead>ফরম্যাট</TableHead>
                    <TableHead className="text-right">সংখ্যা</TableHead>
                    <TableHead className="text-right">একক</TableHead>
                    <TableHead className="text-right">লাইন মোট</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-medium">{item.productTitle}</p>
                        <p className="text-xs text-muted-foreground">{item.authorDisplay}</p>
                        {item.digitalAssetId ? (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {item.entitlements.length === 0 ? (
                              <ToneBadge tone="red" title="এখনো কোনো এনটাইটেলমেন্ট নেই">
                                অ্যাক্সেস নেই
                              </ToneBadge>
                            ) : (
                              item.entitlements.map((en) => (
                                <ToneBadge
                                  key={en.id}
                                  tone={en.status === "active" ? "green" : en.status === "revoked" ? "red" : "gray"}
                                >
                                  <Download className="size-3" aria-hidden />
                                  {en.downloadCount}/{en.maxDownloads}
                                  {en.grantedBy === "admin_comp" ? " · কম্প" : ""}
                                  {en.status !== "active" ? ` · ${en.status === "revoked" ? "বাতিল" : "মেয়াদোত্তীর্ণ"}` : ""}
                                </ToneBadge>
                              ))
                            )}
                            <CompDialog itemId={item.id} onDone={refetch} />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-sm border border-hairline bg-muted px-1.5 py-0.5 text-xs">{formatLabel(item.formatType)}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBdt(item.unitPriceMinor)}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBdt(item.lineTotalMinor)}
                        {item.lineDiscountMinor > 0 ? (
                          <span className="block text-xs font-normal text-muted-foreground">
                            ছাড় −{formatBdt(item.lineDiscountMinor)}
                          </span>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>

          <Panel title="গ্রাহক ও শিপিং">
            <div className="grid gap-6 sm:grid-cols-2">
              <dl className="space-y-2.5">
                <InfoRow label="নাম" value={order.contactName} />
                <InfoRow label="ফোন" value={order.contactPhone} />
                <InfoRow label="ইমেইল" value={order.contactEmail} />
                <InfoRow label="গেস্ট ইমেইল" value={order.guestEmail} />
                <InfoRow label="গেস্ট ফোন" value={order.guestPhone} />
                {order.userId ? <InfoRow label="অ্যাকাউন্ট" value={`লগইনকৃত (${order.userId.slice(0, 8)}…)`} /> : null}
              </dl>
              <dl className="space-y-2.5">
                <InfoRow label="প্রাপক" value={order.shippingName} />
                <InfoRow label="প্রাপকের ফোন" value={order.shippingPhone} />
                <InfoRow label="জেলা" value={order.shippingDistrict} />
                <InfoRow label="এলাকা" value={order.shippingArea} />
                <InfoRow label="ঠিকানা" value={order.shippingAddress} />
                <InfoRow label="পোস্টকোড" value={order.shippingPostcode} />
                <InfoRow label="জোন" value={order.shippingZone ? ZONE_LABELS[order.shippingZone] ?? order.shippingZone : null} />
                <InfoRow label="ডেলিভারি নোট" value={order.shippingNote} />
                <InfoRow label="কুরিয়ার / ট্র্যাকিং" value={[order.courierProvider, order.trackingId].filter(Boolean).join(" · ") || null} />
              </dl>
            </div>
            {order.customerNote ? (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <span className="font-medium">গ্রাহকের নোট:</span> {order.customerNote}
              </div>
            ) : null}
            {order.couponCode ? (
              <p className="mt-3 text-sm text-muted-foreground">কুপন: <span className="font-mono font-medium text-foreground">{order.couponCode}</span></p>
            ) : null}
          </Panel>

          <Panel
            title="প্রাইভেট অ্যাডমিন নোট"
            description="শুধু অ্যাডমিন দেখবে — গ্রাহক কখনো নয়।"
          >
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={noteValue}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="অভ্যন্তরীণ নোট লিখুন…"
                aria-label="প্রাইভেট অ্যাডমিন নোট"
              />
              <div className="flex justify-end">
                <Button
                  className="min-h-[44px]"
                  disabled={noteMutation.isPending || noteValue.trim() === ""}
                  onClick={() => noteMutation.mutate(noteValue.trim())}
                >
                  {noteMutation.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <NotebookPen className="size-4" aria-hidden />}
                  নোট সংরক্ষণ করুন
                </Button>
              </div>
            </div>
          </Panel>

          <Panel title="পেমেন্ট" description="অর্ডারের সব পেমেন্ট রেকর্ড।">
            {order.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো পেমেন্ট রেকর্ড নেই।</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>প্রোভাইডার</TableHead>
                      <TableHead>মেথড</TableHead>
                      <TableHead>ট্রানজেকশন</TableHead>
                      <TableHead className="text-right">পরিমাণ</TableHead>
                      <TableHead>স্ট্যাটাস</TableHead>
                      <TableHead>যাচাইকাল</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.provider}</TableCell>
                        <TableCell>{p.method ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{p.providerTxnId ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatBdt(p.amountMinor)}</TableCell>
                        <TableCell>
                          <ToneBadge tone={PAYMENT_RECORD_TONE[p.status] ?? "gray"}>{p.status}</ToneBadge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {p.verifiedAt ? fmtDateTime(p.verifiedAt) : `— (${fmtDate(p.createdAt)})`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Panel>

          <Panel title="ইভেন্ট টাইমলাইন">
            {order.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো ইভেন্ট নেই।</p>
            ) : (
              <ol className="relative space-y-5 border-l border-hairline pl-5">
                {order.events.map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[26px] top-1 flex size-2.5 items-center justify-center rounded-full bg-oxblood/70" aria-hidden />
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-sm font-medium">{EVENT_TYPE_LABELS[ev.type] ?? ev.type}</span>
                      {ev.fromStatus || ev.toStatus ? (
                        <span className="text-xs text-muted-foreground">
                          {ev.fromStatus ? ORDER_STATUS_LABELS[ev.fromStatus as keyof typeof ORDER_STATUS_LABELS] ?? ev.fromStatus : ""}
                          {ev.fromStatus && ev.toStatus ? " → " : ""}
                          {ev.toStatus ? ORDER_STATUS_LABELS[ev.toStatus as keyof typeof ORDER_STATUS_LABELS] ?? ev.toStatus : ""}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3" aria-hidden />
                        {fmtDateTime(ev.createdAt)}
                      </span>
                    </div>
                    {ev.message ? <p className="mt-0.5 text-sm text-muted-foreground">{ev.message}</p> : null}
                    <p className="text-xs text-muted-foreground/80">{ev.actor}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* Right column — actions */}
        <div className="space-y-5">
          <Panel title="অ্যাকশন">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
              </div>
              <Separator />
              <StatusPanel key={order.status} order={order} onDone={refetch} />
              <Separator />
              <PaymentActions key={order.paymentStatus} order={order} onDone={refetch} />
            </div>
          </Panel>

          <Panel title="মূল্য হিসাব">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">সাবটোটাল</dt>
                <dd className="tabular-nums">{formatBdt(order.subtotalMinor)}</dd>
              </div>
              {order.discountMinor > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ছাড়</dt>
                  <dd className="tabular-nums text-sage">−{formatBdt(order.discountMinor)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ডেলিভারি</dt>
                <dd className="tabular-nums">{formatBdt(order.shippingMinor)}</dd>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <dt>মোট</dt>
                <dd className="tabular-nums">{formatBdt(order.totalMinor)}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="নির্দেশিকা">
            <ul className={cn("space-y-2 text-xs text-muted-foreground")}>
              <li>· স্ট্যাটাস পরিবর্তনের সম্ভাব্য পথ সার্ভারে নির্ধারিত — শুধু অনুমোদিত ট্রানজিশন দেখানো হচ্ছে।</li>
              <li>· বাতিল/ফেরতে গেলে শারীরিক স্টক স্বয়ংক্রিয়ভাবে ফেরত যায়।</li>
              <li>· কম্প গ্রান্ট শুধু যাচাইকৃত প্রয়োজনে — প্রতিটি গ্রান্ট অডিট লগে থাকে।</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
