import "server-only";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { takaInputToPoisha } from "@/lib/money";
import { restockOrder, ORDER_STATUSES, ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import { grantEntitlementsForOrder, adminGrantEntitlement } from "@/lib/entitlements";
import { markCodCollected } from "@/lib/payments";
import { notifyOrderShipped } from "@/lib/notifications";
import { unlink } from "node:fs/promises";
import path from "node:path";

const PRIVATE_ROOT = path.join(process.cwd(), "private-assets");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "covers");

// ─── Product management ──────────────────────────────────────────────────────

export type VariantInput = {
  id?: string;
  formatType: "physical" | "digital" | "bundle";
  priceTaka: string | number;
  compareAtPriceTaka?: string | number | null;
  isActive: boolean;
  stockTaka?: string | number | null; // stock units, not money
  digitalAssetId?: string | null;
  rightsConfirmed?: boolean;
  downloadLimit?: number | null;
  downloadExpiryDays?: number | null;
};

export type ProductInput = {
  title: string;
  titleEn?: string | null;
  slug?: string;
  subtitle?: string | null;
  authorDisplay: string;
  translator?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  language: string;
  publicationYear?: number | null;
  pageCount?: number | null;
  binding?: string | null;
  edition?: string | null;
  description: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  coverImage?: string | null;
  coverPattern: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  categoryIds: string[];
  collectionIds: string[];
  variants: VariantInput[];
};

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return base || `book-${Date.now()}`;
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  let n = 1;
  for (;;) {
    const found = await db.product.findUnique({ where: { slug } });
    if (!found || found.id === excludeId) return slug;
    slug = `${slugify(base)}-${++n}`;
  }
}

type NormalizedVariant = ReturnType<typeof normalizeVariant>;

function validateVariants(variants: VariantInput[]): { ok: true; normalized: NormalizedVariant[] } | { ok: false; error: string } {
  if (variants.length === 0) return { ok: false, error: "অন্তত একটি ফরম্যাট/ভ্যারিয়েন্ট যোগ করুন।" };
  const seen = new Set<string>();
  const normalized: NormalizedVariant[] = [];
  for (const v of variants) {
    const price = takaInputToPoisha(v.priceTaka);
    if (price === null || price <= 0) return { ok: false, error: "প্রতিটি ভ্যারিয়েন্টের সঠিক মূল্য দিন (শূন্যের বেশি)।" };
    const compare = v.compareAtPriceTaka ? takaInputToPoisha(v.compareAtPriceTaka) : null;
    if (compare !== null && compare <= price) return { ok: false, error: "তুলনামূলক মূল্য বিক্রয়মূল্যের বেশি হতে হবে।" };
    if (seen.has(v.formatType)) return { ok: false, error: "একই ফরম্যাট একাধিকবার যোগ করা যাবে না।" };
    seen.add(v.formatType);
    let stock: number | null = null;
    if (v.formatType !== "digital") {
      const s = v.stockTaka === null || v.stockTaka === undefined || v.stockTaka === "" ? 0 : Math.floor(Number(v.stockTaka));
      if (!Number.isFinite(s) || s < 0) return { ok: false, error: "স্টক সংখ্যা সঠিক নয়।" };
      stock = s;
    }
    normalized.push(normalizeVariant(v, price, compare, stock));
  }
  return { ok: true, normalized };
}

function normalizeVariant(v: VariantInput, price: number, compare: number | null, stock: number | null) {
  return {
    id: v.id,
    formatType: v.formatType,
    priceMinor: price,
    compareAtPriceMinor: compare,
    isActive: v.isActive,
    stockOnHand: stock,
    digitalAssetId: v.formatType === "physical" ? null : v.digitalAssetId ?? null,
    rightsConfirmed: !!v.rightsConfirmed,
    downloadLimit: v.formatType === "physical" ? null : v.downloadLimit ?? null,
    downloadExpiryDays: v.formatType === "physical" ? null : v.downloadExpiryDays ?? null,
  };
}

/**
 * Publish guard: a digital/bundle variant may only go live when it references a
 * valid PRIVATE asset with explicit rights confirmation.
 */
