import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { BookCover, FormatBadges } from "@/components/book-cover";
import { ProductGrid } from "@/components/product-card";
import { ProductPurchaseSection } from "@/components/product-purchase-panel";
import { Synopsis } from "@/components/synopsis";
import { bnNum } from "@/components/catalog-shared";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  // Metadata resolves before the streamed shell is flushed, throwing here
  // guarantees a real 404 status (not just the 404 UI).
  if (!product) notFound();
  const title = product.seoTitle || product.title;
  const description = product.seoDescription || product.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: { title, description, type: "website" },
  };
}

function languageLabel(lang: string): string {
  if (lang === "bn") return "বাংলা";
  if (lang === "en") return "ইংরেজি";
  return lang;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedProducts(product)]);

  const metaBits = [
    product.publisher ? `প্রকাশনা: ${product.publisher}` : null,
    product.publicationYear ? `প্রকাশকাল: ${bnNum(product.publicationYear)}` : null,
    product.pageCount ? `পৃষ্ঠা: ${bnNum(product.pageCount)}` : null,
    product.isbn ? `ISBN: ${product.isbn}` : null,
  ].filter((v): v is string => v !== null);

  const detailRows = (
    [
      ["শিরোনাম (ইংরেজি)", product.titleEn],
      ["অনুবাদক", product.translator],
      ["সংস্করণ", product.edition],
      ["প্রকাশনা", product.publisher],
      [
        "প্রকাশকাল",
        product.publicationYear ? bnNum(product.publicationYear) : null,
      ],
      ["ভাষা", languageLabel(product.language)],
      ["পৃষ্ঠা", product.pageCount ? bnNum(product.pageCount) : null],
      ["ISBN", product.isbn],
      ["বাঁধাই", product.binding],
    ] as [string, string | null][]
  ).filter((row): row is [string, string] => typeof row[1] === "string" && row[1].length > 0);

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
              <BreadcrumbPage className="max-w-[40vw] truncate">{product.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto mt-8 grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14 lg:px-8">
        {/* Cover + availability */}
        <div>
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-md shadow-lg shadow-ink/15 lg:max-w-md">
            <BookCover
              title={product.title}
              author={product.authorDisplay}
              coverImage={product.coverImage}
              coverPattern={product.coverPattern}
              size="xl"
              priority
            />
          </div>
          <div className="mt-4 flex justify-center">
            <FormatBadges formats={product.formats} />
          </div>
        </div>

        {/* Title, synopsis, purchase */}
        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
            {product.title}
          </h1>
          {product.subtitle ? (
            <p className="mt-2 text-lg leading-relaxed text-muted-foreground">{product.subtitle}</p>
          ) : null}
          <p className="mt-3 text-sm">
            লেখক: <span className="font-medium">{product.authorDisplay}</span>
            {product.translator ? ` · অনুবাদক: ${product.translator}` : ""}
          </p>
          {metaBits.length > 0 ? (
            <p className="mt-1.5 text-sm text-muted-foreground">{metaBits.join(" · ")}</p>
          ) : null}

          {product.description ? (
            <div className="mt-6">
              <Synopsis text={product.description} />
            </div>
          ) : null}

          <div className="mt-8">
            <ProductPurchaseSection
              product={product}
              settings={{
                deliveryEstimateInside: settings.deliveryEstimateInside,
                deliveryEstimateOutside: settings.deliveryEstimateOutside,
                returnWindowDays: settings.returnWindowDays,
              }}
            />
          </div>

          {/* Details accordion */}
          <div className="mt-10 hairline-t pt-2">
            <Accordion type="single" collapsible className="w-full">
              {detailRows.length > 0 ? (
                <AccordionItem value="details">
                  <AccordionTrigger>বিস্তারিত তথ্য</AccordionTrigger>
                  <AccordionContent>
                    <dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                      {detailRows.map(([k, v]) => (
                        <div key={k} className="flex gap-3 text-sm">
                          <dt className="w-28 shrink-0 text-muted-foreground">{k}</dt>
                          <dd className="font-medium">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              ) : null}
              <AccordionItem value="delivery">
                <AccordionTrigger>ডেলিভারি ও রিটার্ন</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5 text-sm">
                    <li>ঢাকায়: {settings.deliveryEstimateInside}</li>
                    <li>ঢাকার বাইরে: {settings.deliveryEstimateOutside}</li>
                    <li>
                      রিটার্নের সময়সীমা: {bnNum(settings.returnWindowDays)} দিন,{" "}
                      <Link
                        href="/policies/returns"
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        রিটার্ন নীতি দেখুন
                      </Link>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Related books */}
      {related.length > 0 ? (
        <section
          aria-labelledby="related-books"
          className="mx-auto mt-16 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="hairline-t pt-10">
            <h2 id="related-books" className="font-display text-2xl font-semibold md:text-3xl">
              সম্পর্কিত বই
            </h2>
            <ProductGrid products={related} className="mt-6 md:grid-cols-4 xl:grid-cols-4" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
