# Research Notes and Product Decisions

Research reviewed on **11 October 2026**. Provider capabilities, eligibility and fees can change; check the provider's current official documentation and merchant agreement before launch.

## 1. Benchmarks reviewed

### Rokomari — local Bangladesh discovery patterns

Website: https://www.rokomari.com/?locale=bn

Observed useful patterns include Bangla-first browsing, prominent search, broad shop/category entry points, an Ebook category, and order tracking/customer service paths. The project should adopt the clarity of these local patterns without copying its visual design. [Source](https://www.rokomari.com/?locale=bn)

### Bookshop.org — curated discovery and collections

Website: https://bookshop.org/

Bookshop.org foregrounds curated lists and bookstore/reader discovery alongside standard product categories. This supports giving the proposed store a few owner-managed shelves/collections rather than showing only an undifferentiated product grid. Its commercial model and catalogue are not assumed for this project. [Source](https://bookshop.org/)

### Barnes & Noble — browse, metadata and findability

eBook browse: https://www.barnesandnoble.com/pages/browse-ebooks

Barnes & Noble organises books across clear subject areas and supports discovery through search, descriptive metadata, recommendations, reviews and previews. The proposed build prioritises title/author/ISBN search, useful filters, reliable metadata and previews only where permitted. Reviews/previews must not be fabricated. [Source](https://www.barnesandnoble.com/pages/browse-ebooks)

### WooCommerce — physical + virtual + downloadable behaviour

Product docs: https://woocommerce.com/document/managing-products/virtual-downloadable/
Download guide: https://woocommerce.com/document/digital-downloadable-product-handling/

WooCommerce documents downloadable products alongside virtual/physical shipping behavior, and configurable download limits/expiry. The proposed custom app adopts the same underlying product principle: digital variants skip shipping, physical variants require fulfilment, and mixed/bundle variants need explicit rules. [Sources](https://woocommerce.com/document/managing-products/virtual-downloadable/), [download guide](https://woocommerce.com/document/digital-downloadable-product-handling/)

### Shopify — digital asset delivery options

Documentation: https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads

Shopify's digital-product documentation distinguishes file/link assets and automatic versus manual delivery. For this bookstore, digital delivery is automatic only after verified payment and is protected behind an entitlement, rather than exposing a public product-file link. [Source](https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads)

## 2. Bangladesh payments and fulfilment

### aamarPay

Website: https://aamarpay.com/

Its public site lists support for multiple local payment methods including bKash, Rocket and Nagad, bank cards and other methods. This makes it a candidate gateway to evaluate for a single local checkout integration. Current merchant eligibility, settlement, fees, API process and available methods must be confirmed directly; the project must not hard-code unsupported methods. [Source](https://aamarpay.com/)

### bKash business payments

Website: https://www.bkash.com/en/business

bKash advertises business payment-gateway and API options. Direct bKash integration is a possible later provider adapter if merchant onboarding and technical requirements make it preferable to an aggregator. Never collect a customer's PIN or OTP on the store website. [Source](https://www.bkash.com/en/business)

### Pathao Courier

Merchant site: https://merchant.pathao.com/

Pathao describes nationwide delivery and COD services on its merchant site. Keep shipping as a provider adapter; start with configurable delivery fees and manual fulfilment, then connect an officially supported API once the merchant account/API access and current documentation are available. Do not assume a flat courier rate or guarantee a delivery window. [Source](https://merchant.pathao.com/)

## 3. Technical choices

### Next.js App Router and SEO

Official docs: https://nextjs.org/docs/app and https://nextjs.org/docs/app/getting-started/metadata-and-og-images

The App Router provides server/client composition and route-based structure. Next.js metadata APIs support per-page titles, descriptions and share metadata. This fits indexable product/category pages and a server-owned checkout. Keep the recommendation conditional on the existing repository; do not replace a working app stack without a clear reason. [Sources](https://nextjs.org/docs/app), [metadata docs](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)

### Supabase Storage private assets

Docs: https://supabase.com/docs/guides/storage/buckets/fundamentals and https://supabase.com/docs/guides/storage/security/access-control

Supabase documents private buckets, access control through RLS, and time-limited signed URLs. Original PDF files should be private and reachable only after the server has checked the buyer's entitlement. Public bucket URLs are inappropriate for purchased source files. [Sources](https://supabase.com/docs/guides/storage/buckets/fundamentals), [access control](https://supabase.com/docs/guides/storage/security/access-control)

## 4. Design reference

A contemporary editorial bookstore reference with restrained cream backgrounds, serif typography and structured book imagery: https://www.framer.com/marketplace/templates/bookstorestudio/ . Use it as mood/reference only; build an original design system and do not copy exact composition, assets or brand.

## 5. Key product decisions and why

| Decision | Reason |
|---|---|
| One title can have physical, digital, and bundle variants | Prevents duplicated catalogue records and makes format/price selection understandable. |
| Variant is the cart line identity | A customer may buy the same title as a hard copy and PDF in one order; pricing and fulfilment differ. |
| Physical-only carts may use COD; digital/mixed carts require online payment in MVP | COD cannot confirm digital payment, and mixed baskets otherwise need split-settlement logic. |
| Gateway is an adapter with server-side verification | Payment provider and merchant access may change; browser redirects cannot be trusted for payment state. |
| Private source PDF storage + entitlement and temporary delivery URLs | Prevents permanent public sharing and supports expiry/download limits/auditing. This is access control, not complete DRM. |
| Owner-curated collections before complex recommendations | Matches editorial bookstore feel and is possible without unreliable/fake personalization. |
| Manual delivery integration first | Store can launch without blocking on courier API onboarding; provider API comes later. |
| Bengali-first UI with English-ready data/content support | Fits primary market while leaving room for English book metadata and future expansion. |
| Keep name, policy, prices, gateway and delivery configuration editable | Owner has not yet supplied brand identity, real catalogue, merchant details or operating policy. |

## 6. Open questions for launch (do not block implementation)

The agent should make the app configurable and use labelled placeholders, then list these questions in its final report:

1. Final store name, logo, support email/phone, domain and social links.
2. Real catalogue, product covers, author/ISBN metadata, prices, and stock counts.
3. Rights/distribution evidence for each PDF/eBook and the store's preview/watermark policy.
4. Payment provider selected, merchant approval, live/sandbox credentials and callback URLs.
5. Delivery fee zones, free-shipping thresholds if any, courier account, handling times and return rules.
6. Customer account requirement vs guest checkout preference.
7. Final Bengali/English content and terms/refund policy reviewed for the actual business.

## 7. Source links (quick reference)

- [Rokomari](https://www.rokomari.com/?locale=bn)
- [Bookshop.org](https://bookshop.org/)
- [Barnes & Noble eBook subjects](https://www.barnesandnoble.com/pages/browse-ebooks)
- [WooCommerce virtual/downloadable products](https://woocommerce.com/document/managing-products/virtual-downloadable/)
- [WooCommerce digital delivery guide](https://woocommerce.com/document/digital-downloadable-product-handling/)
- [Shopify digital products](https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads)
- [aamarPay](https://aamarpay.com/)
- [bKash business](https://www.bkash.com/en/business)
- [Pathao Courier merchant portal](https://merchant.pathao.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Supabase private storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [BookstoreStudio design reference](https://www.framer.com/marketplace/templates/bookstorestudio/)
