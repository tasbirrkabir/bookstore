"use client";

// Products list: search + status filter, cover thumb, variant chips, flags,
// edit link and confirm-guarded delete.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Award, Pencil, Plus, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { BookCover } from "@/components/book-cover";
import {
  adminAction,
  adminApi,
  EmptyState,
  fmtDate,
  formatBdt,
  formatLabel,
  PageHeader,
  ProductStatusBadge,
  type ProductsResponse,
  Spinner,
  type AdminProductRow,
} from "@/components/admin/admin-shared";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "সব স্ট্যাটাস" },
  { value: "draft", label: "খসড়া" },
  { value: "published", label: "প্রকাশিত" },
  { value: "archived", label: "আর্কাইভ" },
] as const;

function FlagIcons({ row }: { row: AdminProductRow }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      {row.featured ? (
        <span title="ফিচার্ড">
          <Star className="size-3.5 fill-amber-400 text-amber-500" aria-label="ফিচার্ড" />
          <span className="sr-only">ফিচার্ড</span>
        </span>
      ) : null}
      {row.newArrival ? (
        <span title="নতুন এসেছে">
          <Sparkles className="size-3.5 text-sage" aria-label="নতুন এসেছে" />
          <span className="sr-only">নতুন এসেছে</span>
        </span>
      ) : null}
      {row.editorPick ? (
        <span title="সম্পাদকের পছন্দ">
          <Award className="size-3.5 text-oxblood" aria-label="সম্পাদকের পছন্দ" />
          <span className="sr-only">সম্পাদকের পছন্দ</span>
        </span>
      ) : null}
      {!row.featured && !row.newArrival && !row.editorPick ? <span className="text-xs">—</span> : null}
    </span>
  );
}

function VariantChips({ row }: { row: AdminProductRow }) {
  if (row.variants.length === 0) return <span className="text-xs text-muted-foreground">কোনো ভ্যারিয়েন্ট নেই</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {row.variants.map((v) => (
        <span
          key={v.id}
          className={cn(
            "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-1.5 py-0.5 text-[11px]",
            v.isActive ? "border-hairline bg-muted text-foreground" : "border-dashed border-border bg-transparent text-muted-foreground line-through"
          )}
        >
          {formatLabel(v.formatType)}
          <span className="font-medium tabular-nums">{formatBdt(v.priceMinor)}</span>
          {v.formatType !== "digital" && v.stockOnHand !== null ? (
            <span className={cn("tabular-nums", v.stockOnHand <= 3 ? "text-amber-700" : "text-muted-foreground")}>
              · স্টক {v.stockOnHand}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function DeleteButton({ product, onDeleted }: { product: AdminProductRow; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const del = useMutation({
    mutationFn: () => adminAction({ action: "product_delete", id: product.id }),
    onSuccess: () => {
      toast.success(`“${product.title}” মুছে ফেলা হয়েছে।`);
      setOpen(false);
      onDeleted();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-[44px] px-2.5 text-destructive hover:text-destructive"
          aria-label={`${product.title} ডিলিট করুন`}
        >
          <Trash2 className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">ডিলিট</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>পণ্যটি মুছে ফেলবেন?</AlertDialogTitle>
          <AlertDialogDescription>
            “{product.title}” স্থায়ীভাবে মুছে যাবে — ভ্যারিয়েন্ট, বিভাগ ও কালেকশন লিংকসহ। এই কাজ ফেরানো যাবে না।
          </AlertDialogDescription>
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

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-products", q, status],
    queryFn: () => {
      const p = new URLSearchParams({ resource: "products" });
      if (q) p.set("q", q);
      if (status !== "all") p.set("status", status);
      return adminApi<ProductsResponse>(`/api/admin?${p.toString()}`);
    },
  });

  const rows = data?.products ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="পণ্য"
        description="ক্যাটালগের সব বই — খসড়া, প্রকাশিত ও আর্কাইভ।"
        actions={
          <Button asChild className="min-h-[44px]">
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden />
              নতুন পণ্য
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-card p-3 sm:flex-row sm:items-end sm:gap-4 sm:p-4">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="product-search">খুঁজুন</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="product-search"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="নাম, লেখক বা স্লাগ…"
              className="min-h-[44px] pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="w-full space-y-1.5 sm:w-48">
          <Label htmlFor="product-status">স্ট্যাটাস</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="product-status" className="min-h-[44px] w-full">
              <SelectValue placeholder="সব স্ট্যাটাস" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        {isLoading ? (
          <Spinner label="পণ্য তালিকা লোড হচ্ছে…" />
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">প্রচ্ছদ</TableHead>
                  <TableHead>পণ্য</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="min-w-52">ভ্যারিয়েন্ট</TableHead>
                  <TableHead>চিহ্ন</TableHead>
                  <TableHead>আপডেট</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              {rows.length === 0 ? (
                <TableBody>
                  <EmptyState
                    colSpan={7}
                    title="কোনো পণ্য পাওয়া যায়নি"
                    hint="সার্চ বদলে দেখুন বা নতুন পণ্য যোগ করুন।"
                  />
                </TableBody>
              ) : (
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <BookCover
                          title={p.title}
                          author={p.authorDisplay}
                          coverImage={p.coverImage}
                          coverPattern={p.coverPattern}
                          size="sm"
                          className="w-10 rounded-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {p.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{p.authorDisplay}</p>
                        <p className="text-[11px] text-muted-foreground/80">/{p.slug}</p>
                      </TableCell>
                      <TableCell>
                        <ProductStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell>
                        <VariantChips row={p} />
                      </TableCell>
                      <TableCell>
                        <FlagIcons row={p} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(p.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="outline" size="sm" className="min-h-[44px] px-3">
                            <Link href={`/admin/products/${p.id}`}>
                              <Pencil className="size-4" aria-hidden />
                              এডিট
                            </Link>
                          </Button>
                          <DeleteButton product={p} onDeleted={() => qc.invalidateQueries({ queryKey: ["admin-products"] })} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
          </div>
        )}
      </div>
      {!isLoading && data ? (
        <p className="text-xs text-muted-foreground">
          সর্বশেষ ১০০টি পণ্য দেখানো হচ্ছে{rows.length > 0 ? ` — মোট ${rows.length}টি` : ""}।
        </p>
      ) : null}
    </div>
  );
}
