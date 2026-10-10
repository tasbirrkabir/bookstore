# MASTER PROMPT — Build the Bookstore E-commerce Website

You are the senior product engineer, commerce architect, UX designer, and QA owner responsible for implementing a real bookstore e-commerce product in this repository.

## Your mission

Build a beautiful, elegant, editorial-style online bookstore for the Bangladesh market. It sells book **Hard Copies, PDF/eBooks, and optionally a Bundle of both**. It must be a real full-stack commerce experience with persistent data, secure checkout, admin controls, digital access protection, and responsive UX—not just a landing page or static demo.

## First: inspect the repository

1. Inspect the current project structure, framework, package manager, existing design system, auth, database, storage, deployment assumptions, and tests.
2. Read all files in this pack, especially:
   - `PRODUCT_REQUIREMENTS.md`
   - `UI_UX_SPEC.md`
   - `TECHNICAL_ARCHITECTURE.md`
   - `DATA_MODEL_AND_SECURITY.md`
   - `IMPLEMENTATION_PLAN.md`
   - `QA_ACCEPTANCE_CRITERIA.md`
   - `RESEARCH_AND_DECISIONS.md`
3. Before implementation, give a compact repository assessment and plan: existing stack, what can be reused, required migrations, likely risks, and the first milestone.
4. **Preserve the existing working stack and project conventions.** If the repository is empty, use Next.js App Router, TypeScript, Tailwind, Supabase Postgres/Auth/Storage, and a clean accessible component system. Do not perform a wholesale rewrite without a genuine technical reason.
5. Then continue implementation milestone by milestone. Do not stop after producing a plan or UI mockup.

## Product and UX direction

The visual direction is a refined independent bookstore: warm paper/ivory backgrounds, dark ink typography, editorial serif display headings, Bengali-capable body typography, restrained oxblood or sage accents, thin dividers, intentional whitespace, and beautiful consistent book-cover presentation. The design should feel carefully art-directed, warm, modern, and trustworthy. Avoid generic marketplace clutter, loud gradients, neumorphism, excessive rounded cards, giant empty hero sections, fake urgency, and overused “AI-generated SaaS landing page” patterns.

The primary market is Bangladesh. Use BDT (`৳`), mobile-first layouts, Bengali-first interface copy with English-ready structure, local address fields, and payment methods enabled by actual merchant configuration. Use a configurable placeholder brand such as `পাতা / PATA` only until the real brand details are provided; centralise the name/logo/support/policy in settings rather than hard-coding it into pages.

Build these major areas:

- Editorial home page with real catalogue-driven category and collection modules.
- Shop, category/collection, search results, filters and sorting.
- Product details with explicit format selection: Hard Copy, PDF/eBook, Bundle, as available per title.
- Persistent cart with format-aware cart lines.
- Checkout with server-side totals, local contact/address, online gateway support, and COD for physical-only carts.
- Order confirmation/status/tracking.
- Customer order history and digital library/access route; guest checkout should remain possible.
- Admin dashboard for products/variants, categories/collections, stock, digital asset upload/rights confirmation, orders, fulfilment, coupons/settings.
- About/contact/FAQ/delivery/returns/privacy/terms pages.

Read the UI spec for exact page structure and responsive behavior.

## Must-have business rules

1. A product title may have separate purchasable `physical`, `digital`, and `bundle` variants. Store price and availability per variant.
2. The cart line must identify the selected variant, not just the title.
3. The server recalculates totals, coupon rules, stock, variant eligibility, and shipping. Never trust browser-submitted totals.
4. Physical-only cart may use COD. Digital and mixed carts must use verified online payment in MVP. Explain this rule before final checkout submission.
5. Keep payment status separate from fulfilment status.
6. A browser redirect must never mark an order paid. Validate the chosen gateway's server-side callback/API status and compare provider reference, expected order reference, amount, and currency.
7. Payment events, webhook callbacks, inventory transitions, notifications, and entitlement grants must be idempotent.
8. **Original PDF/eBook files must live in private storage.** Public APIs must not expose source paths or permanent public links.
9. Grant digital entitlement only after verified payment or a permission-checked, logged admin-comp grant.
10. Download endpoint verifies auth/guest capability token, order ownership, paid state, active entitlement, expiry, download count, and revocation. Use short-lived signed URLs or server-side streaming. Hash guest tokens at rest. Rate-limit and audit downloads.
11. Only publish PDFs the business owns or has permission to distribute. The admin flow requires explicit rights confirmation. Do not seed copyrighted PDFs.
12. Admin permissions must be verified on the server. A hidden admin menu is not authorisation.
13. Do not request/store customer payment PINs or OTPs.
14. Use only real stock, reviews, sales metrics, discounts, payment methods and delivery promises. Never invent testimonials, bestseller claims, ratings or limited-stock urgency.
15. Keep shipping fees/delivery estimates configurable. Start with manual fulfilment; integrate Pathao or another courier only when actual provider/API access is available.
16. If a live payment/email/courier credential is missing, implement the correct adapter/config boundary and explain the setup; do not pretend the service is connected. Mock payment may run only in test/development mode and must not mark a production order paid.

