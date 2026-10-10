"use client";

// Product editor shared by /admin/products/new and /admin/products/[id].
// Data is NEVER cleared on errors, server errors surface verbatim as inline
// alert + toast while all entered values stay in place.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookCover, COVER_PATTERNS } from "@/components/book-cover";
import {
  adminAction,
  adminApi,
  adminUpload,
  PageHeader,
  Panel,
  Spinner,
  type CategoriesResponse,
  type CollectionsResponse,
  type ProductResponse,
} from "@/components/admin/admin-shared";
import { takaInputToPoisha } from "@/lib/money";
import { FORMAT_LABELS } from "@/lib/order-ui";
import { cn } from "@/lib/utils";

const PATTERN_LABELS: Record<string, string> = {
  oxblood: "মেরুন",
  sage: "সেজ",
  ink: "কালি",
  clay: "মাটি",
  mustard: "সরিষা",
  teal: "টিল",
  plum: "বেগুনি",
};

const STATUS_OPTIONS = [
  { value: "draft", label: "খসড়া" },
  { value: "published", label: "প্রকাশিত" },
  { value: "archived", label: "আর্কাইভ" },
] as const;

type FormatType = "physical" | "digital" | "bundle";

type VariantRow = {
  key: string;
  id?: string;
  formatType: FormatType;
  price: string;
  compareAt: string;
  isActive: boolean;
  stock: string;
  digitalAssetId: string | null;
  digitalAssetName: string | null;
  rightsAt: string | null;
  rightsChecked: boolean;
  downloadLimit: string;
  downloadExpiryDays: string;
};

type FormState = {
  title: string;
  titleEn: string;
  slug: string;
  subtitle: string;
  authorDisplay: string;
  translator: string;
  description: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  publisher: string;
  isbn: string;
  language: "bn" | "en";
  publicationYear: string;
  pageCount: string;
  binding: string;
  edition: string;
  coverPattern: string;
  coverImage: string | null;
  categoryIds: string[];
  collectionIds: string[];
  seoTitle: string;
  seoDescription: string;
  variants: VariantRow[];
};

