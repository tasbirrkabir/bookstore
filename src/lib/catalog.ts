import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

// ─── Public-safe DTOs ────────────────────────────────────────────────────────
// Invariants: never expose private asset storage paths, download URLs, admin notes,
// or draft/archived products.

export type FormatType = "physical" | "digital" | "bundle";

export const FORMAT_LABELS: Record<FormatType, string> = {
  physical: "হার্ড কপি",
  digital: "PDF / ই-বুক",
  bundle: "হার্ড কপি + PDF",
};

export const FORMAT_LABELS_EN: Record<FormatType, string> = {
  physical: "Hard Copy",
  digital: "PDF / eBook",
  bundle: "Bundle",
};

export type VariantDTO = {
  id: string;
  formatType: FormatType;
  priceMinor: number;
  compareAtPriceMinor: number | null;
  currency: string;
  isActive: boolean;
  inStock: boolean;
  stockOnHand: number | null;
  hasDigitalFile: boolean;
  downloadLimit: number | null;
  downloadExpiryDays: number | null;
};

export type ProductCardDTO = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  subtitle: string | null;
  authorDisplay: string;
  coverImage: string | null;
  coverPattern: string;
  status: string;
  featured: boolean;
  newArrival: boolean;
  editorPick: boolean;
  minPriceMinor: number | null;
  hasDiscount: boolean;
  /** Real compare-at amount of the discounted variant (null when no discount). */
  compareAtMinor: number | null;
  /** Whole percent off, grounded on the discounted variant (null when none). */
  discountPercent: number | null;
  formats: FormatType[];
  categories: { slug: string; name: string }[];
};

export type ProductDetailDTO = ProductCardDTO & {
  description: string;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  language: string;
  publicationYear: number | null;
  pageCount: number | null;
  binding: string | null;
  edition: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  variants: VariantDTO[];
};

function minPrice(variants: { priceMinor: number; compareAtPriceMinor: number | null }[]): number | null {
  if (variants.length === 0) return null;
  return Math.min(...variants.map((v) => v.priceMinor));
}

function toCard(p: ProductWithVariantsAndCategories): ProductCardDTO {
  const active = p.variants.filter((v) => v.isActive);
  const formats = [...new Set(active.map((v) => v.formatType as FormatType))];
  const order: FormatType[] = ["physical", "digital", "bundle"];
  formats.sort((a, b) => order.indexOf(a) - order.indexOf(b));

  // Ground the discount on the variant with the largest real markdown.
  const discounted = active
    .filter((v) => v.compareAtPriceMinor && v.compareAtPriceMinor > v.priceMinor)
    .sort((a, b) => (b.compareAtPriceMinor! - b.priceMinor) - (a.compareAtPriceMinor! - a.priceMinor))[0];
  const compareAtMinor = discounted?.compareAtPriceMinor ?? null;
  const discountPercent = discounted
    ? Math.round(((discounted.compareAtPriceMinor! - discounted.priceMinor) / discounted.compareAtPriceMinor!) * 100)
    : null;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    titleEn: p.titleEn,
    subtitle: p.subtitle,
    authorDisplay: p.authorDisplay,
    coverImage: p.coverImage,
    coverPattern: p.coverPattern,
    status: p.status,
    featured: p.featured,
    newArrival: p.newArrival,
    editorPick: p.editorPick,
    minPriceMinor: minPrice(active),
    hasDiscount: !!discounted,
    compareAtMinor,
    discountPercent,
    formats,
    categories: p.categories.map((pc) => ({ slug: pc.category.slug, name: pc.category.name })),
  };
}

type ProductWithVariantsAndCategories = Prisma.ProductGetPayload<{
  include: {
    variants: { where: { isActive: true } };
    categories: { include: { category: true } };
  };
}>;

const cardInclude = {
  variants: { where: { isActive: true } },
  categories: { include: { category: true } },
} satisfies Prisma.ProductInclude;

export type CatalogFilters = {
  q?: string;
  category?: string;
  collection?: string;
  format?: FormatType;
  language?: string;
  minPriceTaka?: number;
  maxPriceTaka?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "title";
  page?: number;
  perPage?: number;
};

