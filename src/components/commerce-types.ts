// Client-safe mirror of the cart quote DTO returned by GET /api/cart.
// (src/lib/cart.ts is server-only, client components must not import it, not even types.)

export type CartLineFormat = "physical" | "digital" | "bundle";

export type CartLine = {
  id: string;
  variantId: string;
  productId: string;
  slug: string;
  title: string;
  titleEn: string | null;
  authorDisplay: string;
  coverImage: string | null;
  coverPattern: string;
  formatType: CartLineFormat;
  unitPriceMinor: number;
  compareAtPriceMinor: number | null;
  quantity: number;
  lineSubtotalMinor: number;
  inStock: boolean;
  stockOnHand: number | null;
  hasIssue: string | null; // "unavailable" | "out_of_stock" | "qty_over_stock"
};

export type CartQuote = {
  lines: CartLine[];
  subtotalMinor: number;
  discountMinor: number;
  couponCode: string | null;
  couponMessage: string | null;
  couponError: string | null;
  hasPhysical: boolean;
  hasDigital: boolean;
  allPhysicalAvailable: boolean;
  codEligible: boolean;
  requiresOnlinePayment: boolean;
  shippingEstimateMinor: number | null;
  shippingZones: { id: string; label: string; feeMinor: number; estimate: string }[];
  totalMinorWithShippingEstimate: number | null;
  itemCount: number;
};
