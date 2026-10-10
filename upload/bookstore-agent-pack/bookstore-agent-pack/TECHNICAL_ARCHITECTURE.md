# Technical Architecture

## 1. Architecture objective

Deliver a maintainable, secure full-stack commerce application. Keep business logic on the server, payment/delivery providers replaceable, private files protected, and the core store functional even before optional third-party integrations are configured.

## 2. Repository-first rule

Before changing code, inspect the repo, package manager, routing, design system, database/auth setup, environment variables, deployment target, and existing features. Preserve working conventions and avoid broad rewrites. If the repo is empty, use the recommended baseline below.

## 3. Recommended baseline for a new repo

- Framework: Next.js App Router + React + TypeScript.
- Styling: Tailwind CSS with a small, consistent token system and accessible components.
- Backend/data: Supabase Postgres; use server-side clients for privileged operations and Auth if customer accounts are included.
- Object storage: Supabase Storage private bucket for original PDFs and authorised public assets for covers/previews, or equivalent private S3-compatible storage.
- Email: provider adapter (for example, Resend) for transactional messages.
- Payments: a provider abstraction with a gateway that is officially available to the merchant, such as aamarPay or SSLCOMMERZ; do not assume merchant account approval or credentials.
- Deployment: Vercel or another supported Node-compatible platform, selected based on the current repo.
- Testing: unit/integration tests for money/order/payment/security logic; browser E2E tests for core flows.

Do not install redundant libraries for functionality already present in the project. Keep dependency count reasonable.

## 4. Application modules

Suggested code boundaries (adapt to existing architecture):

- `catalog`: products, variants, categories, collections, search, SEO metadata.
- `cart`: persistent cart state and server-side price/stock revalidation.
- `checkout`: validation, address, shipping quote, totals, order creation.
- `payments`: provider adapter, initiation, status verification, webhook/callback, reconciliation.
- `orders`: state transitions, order history, notifications, fulfilment.
- `digital-library`: entitlements, signed-download issuance, limits, expiry, audit events.
- `inventory`: atomic stock reservation/decrement and restock flows.
- `admin`: role guard, product editor, asset management, order operations, settings.
- `notifications`: email templates and send/retry behavior.
- `content`: homepage collections, policies, about/contact/FAQ.
- `analytics`: privacy-aware event definitions and deduplication.

Keep shared domain logic in server-only modules. Never import service-role credentials into Client Components.

## 5. Request and trust boundaries

Browser requests are untrusted. The server must re-resolve product status, current variant price, stock, coupon validity, shipping eligibility, and totals before creating an order. Provider responses/redirects are also untrusted until verified according to the gateway's documented server-to-server process.

### Order creation pattern

1. Validate request shape and rate limits.
2. Fetch live published variants and stock in the database.
3. Recalculate subtotal/discount/shipping/total server-side.
4. Create an order and order lines using a transaction or equivalent safe pattern.
5. For online payment, create a provider transaction using the unique order reference and persist the pending payment attempt.
6. For COD-eligible physical-only cart, create the order with payment status `cod_due` and the chosen fulfilment state.
7. On verified payment result, atomically mark payment paid, update order status, commit stock changes if not already reserved, and create digital entitlements exactly once.
8. Queue/send email notifications with retry-safe jobs where available.

Avoid holding a database transaction open while waiting for an external gateway network call. Use explicit pending states, idempotency keys, and reconciliation for incomplete attempts.

## 6. Payment provider adapter

Define a provider-neutral interface conceptually equivalent to:

- `createCheckout({ order, customer, returnUrls })`
- `verifyCallback({ request })` / `verifyTransaction({ providerReference })`
- `parseWebhook({ request })`
- `refund({ payment, amount })` if refunds are supported

The provider adapter must follow the chosen provider's current official documentation. Verify signatures/tokens and then perform server-side status/amount/currency/reference comparison. Never trust a client-provided `status=success` alone. Keep raw responses minimal and redact credentials/PII. Support replay-safe webhook handling.

If gateway credentials are unavailable, make the checkout unavailable in production or clearly enable a development-only sandbox/mock provider guarded by an explicit non-production environment check. A mock must never imply real money moved.

## 7. Digital asset delivery

- Bucket for original PDFs is private.
- Public product/catalogue API returns safe metadata only, not a private `storage_path` or signed URL.
- Download route verifies customer auth or guest capability token, entitlement, payment status, revocation, expiry, and remaining count.
- Increment/log the download count atomically before issuing the short-lived URL or stream, with sensible handling for failed download starts if applicable.
- Signed URL TTL should be short and configurable (for example, a few minutes), not several days.
- Rate-limit per entitlement/account/guest token and keep anti-enumeration responses generic.
- Do not pretend signed URLs provide DRM; they are time-limited access links.