function assertDigitalPublishable(variants: ReturnType<typeof normalizeVariant>[], status: string, existingVariants: { id: string; digitalAssetId: string | null; rightsConfirmedAt: Date | null }[]) {
  if (status !== "published") return null;
  for (const v of variants) {
    if (v.formatType === "physical" || !v.isActive) continue;
    const existing = existingVariants.find((ev) => ev.id === v.id);
    const assetId = v.digitalAssetId ?? existing?.digitalAssetId ?? null;
    if (!assetId) return `ডিজিটাল/বান্ডেল ভ্যারিয়েন্ট প্রকাশের জন্য একটি ব্যক্তিগত PDF ফাইল আপলোড করতে হবে (${v.formatType})।`;
    if (!v.rightsConfirmed && !existing?.rightsConfirmedAt) {
      return "ডিজিটাল ফাইল প্রকাশের আগে স্বত্ব/অনুমতি নিশ্চিত করতে হবে।";
    }
  }
  return null;
}

export async function upsertProduct(input: ProductInput, existingId?: string, actorEmail = ""): Promise<{ ok: true; id: string; slug: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();

  if (!input.title.trim()) return { ok: false, error: "বইয়ের নাম দিন।" };
  if (!input.authorDisplay.trim()) return { ok: false, error: "লেখকের নাম দিন।" };
  if (!input.description.trim()) return { ok: false, error: "বইয়ের বিবরণ দিন।" };

  const vCheck = validateVariants(input.variants);
  if (!vCheck.ok) return { ok: false, error: vCheck.error };

  const existing = existingId ? await db.product.findUnique({ where: { id: existingId }, include: { variants: true } }) : null;
  if (existingId && !existing) return { ok: false, error: "পণ্য পাওয়া যায়নি।" };

  const publishError = assertDigitalPublishable(vCheck.normalized, input.status, existing?.variants ?? []);
  if (publishError) return { ok: false, error: publishError };

  const slug = input.slug?.trim() ? await uniqueSlug(input.slug, existingId) : await uniqueSlug(input.titleEn?.trim() || input.title, existingId);

  const data = {
    title: input.title.trim(),
    titleEn: input.titleEn?.trim() || null,
    slug,
    subtitle: input.subtitle?.trim() || null,
    authorDisplay: input.authorDisplay.trim(),
    translator: input.translator?.trim() || null,
    publisher: input.publisher?.trim() || null,
    isbn: input.isbn?.trim() || null,
    language: input.language === "en" ? "en" : "bn",
    publicationYear: input.publicationYear ?? null,
    pageCount: input.pageCount ?? null,
    binding: input.binding?.trim() || null,
    edition: input.edition?.trim() || null,
    description: input.description,
    status: input.status,
    featured: input.featured,
    newArrival: input.newArrival,
    editorPick: input.editorPick,
    coverImage: input.coverImage || null,
    coverPattern: input.coverPattern || "oxblood",
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };

  const productId = await db.$transaction(async (tx) => {
    let pid: string;
    if (existing) {
      pid = existing.id;
      await tx.product.update({ where: { id: pid }, data });
    } else {
      pid = (await tx.product.create({ data })).id;
    }

    // Replace variant set (simple, safe for admin-scale traffic).
    const keepIds = vCheck.normalized.filter((v) => v.id).map((v) => v.id!);
    await tx.productVariant.deleteMany({ where: { productId: pid, id: { notIn: keepIds } } });
    for (const v of vCheck.normalized) {
      const prev = existing?.variants.find((ev) => ev.id === v.id);
      const base = {
        formatType: v.formatType,
        priceMinor: v.priceMinor,
        compareAtPriceMinor: v.compareAtPriceMinor,
        isActive: v.isActive,
        stockOnHand: v.stockOnHand,
        digitalAssetId: v.digitalAssetId,
        downloadLimit: v.downloadLimit,
        downloadExpiryDays: v.downloadExpiryDays,
        rightsConfirmedAt: v.rightsConfirmed ? new Date() : prev?.rightsConfirmedAt ?? null,
        rightsConfirmedBy: v.rightsConfirmed ? admin.email : prev?.rightsConfirmedBy ?? null,
      };
      if (prev) {
        await tx.productVariant.update({ where: { id: prev.id }, data: base });
      } else {
        await tx.productVariant.create({ data: { ...base, productId: pid, sku: `${slug.slice(0, 20)}-${v.formatType.slice(0, 3)}`.toUpperCase() } });
      }
    }

    await tx.productCategory.deleteMany({ where: { productId: pid } });
    for (const cid of input.categoryIds) {
      await tx.productCategory.create({ data: { productId: pid, categoryId: cid } }).catch(() => {});
    }
    await tx.collectionProduct.deleteMany({ where: { productId: pid } });
    for (const [i, cid] of input.collectionIds.entries()) {
      await tx.collectionProduct.create({ data: { productId: pid, collectionId: cid, sortOrder: i } }).catch(() => {});
    }
    return pid;
  });

  await logAudit({ actorEmail: actorEmail || admin.email, action: existing ? "product_update" : "product_create", targetType: "product", targetId: productId, detail: input.title });
  return { ok: true, id: productId, slug };
}