## Architecture guidance

Follow `TECHNICAL_ARCHITECTURE.md` and `DATA_MODEL_AND_SECURITY.md`. Use the existing ORM/migrations if present; if starting fresh, choose a maintainable schema and commit migrations. Prefer server-side domain functions for catalog validation, totals, order transitions, payment verification, inventory, entitlement and download checks. Keep privileged secret keys out of client bundles.

Implement safe order item snapshots so edits to a title/price do not rewrite order history. Use integer-safe money math and store currency explicitly. Write RLS/ownership policies and test with at least two customers and an admin. Do not hard-code merchant details or policy promises. Add environment validation and a useful `.env.example` without secrets.

## Visual quality bar

- Thoughtful typography and spacing; Bengali glyphs render correctly.
- Beautiful but consistent book-cover cards; create local CSS/demo covers if real images aren't provided.
- Desktop 4–5 column product grid when space permits, 3 at tablet, 2 on mobile.
- Header/search/cart are usable and not overly tall.
- Product detail has clear purchase panel and accessible format selector.
- Checkout is calm, concise, mobile-friendly and clear about shipping/payment.
- Admin is utilitarian, searchable, form-validated and usable on laptop/tablet/mobile.
- Every visible control works. No dead buttons, fake charts, placeholder actions pretending to succeed, or silent no-op forms.
- Include loading/skeleton, empty, no-result, error, pending/success/failure and disabled states.
- Meet accessibility basics: semantic landmarks, labelled inputs, keyboard navigation, focus indication, dialog focus management, reduced motion, sufficient contrast and descriptive alt text.
- Test viewport sizes 360×800, 390×844, 768×1024, 1024×768, 1366×900 and 1440×900.

## Execution method

Implement in these milestone groups, keeping the project runnable:

1. Repository assessment and environment/setup.
2. Design system, shared UI and global shell.
3. Persistent catalogue, variants, search/filtering, home and product pages.
4. Cart, server-side calculations and checkout validation.
5. Orders, stock consistency and server-protected admin.
6. Private digital assets, entitlements and downloads.
7. Payment adapter, verified callback/webhook and email notifications.
8. Fulfilment/tracking, SEO, security hardening and QA.

After each major milestone, run the checks available in the repo and fix regressions. If a required provider credential is absent, finish all testable provider-independent logic and label the real-provider setup clearly rather than halting unrelated work.

## Testing requirements

Implement meaningful automated tests for:

- Money, discount, shipping and server-side total calculation.
- Format eligibility and cart lines.
- Inventory concurrency / preventing oversell.
- Payment verification and duplicate callbacks.
- Entitlement idempotency and download access denial.
- Admin role and order ownership checks.
- Physical COD flow.
- Digital online-payment flow in a sandbox/test provider.
- Mixed cart requiring online payment and granting digital access only after successful verified payment.
- Payment failure/retry.
- Admin publishes a title with multiple formats and processes an order.

Run lint, type checking, tests, and production build. Do not claim tests passed if they were not run. Do not remove failing tests just to obtain a green result.

## Final deliverables

Make the required code changes directly in the repository. Include migrations and non-copyrighted demo seeds where relevant. Update project README/setup documentation and `.env.example`.

At completion, provide a precise report containing:

1. Main features and pages implemented.
2. Important routes/modules and database changes.
3. Setup steps and required environment variables.
4. Payment, email and courier integrations: real/sandbox/manual/not configured—be exact.
5. Commands run and actual results for lint, type-check, tests and build.
6. Manual QA completed.
7. Remaining blockers, security decisions, and production launch steps.

Do not stop after analysis or UI generation. Build the actual product, verify it, and disclose anything still incomplete.
