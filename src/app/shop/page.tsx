import type { Metadata } from "next";
import { listProducts, listCategories } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/catalog-browser";
import {
  bnNum,
  parseCatalogSearchParams,
  toListProductsArgs,
} from "@/components/catalog-shared";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const f = parseCatalogSearchParams(await searchParams);
  return {
    title: f.q ? `খোঁজা: ${f.q}` : "সব বই",
    robots: f.q ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const f = parseCatalogSearchParams(await searchParams);
  const [result, categories] = await Promise.all([
    listProducts(toListProductsArgs(f, { perPage: 20 })),
    listCategories(),
  ]);

  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">
          {f.q ? (
            <>
              খোঁজা: <span className="text-primary">“{f.q}”</span>
            </>
          ) : (
            "সব বই"
          )}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {bnNum(result.total)}টি বই পাওয়া গেছে
          {f.q ? " — শিরোনাম, লেখক, প্রকাশক ও ISBN ধরে খোঁজা হয়েছে" : ""}
        </p>
      </div>
      <div className="mt-8">
        <CatalogBrowser
          result={result}
          categories={categories.map((c) => ({
            slug: c.slug,
            name: c.name,
            productCount: c.productCount,
          }))}
          basePath="/shop"
          showCategoryFilter
          current={{
            q: f.q,
            category: f.category,
            format: f.format,
            language: f.language,
            priceMin: f.priceMin,
            priceMax: f.priceMax,
            inStock: f.inStock,
            sort: f.sort,
          }}
        />
      </div>
    </div>
  );
}