function buildWhere(f: CatalogFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { status: "published" };
  if (f.q) {
    where.OR = [
      { title: { contains: f.q } },
      { titleEn: { contains: f.q } },
      { authorDisplay: { contains: f.q } },
      { publisher: { contains: f.q } },
      { isbn: { contains: f.q } },
      { description: { contains: f.q } },
    ];
  }
  if (f.category) where.categories = { some: { category: { slug: f.category } } };
  if (f.collection) where.collections = { some: { collection: { slug: f.collection } } };
  if (f.language) where.language = f.language;
  if (f.format || f.minPriceTaka !== undefined || f.maxPriceTaka !== undefined || f.inStock) {
    const v: Prisma.ProductVariantWhereInput = { isActive: true };
    const priceFilter: Prisma.IntFilter<"ProductVariant"> = {};
    if (f.minPriceTaka !== undefined) priceFilter.gte = Math.round(f.minPriceTaka * 100);
    if (f.maxPriceTaka !== undefined) priceFilter.lte = Math.round(f.maxPriceTaka * 100);
    if (Object.keys(priceFilter).length > 0) v.priceMinor = priceFilter;
    if (f.format) v.formatType = f.format;
    if (f.inStock) v.OR = [{ formatType: "digital" }, { stockOnHand: { gt: 0 } }];
    where.variants = { some: v };
  }
  return where;
}

export async function listProducts(f: CatalogFilters): Promise<{ items: ProductCardDTO[]; total: number; page: number; perPage: number; totalPages: number }> {
  const perPage = Math.min(Math.max(f.perPage ?? 12, 4), 48);
  const page = Math.max(f.page ?? 1, 1);
  const where = buildWhere(f);

  let orderBy: Prisma.ProductOrderByWithRelationInput;
  switch (f.sort) {
    case "price_asc":
      orderBy = { variants: { _count: "desc" } }; // replaced below by manual sort; keep stable base
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [rows, total] = await Promise.all([
    db.product.findMany({ where, include: cardInclude, orderBy, skip: (page - 1) * perPage, take: perPage }),
    db.product.count({ where }),
  ]);

  let items = rows.map(toCard);
  if (f.sort === "price_asc" || f.sort === "price_desc") {
    items = items.sort((a, b) => {
      const av = a.minPriceMinor ?? Number.MAX_SAFE_INTEGER;
      const bv = b.minPriceMinor ?? Number.MAX_SAFE_INTEGER;
      return f.sort === "price_asc" ? av - bv : bv - av;
    });
  }

  return { items, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  const p = await db.product.findFirst({
    where: { slug, status: "published" },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { digitalAsset: { select: { id: true, kind: true, isPrivate: true } } } },
      categories: { include: { category: true } },
    },
  });
  if (!p) return null;
  const card = toCard(p as ProductWithVariantsAndCategories);
  return {
    ...card,
    description: p.description,
    translator: p.translator,
    publisher: p.publisher,
    isbn: p.isbn,
    language: p.language,
    publicationYear: p.publicationYear,
    pageCount: p.pageCount,
    binding: p.binding,
    edition: p.edition,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    variants: p.variants.map((v) => ({
      id: v.id,
      formatType: v.formatType as FormatType,
      priceMinor: v.priceMinor,
      compareAtPriceMinor: v.compareAtPriceMinor,
      currency: v.currency,
      isActive: v.isActive,
      inStock: v.formatType === "digital" ? true : (v.stockOnHand ?? 0) > 0,
      stockOnHand: v.formatType === "digital" ? null : v.stockOnHand,
      // Safe boolean only, never expose the storage path or file URL.
      hasDigitalFile: !!v.digitalAssetId && !!v.rightsConfirmedAt,
      downloadLimit: v.downloadLimit,
      downloadExpiryDays: v.downloadExpiryDays,
    })),
  };
}

