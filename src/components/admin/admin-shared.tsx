"use client";

// Shared client helpers for the admin area: typed API client, response types,
// status badges, date formatting and small layout primitives.

import { formatBdt } from "@/lib/money";
import { FORMAT_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-ui";
import { cn } from "@/lib/utils";
import { Inbox, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "@/components/ui/table";

// ─── API client ──────────────────────────────────────────────────────────────

/** GET/POST JSON against the admin API; surfaces server errors verbatim. */
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।");
  }
  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login?next=/admin";
    throw new Error("সেশন শেষ — আবার লগইন করুন।");
  }
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
  if (!res.ok || !data?.ok) {
    const raw = typeof data?.error === "string" ? data.error : "অনুরোধ ব্যর্থ হয়েছে।";
    throw new Error(raw === "FORBIDDEN" ? "অনুমতি নেই।" : raw);
  }
  return data as T;
}

/** POST one of the single admin actions: {action, ...}. */
export function adminAction<T = { ok: true }>(body: Record<string, unknown>): Promise<T> {
  return adminApi<T>("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Multipart upload to /api/admin/upload (kind: "cover" | "private_pdf"). */
export async function adminUpload<T = { ok: true; assetId: string; publicUrl: string | null }>(
  form: FormData
): Promise<T> {
  return adminApi<T>("/api/admin/upload", { method: "POST", body: form });
}

// ─── Response types (mirror /api/admin GET shapes) ───────────────────────────

export type AdminStats = {
  productCount: number;
  publishedCount: number;
  orderCount: number;
  pendingOrders: number;
  paidRevenueMinor: number;
  codDueOrders: number;
  lowStock: { id: string; title: string; formatType: string; stockOnHand: number }[];
  outboxPending: number;
};
export type StatsResponse = {
  ok: true;
  stats: AdminStats;
  config: { emailConfigured: boolean; paymentProvider: "mock" | "disabled" };
};

export type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  authorDisplay: string;
  status: string;
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  coverImage: string | null;
  coverPattern: string;
  updatedAt: string;
  categories: string[];
  variants: { id: string; formatType: string; priceMinor: number; isActive: boolean; stockOnHand: number | null }[];
};
export type ProductsResponse = { ok: true; products: AdminProductRow[] };

export type AdminProductVariantDetail = {
  id: string;
  formatType: "physical" | "digital" | "bundle";
  priceTaka: string;
  compareAtPriceTaka: string | null;
  isActive: boolean;
  stock: number | null;
  digitalAssetId: string | null;
  digitalAsset: { id: string; originalFilename: string; sizeBytes: number; rightsConfirmedAt: string | null } | null;
  rightsConfirmed: boolean;
  downloadLimit: number | null;
  downloadExpiryDays: number | null;
};
export type AdminProductDetail = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
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
  status: string;
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  coverImage: string | null;
  coverPattern: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
  categories: string[];
  collections: string[];
  variants: AdminProductVariantDetail[];
};
export type ProductResponse = { ok: true; product: AdminProductDetail };

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};
export type CategoriesResponse = { ok: true; categories: AdminCategory[] };

export type AdminCollection = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};
export type CollectionsResponse = { ok: true; collections: AdminCollection[] };

export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalMinor: number;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  itemCount: number;
  hasDigital: boolean;
};
export type OrdersResponse = { ok: true; orders: AdminOrderRow[] };

export type AdminEntitlementChip = {
  id: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  grantedBy: string;
};
export type AdminOrderItem = {
  id: string;
  productTitle: string;
  authorDisplay: string;
  formatType: string;
  sku: string | null;
  productSlug: string | null;
  unitPriceMinor: number;
  quantity: number;
  lineSubtotalMinor: number;
  lineDiscountMinor: number;
  lineTotalMinor: number;
  digitalAssetId: string | null;
  entitlements: AdminEntitlementChip[];
};
export type AdminPayment = {
  id: string;
  provider: string;
  providerTxnId: string | null;
  amountMinor: number;
  status: string;
  method: string | null;
  verifiedAt: string | null;
  createdAt: string;
};
export type AdminOrderEvent = {
  id: string;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string | null;
  actor: string;
  createdAt: string;
};
export type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  userId: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalMinor: number;
  discountMinor: number;
  shippingMinor: number;
  totalMinor: number;
  couponCode: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingDistrict: string | null;
  shippingArea: string | null;
  shippingAddress: string | null;
  shippingPostcode: string | null;
  shippingZone: string | null;
  shippingNote: string | null;
  customerNote: string | null;
  adminNote: string | null;
  courierProvider: string | null;
  trackingId: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  items: AdminOrderItem[];
  payments: AdminPayment[];
  events: AdminOrderEvent[];
};
export type OrderResponse = { ok: true; order: AdminOrderDetail };

export type AdminCoupon = {
  id: string;
  code: string;
  description: string | null;
  discountType: "percent" | "fixed";
  discountValue: number; // percent 1–100, or poisha for fixed
  minSpendMinor: number | null;
  maxDiscountMinor: number | null;
  appliesToFormat: string | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  redemptions: number;
};
export type CouponsResponse = { ok: true; coupons: AdminCoupon[] };

