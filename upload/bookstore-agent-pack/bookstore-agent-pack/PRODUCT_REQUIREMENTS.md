# Product Requirements Document (PRD)

## 1. Product vision

Build an elegant, editorial-style online bookstore where customers can discover books and choose how they want to own each title: **physical hard copy, digital PDF/eBook, or a combined bundle** when offered. The store should feel curated and trustworthy, but shopping, checkout, order tracking, and digital access must be operationally real.

### Primary market

Bangladesh, with prices in BDT, local mobile-first behavior, district/address collection, common local payment methods through a gateway, and COD for eligible physical orders.

### Success outcomes

- A new visitor can find a book quickly, understand its available formats, and complete a purchase without confusion.
- A physical order can be managed from placement through shipment and delivery.
- A digital purchase unlocks secure downloads without exposing master PDF URLs.
- The owner can manage the catalogue, prices, stock, orders, digital assets, coupons, and storefront content without editing code.
- The site remains fast, accessible, and visually distinctive on low-to-mid-range mobile devices.

## 2. User roles

### Visitor / customer

Browse, search, filter, view product detail, add formats to cart, check out as guest, receive order confirmation, view order status, and access digital downloads after payment verification. Customer accounts and wishlist are supported if the existing stack can deliver them without delaying the core flow.

### Store administrator

Manage products and their variants, categories, authors, book metadata, private digital assets, stock, orders, shipping/tracking, payment status, coupons, homepage collections, reviews, and basic store settings. Admin role checks must run server-side.

### Future roles (not required for MVP)

Catalog editor, fulfilment operator, customer support, author/publisher partner.

## 3. Product types and variant rules

A book title is the parent product. A customer buys a purchasable offer/variant, not an ambiguous generic product.

Supported variant types:

- `physical`: hard copy; has stock, weight/size if needed, shipping eligibility, and a physical price.
- `digital`: PDF/eBook; no shipping or physical inventory; has an associated licensed digital asset and secure entitlement rules.
- `bundle`: physical + digital; has an explicit bundle price, decrements physical stock, and unlocks the included digital file only after successful online payment.

A title can offer any subset of these. Admin may mark an offer unavailable without deleting the title. Do not show a format selector for formats that do not exist. Changing format updates price, availability, cart line identity, delivery estimate, and eligibility for COD.

## 4. Core user journeys

### Journey A: Discover and purchase a book

1. Open home, category, collection, or search.
2. Scan clear book cards: cover, title, author, current price or “from” price, available format indicator, and optional real review summary.
3. Open product detail; review synopsis, author/publisher details, metadata, format choices, price, stock/availability, delivery information, and any authorised preview.
4. Select format and quantity (physical/bundle quantity cannot exceed available stock).
5. Add to cart; receive clear confirmation and see the selected format.
6. Checkout with contact details, shipping address for physical items, delivery method/fee, payment method, order summary, and policy consent.
7. Place order and see a pending/success/failure state consistent with actual server state.
8. Receive email confirmation; if digital access has been granted, email provides a safe way to reach the download area.

### Journey B: Buy a PDF/eBook

1. Select digital format on a title that offers it.
2. Cart and checkout identify the item as digital and indicate that no courier delivery is needed.
3. Customer pays through a supported online gateway.
4. Server verifies payment before activating entitlement.
5. The customer receives a confirmation and can access the file through their account or a secure guest-access link.
6. Download action authorizes the order entitlement, records an audit event, and issues a short-lived signed URL or streams the file securely.
7. Limit and expiry rules are configurable and visible in plain language. Never display the private storage path.

### Journey C: Mixed physical + digital cart

Allow the cart and compute shipping only for physical components. Require online payment for the whole cart in MVP. Once payment is verified, digital components become available; physical components continue through fulfilment. If a future split-payment/split-order design is introduced, make it explicit in checkout and order history.

### Journey D: Track an order

Customer uses a secure order status page or signed email link. Show a human-readable status timeline, payment state, items, selected formats, delivery fee, address summary, and courier tracking ID/link when set. Do not expose private admin notes.

### Journey E: Admin fulfils an order

Admin views new orders, checks payment/fulfilment state, confirms COD orders, updates processing/shipped/delivered/cancelled/returned status, adds courier/consignment information, and sends a status notification. Digital delivery should follow payment verification, not depend on shipping status.

## 5. Required public pages

- Home
- Shop / all books
- Category and curated collection pages
- Search results
- Product detail
- Cart
- Checkout
- Order confirmation / status
- Customer sign-in / magic link or account area, if supported
- My orders / digital library / downloads
- Wishlist, optional in MVP if it doesn't compromise core commerce
- About the bookstore
- Contact / support
- Delivery policy
- Returns/refund policy
- Privacy policy
- Terms of sale, including digital-product access terms
- FAQ
- Custom not-found and error states

## 6. Required admin pages

- Admin overview with real counts from the database
- Products and variants CRUD
- Categories/collections CRUD
- Product image and authorised digital-file management
- Inventory management and low-stock indicators based on real stock
- Orders and order detail with payment/fulfilment state transitions
- Coupon management with validity, usage limit, and eligible formats/categories
- Reviews moderation, if reviews are enabled
- Store settings: branding, language/default locale, contact/support, delivery charges/zones, tax/discount settings if applicable, return policy text, download limit/expiry
- Audit log for critical admin actions and download events

## 7. Catalogue requirements

Each title should support:

