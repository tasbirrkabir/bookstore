import Link from "next/link";
import { BookCover, FormatBadges } from "@/components/book-cover";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bnNum } from "@/components/catalog-shared";
import type { ProductCardDTO } from "@/lib/catalog";

/**
 * Shared product card. Only grounded labels are shown:
 * - "নতুন" when the admin flagged the title as a new arrival;
 * - a real "-X%" chip plus strike-through compare-at price when an active
 *   variant genuinely carries a compare-at amount.
 * Whole card links to /product/[slug].
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardDTO;
  priority?: boolean;
  className?: string;
}) {
  const showFrom = product.formats.length > 1 && product.minPriceMinor != null;
  const deal = product.hasDiscount && product.discountPercent != null && product.compareAtMinor != null;

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-lg border border-hairline bg-card transition-all duration-200 hover:-translate-y-1 hover:border-forest/40 hover:shadow-xl hover:shadow-forest/10",
        className
      )}
    >
      <div className="relative p-3 pb-0">
        <div className="pointer-events-none absolute inset-x-3 top-3 bottom-0 z-0 rounded-md bg-forest-soft/0 transition-colors duration-200 group-hover:bg-forest-soft/40" aria-hidden />
        {deal ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-oxblood px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground shadow-sm">
            -{bnNum(product.discountPercent ?? 0)}%
          </span>
        ) : product.newArrival ? (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-forest px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground shadow-sm">
            নতুন
          </span>
        ) : null}
        <BookCover
          title={product.title}
          author={product.authorDisplay}
          coverImage={product.coverImage}
          coverPattern={product.coverPattern}
          size="md"
          priority={priority}
          className="relative z-[1] rounded-[3px] shadow-md shadow-ink/15 transition-transform duration-200 group-hover:-translate-y-0.5"
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col px-3 pb-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{product.authorDisplay}</p>
        <div className="mt-auto pt-2.5">
          {product.minPriceMinor != null ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-sm font-bold text-foreground">
                {formatBdt(product.minPriceMinor)}
              </span>
              {deal ? (
                <span className="text-xs text-muted-foreground line-through">
                  {formatBdt(product.compareAtMinor!)}
                </span>
              ) : null}
              {showFrom ? <span className="text-xs font-normal text-muted-foreground">থেকে</span> : null}
            </p>
          ) : null}
          <FormatBadges formats={product.formats} className="mt-1.5" />
        </div>
      </div>
    </Link>
  );
}

/** Standard catalog grid. Pass colsClass to override the column template. */
export function ProductGrid({
  products,
  className,
  colsClass,
}: {
  products: ProductCardDTO[];
  className?: string;
  colsClass?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 md:gap-6",
        colsClass ?? "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

/** Horizontal scrollable shelf (used by the arrivals row on the home page). */
export function ProductShelf({
  products,
  className,
}: {
  products: ProductCardDTO[];
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4 overflow-x-auto pb-3 scroll-slim md:gap-5", className)}>
      {products.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          priority={i < 2}
          className="w-44 shrink-0 md:w-52"
        />
      ))}
    </div>
  );
}
