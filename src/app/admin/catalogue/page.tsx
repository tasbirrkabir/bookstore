"use client";

// Catalogue management: categories and collections in two tabs, each with a
// create/edit dialog and confirm-guarded delete (server errors surface as-is).

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PageHeader,
  Spinner,
  YesNoBadge,
  type AdminCategory,
  type AdminCollection,
  type CategoriesResponse,
  type CollectionsResponse,
} from "@/components/admin/admin-shared";

type CatForm = {
  id?: string;
  name: string;
  nameEn: string;
  slug: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};
type ColForm = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_CAT: CatForm = { name: "", nameEn: "", slug: "", description: "", sortOrder: "0", isActive: true };
const EMPTY_COL: ColForm = { title: "", slug: "", description: "", sortOrder: "0", isActive: true };

function DeleteCell({
  what,
  id,
  label,
  onDone,
}: {
  what: "category" | "collection";
  id: string;
  label: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const del = useMutation({
    mutationFn: () => adminAction({ action: `${what}_delete`, id }),
    onSuccess: () => {
      toast.success(`“${label}” মুছে ফেলা হয়েছে।`);
      setOpen(false);
      onDone();
    },
    onError: (e: Error) => {
      // Server blocks deletes that would orphan products, surface verbatim.
      toast.error(e.message);
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="min-h-[44px] px-2.5 text-destructive hover:text-destructive" aria-label={`${label} ডিলিট করুন`}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>মুছে ফেলবেন?</AlertDialogTitle>
          <AlertDialogDescription>
            “{label}” মুছে ফেলা হবে। যুক্ত পণ্য থাকলে সার্ভার মুছতে বাধা দিতে পারে।
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

function CategoriesTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatForm>(EMPTY_CAT);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminApi<CategoriesResponse>("/api/admin?resource=categories"),
  });

  const save = useMutation({
    mutationFn: (f: CatForm) =>
      adminAction({
        action: "category_upsert",
        category: {
          ...(f.id ? { id: f.id } : {}),
          name: f.name,
          nameEn: f.nameEn || undefined,
          slug: f.slug || undefined,
          description: f.description || undefined,
          sortOrder: f.sortOrder.trim() === "" ? 0 : Number(f.sortOrder) || 0,
          isActive: f.isActive,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "বিভাগ আপডেট হয়েছে।" : "বিভাগ তৈরি হয়েছে।");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (c: AdminCategory) => {
    setForm({
      id: c.id,
      name: c.name,
      nameEn: c.nameEn ?? "",
      slug: c.slug,
      description: c.description ?? "",
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const rows = data?.categories ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="min-h-[44px]"
          onClick={() => {
            setForm(EMPTY_CAT);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          নতুন বিভাগ
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        {isLoading ? (
          <Spinner label="বিভাগ লোড হচ্ছে…" />
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>সক্রিয়</TableHead>
                  <TableHead className="text-right">পণ্য</TableHead>
                  <TableHead className="text-right">ক্রম</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              {rows.length === 0 ? (
                <TableBody>
                  <EmptyState colSpan={6} title="কোনো বিভাগ নেই" hint="নতুন বিভাগ তৈরি করুন।" />
                </TableBody>
              ) : (
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-medium">{c.name}</p>
                        {c.nameEn ? <p className="text-xs text-muted-foreground">{c.nameEn}</p> : null}
                      </TableCell>
                      <TableCell className="font-mono text-xs">/{c.slug}</TableCell>
                      <TableCell>
                        <YesNoBadge value={c.isActive} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.productCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="min-h-[44px] px-3" onClick={() => startEdit(c)}>
                            <Pencil className="size-4" aria-hidden />
                            এডিট
                          </Button>
                          <DeleteCell what="category" id={c.id} label={c.name} onDone={() => qc.invalidateQueries({ queryKey: ["admin-categories"] })} />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "বিভাগ সম্পাদনা" : "নতুন বিভাগ"}</DialogTitle>
            <DialogDescription>বিভাগের নাম বাংলায়, স্লাগ ইংরেজিতে রাখা ভালো।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">নাম (বাংলা) *</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-nameEn">নাম (ইংরেজি)</Label>
              <Input id="cat-nameEn" value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug">স্লাগ</Label>
              <Input id="cat-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="min-h-[44px]" placeholder="খালি রাখলে স্বয়ংক্রিয়" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">বিবরণ</Label>
              <Textarea id="cat-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat-sort">ক্রম</Label>
                <Input id="cat-sort" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="min-h-[44px]" />
              </div>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3">
                <span className="text-sm font-medium">সক্রিয়</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} aria-label="সক্রিয়" />
              </label>
            </div>
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

function CollectionsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ColForm>(EMPTY_COL);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => adminApi<CollectionsResponse>("/api/admin?resource=collections"),
  });

  const save = useMutation({
    mutationFn: (f: ColForm) =>
      adminAction({
        action: "collection_upsert",
        collection: {
          ...(f.id ? { id: f.id } : {}),
          title: f.title,
          slug: f.slug || undefined,
          description: f.description || undefined,
          sortOrder: f.sortOrder.trim() === "" ? 0 : Number(f.sortOrder) || 0,
          isActive: f.isActive,
        },
      }),
    onSuccess: () => {
      toast.success(form.id ? "কালেকশন আপডেট হয়েছে।" : "কালেকশন তৈরি হয়েছে।");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-collections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (c: AdminCollection) => {
    setForm({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description ?? "",
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
    });
    setOpen(true);
  };

  const rows = data?.collections ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="min-h-[44px]"
          onClick={() => {
            setForm(EMPTY_COL);
            setOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden />
          নতুন কালেকশন
        </Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-hairline bg-card">
        {isLoading ? (
          <Spinner label="কালেকশন লোড হচ্ছে…" />
        ) : isError ? (
          <p className="p-6 text-sm text-destructive">{error.message}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>শিরোনাম</TableHead>
                  <TableHead>স্লাগ</TableHead>
                  <TableHead>সক্রিয়</TableHead>
                  <TableHead className="text-right">পণ্য</TableHead>
                  <TableHead className="text-right">ক্রম</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              {rows.length === 0 ? (
                <TableBody>
                  <EmptyState colSpan={6} title="কোনো কালেকশন নেই" hint="নতুন কালেকশন তৈরি করুন।" />
                </TableBody>
              ) : (
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="font-mono text-xs">/{c.slug}</TableCell>
                      <TableCell>
                        <YesNoBadge value={c.isActive} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.productCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" className="min-h-[44px] px-3" onClick={() => startEdit(c)}>
                            <Pencil className="size-4" aria-hidden />
                            এডিট
                          </Button>
                          <DeleteCell what="collection" id={c.id} label={c.title} onDone={() => qc.invalidateQueries({ queryKey: ["admin-collections"] })} />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "কালেকশন সম্পাদনা" : "নতুন কালেকশন"}</DialogTitle>
            <DialogDescription>কালেকশন হোমপেজ ও নেভিগেশনে প্রদর্শিত হয়।</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="col-title">শিরোনাম *</Label>
              <Input id="col-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="min-h-[44px]" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="col-slug">স্লাগ</Label>
              <Input id="col-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="min-h-[44px]" placeholder="খালি রাখলে স্বয়ংক্রিয়" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="col-desc">বিবরণ</Label>
              <Textarea id="col-desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="col-sort">ক্রম</Label>
                <Input id="col-sort" type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="min-h-[44px]" />
              </div>
              <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline px-3">
                <span className="text-sm font-medium">সক্রিয়</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} aria-label="সক্রিয়" />
              </label>
            </div>
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

export default function AdminCataloguePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="বিভাগ ও কালেকশন"
        description="দোকানের ব্রাউজিং কাঠামো, বিভাগ ও কিউরেটেড কালেকশন।"
        actions={
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <AlertTriangle className="size-3.5" aria-hidden />
            পণ্যযুক্ত বিভাগ মুছতে সার্ভার বাধা দেবে
          </span>
        }
      />
      <Tabs defaultValue="categories">
        <TabsList className="min-h-[44px]">
          <TabsTrigger value="categories" className="min-h-[44px] px-4">বিভাগ</TabsTrigger>
          <TabsTrigger value="collections" className="min-h-[44px] px-4">কালেকশন</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="collections" className="mt-4">
          <CollectionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