- Title, slug, author(s), optional translator/editor/illustrator
- Short subtitle/tagline and long description/synopsis
- One primary cover plus optional gallery images
- Language, category/categories, tags, publisher/imprint, publication date/year, ISBN when applicable, page count, binding/edition, country/region metadata where useful
- SEO title/description and share image, with sensible generated defaults
- Status: draft, published, archived
- Featured/new-arrival/bestseller/editor-pick flags set by admins, not fabricated from sales
- Preview excerpt only where rights permit
- Actual inventory and price per physical/bundle variant
- Digital asset metadata and rights confirmation for downloadable formats
- Optional rating and reviews only if real, moderated submissions exist

## 8. Search and browse

- Search across title, author, ISBN, publisher, tags, and synopsis where supported.
- Search UI works with Enter and a visible search button; suggestions are optional.
- Filters: category, author, language, format (Hard Copy/PDF/Bundle), price range, availability, and relevant attributes.
- Sort: relevance, newest, price low-to-high, price high-to-low, and best-selling only when backed by real order data.
- Filters should be shareable as URL query parameters and retain state on back navigation.
- Provide clear-filters and useful empty results guidance.

## 9. Cart, checkout, and pricing

- Cart persists across navigation and survives refresh. Guest cart is supported.
- A cart line is keyed by variant/offer, not just parent title. The same title in physical and PDF formats can be two distinct lines.
- Validate current price, publish status, stock, variant availability, coupon, and delivery eligibility on the server during checkout.
- Do not trust totals sent by the browser.
- Calculate subtotal, eligible coupon discount, shipping, and grand total server-side with integer-safe money arithmetic.
- Physical items require delivery address and a shipping charge/zone calculation. Digital-only carts must not ask for a street address unless needed for invoicing or fraud checks.
- COD is available only when the cart contains physical items and no digital entitlement items, unless order-splitting is deliberately implemented. In MVP, disable COD for mixed carts and explain why.
- Online gateway methods depend on configured merchant account/contract. Show only enabled methods.
- Manual bank/mobile-payment instructions may be added as an admin-enabled fallback, but should not auto-mark orders as paid. A human verifies reference/transaction evidence.
- Support safe retry for failed/cancelled gateway attempts without creating duplicate paid orders.

## 10. Payments and order lifecycle

Suggested order statuses: `pending_payment`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `returned`, `refunded`.

Keep payment status separate: `unpaid`, `pending`, `paid`, `failed`, `partially_refunded`, `refunded`, `cod_due`, `cod_collected`.

- Successful payment is established by a verified server callback/API verification, not by a redirect query string or frontend state.
- Payment events are idempotent by provider transaction/reference ID.
- Record gateway, amount, currency, state, raw response metadata where appropriate (redact secrets/PII), and timestamps.
- Do not issue digital entitlements on `pending`, `failed`, or an unverified browser return.
- Cancellation/refund must revoke future entitlements where policy and local requirements call for it; previously generated short-lived links can remain valid until their short expiry, so keep TTL low.

## 11. Digital catalogue and delivery

- Store source PDFs in a private bucket or equivalent private object storage.
- Keep `storage_path` server-side; do not send it to public product APIs.
- Each asset must have a rights/permission flag confirmed by an administrator before publishing a digital variant.
- Grant entitlement only for paid orders (or a logged, permission-checked admin grant).
- Entitlement fields: order line, customer/order access owner, activation, optional expiration, maximum downloads, successful download count, revocation state.
- Use short-lived signed URLs or server streaming after authorization. Protect the endpoint with authentication or a high-entropy expiring guest token.
- Store only a hash of guest download tokens; do not store bearer tokens in plaintext.
- Rate-limit entitlement creation and download endpoints. Log time, order line, asset ID, and outcome; avoid over-collecting IP or device data.
- Optionally watermark PDFs with buyer/order metadata only if implemented reliably and described in the policy. Watermarking is not a substitute for access controls.
- Previews/excerpts must be separate assets that the store has permission to publish publicly.

## 12. Physical inventory and fulfilment

- Inventory is checked and reserved/decremented atomically when an order reaches the appropriate confirmed state. Avoid overselling concurrent checkouts.
- COD orders may start as `confirmed` but payment remains `cod_due`; set the exact policy in code and tests.
- Store customer recipient name, phone, district, area, full address, optional delivery instructions, courier provider, consignment/tracking ID, shipment status, and admin notes separately.
- Provide manual fulfilment first. Add courier API integration through a provider adapter only when credentials are supplied and the integration is tested.
- Delivery charge and expected delivery copy are configurable. Do not hard-code unverified provider pricing or guarantee delivery timing.

## 13. Email/notifications

Transactional messages: order placed, payment confirmed/failed, digital library ready, download access/recovery, order shipped/tracking, delivered, cancelled/refunded, and admin low-stock/order alerts. If email isn't configured, the app must disclose this in setup documentation and surface an admin warning rather than silently pretending to send messages.

## 14. Analytics and operations

Track meaningful events without putting payment data or secret links in analytics: `view_item`, `select_format`, `add_to_cart`, `begin_checkout`, `purchase` only after confirmed payment or explicitly identified COD order placement, `search`, `filter_catalogue`, `download_authorized`, and `download_denied`. Keep event semantics documented; do not double-count purchase on a payment return page and a webhook.

## 15. Out of scope for MVP

- Multi-vendor marketplace
- DRM claiming to prevent all copying
- Subscription/credit-based reading service
- Native mobile app
- International currencies/tax automation unless requested
- AI book recommendations using personal customer data
- Automated courier booking before credentials and operating process are confirmed

## 16. MVP release gate

A release is not complete until a real admin can publish an authorised product, a customer can buy a physical or digital variant with correct pricing, the server can confirm a payment or place an allowed COD order, inventory/order state is persisted, digital files remain private, a paid buyer can securely download the correct file, and the essential test suite and production build pass.
