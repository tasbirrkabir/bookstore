import Link from "next/link";
import { BookCover, FormatBadges } from "@/components/book-cover";
import { formatBdt } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCardDTO } from "@/lib/catalog";

/**
 * Shared product card. Only grounded labels are shown:
 * - "নতুন" when the admin flagged the title as a new arrival;
 * - "ছাড় চলছে" when an active variant really carries a compare-at price.
 * The card DTO does not include the compare-at amount, so no invented
 * percentage is displayed. Whole card links to /product/[slug].
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
  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        "group flex h-full flex-col rounded-md border border-hairline bg-card p-3 transition-colors duration-200 hover:border-primary/60",
        className
      )}
    >
      <div className="relative">
        {product.newArrival ? (
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground">
            নতুন
          </span>
        ) : product.hasDiscount ? (
          <span className="absolute left-2 top-2 z-10 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            ছাড় চলছে
          </span>
        ) : null}
        <BookCover
          title={product.title}
          author={product.authorDisplay}
          coverImage={product.coverImage}
          coverPattern={product.coverPattern}
          size="md"
          priority={priority}
          className="rounded-[3px] transition-transform duration-200 group-hover:-translate-y-0.5"
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.authorDisplay}</p>
        <div className="mt-auto pt-2.5">
          {product.minPriceMinor != null ? (
            <p className="text-sm font-semibold text-foreground">
              {formatBdt(product.minPriceMinor)}
              {showFrom ? <span className="text-xs font-normal text-muted-foreground"> থেকে</span> : null}
            </p>
          ) : null}
          <FormatBadges formats={product.formats} className="mt-1.5" />
        </div>
      </div>
    </Link>
  );
}

/** Standard catalog grid: 2 / 3 / 4 / 5 columns. */
export function ProductGrid({
  products,
  className,
}: {
  products: ProductCardDTO[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5",
        className
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