export async function getRelatedProducts(product: ProductCardDTO, limit = 4): Promise<ProductCardDTO[]> {
  const slugs = product.categories.map((c) => c.slug);
  if (slugs.length === 0) {
    const rows = await db.product.findMany({ where: { status: "published", id: { not: product.id } }, include: cardInclude, take: limit, orderBy: { createdAt: "desc" } });
    return rows.map(toCard);
  }
  const rows = await db.product.findMany({
    where: { status: "published", id: { not: product.id }, categories: { some: { category: { slug: { in: slugs } } } } },
    include: cardInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  if (rows.length >= limit) return rows.map(toCard);
  const extra = await db.product.findMany({
    where: { status: "published", id: { notIn: [product.id, ...rows.map((r) => r.id)] } },
    include: cardInclude,
    take: limit - rows.length,
    orderBy: { createdAt: "desc" },
  });
  return [...rows, ...extra].map(toCard);
}

export async function listCategories() {
  try {
    return await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { product: { status: "published" } } } } } },
    }).then((rows) =>
      rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, nameEn: c.nameEn, description: c.description, productCount: c._count.products }))
    );
  } catch (err) {
    console.error("[catalog] listCategories error:", err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findFirst({ where: { slug, isActive: true } });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findFirst({ where: { slug, isActive: true } });
}

export async function listCollectionsWithProducts(limit = 2) {
  const cols = await db.collection.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: limit,
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        take: 8,
        include: { product: { include: cardInclude } },
      },
    },
  });
  return cols
    .map((c) => ({ id: c.id, slug: c.slug, title: c.title, description: c.description, products: c.products.map((cp) => toCard(cp.product as ProductWithVariantsAndCategories)).slice(0, 4) }))
    .filter((c) => c.products.length > 0);
}

export async function homeModules() {
  try {
    const [featured, newArrivals, collections, categories] = await Promise.all([
      db.product.findMany({ where: { status: "published", OR: [{ featured: true }, { editorPick: true }] }, include: cardInclude, take: 8, orderBy: { createdAt: "desc" } }),
      db.product.findMany({ where: { status: "published", newArrival: true }, include: cardInclude, take: 8, orderBy: { createdAt: "desc" } }),
      listCollectionsWithProducts(2),
      listCategories(),
    ]);
    return {
      featured: featured.map(toCard),
      newArrivals: newArrivals.map(toCard),
      collections,
      categories,
    };
  } catch (err) {
    console.error("[catalog] homeModules error:", err);
    return {
      featured: [],
      newArrivals: [],
      collections: [],
      categories: [],
    };
  }
}

/** The published variant with the biggest genuine markdown, for the deal banner. */
export async function findDealProduct(): Promise<{
  card: ProductCardDTO;
  priceMinor: number;
  compareAtMinor: number;
  discountPercent: number;
} | null> {
  try {
    const rows = await db.product.findMany({
      where: { status: "published", variants: { some: { isActive: true, compareAtPriceMinor: { gt: 0 } } } },
      include: cardInclude,
      take: 30,
      orderBy: { createdAt: "desc" },
    });

    let best: { card: ProductCardDTO; priceMinor: number; compareAtMinor: number; discountPercent: number } | null = null;
    for (const p of rows) {
      for (const v of p.variants) {
        if (!v.isActive || !v.compareAtPriceMinor || v.compareAtPriceMinor <= v.priceMinor) continue;
        const percent = Math.round(((v.compareAtPriceMinor - v.priceMinor) / v.compareAtPriceMinor) * 100);
        const saving = v.compareAtPriceMinor - v.priceMinor;
        const bestSaving = best ? best.compareAtMinor - best.priceMinor : -1;
        if (saving > bestSaving) {
          best = { card: toCard(p), priceMinor: v.priceMinor, compareAtMinor: v.compareAtPriceMinor, discountPercent: percent };
        }
      }
    }
    return best;
  } catch (err) {
    console.error("[catalog] findDealProduct error:", err);
    return null;
  }
}

/** Distinct author list for filters. */
export async function listAuthors(limit = 30) {
  const rows = await db.product.findMany({ where: { status: "published" }, select: { authorDisplay: true }, distinct: ["authorDisplay"], take: limit, orderBy: { authorDisplay: "asc" } });
  return rows.map((r) => r.authorDisplay);
}