export async function deleteProduct(id: string, actorEmail = "") {
  await requireAdmin();
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return { ok: false, error: "পণ্য পাওয়া যায়নি।" };
  await db.product.delete({ where: { id } });
  await logAudit({ actorEmail: actorEmail || "admin", action: "product_delete", targetType: "product", targetId: id, detail: product.title });
  return { ok: true };
}

// ─── Category / collection management ────────────────────────────────────────

export async function upsertCategory(input: { id?: string; name: string; nameEn?: string; slug?: string; description?: string; sortOrder?: number; isActive: boolean }) {
  const admin = await requireAdmin();
  if (!input.name.trim()) return { ok: false as const, error: "বিভাগের নাম দিন।" };
  const slug = input.slug?.trim() || slugify(input.nameEn || input.name);
  const data = { name: input.name.trim(), nameEn: input.nameEn?.trim() || null, slug, description: input.description?.trim() || null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive };
  const cat = input.id ? await db.category.update({ where: { id: input.id }, data }) : await db.category.create({ data });
  await logAudit({ actorEmail: admin.email, action: input.id ? "category_update" : "category_create", targetType: "category", targetId: cat.id, detail: cat.name });
  return { ok: true as const, id: cat.id };
}

export async function deleteCategory(id: string) {
  const admin = await requireAdmin();
  await db.category.delete({ where: { id } });
  await logAudit({ actorEmail: admin.email, action: "category_delete", targetType: "category", targetId: id });
  return { ok: true as const };
}

export async function upsertCollection(input: { id?: string; title: string; slug?: string; description?: string; sortOrder?: number; isActive: boolean }) {
  const admin = await requireAdmin();
  if (!input.title.trim()) return { ok: false as const, error: "কালেকশনের শিরোনাম দিন।" };
  const slug = input.slug?.trim() || slugify(input.title);
  const data = { title: input.title.trim(), slug, description: input.description?.trim() || null, sortOrder: input.sortOrder ?? 0, isActive: input.isActive };
  const col = input.id ? await db.collection.update({ where: { id: input.id }, data }) : await db.collection.create({ data });
  await logAudit({ actorEmail: admin.email, action: input.id ? "collection_update" : "collection_create", targetType: "collection", targetId: col.id, detail: col.title });
  return { ok: true as const, id: col.id };
}

export async function deleteCollection(id: string) {
  const admin = await requireAdmin();
  await db.collection.delete({ where: { id } });
  await logAudit({ actorEmail: admin.email, action: "collection_delete", targetType: "collection", targetId: id });
  return { ok: true as const };
}

// ─── Order management ────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

export async function updateOrderStatus(input: { orderId: string; toStatus: OrderStatus; note?: string; trackingId?: string; courierProvider?: string }, actorEmail = "") {
  const admin = await requireAdmin();
  if (!ORDER_STATUSES.includes(input.toStatus)) return { ok: false as const, error: "অবৈধ স্ট্যাটাস।" };
  const order = await db.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false as const, error: "অর্ডার পাওয়া যায়নি।" };
  const from = order.status as OrderStatus;
  if (from === input.toStatus) return { ok: true as const };
  if (!ALLOWED_TRANSITIONS[from]?.includes(input.toStatus)) {
    return { ok: false as const, error: `${ORDER_STATUS_LABELS[from]} থেকে ${ORDER_STATUS_LABELS[input.toStatus]}-তে যাওয়া যাবে না।` };
  }

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: input.toStatus,
        trackingId: input.trackingId !== undefined ? input.trackingId || null : undefined,
        courierProvider: input.courierProvider !== undefined ? input.courierProvider || null : undefined,
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: input.toStatus === "shipped" && input.trackingId ? "tracking" : "status_change",
        fromStatus: from,
        toStatus: input.toStatus,
        message: input.note?.trim() || undefined,
        actor: `admin:${admin.email}`,
      },
    });
  });

  if (input.toStatus === "cancelled" || input.toStatus === "returned") {
    // Release committed stock (physical eligibility checked inside).
    await restockOrder(order.id, `admin:${admin.email}`, `স্ট্যাটাস: ${input.toStatus}`);
  }
  if (input.toStatus === "shipped") {
    await notifyOrderShipped(order.id).catch(() => {});
  }
  await logAudit({ actorEmail: actorEmail || admin.email, action: "order_status", targetType: "order", targetId: order.id, detail: `${from} → ${input.toStatus}` });
  return { ok: true as const };
}

