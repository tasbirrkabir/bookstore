# QA and Acceptance Criteria

## 1. Definition of Done

A feature is done only when UI, server validation, persistent data, authorisation, failure states, and tests agree. A visually functional control that does not perform its stated action is not complete.

## 2. Critical user-flow acceptance tests

### Catalogue and format selection

- [ ] Published product appears in shop/search/category; draft and archived products do not appear publicly.
- [ ] Product details render the correct book metadata and available variants.
- [ ] Selecting Hard Copy, PDF, or Bundle updates price and delivery/download copy correctly.
- [ ] Unsupported formats cannot be added to cart through a crafted API request.
- [ ] Admin-selected featured/new items work; “bestseller” reflects real orders or is explicitly editor-curated.
- [ ] Search by title and author works; search filters survive refresh/back navigation.

### Cart and pricing

- [ ] Refreshing and navigating does not silently lose the guest cart.
- [ ] Same book bought in two different formats appears as separate cart lines.
- [ ] Server recomputes prices, discounts, shipping and total; changing client payload totals has no effect.
- [ ] Price/status/stock changed after adding to cart is caught at checkout with a clear recovery message.
- [ ] Coupon expiry, usage limits, minimum spend and ineligible format/category are enforced on server.
- [ ] Physical quantity cannot exceed available inventory.
- [ ] Digital-only checkout does not require a shipping address.
- [ ] COD is rejected for digital or mixed carts under the MVP rule.
- [ ] Repeated taps/refreshes do not create duplicate orders or charges.

### Payment

- [ ] Unconfigured gateway cannot result in a production order marked paid.
- [ ] A frontend return URL with a forged success query never confirms payment.
- [ ] Callback/webhook verifies provider state/reference, amount, currency and expected order before marking paid.
- [ ] Duplicate webhook/callback does not duplicate payment events, stock decrement, entitlements, emails, or purchase analytics.
- [ ] Wrong amount, wrong order reference, invalid signature, unknown transaction and stale callback are rejected or held for reconciliation.
- [ ] Gateway cancellation/failure leaves payment unpaid/failed and offers a safe retry.
- [ ] Secrets are not rendered into client HTML or console logs.

### Digital files

- [ ] Original PDF resides in private storage and does not have a permanent public URL.
- [ ] Public product API and rendered page do not contain the source PDF path.
- [ ] Valid paid buyer can download the correct file using an authorised route.
- [ ] Unpaid/pending/failed order cannot download.
- [ ] Another customer cannot use a known order ID to download someone else's file.
- [ ] Guest access requires a valid high-entropy capability link/token and does not reveal whether random order IDs exist.
- [ ] Expired, revoked and over-limit entitlements are denied.
- [ ] Download counter and audit event are updated in a race-safe way.
- [ ] Signed URLs, if used, are short-lived and are not stored in analytics or logs.
- [ ] Digital asset cannot be published without rights confirmation and a valid file.
- [ ] Admin-comp grants require permission and a reason; the event is auditable.

### Inventory and order processing

- [ ] Concurrent attempts to buy the last copy cannot oversell stock.
- [ ] Order items preserve price/title/format snapshots after product edits.
- [ ] COD order shows payment `cod_due` (or the explicitly documented equivalent) and never `paid` before collection.
- [ ] Cancelled orders release reserved stock according to the documented stock policy; returned stock is only restocked after the defined eligibility/return process.
- [ ] Admin status transitions are validated; a client cannot directly mutate order/payment status.
- [ ] Shipment tracking details persist and customer status page only shows safe fields.

### Admin and roles

- [ ] Unauthenticated users cannot access admin routes/actions.
- [ ] Customer role cannot grant itself admin privileges or edit another user's order.
- [ ] Product, variant, category and collection updates persist after refresh.
- [ ] Digital asset replacement does not accidentally publish its private path or lose a required rights check.
- [ ] Order status/payment history and sensitive admin actions are auditable.
- [ ] Admin form error does not silently discard all entered data.

### Email / notifications

- [ ] Email is sent only from actual persisted state transitions; purchase is not double-notified on webhook retries.
- [ ] Download email contains a safe entry point, not the permanent private asset path.
- [ ] Email provider failure does not roll back a verified payment; it is logged and retryable.
- [ ] If email config is missing, the app/admin shows a clear warning and setup documentation names the missing variables.

## 3. Security checks

- [ ] Validate and normalise all inputs server-side; reject malformed UUIDs, quantities, emails, phone strings and coupon values.
- [ ] Apply rate limits to checkout, login/magic link, coupon validation, order lookup, payment init, download and admin login paths.
- [ ] Test RLS with Customer A, Customer B and Admin.
- [ ] Check SQL injection/XSS risks; render customer review/content safely.
- [ ] Use secure cookie settings for auth/session and avoid logging tokens.
- [ ] Restrict upload MIME types/size and validate file metadata where possible.
- [ ] Do not permit an arbitrary URL to be saved as a trusted digital asset; uploads go through authenticated admin flows.
- [ ] Avoid open redirects in gateway return handling.
- [ ] Check CSP and dependency vulnerabilities when compatible with project setup.

## 4. UX, responsive and accessibility checks

- [ ] Test viewport widths 360, 390, 768, 1024, 1366 and 1440 pixels.
- [ ] Test Bengali and English titles, long names, missing metadata and large cover ratios.
- [ ] No horizontal overflow; product grid and checkout fields remain usable on mobile.
- [ ] Tab order is sensible; all controls have labels; focus is visible; dialogs return focus after close.
- [ ] Inputs have associated errors and appropriate `aria` state; status changes are announced where relevant.
- [ ] Contrast meets WCAG AA for body text and controls where applicable; colour is not the sole status cue.
- [ ] Reduced-motion preference is respected; no scroll hijacking.
- [ ] Loading, no-result, empty-cart, empty-library, payment-failure and server-error states exist.
- [ ] Core pages remain useful when optional analytics/email/courier services are not configured.

## 5. Performance and SEO checks

- [ ] Product/category page initial HTML includes meaningful content and metadata.
- [ ] Images have correct dimensions/alt text and use responsive sizing/lazy loading where appropriate.
- [ ] Fonts do not create long invisible text or missing Bengali glyphs.
- [ ] Product metadata and share card are generated dynamically and safely.
- [ ] Sitemap contains only indexable published pages; private account/admin/order routes are excluded.
- [ ] No unhandled runtime errors, noisy console warnings, or dead UI controls.
- [ ] Production build succeeds with only documented non-blocking warnings.

## 6. Required automated test suite

At minimum, cover:

1. Money/discount/shipping calculation.
2. Variant format eligibility and cart totals.
3. Stock concurrency/conditional decrement.
4. Payment callback verification and idempotency.
5. Entitlement grant idempotency.
6. Download authorization (paid, unpaid, wrong user, guest token, expiry, revoked, over limit).
7. Admin role checks and customer data ownership.
8. E2E checkout: physical COD.
9. E2E checkout: digital online payment (sandbox/mock only in test env).
10. E2E checkout: mixed online cart and successful digital entitlement.
11. E2E checkout: payment failure/retry.
12. E2E admin publishes a title with two offers and updates an order.

## 7. Final coding-agent report template

At completion, report:

- Implemented features (with key routes/modules).
- Database migrations/seeds and any setup needed.
- Environment variables required, grouped by service.
- Commands run and pass/fail output summary for lint, type-check, tests, build.
- Manual tests completed and gaps remaining.
- Security/payment/storage items that still require merchant credentials or human configuration.
- Explicitly list anything mocked, stubbed, or not implemented. Do not describe stubs as production-ready.