const EMPTY_FORM: FormState = {
  title: "",
  titleEn: "",
  slug: "",
  subtitle: "",
  authorDisplay: "",
  translator: "",
  description: "",
  status: "draft",
  featured: false,
  newArrival: false,
  editorPick: false,
  publisher: "",
  isbn: "",
  language: "bn",
  publicationYear: "",
  pageCount: "",
  binding: "",
  edition: "",
  coverPattern: "oxblood",
  coverImage: null,
  categoryIds: [],
  collectionIds: [],
  seoTitle: "",
  seoDescription: "",
  variants: [],
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function parseIntOrNull(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : null;
}

function newVariantKey(): string {
  return `v-${Math.random().toString(36).slice(2, 10)}`;
}

function makeVariant(formatType: FormatType): VariantRow {
  return {
    key: newVariantKey(),
    formatType,
    price: "",
    compareAt: "",
    isActive: true,
    stock: "",
    digitalAssetId: null,
    digitalAssetName: null,
    rightsAt: null,
    rightsChecked: false,
    downloadLimit: "",
    downloadExpiryDays: "",
  };
}

// Matches ProductInput in src/lib/admin-service.ts exactly.
type VariantPayload = {
  id?: string;
  formatType: FormatType;
  priceTaka: string;
  compareAtPriceTaka: string | null;
  isActive: boolean;
  stockTaka: string | null;
  digitalAssetId: string | null;
  rightsConfirmed: boolean;
  downloadLimit: number | null;
  downloadExpiryDays: number | null;
};

type ProductPayload = {
  title: string;
  titleEn: string | null;
  slug?: string;
  subtitle: string | null;
  authorDisplay: string;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  language: string;
  publicationYear: number | null;
  pageCount: number | null;
  binding: string | null;
  edition: string | null;
  description: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  coverImage: string | null;
  coverPattern: string;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryIds: string[];
  collectionIds: string[];
  variants: VariantPayload[];
};

function formFromProduct(p: NonNullable<ProductResponse["product"]>): FormState {
  return {
    title: p.title,
    titleEn: p.titleEn ?? "",
    slug: p.slug,
    subtitle: p.subtitle ?? "",
    authorDisplay: p.authorDisplay,
    translator: p.translator ?? "",
    description: p.description ?? "",
    status: (p.status === "published" || p.status === "archived" ? p.status : "draft") as FormState["status"],
    featured: p.featured,
    newArrival: p.newArrival,
    editorPick: p.editorPick,
    publisher: p.publisher ?? "",
    isbn: p.isbn ?? "",
    language: p.language === "en" ? "en" : "bn",
    publicationYear: p.publicationYear === null ? "" : String(p.publicationYear),
    pageCount: p.pageCount === null ? "" : String(p.pageCount),
    binding: p.binding ?? "",
    edition: p.edition ?? "",
    coverPattern: p.coverPattern || "oxblood",
    coverImage: p.coverImage,
    categoryIds: [...p.categories],
    collectionIds: [...p.collections],
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
    variants: p.variants.map((v) => ({
      key: newVariantKey(),
      id: v.id,
      formatType: v.formatType,
      price: v.priceTaka,
      compareAt: v.compareAtPriceTaka ?? "",
      isActive: v.isActive,
      stock: v.stock === null ? "" : String(v.stock),
      digitalAssetId: v.digitalAssetId,
      digitalAssetName: v.digitalAsset?.originalFilename ?? null,
      rightsAt: v.digitalAsset?.rightsConfirmedAt ?? null,
      rightsChecked: v.rightsConfirmed,
      downloadLimit: v.downloadLimit === null ? "" : String(v.downloadLimit),
      downloadExpiryDays: v.downloadExpiryDays === null ? "" : String(v.downloadExpiryDays),
    })),
  };
}

// ─── Small building blocks ───────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-md border border-hairline bg-background px-3 py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdfKey, setUploadingPdfKey] = useState<string | null>(null);
  const slugTouched = useRef(false);
  const initialized = useRef(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const productQ = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => adminApi<ProductResponse>(`/api/admin?resource=product&id=${encodeURIComponent(productId!)}`),
    enabled: !!productId,
  });
  const categoriesQ = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminApi<CategoriesResponse>("/api/admin?resource=categories"),
  });
  const collectionsQ = useQuery({
    queryKey: ["admin-collections"],
    queryFn: () => adminApi<CollectionsResponse>("/api/admin?resource=collections"),
  });

  useEffect(() => {
    if (productId && productQ.data?.product && !initialized.current) {
      initialized.current = true;
      slugTouched.current = true; // existing slug is already set, don't auto-suggest
      setForm(formFromProduct(productQ.data.product));
    }
  }, [productId, productQ.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateVariant = (key: string, patch: Partial<VariantRow>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));

  const addVariant = (formatType: FormatType) =>
    setForm((f) => ({ ...f, variants: [...f.variants, makeVariant(formatType)] }));

  const removeVariant = (key: string) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.key !== key) }));

  const toggleInList = (key: "categoryIds" | "collectionIds", id: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));

  // Live publish guard for active digital/bundle variants.
  const publishBlockers =
    form.status === "published"
      ? form.variants
          .filter((v) => v.isActive && v.formatType !== "physical" && (!v.digitalAssetId || !v.rightsChecked))
          .map((v) => FORMAT_LABELS[v.formatType])
      : [];

  const validate = (): string | null => {
    if (!form.title.trim()) return "বইয়ের নাম দিন।";
    if (!form.authorDisplay.trim()) return "লেখকের নাম দিন।";
    if (!form.description.trim()) return "বইয়ের বিবরণ দিন।";
    if (form.variants.length === 0) return "অন্তত একটি ফরম্যাট/ভ্যারিয়েন্ট যোগ করুন।";
    for (const v of form.variants) {
      const price = takaInputToPoisha(v.price);
      if (price === null || price <= 0) return `“${FORMAT_LABELS[v.formatType]}” ভ্যারিয়েন্টের সঠিক মূল্য দিন (শূন্যের বেশি)।`;
      if (v.compareAt.trim()) {
        const compare = takaInputToPoisha(v.compareAt);
        if (compare === null) return `“${FORMAT_LABELS[v.formatType]}”-এর তুলনামূলক মূল্য সঠিক নয়।`;
        if (compare <= price) return "তুলনামূলক মূল্য বিক্রয়মূল্যের বেশি হতে হবে।";
      }
      if (v.formatType !== "digital" && v.stock.trim()) {
        const s = Number(v.stock);
        if (!Number.isFinite(s) || s < 0 || !Number.isInteger(s)) return "স্টক সংখ্যা সঠিক নয়।";
      }
      if (form.status === "published" && v.isActive && v.formatType !== "physical") {
        if (!v.digitalAssetId) return `${FORMAT_LABELS[v.formatType]} ভ্যারিয়েন্ট প্রকাশের জন্য একটি ব্যক্তিগত PDF ফাইল আপলোড করতে হবে।`;
        if (!v.rightsChecked) return `${FORMAT_LABELS[v.formatType]} ভ্যারিয়েন্টের স্বত্ব নিশ্চিতকরণ চেকবক্সে টিক দিন।`;
      }
    }
    return null;
  };

  const save = useMutation({
    mutationFn: async () => {
      setSaveError(null);
      const err = validate();
      if (err) throw new Error(err);
      const payload: ProductPayload = {
        title: form.title,
        titleEn: form.titleEn.trim() || null,
        slug: form.slug.trim() || undefined,
        subtitle: form.subtitle.trim() || null,
        authorDisplay: form.authorDisplay,
        translator: form.translator.trim() || null,
        publisher: form.publisher.trim() || null,
        isbn: form.isbn.trim() || null,
        language: form.language,
        publicationYear: parseIntOrNull(form.publicationYear),
        pageCount: parseIntOrNull(form.pageCount),
        binding: form.binding.trim() || null,
        edition: form.edition.trim() || null,
        description: form.description,
        status: form.status,
        featured: form.featured,
        newArrival: form.newArrival,
        editorPick: form.editorPick,
        coverImage: form.coverImage,
        coverPattern: form.coverPattern,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        categoryIds: form.categoryIds,
        collectionIds: form.collectionIds,
        variants: form.variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          formatType: v.formatType,
          priceTaka: v.price,
          compareAtPriceTaka: v.compareAt.trim() ? v.compareAt : null,
          isActive: v.isActive,
          stockTaka: v.formatType === "digital" ? null : v.stock.trim() === "" ? "0" : v.stock,
          digitalAssetId: v.formatType === "physical" ? null : v.digitalAssetId,
          rightsConfirmed: v.rightsChecked,
          downloadLimit: v.formatType === "physical" ? null : parseIntOrNull(v.downloadLimit),
          downloadExpiryDays: v.formatType === "physical" ? null : parseIntOrNull(v.downloadExpiryDays),
        })),
      };
      return adminAction<{ ok: true; id: string; slug: string }>({
        action: "product_upsert",
        ...(productId ? { id: productId } : {}),
        product: payload,
      });
    },
    onSuccess: () => {
      toast.success(productId ? "পণ্য আপডেট হয়েছে।" : "পণ্য তৈরি হয়েছে।");
      router.push("/admin/products");
    },
    onError: (e: Error) => {
      setSaveError(e.message);
      toast.error(e.message);
    },
  });

  const uploadCover = async (file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "cover");
      const res = await adminUpload<{ ok: true; publicUrl: string | null }>(fd);
      if (!res.publicUrl) throw new Error("কভার URL পাওয়া যায়নি।");
      set("coverImage", res.publicUrl);
      toast.success("কভার ছবি আপলোড হয়েছে।");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploadingCover(false);
    }
  };

  const uploadPdf = async (key: string, file: File) => {
    setUploadingPdfKey(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "private_pdf");
      fd.append("rightsConfirmed", "true");
      const res = await adminUpload<{ ok: true; assetId: string }>(fd);
      updateVariant(key, {
        digitalAssetId: res.assetId,
        digitalAssetName: file.name,
        rightsAt: new Date().toISOString(),
        rightsChecked: true,
      });
      toast.success("PDF আপলোড হয়েছে, স্বত্ব নিশ্চিতকরণ রেকর্ড হয়েছে।");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "আপলোড ব্যর্থ হয়েছে।");
    } finally {
      setUploadingPdfKey(null);
    }
  };

  if (productId && productQ.isLoading) return <Spinner label="পণ্য লোড হচ্ছে…" />;
  if (productId && productQ.isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" aria-hidden />
        <AlertTitle>পণ্য আনা যায়নি</AlertTitle>
        <AlertDescription>{productQ.error.message}</AlertDescription>
      </Alert>
    );
  }

  const remainingFormats = (["physical", "digital", "bundle"] as FormatType[]).filter(
    (f) => !form.variants.some((v) => v.formatType === f)
  );

  const saveButton = (
    <Button type="button" className="min-h-[44px]" onClick={() => save.mutate()} disabled={save.isPending}>
      {save.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
      {save.isPending ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
    </Button>
  );

  return (
    <form
      className="space-y-5 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <PageHeader
        title={productId ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}
        description={
          productId && productQ.data
            ? `স্লাগ: /${productQ.data.product.slug}`
            : "বইয়ের সব তথ্য পূরণ করে সংরক্ষণ করুন, খসড়া হিসেবে রাখলে দোকানে দেখাবে না।"
        }
        actions={saveButton}
      />

      {saveError ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" aria-hidden />
          <AlertTitle>সংরক্ষণ করা যায়নি</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      ) : null}

      {/* a) মৌলিক তথ্য */}
      <Panel title="মৌলিক তথ্য">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="বইয়ের নাম (বাংলা) *" htmlFor="f-title">
            <Input id="f-title" value={form.title} onChange={(e) => set("title", e.target.value)} required className="min-h-[44px]" />
          </Field>
          <Field
            label="নাম (ইংরেজি)"
            htmlFor="f-titleEn"
            hint="স্লাগ স্বয়ংক্রিয়ভাবে এখান থেকে তৈরি হবে (সম্পাদনাযোগ্য)।"
          >
            <Input
              id="f-titleEn"
              value={form.titleEn}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, titleEn: v, slug: slugTouched.current ? f.slug : slugify(v) }));
              }}
              className="min-h-[44px]"
            />
          </Field>
          <Field label="সাবটাইটেল" htmlFor="f-subtitle" className="sm:col-span-2">
            <Input id="f-subtitle" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="লেখক (প্রদর্শিত নাম) *" htmlFor="f-author">
            <Input id="f-author" value={form.authorDisplay} onChange={(e) => set("authorDisplay", e.target.value)} required className="min-h-[44px]" />
          </Field>
          <Field label="অনুবাদক" htmlFor="f-translator">
            <Input id="f-translator" value={form.translator} onChange={(e) => set("translator", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="বিবরণ *" htmlFor="f-desc" className="sm:col-span-2">
            <Textarea id="f-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={6} required />
          </Field>
          <Field label="স্ট্যাটাস" htmlFor="f-status">
            <Select value={form.status} onValueChange={(v) => set("status", v as FormState["status"])}>
              <SelectTrigger id="f-status" className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="স্লাগ" htmlFor="f-slug" hint="খালি রাখলে নাম থেকে তৈরি হবে।">
            <Input
              id="f-slug"
              value={form.slug}
              onChange={(e) => {
                slugTouched.current = true;
                set("slug", e.target.value);
              }}
              className="min-h-[44px]"
            />
          </Field>
          <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
            <ToggleField
              label="ফিচার্ড"
              checked={form.featured}
              onChange={(v) => set("featured", v)}
              hint="হোমপেজের ফিচার্ড তালিকায় দেখাবে"
            />
            <ToggleField
              label="নতুন এসেছে"
              checked={form.newArrival}
              onChange={(v) => set("newArrival", v)}
              hint="নতুন বইয়ের তালিকায় দেখাবে"
            />
            <ToggleField
              label="সম্পাদকের পছন্দ"
              checked={form.editorPick}
              onChange={(v) => set("editorPick", v)}
            />
            <p className="text-xs text-muted-foreground sm:col-span-3">
              শুধু প্রকৃত নির্বাচন, ভুয়া দাবি নয়। চিহ্নগুলো কেবল সত্যিকারের তালিকাভুক্তি বোঝাতে ব্যবহার করুন।
            </p>
          </div>
        </div>
      </Panel>

      {/* b) মেটাডেটা */}
      <Panel title="মেটাডেটা" description="প্রকাশনা সংক্রান্ত তথ্য, ঐচ্ছিক, তবে সঠিকভাবে পূরণ করুন।">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="প্রকাশক" htmlFor="f-publisher">
            <Input id="f-publisher" value={form.publisher} onChange={(e) => set("publisher", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="ISBN" htmlFor="f-isbn">
            <Input id="f-isbn" value={form.isbn} onChange={(e) => set("isbn", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="ভাষা" htmlFor="f-language">
            <Select value={form.language} onValueChange={(v) => set("language", v as "bn" | "en")}>
              <SelectTrigger id="f-language" className="min-h-[44px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="en">ইংরেজি</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="প্রকাশকাল (সাল)" htmlFor="f-year">
            <Input id="f-year" type="number" min="0" max="2200" value={form.publicationYear} onChange={(e) => set("publicationYear", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="পৃষ্ঠা সংখ্যা" htmlFor="f-pages">
            <Input id="f-pages" type="number" min="0" value={form.pageCount} onChange={(e) => set("pageCount", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="বাঁধাই" htmlFor="f-binding" hint="যেমন: হার্ডকভার, পেপারব্যাক">
            <Input id="f-binding" value={form.binding} onChange={(e) => set("binding", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="সংস্করণ" htmlFor="f-edition">
            <Input id="f-edition" value={form.edition} onChange={(e) => set("edition", e.target.value)} className="min-h-[44px]" />
          </Field>
        </div>
      </Panel>

      {/* c) বিভাগ ও কালেকশন */}
      <Panel title="বিভাগ ও কালেকশন" description="যেখানে বইটি দেখাবে সেগুলো বেছে নিন।">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">বিভাগ</p>
            {categoriesQ.isLoading ? <Spinner label="বিভাগ লোড হচ্ছে…" /> : null}
            {categoriesQ.data && categoriesQ.data.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো বিভাগ নেই, বিভাগ ও কালেকশন পাতায় তৈরি করুন।</p>
            ) : null}
            <div className="scroll-slim max-h-52 space-y-1 overflow-y-auto rounded-md border border-hairline p-2">
              {categoriesQ.data?.categories.map((c) => (
                <label key={c.id} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-md px-2 hover:bg-muted">
                  <Checkbox
                    checked={form.categoryIds.includes(c.id)}
                    onCheckedChange={() => toggleInList("categoryIds", c.id)}
                    aria-label={`বিভাগ: ${c.name}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
                  {!c.isActive ? <span className="text-xs text-muted-foreground">(নিষ্ক্রিয়)</span> : null}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">কালেকশন</p>
            {collectionsQ.isLoading ? <Spinner label="কালেকশন লোড হচ্ছে…" /> : null}
            {collectionsQ.data && collectionsQ.data.collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো কালেকশন নেই, বিভাগ ও কালেকশন পাতায় তৈরি করুন।</p>
            ) : null}
            <div className="scroll-slim max-h-52 space-y-1 overflow-y-auto rounded-md border border-hairline p-2">
              {collectionsQ.data?.collections.map((c) => (
                <label key={c.id} className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-md px-2 hover:bg-muted">
                  <Checkbox
                    checked={form.collectionIds.includes(c.id)}
                    onCheckedChange={() => toggleInList("collectionIds", c.id)}
                    aria-label={`কালেকশন: ${c.title}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{c.title}</span>
                  {!c.isActive ? <span className="text-xs text-muted-foreground">(নিষ্ক্রিয়)</span> : null}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      {/* d) কভার */}
      <Panel title="কভার" description="আপলোড না করলে বেছে নেওয়া রঙের ডেমো প্যাটার্ন দেখানো হবে।">
        <div className="flex flex-col gap-5 sm:flex-row">
          <BookCover
            title={form.title || "বইয়ের নাম"}
            author={form.authorDisplay || undefined}
            coverImage={form.coverImage}
            coverPattern={form.coverPattern}
            size="md"
            className="w-28 shrink-0 rounded-md shadow-sm"
          />
          <div className="min-w-0 flex-1 space-y-4">
            <Field label="ডেমো প্যাটার্ন" htmlFor="f-pattern">
              <Select value={form.coverPattern} onValueChange={(v) => set("coverPattern", v)}>
                <SelectTrigger id="f-pattern" className="min-h-[44px] sm:max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COVER_PATTERNS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span className={cn("cover-pattern", `cover-${p}`)} style={{ display: "inline-block", height: 14, width: 14, borderRadius: 3 }} aria-hidden />
                        {PATTERN_LABELS[p] ?? p}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="space-y-2">
              <p className="text-sm font-medium">কভার ছবি</p>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                aria-label="কভার ছবি আপলোড"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadCover(f);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                  {uploadingCover ? "আপলোড হচ্ছে…" : form.coverImage ? "ছবি বদলান" : "ছবি আপলোড করুন"}
                </Button>
                {form.coverImage ? (
                  <Button type="button" variant="ghost" className="min-h-[44px] text-destructive hover:text-destructive" onClick={() => set("coverImage", null)}>
                    <Trash2 className="size-4" aria-hidden />
                    সরান
                  </Button>
                ) : null}
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="size-3.5" aria-hidden />
                JPG/PNG/WebP/AVIF, সর্বোচ্চ 8MB। প্রচ্ছদ ২:৩ অনুপাতে দেখানো হয়।
              </p>
            </div>
          </div>
        </div>
      </Panel>

      {/* e) ফরম্যাট/ভ্যারিয়েন্ট */}
      <Panel
        title="ফরম্যাট / ভ্যারিয়েন্ট"
        description="প্রতিটি ফরম্যাট একবারই যোগ করা যায়, মূল্য, স্টক ও ডিজিটাল ফাইল এখানে ঠিক করুন।"
      >
        <div className="space-y-4">
          {publishBlockers.length > 0 ? (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-700">
              <AlertTriangle className="size-4" aria-hidden />
              <AlertTitle>প্রকাশের শর্ত পূরণ হয়নি</AlertTitle>
              <AlertDescription>
                {publishBlockers.join(", ")}, প্রকাশ করতে হলে প্রতিটি সক্রিয় ডিজিটাল ভ্যারিয়েন্টে PDF ফাইল ও স্বত্ব নিশ্চিতকরণ আবশ্যক।
              </AlertDescription>
            </Alert>
          ) : null}

          {form.variants.length === 0 ? (
            <p className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
              কোনো ভ্যারিয়েন্ট যোগ করা হয়নি, নিচের বোতাম থেকে ফরম্যাট যোগ করুন।
            </p>
          ) : null}

          {form.variants.map((v) => (
            <div key={v.key} className="rounded-lg border border-hairline bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                  {v.formatType === "physical" ? <Package className="size-3.5" aria-hidden /> : <FileText className="size-3.5" aria-hidden />}
                  {FORMAT_LABELS[v.formatType]}
                  {v.id ? <span className="font-normal text-muted-foreground">(বিদ্যমান)</span> : null}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
                    সক্রিয়
                    <Switch checked={v.isActive} onCheckedChange={(c) => updateVariant(v.key, { isActive: c })} aria-label={`${FORMAT_LABELS[v.formatType]} সক্রিয়`} />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] px-2.5 text-destructive hover:text-destructive"
                    onClick={() => removeVariant(v.key)}
                    aria-label={`${FORMAT_LABELS[v.formatType]} ভ্যারিয়েন্ট সরান`}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="মূল্য (৳) *" htmlFor={`p-${v.key}`}>
                  <Input
                    id={`p-${v.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={v.price}
                    onChange={(e) => updateVariant(v.key, { price: e.target.value })}
                    className="min-h-[44px]"
                  />
                </Field>
                <Field label="তুলনামূলক মূল্য (৳)" htmlFor={`c-${v.key}`} hint="ঐচ্ছিক, ছাড় দেখানোর জন্য, বিক্রয়মূল্যের বেশি হতে হবে।">
                  <Input
                    id={`c-${v.key}`}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={v.compareAt}
                    onChange={(e) => updateVariant(v.key, { compareAt: e.target.value })}
                    className="min-h-[44px]"
                  />
                </Field>
                {v.formatType !== "digital" ? (
                  <Field label="স্টক (ইউনিট)" htmlFor={`s-${v.key}`} hint="খালি রাখলে ০ ধরা হবে।">
                    <Input
                      id={`s-${v.key}`}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={v.stock}
                      onChange={(e) => updateVariant(v.key, { stock: e.target.value })}
                      className="min-h-[44px]"
                    />
                  </Field>
                ) : null}
              </div>

              {v.formatType !== "physical" ? (
                <div className="mt-4 space-y-3 rounded-md border border-hairline bg-card p-3">
                  <p className="text-sm font-medium">প্রাইভেট PDF ফাইল</p>
                  {v.digitalAssetId && v.digitalAssetName ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-hairline bg-muted/50 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <FileText className="size-4 shrink-0 text-sage" aria-hidden />
                        <span className="truncate">{v.digitalAssetName}</span>
                      </span>
                      {v.rightsAt ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-sage" aria-hidden />
                          স্বত্ব নিশ্চিতকৃত
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          updateVariant(v.key, { digitalAssetId: null, digitalAssetName: null, rightsAt: null, rightsChecked: false })
                        }
                        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="ফাইল সরান"
                      >
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                  <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 text-sm leading-5">
                    <Checkbox
                      className="mt-0.5"
                      checked={v.rightsChecked}
                      onCheckedChange={(c) => updateVariant(v.key, { rightsChecked: c === true })}
                      aria-label="স্বত্ব নিশ্চিতকরণ"
                    />
                    <span>
                      আমি নিশ্চিত করছি এই ফাইলের স্বত্ব/বিতরণ অনুমতি আছে
                      <span className="block text-xs text-muted-foreground">শুধু নিজস্ব বা লাইসেন্সকৃত ফাইল আপলোড করুন।</span>
                    </span>
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    aria-label="প্রাইভেট PDF আপলোড"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPdf(v.key, f);
                      e.target.value = "";
                    }}
                    id={`pdf-${v.key}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px]"
                    disabled={!v.rightsChecked || uploadingPdfKey === v.key}
                    onClick={() => document.getElementById(`pdf-${v.key}`)?.click()}
                  >
                    {uploadingPdfKey === v.key ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
                    {uploadingPdfKey === v.key ? "আপলোড হচ্ছে…" : v.digitalAssetId ? "নতুন PDF দিন" : "PDF আপলোড করুন"}
                  </Button>
                  {!v.rightsChecked ? (
                    <p className="text-xs text-muted-foreground">আপলোডের আগে স্বত্ব নিশ্চিতকরণ চেকবক্সে টিক দিন।</p>
                  ) : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="ডাউনলোড সীমা" htmlFor={`dl-${v.key}`} hint="খালি = স্টোর ডিফল্ট।">
                      <Input
                        id={`dl-${v.key}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={v.downloadLimit}
                        onChange={(e) => updateVariant(v.key, { downloadLimit: e.target.value })}
                        className="min-h-[44px]"
                      />
                    </Field>
                    <Field label="ডাউনলোড মেয়াদ (দিন)" htmlFor={`de-${v.key}`} hint="খালি = স্টোর ডিফল্ট।">
                      <Input
                        id={`de-${v.key}`}
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={v.downloadExpiryDays}
                        onChange={(e) => updateVariant(v.key, { downloadExpiryDays: e.target.value })}
                        className="min-h-[44px]"
                      />
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ডিজিটাল ভ্যারিয়েন্ট প্রকাশের জন্য PDF ফাইল ও স্বত্ব নিশ্চিতকরণ আবশ্যক।
                  </p>
                </div>
              ) : null}
            </div>
          ))}

          {remainingFormats.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">ফরম্যাট যোগ করুন:</span>
              {remainingFormats.map((f) => (
                <Button key={f} type="button" variant="outline" className="min-h-[44px]" onClick={() => addVariant(f)}>
                  <Plus className="size-4" aria-hidden />
                  {FORMAT_LABELS[f]}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>

      {/* f) SEO */}
      <Panel title="SEO" description="সার্চ ইঞ্জিনের জন্য, খালি রাখলে নাম ও বিবরণ ব্যবহৃত হবে।">
        <div className="space-y-4">
          <Field label="SEO শিরোনাম" htmlFor="f-seoTitle">
            <Input id="f-seoTitle" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className="min-h-[44px]" />
          </Field>
          <Field label="SEO বিবরণ" htmlFor="f-seoDesc">
            <Textarea id="f-seoDesc" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={3} />
          </Field>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => router.push("/admin/products")}>
          বাতিল
        </Button>
        {saveButton}
      </div>
    </form>
  );
}