export async function updateOrderPaymentStatus(input: { orderId: string; action: "mark_cod_collected" | "mark_refunded" }, actorEmail = "") {
  const admin = await requireAdmin();
  const order = await db.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false as const, error: "অর্ডার পাওয়া যায়নি।" };
  if (input.action === "mark_cod_collected") {
    if (order.paymentStatus !== "cod_due") return { ok: false as const, error: "এই অর্ডারে COD পাওনা নেই।" };
    await markCodCollected(order.id, actorEmail || admin.email);
    await logAudit({ actorEmail: actorEmail || admin.email, action: "cod_collected", targetType: "order", targetId: order.id });
    return { ok: true as const };
  }
  if (order.paymentStatus !== "paid" && order.paymentStatus !== "cod_collected") {
    return { ok: false as const, error: "শুধু পরিশোধিত অর্ডার রিফান্ড করা যায়।" };
  }
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "refunded", status: "refunded" } });
    await tx.orderEvent.create({ data: { orderId: order.id, type: "payment", toStatus: "refunded", message: "রিফান্ড রেকর্ড করা হয়েছে", actor: `admin:${admin.email}` } });
  });
  await logAudit({ actorEmail: actorEmail || admin.email, action: "order_refund", targetType: "order", targetId: order.id });
  return { ok: true as const };
}

export async function compEntitlement(orderItemId: string, reason: string, actorEmail = "") {
  await requireAdmin();
  try {
    await adminGrantEntitlement(orderItemId, actorEmail, reason);
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "ব্যর্থ" };
  }
}

// ─── Coupon management ───────────────────────────────────────────────────────

export async function upsertCoupon(input: {
  id?: string;
  code: string;
  description?: string;
  discountType: "percent" | "fixed";
  discountValueTaka: string | number;
  minSpendTaka?: string | number | null;
  maxDiscountTaka?: string | number | null;
  appliesToFormat?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  isActive: boolean;
}) {
  const admin = await requireAdmin();
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { ok: false as const, error: "কোড ৩–২৪ অক্ষরের হতে হবে (A-Z, 0-9)।" };
  const discountType = input.discountType;
  let discountValue: number;
  if (discountType === "percent") {
    discountValue = Math.floor(Number(input.discountValueTaka));
    if (!Number.isFinite(discountValue) || discountValue < 1 || discountValue > 100) return { ok: false as const, error: "ছাড়ের হার ১–১০০% এর মধ্যে দিন।" };
  } else {
    discountValue = takaInputToPoisha(input.discountValueTaka) ?? 0;
    if (discountValue <= 0) return { ok: false as const, error: "সঠিক ছাড়ের পরিমাণ দিন।" };
  }
  const data = {
    code,
    description: input.description?.trim() || null,
    discountType,
    discountValue,
    minSpendMinor: input.minSpendTaka ? takaInputToPoisha(input.minSpendTaka) : null,
    maxDiscountMinor: discountType === "percent" && input.maxDiscountTaka ? takaInputToPoisha(input.maxDiscountTaka) : null,
    appliesToFormat: input.appliesToFormat || null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    usageLimit: input.usageLimit ? Math.floor(Number(input.usageLimit)) : null,
    isActive: input.isActive,
  };
  try {
    const c = input.id ? await db.coupon.update({ where: { id: input.id }, data }) : await db.coupon.create({ data });
    await logAudit({ actorEmail: admin.email, action: input.id ? "coupon_update" : "coupon_create", targetType: "coupon", targetId: c.id, detail: c.code });
    return { ok: true as const, id: c.id };
  } catch {
    return { ok: false as const, error: "এই কোড আগে থেকেই আছে।" };
  }
}

export async function deleteCoupon(id: string) {
  const admin = await requireAdmin();
  await db.coupon.delete({ where: { id } });
  await logAudit({ actorEmail: admin.email, action: "coupon_delete", targetType: "coupon", targetId: id });
  return { ok: true as const };
}

// ─── Asset management ────────────────────────────────────────────────────────

