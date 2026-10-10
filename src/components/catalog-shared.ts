// Pure, client-safe helpers shared by the server catalog pages (shop / category /
// collection) and the client CatalogBrowser. No server-only imports here.

export type CatalogSort = "newest" | "price_asc" | "price_desc" | "title";
export type CatalogFormat = "physical" | "digital" | "bundle";

export type ParsedCatalogFilters = {
  q: string;
  category: string;
  format: string;
  language: string;
  priceMin: string;
  priceMax: string;
  inStock: boolean;
  sort: CatalogSort | "";
  page: number;
};

export type CatalogBrowserState = {
  q: string;
  category: string;
  format: string;
  language: string;
  priceMin: string;
  priceMax: string;
  inStock: boolean;
  sort: string;
};

const FORMATS: CatalogFormat[] = ["physical", "digital", "bundle"];
const SORTS: CatalogSort[] = ["newest", "price_asc", "price_desc", "title"];
const LANGUAGES = ["bn", "en"];

function firstStr(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

/** Parse shop-style search params into validated filter values. */
export function parseCatalogSearchParams(sp: Record<string, string | string[] | undefined>): ParsedCatalogFilters {
  const formatRaw = firstStr(sp.format);
  const sortRaw = firstStr(sp.sort) as CatalogSort;
  const langRaw = firstStr(sp.language);
  const pageRaw = parseInt(firstStr(sp.page), 10);
  const priceMin = firstStr(sp.price_min);
  const priceMax = firstStr(sp.price_max);
  return {
    q: firstStr(sp.q).slice(0, 120),
    category: firstStr(sp.category),
    format: FORMATS.includes(formatRaw as CatalogFormat) ? formatRaw : "",
    language: LANGUAGES.includes(langRaw) ? langRaw : "",
    priceMin: /^\d+(\.\d+)?$/.test(priceMin) ? priceMin : "",
    priceMax: /^\d+(\.\d+)?$/.test(priceMax) ? priceMax : "",
    inStock: ["1", "true"].includes(firstStr(sp.inStock)),
    sort: SORTS.includes(sortRaw) ? sortRaw : "",
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 999) : 1,
  };
}

/** Map parsed filters to the listProducts() argument shape. */
export function toListProductsArgs(
  f: ParsedCatalogFilters,
  extra?: { category?: string; collection?: string; perPage?: number }
) {
  return {
    q: f.q || undefined,
    category: extra?.category ?? (f.category || undefined),
    collection: extra?.collection,
    format: (f.format || undefined) as CatalogFormat | undefined,
    language: f.language || undefined,
    minPriceTaka: f.priceMin ? Number(f.priceMin) : undefined,
    maxPriceTaka: f.priceMax ? Number(f.priceMax) : undefined,
    inStock: f.inStock || undefined,
    sort: (f.sort || "newest") as CatalogSort,
    page: f.page,
    perPage: extra?.perPage,
  };
}

export const SORT_OPTIONS = [
  { value: "newest", label: "নতুনতম" },
  { value: "price_asc", label: "মূল্য: কম → বেশি" },
  { value: "price_desc", label: "মূল্য: বেশি → কম" },
  { value: "title", label: "নাম" },
] as const;

export const FORMAT_FILTER_OPTIONS = [
  { value: "", label: "সব" },
  { value: "physical", label: "হার্ড কপি" },
  { value: "digital", label: "PDF" },
  { value: "bundle", label: "বান্ডেল" },
] as const;

export const LANGUAGE_FILTER_OPTIONS = [
  { value: "", label: "সব" },
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "ইংরেজি" },
] as const;

/** Bengali digits for counts/numbers. */
export function bnNum(n: number): string {
  return n.toLocaleString("bn-BD");
}