## 8. Authentication and authorisation

- Admin routes and server actions require an authenticated user with explicit admin role/claim or a server-checked allowlist in an admin table. Never treat obscurity or a hidden nav item as access control.
- Supabase RLS should be enabled for customer-scoped tables. User-facing data access must enforce ownership.
- Service-role/server secret keys stay server-only, never under `NEXT_PUBLIC_`.
- Guest orders are accessible only through a verified high-entropy token, secure magic link, or equivalent; order ID alone is not authorization.
- Use CSRF-aware patterns, safe redirects, strict request validation, and rate limits on login, coupon attempts, checkout, order lookup, and download routes.

## 9. Inventory consistency

Use a database transaction, row lock, conditional update, or RPC for stock reservation so concurrent checkouts cannot oversell. Decide and document whether stock is reserved when an order is created or only when payment succeeds; if reserved while pending, release reservations after a configured expiry. Add tests for concurrent purchase attempts.

For COD orders, stock is reserved/committed when the store confirms the order according to configured policy. Cancellation/return flows must restock only when the item is physically eligible and actually returned, not automatically for every cancelled order.

## 10. Money model

Use integer minor units (BDT poisha) internally wherever practical; store the currency explicitly (`BDT`). Format using `Intl.NumberFormat('bn-BD', { style: 'currency', currency: 'BDT' })` or an agreed locale-aware formatter. Provider amount formats and rounding rules must match their official documentation. Never use binary floating point for authoritative totals.

## 11. Shipping provider abstraction

MVP should support configurable flat/zone-based delivery charges and manual courier fulfilment. Add a provider adapter for Pathao or another courier only after official API access and credentials are provided. Keep courier credentials in server environment variables. Save the provider's consignment/tracking reference and show a verified tracking link. Do not scrape merchant-panel pages as a substitute for an API.

## 12. Email and async work

Send transactional email server-side. Use durable queue/background job support if already available; otherwise implement retryable sending with an outbox/log pattern appropriate to the deployment. Never block the verified payment state transition indefinitely because email delivery fails. Provide an admin retry action and log notification delivery outcomes.

## 13. Search and SEO

- Use server-rendered product/category pages with canonical URLs and useful metadata.
- Implement per-product title/description and Open Graph image; ensure private PDF paths never appear in metadata or HTML.
- Generate sitemap and robots rules; keep cart, account, order, and admin routes out of indexing.
- Use product structured data only for real, correctly represented prices/availability/ratings. Never claim reviews or stock values that don't exist.
- Search implementation can start with Postgres full-text/trigram support or a reliable database query. Add a dedicated search service only when justified.

## 14. Operational requirements

- Schema migrations committed to repo.
- Seed script with obviously fictional demo content; seed never includes copyrighted PDF downloads.
- Environment validation at boot/build with clear errors for missing required production values.
- Structured logs for order/payment/download transitions; avoid logging secrets or entire customer payloads.
- Error monitoring hook if configured; graceful fallback if not.
- Backup, restore, privacy, refunds, taxes, and retention policies documented before production launch.
- Production admin bootstrap process documented securely; never hard-code a default password.

## 15. Environment variable template

Use only variables relevant to chosen integrations. Suggested names (adjust as needed):

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=পাতা
NEXT_PUBLIC_DEFAULT_LOCALE=bn

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

EMAIL_PROVIDER_API_KEY=
EMAIL_FROM_ADDRESS=

PAYMENT_PROVIDER=disabled
PAYMENT_MERCHANT_ID=
PAYMENT_MERCHANT_KEY=
PAYMENT_STORE_ID=
PAYMENT_STORE_PASSWORD=
PAYMENT_WEBHOOK_SECRET=

COURIER_PROVIDER=manual
COURIER_CLIENT_ID=
COURIER_CLIENT_SECRET=

DOWNLOAD_SIGNED_URL_TTL_SECONDS=300
DOWNLOAD_DEFAULT_LIMIT=5
DOWNLOAD_DEFAULT_EXPIRY_DAYS=365
ADMIN_EMAIL_ALLOWLIST=
```

Do not commit real values. Document which variables the actual implementation requires. `PAYMENT_PROVIDER=disabled` must not silently produce a production “paid” order.

## 16. Deployment checklist

- Apply migrations to the intended database and verify RLS.
- Add production environment variables and rotate any that may have leaked.
- Configure gateway callback/return URLs and verify transaction checking in sandbox, then run a low-value controlled live test when authorized.
- Configure private storage bucket policies and test cross-account/download-denial cases.
- Verify email sender/domain and bounce behavior.
- Set site URL, canonical metadata, sitemap, robots, analytics consent where required, and error monitoring.
- Test restore and admin access.
- Check checkout on a real mobile device and weak network before marketing launch.
