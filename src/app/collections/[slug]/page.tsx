import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCollectionBySlug, listProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { bnNum, parseCatalogSearchParams } from "@/components/catalog-shared";
import { Button } from "@/components/ui/button";
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
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "সংগ্রহ পাওয়া যায়নি" };
  return {
    title: collection.title,
    description: collection.description ?? undefined,
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const page = parseCatalogSearchParams(await searchParams).page;
  const result = await listProducts({ collection: slug, page, perPage: 24, sort: "newest" });

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
              <BreadcrumbPage>{collection.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Editorial shelf header */}
      <section className="hairline-b bg-secondary/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-accent-foreground">সংগ্রহ</p>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            {collection.title}
          </h1>
          {collection.description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">{bnNum(result.total)}টি বই</p>
        </div>
      </section>

      <div className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {result.items.length > 0 ? (
          <>
            <ProductGrid products={result.items} />
            {result.totalPages > 1 ? (
              <nav
                aria-label="পেজিনেশন"
                className="mt-10 flex items-center justify-center gap-4"
              >
                {result.page > 1 ? (
                  <Button asChild variant="outline" className="h-11 gap-1.5 bg-card">
                    <Link href={`/collections/${slug}?page=${result.page - 1}`} rel="prev">
                      <ChevronLeft aria-hidden className="size-4" />
                      পূর্ববর্তী
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="h-11 gap-1.5">
                    <ChevronLeft aria-hidden className="size-4" />
                    পূর্ববর্তী
                  </Button>
                )}
                <p className="text-sm text-muted-foreground">
                  পৃষ্ঠা {bnNum(result.page)}/{bnNum(result.totalPages)}
                </p>
                {result.page < result.totalPages ? (
                  <Button asChild variant="outline" className="h-11 gap-1.5 bg-card">
                    <Link href={`/collections/${slug}?page=${result.page + 1}`} rel="next">
                      পরবর্তী
                      <ChevronRight aria-hidden className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="h-11 gap-1.5">
                    পরবর্তী
                    <ChevronRight aria-hidden className="size-4" />
                  </Button>
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <div className="rounded-md border border-hairline bg-card px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-semibold">এই সংগ্রহে এখনও কোনো বই নেই</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
              শীঘ্রই বই যোগ করা হবে। ততক্ষণে দোকানের অন্য বইগুলো দেখে আসুন।
            </p>
            <Button asChild variant="outline" className="mt-5 h-11 bg-card px-6">
              <Link href="/shop">সব বই দেখুন</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