export type AdminSettings = {
  storeName: string;
  storeNameEn: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  addressLine: string;
  facebookUrl: string | null;
  announcement: string | null;
  announcementEnabled: boolean;
  shippingInsideDhaka: number;
  shippingOutsideDhaka: number;
  freeShippingThreshold: number | null;
  deliveryEstimateInside: string;
  deliveryEstimateOutside: string;
  downloadLimitDefault: number;
  downloadExpiryDays: number;
  paymentProvider: string;
  codEnabled: boolean;
  returnWindowDays: number;
  aboutText: string | null;
};
export type SettingsResponse = {
  ok: true;
  settings: AdminSettings;
  emailConfigured: boolean;
  paymentProvider: "mock" | "disabled";
};

export type AuditEntry = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
};
export type AuditResponse = { ok: true; entries: AuditEntry[] };

export type OutboxMessage = {
  id: string;
  kind: string;
  toEmail: string;
  subject: string;
  status: string;
  statusDetail: string | null;
  orderNumber: string | null;
  createdAt: string;
};
export type OutboxResponse = { ok: true; messages: OutboxMessage[] };

// ─── Formatting helpers ──────────────────────────────────────────────────────

function bnDate(iso: string | null | undefined, withTime: boolean): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return d.toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch {
    return iso.slice(0, 10);
  }
}
export function fmtDate(iso: string | null | undefined): string {
  return bnDate(iso, false);
}
export function fmtDateTime(iso: string | null | undefined): string {
  return bnDate(iso, true);
}
export { formatBdt };

// ─── Badges ──────────────────────────────────────────────────────────────────

export type BadgeTone = "green" | "amber" | "red" | "gray" | "sage" | "ink";

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-900",
  amber: "border-amber-200 bg-amber-50 text-amber-900",
  red: "border-red-200 bg-red-50 text-red-900",
  gray: "border-border bg-muted text-muted-foreground",
  sage: "border-transparent bg-secondary text-secondary-foreground",
  ink: "border-transparent bg-foreground/90 text-background",
};

export function ToneBadge({
  tone,
  children,
  className,
  title,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium leading-5",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  pending_payment: "amber",
  confirmed: "sage",
  processing: "gray",
  shipped: "ink",
  delivered: "green",
  cancelled: "red",
  returned: "amber",
  refunded: "gray",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={ORDER_STATUS_TONE[status] ?? "gray"}>
      {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status}
    </ToneBadge>
  );
}

const PAYMENT_STATUS_TONE: Record<string, BadgeTone> = {
  unpaid: "gray",
  pending: "sage",
  paid: "green",
  failed: "red",
  cod_due: "amber",
  cod_collected: "green",
  refunded: "gray",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <ToneBadge tone={PAYMENT_STATUS_TONE[status] ?? "gray"}>
      {PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ?? status}
    </ToneBadge>
  );
}

export function ProductStatusBadge({ status }: { status: string }) {
  if (status === "published") return <ToneBadge tone="green">প্রকাশিত</ToneBadge>;
  if (status === "archived") return <ToneBadge tone="sage">আর্কাইভ</ToneBadge>;
  return <ToneBadge tone="gray">খসড়া</ToneBadge>;
}

export function OutboxStatusBadge({ status }: { status: string }) {
  if (status === "sent") return <ToneBadge tone="green">পাঠানো হয়েছে</ToneBadge>;
  if (status === "pending") return <ToneBadge tone="amber">অপেক্ষমাণ</ToneBadge>;
  if (status === "failed") return <ToneBadge tone="red">ব্যর্থ</ToneBadge>;
  if (status === "skipped_no_provider") return <ToneBadge tone="gray">প্রোভাইডার নেই</ToneBadge>;
  return <ToneBadge tone="gray">{status}</ToneBadge>;
}

export function YesNoBadge({ value, yes = "সক্রিয়", no = "নিষ্ক্রিয়" }: { value: boolean; yes?: string; no?: string }) {
  return value ? <ToneBadge tone="green">{yes}</ToneBadge> : <ToneBadge tone="gray">{no}</ToneBadge>;
}

export function formatLabel(format: string): string {
  return FORMAT_LABELS[format as keyof typeof FORMAT_LABELS] ?? format;
}

// ─── Layout primitives ───────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-lg border border-hairline bg-card", className)}>
      {title ? (
        <div className="hairline-b flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function Spinner({ label = "লোড হচ্ছে…" }: { label?: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, colSpan }: { title: string; hint?: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center">
        <div className="mx-auto flex max-w-sm flex-col items-center gap-1.5 text-muted-foreground">
          <Inbox className="size-6 opacity-60" aria-hidden />
          <p className="text-sm font-medium text-foreground">{title}</p>
          {hint ? <p className="text-xs">{hint}</p> : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <TableCell key={c}>
              <Skeleton className={cn("h-4", c === 0 ? "w-3/4" : "w-1/2")} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
