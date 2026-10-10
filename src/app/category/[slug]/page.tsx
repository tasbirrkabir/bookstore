import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, listCategories, listProducts } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/catalog-browser";
import {
  bnNum,
  parseCatalogSearchParams,
  toListProductsArgs,
} from "@/components/catalog-shared";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "বিভাগ পাওয়া যায়নি" };
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: { canonical: `/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const f = parseCatalogSearchParams(await searchParams);
  const [result, categories] = await Promise.all([
    listProducts(toListProductsArgs(f, { category: slug, perPage: 20 })),
    listCategories(),
  ]);

  return (
    <div className="pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">হোম</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/shop">বইসমূহ</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{category.name}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {category.description ? `${category.description} · ` : ""}
          {bnNum(result.total)}টি বই
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
          basePath={`/category/${slug}`}
          showCategoryFilter={false}
          current={{
            q: f.q,
            category: "",
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
