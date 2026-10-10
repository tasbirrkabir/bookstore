# Implementation Plan and Milestones

Follow the phases in order. Keep the app runnable after every phase. Update the checklist in the pull request/agent report as each gate passes.

## Phase 0 — Reconnaissance and setup

- [ ] Inspect repository, package manager, app routes, database, auth, storage, design system, deployment and tests.
- [ ] Summarise existing architecture and identify constraints before making changes.
- [ ] Read the PRD, UI/UX spec, architecture and data/security notes.
- [ ] Define the smallest integration plan that fits the repo; document any deviations.
- [ ] Verify environment variable handling and ensure no secrets are committed.
- [ ] Record baseline lint/type-check/test/build results.

**Gate:** No code rewrite begins before the agent understands the repository.

## Phase 1 — Design system and public shell

- [ ] Add tokens for colour, typography, spacing, borders, responsive containers, focus and semantic states.
- [ ] Build global header, navigation/search affordance, footer, buttons, inputs, status messages, product cover/card, loading skeletons, and empty/error states.
- [ ] Implement mobile and desktop layouts, keyboard/focus behavior, reduced-motion behavior, and Bengali font fallback.
- [ ] Use local, clearly fictional placeholder covers until real catalogue assets are provided.

**Gate:** Responsive shell works at mobile/tablet/desktop breakpoints with no horizontal overflow.

## Phase 2 — Catalogue and discovery

- [ ] Create/migrate data model for products, variants, categories, collections and assets.
- [ ] Implement product/variant query functions and safe public DTOs.
- [ ] Build home, shop, category, collection, search/results and product detail pages.
- [ ] Implement format selection and live price/availability updates.
- [ ] Add filters/sorting with URL query state and clear-filters behavior.
- [ ] Add metadata, canonical links, Open Graph, sitemap/robots strategy.
- [ ] Seed only fictional demo records; do not seed copyrighted digital files.

**Gate:** Catalogue pages use persistent data, product status is respected, and price/format state is correct.

## Phase 3 — Cart and checkout calculation

- [ ] Implement persistent guest cart and safe cart line identity by variant.
- [ ] Revalidate product, price, stock, coupon, format and shipping eligibility server-side.
- [ ] Implement integer-safe money helpers and tax/discount/shipping breakdown.
- [ ] Build checkout form and validation; collect address only for physical items.
- [ ] Enforce COD restriction for digital/mixed carts.
- [ ] Prevent double submission and handle expired stock/price changes gracefully.

**Gate:** Test cases prove the browser cannot manipulate final order totals or purchase unavailable variants.

## Phase 4 — Orders, inventory and admin

- [ ] Implement order/order-line snapshots and safe order numbers.
- [ ] Implement order lifecycle and separate payment status.
- [ ] Add race-safe stock reservation/commit/release policy and inventory audit trail.
- [ ] Implement server-protected admin bootstrap and admin role checks.
- [ ] Build admin product/variant/category/collection editor and inventory controls.
- [ ] Build admin order list/detail, status updates, shipping/tracking fields, and admin notes.
- [ ] Add store settings for brand/contact/policies/shipping/download defaults.

**Gate:** Admin can create/publish a product and process an allowed COD order end-to-end.

## Phase 5 — Digital assets and download entitlements

- [ ] Configure a private digital asset bucket/storage adapter.
- [ ] Add secure admin upload/replace flow and explicit rights confirmation.
- [ ] Implement entitlement creation as an idempotent server-side operation.
- [ ] Implement authenticated or token-authorized download endpoint with limits/expiry/revocation.
- [ ] Add short-lived signed URL/stream handling and download audit log.
- [ ] Build customer digital library and guest recovery access.
- [ ] Test access denial for unpaid, other-customer, expired, revoked, and over-limit cases.

**Gate:** Unpaid and unauthorised users cannot retrieve original files or direct private storage paths.

## Phase 6 — Payments and notifications

- [ ] Define provider adapter and config switch.
- [ ] Implement the chosen official gateway's initiation and server-side verification using its current docs.
- [ ] Validate amount, currency, order reference, signature/token and provider state.
- [ ] Add webhook/callback idempotency and safe retry/reconciliation.
- [ ] Activate digital entitlements only after verified payment.
- [ ] Integrate transactional email adapter/templates and delivery logging.
- [ ] Clearly disable real-payment checkout in production when credentials are missing; allow mock mode only in explicit development/test environments.

**Gate:** Sandbox/automated tests show that a fake frontend success redirect cannot mark a payment as paid.

## Phase 7 — Physical fulfilment and customer service

- [ ] Finish order tracking/status timeline and public tracking page capability.
- [ ] Add configurable delivery zones/fees and manual fulfilment.
- [ ] Store courier tracking reference and link.
- [ ] Send shipment/status notifications when email is configured.
- [ ] Keep courier API integration optional until an account and API details are supplied.
- [ ] Add policy/contact/FAQ pages and truthful checkout copy.

**Gate:** Physical order can be placed, confirmed, shipped, tracked and marked delivered with persisted state.

## Phase 8 — QA, hardening and launch prep

- [ ] Unit tests for price calculation, coupon rules, inventory and state transitions.
- [ ] Integration tests for order creation, webhook verification, entitlement creation and download authorization.
- [ ] E2E tests for physical COD, digital online, mixed online checkout, payment failure/retry, admin publishing and customer downloads.
- [ ] Verify RLS using two customers and an admin.
- [ ] Add rate limiting on auth/checkout/payment/download/order-lookup endpoints.
- [ ] Review accessibility, keyboard navigation, contrast, mobile layouts and Bengali rendering.
- [ ] Run lint, type check, unit/integration tests and production build; fix errors instead of skipping commands.
- [ ] Document production environment variables, admin bootstrap, migrations, seed data, payment setup, storage policies, and known limitations.

**Gate:** All critical acceptance criteria in `QA_ACCEPTANCE_CRITERIA.md` pass, and unresolved risks are explicitly disclosed.

## Recommended prioritisation

**P0 / must ship:** Catalogue, variants, product detail, cart, correct checkout totals, COD for physical-only, payment adapter, verified payment state, secure PDF entitlement/download, admin product/order management, inventory, policy pages, responsive/accessibility baseline, tests.

**P1 / after core is reliable:** Wishlist, verified reviews, advanced search suggestions, coupon rules beyond a basic code, customer account address book, automatic courier booking, abandoned-cart email, richer analytics.

**P2 / later:** Personalised recommendations, author pages, bundles across multiple different titles, book club/community features, subscriptions.

Do not prioritise animation or secondary marketing widgets over real checkout, security and admin operations.
