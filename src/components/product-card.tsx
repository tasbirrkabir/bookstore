import Link from "next/link";
import { BookCover, FormatBadges } from "@/components/book-cover";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import { bnNum } from "@/components/catalog-shared";
import type { ProductCardDTO } from "@/lib/catalog";

/**
 * Shared product card, kept deliberately quiet: a soft plate behind the
 * cover, calm type below, no stamps or heavy frames. Only grounded labels
 * are shown ("নতুন", a real -X% pill with strike-through compare-at price).
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
      className={cn("group flex h-full flex-col", className)}
    >
      <div className="relative rounded-xl bg-sand p-5 transition-colors duration-300 group-hover:bg-[#eceadf]">
        {deal ? (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-press shadow-whisper">
            -{bnNum(product.discountPercent ?? 0)}%
          </span>
        ) : product.newArrival ? (
          <span className="absolute left-3.5 top-3.5 z-10 rounded-full bg-forest px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
            নতুন
          </span>
        ) : null}
        <div className="mx-auto w-[72%] transition-transform duration-300 ease-out group-hover:-translate-y-1">
          <BookCover
            title={product.title}
            author={product.authorDisplay}
            coverImage={product.coverImage}
            coverPattern={product.coverPattern}
            size="md"
            priority={priority}
            className="rounded-md shadow-lift"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pb-1 pt-3.5">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-sm font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{product.authorDisplay}</p>
        <div className="mt-auto pt-2.5">
          {product.minPriceMinor != null ? (
            <p className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[15px] font-semibold text-foreground">
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
        "grid grid-cols-2 gap-x-5 gap-y-9 md:gap-x-6",
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
    <div className={cn("flex gap-5 overflow-x-auto pb-3 scroll-slim md:gap-6", className)}>
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
