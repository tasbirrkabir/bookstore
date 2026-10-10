"use client";

// Coupons: table + create/edit dialog matching upsertCoupon's input shape
// (percent value as a number, fixed value as taka string; dates as yyyy-mm-dd).

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  EmptyState,
  fmtDate,
  formatBdt,
  formatLabel,
  PageHeader,
  Spinner,
  ToneBadge,
  YesNoBadge,
  type AdminCoupon,
  type CouponsResponse,
} from "@/components/admin/admin-shared";
import { poishaToTakaInput } from "@/lib/money";

type CouponForm = {
  id?: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  minSpend: string;
  maxDiscount: string;
  appliesToFormat: string; // all | physical | digital | bundle
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
};

const EMPTY: CouponForm = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  minSpend: "",
  maxDiscount: "",
  appliesToFormat: "all",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  isActive: true,
};

function discountDisplay(c: AdminCoupon): string {
  return c.discountType === "percent" ? `${c.discountValue}%` : formatBdt(c.discountValue);
}

function DeleteButton({ coupon, onDone }: { coupon: AdminCoupon; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const del = useMutation({
    mutationFn: () => adminAction({ action: "coupon_delete", id: coupon.id }),
    onSuccess: () => {
      toast.success(`কুপন ${coupon.code} মুছে ফেলা হয়েছে।`);
      setOpen(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-[44px] px-2.5 text-destructive hover:text-destructive" aria-label={`${coupon.code} ডিলিট করুন`}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>কুপন মুছবেন?</AlertDialogTitle>
          <AlertDialogDescription>“{coupon.code}” স্থায়ীভাবে মুছে যাবে — অর্ডারে ব্যবহৃত হলেও।</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-[44px]">বাতিল</AlertDialogCancel>
          <AlertDialogAction
            className="min-h-[44px] bg-destructive text-white hover:bg-destructive/90"
            disabled={del.isPending}
            onClick={(e) => {
              e.preventDefault();
              del.mutate();
            }}
          >
            {del.isPending ? "মুছা হচ্ছে…" : "হ্যাঁ, মুছুন"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CouponForm>(EMPTY);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: () => adminApi<CouponsResponse>("/api/admin?resource=coupons"),
  });

  const save = useMutation({
    mutationFn: (f: CouponForm) =>
      adminAction({
        action: "coupon_upsert",
        coupon: {
          ...(f.id ? { id: f.id } : {}),
          code: f.code,
          description: f.description || undefined,
          discountType: f.discountType,
          discountValueTaka: f.discountValue,
          minSpendTaka: f.minSpend || null,
          maxDiscountTaka: f.discountType === "percent" ? f.maxDiscount || null : null,
          appliesToFormat: f.appliesToFormat === "all" ? null : f.appliesToFormat,
          startsAt: f.startsAt || null,
          endsAt: f.endsAt || null,
          usageLimit: f.usageLimit.trim() === "" ? null : Number(f.usageLimit),
          isActive: f.isActive,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "কুপন আপডেট হয়েছে।" : "কুপন তৈরি হয়েছে।");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (c: AdminCoupon) => {
    setForm({
      id: c.id,
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: c.discountType === "percent" ? String(c.discountValue) : poishaToTakaInput(c.discountValue),
      minSpend: poishaToTakaInput(c.minSpendMinor),
      maxDiscount: poishaToTakaInput(c.maxDiscountMinor),
      appliesToFormat: c.appliesToFormat ?? "all",
      startsAt: c.startsAt ? c.startsAt.slice(0, 10) : "",
      endsAt: c.endsAt ? c.endsAt.slice(0, 10) : "",
      usageLimit: c.usageLimit === null ? "" : String(c.usageLimit),
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const rows = data?.coupons ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="কুপন"
        description="ছাড়ের কোড — শর্ত, মেয়াদ ও ব্যবহারসীমা নিয়ন্ত্রণ করুন।"
        actions={
          <Button
            className="min-h-[44px]"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
            নতুন কুপন
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        {isLoading ? (
          <Spinner label="কুপন লোড হচ্ছে…" />
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>কোড</TableHead>
                  <TableHead>ছাড়</TableHead>
                  <TableHead>সর্বনিম্ন কেনাকাটা</TableHead>
                  <TableHead>প্রযোজ্য ফরম্যাট</TableHead>
                  <TableHead>সময়সীমা</TableHead>
                  <TableHead className="text-right">ব্যবহার</TableHead>
                  <TableHead>সক্রিয়</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              {rows.length === 0 ? (
                <TableBody>
                  <EmptyState colSpan={8} title="কোনো কুপন নেই" hint="নতুন কুপন তৈরি করুন।" />
                </TableBody>
              ) : (
                <TableBody>
                  {rows.map((c) => {
                    const expired = c.endsAt ? new Date(c.endsAt).getTime() < Date.now() : false;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-mono font-semibold">{c.code}</p>
                          {c.description ? <p className="max-w-48 truncate text-xs text-muted-foreground">{c.description}</p> : null}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 font-medium">
                            <TicketPercent className="size-3.5 text-oxblood" aria-hidden />
                            {discountDisplay(c)}
                            {c.maxDiscountMinor ? (
                              <span className="text-xs font-normal text-muted-foreground">(সর্বোচ্চ {formatBdt(c.maxDiscountMinor)})</span>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums">{c.minSpendMinor ? formatBdt(c.minSpendMinor) : "—"}</TableCell>
                        <TableCell className="text-sm">{c.appliesToFormat ? formatLabel(c.appliesToFormat) : "সব ফরম্যাট"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {c.startsAt || c.endsAt ? (
                            <>
                              {c.startsAt ? fmtDate(c.startsAt) : "…"} → {c.endsAt ? fmtDate(c.endsAt) : "…"}
                              {expired ? (
                                <span className="ml-1">
                                  <ToneBadge tone="red">মেয়াদ শেষ</ToneBadge>
                                </span>
                              ) : null}
                            </>
                          ) : (
                            "সর্বদা"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.usageCount}
                          {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                        </TableCell>
                        <TableCell>
                          <YesNoBadge value={c.isActive} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" className="min-h-[44px] px-3" onClick={() => startEdit(c)}>
                              <Pencil className="size-4" aria-hidden />
                              এডিট
                            </Button>
                            <DeleteButton coupon={c} onDone={() => qc.invalidateQueries({ queryKey: ["admin-coupons"] })} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              )}
            </Table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "কুপন সম্পাদনা" : "নতুন কুপন"}</DialogTitle>
            <DialogDescription>কোড A–Z, 0-9 দিয়ে ৩–২৪ অক্ষরের হতে হবে।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cp-code">কোড *</Label>
                <Input
                  id="cp-code"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="min-h-[44px] font-mono uppercase"
                  placeholder="WELCOME10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-type">ছাড়ের ধরন</Label>
                <Select value={form.discountType} onValueChange={(v) => setForm((f) => ({ ...f, discountType: v as "percent" | "fixed" }))}>
                  <SelectTrigger id="cp-type" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">শতাংশ (%)</SelectItem>
                    <SelectItem value="fixed">নির্দিষ্ট পরিমাণ (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-value">{form.discountType === "percent" ? "ছাড়ের হার (%) *" : "ছাড়ের পরিমাণ (৳) *"}</Label>
                <Input
                  id="cp-value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={form.discountType === "percent" ? "1" : "0.01"}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  className="min-h-[44px]"
                />
              </div>
              {form.discountType === "percent" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="cp-max">সর্বোচ্চ ছাড় (৳)</Label>
                  <Input
                    id="cp-max"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    className="min-h-[44px]"
                    placeholder="ঐচ্ছিক"
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="cp-min">সর্বনিম্ন কেনাকাটা (৳)</Label>
                <Input
                  id="cp-min"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.minSpend}
                  onChange={(e) => setForm((f) => ({ ...f, minSpend: e.target.value }))}
                  className="min-h-[44px]"
                  placeholder="ঐচ্ছিক"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-format">প্রযোজ্য ফরম্যাট</Label>
                <Select value={form.appliesToFormat} onValueChange={(v) => setForm((f) => ({ ...f, appliesToFormat: v }))}>
                  <SelectTrigger id="cp-format" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">সব ফরম্যাট</SelectItem>
                    <SelectItem value="physical">হার্ড কপি</SelectItem>
                    <SelectItem value="digital">PDF / ই-বুক</SelectItem>
                    <SelectItem value="bundle">হার্ড কপি + PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-start">শুরু</Label>
                <Input id="cp-start" type="date" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-end">শেষ</Label>
                <Input id="cp-end" type="date" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cp-limit">ব্যবহারসীমা</Label>
                <Input
                  id="cp-limit"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                  className="min-h-[44px]"
                  placeholder="সীমাহীন — খালি রাখুন"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-desc">বিবরণ</Label>
              <Input id="cp-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-[44px]" />
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3">
              <span className="text-sm font-medium">সক্রিয়</span>
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} aria-label="সক্রিয়" />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" className="min-h-[44px]" onClick={() => setOpen(false)} disabled={save.isPending}>
              বাতিল
            </Button>
            <Button className="min-h-[44px]" onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              সংরক্ষণ করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