export async function saveUploadedAsset(input: {
  file: Buffer;
  originalFilename: string;
  mimeType: string;
  kind: "cover" | "private_pdf";
  productId?: string | null;
  rightsConfirmed: boolean;
}) {
  const admin = await requireAdmin();
  const isPrivate = input.kind === "private_pdf";
  if (isPrivate) {
    if (input.mimeType !== "application/pdf") return { ok: false as const, error: "শুধু PDF ফাইল গ্রহণযোগ্য।" };
    if (input.file.length > 50 * 1024 * 1024) return { ok: false as const, error: "ফাইল সাইজ সর্বোচ্চ 50MB।" };
    if (!input.rightsConfirmed) return { ok: false as const, error: "স্বত্ব নিশ্চিত করা আবশ্যক — শুধু নিজস্ব/লাইসেন্সকৃত ফাইল আপলোড করুন।" };
  } else {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(input.mimeType)) return { ok: false as const, error: "কভার ছবি: JPG/PNG/WebP/AVIF গ্রহণযোগ্য।" };
    if (input.file.length > 8 * 1024 * 1024) return { ok: false as const, error: "ছবি সর্বোচ্চ 8MB।" };
  }
  const ext = isPrivate ? "pdf" : input.mimeType.split("/")[1].replace("jpeg", "jpg");
  const fname = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const dir = isPrivate ? PRIVATE_ROOT : PUBLIC_ROOT;
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fname), input.file);

  const asset = await db.asset.create({
    data: {
      productId: input.productId ?? null,
      kind: input.kind === "cover" ? "cover" : "private_pdf",
      storageProvider: "local",
      bucket: isPrivate ? "private-assets" : "public/covers",
      storagePath: fname,
      originalFilename: input.originalFilename.slice(0, 200),
      mimeType: input.mimeType,
      sizeBytes: input.file.length,
      isPrivate,
      rightsConfirmedAt: isPrivate && input.rightsConfirmed ? new Date() : null,
      rightsConfirmedBy: isPrivate && input.rightsConfirmed ? admin.email : null,
    },
  });
  await logAudit({ actorEmail: admin.email, action: "asset_upload", targetType: "asset", targetId: asset.id, detail: `${input.kind} ${input.originalFilename}` });
  return { ok: true as const, assetId: asset.id, publicUrl: isPrivate ? null : `/covers/${fname}` };
}

export async function deleteAsset(id: string) {
  const admin = await requireAdmin();
  const asset = await db.asset.findUnique({ where: { id } });
  if (!asset) return { ok: false as const, error: "অ্যাসেট পাওয়া যায়নি।" };
  const inUse = await db.productVariant.count({ where: { digitalAssetId: id } });
  if (inUse > 0) return { ok: false as const, error: "এই ফাইল একটি ভ্যারিয়েন্টে ব্যবহৃত — আগে ভ্যারিয়েন্ট থেকে সরান।" };
  const dir = asset.isPrivate ? PRIVATE_ROOT : PUBLIC_ROOT;
  await unlink(path.join(dir, asset.storagePath)).catch(() => {});
  await db.asset.delete({ where: { id } });
  await logAudit({ actorEmail: admin.email, action: "asset_delete", targetType: "asset", targetId: id });
  return { ok: true as const };
}

/** Product editor data — includes private asset metadata (admin only). */
export async function getProductForAdmin(id: string) {
  await requireAdmin();
  const p = await db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sortOrder: "asc" }, include: { digitalAsset: true } },
      categories: true,
      collections: true,
      assets: true,
    },
  });
  if (!p) return null;
  const { variants, assets, categories, collections, ...rest } = p;
  return {
    ...rest,
    categories: categories.map((c) => c.categoryId),
    collections: collections.map((c) => c.collectionId),
    variants: variants.map((v) => ({
      id: v.id,
      formatType: v.formatType as "physical" | "digital" | "bundle",
      priceTaka: (v.priceMinor / 100).toString(),
      compareAtPriceTaka: v.compareAtPriceMinor ? (v.compareAtPriceMinor / 100).toString() : null,
      isActive: v.isActive,
      stock: v.formatType === "digital" ? null : v.stockOnHand ?? 0,
      digitalAssetId: v.digitalAssetId,
      digitalAsset: v.digitalAsset ? { id: v.digitalAsset.id, originalFilename: v.digitalAsset.originalFilename, sizeBytes: v.digitalAsset.sizeBytes, rightsConfirmedAt: v.digitalAsset.rightsConfirmedAt?.toISOString() ?? null } : null,
      rightsConfirmed: !!v.rightsConfirmedAt,
      downloadLimit: v.downloadLimit,
      downloadExpiryDays: v.downloadExpiryDays,
    })),
    assets: assets.map((a) => ({ id: a.id, kind: a.kind, originalFilename: a.originalFilename, sizeBytes: a.sizeBytes, isPrivate: a.isPrivate, rightsConfirmedAt: a.rightsConfirmedAt?.toISOString() ?? null, createdAt: a.createdAt.toISOString() })),
  };
}
