# পাতা / PATA — Editorial Bookstore (Demo Build)

An editorial-style bookstore for the Bangladesh market selling **Hard Copy, PDF/eBook, and Bundle** formats of each title. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, and Prisma + SQLite.

> **Demo notice:** the catalogue, authors, prices and PDF files are clearly-labelled fictional demo content. Replace them via the admin panel before any real launch (see *Launch checklist*).

## Quick start

```bash
bun install
bun run db:push          # apply schema to SQLite (db/custom.db)
bun prisma/seed.ts       # demo catalogue + admin account (idempotent)
bun run dev              # http://localhost:3000
```

### Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@pata.test` | `pata-admin-123` (override with `ADMIN_PASSWORD` env before seeding) |
| Customer | `customer@pata.test` | `pata-customer-123` |

> These are development defaults only. For production: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, re-run seed, and delete the demo users.

## What's implemented

**Storefront** — editorial home (curated picks, new arrivals, collections, format explainer), shop with URL-synced filters (category/format/language/price/stock) + sorting + pagination + search (title/author/ISBN/publisher/synopsis), category & collection pages, product detail with format-aware pricing/stock/delivery info, breadcrumbs, metadata + OpenGraph.

**Commerce** — persistent DB-backed guest cart (cookie cart id, survives refresh), variant-keyed cart lines (same book in 2 formats = 2 lines), coupon engine (percent/fixed, min-spend, max-discount, format scope, usage limits, atomic redemption), checkout with server-side validation (BD phone regex, consent), address collected **only** for physical carts, zone-based shipping fees (configurable), COD for physical-only carts, online payment for digital/mixed carts.

**Orders** — human-readable non-sequential order numbers, immutable line snapshots, separate order status × payment status, status timeline, guest capability tokens (SHA-256 hashed at rest), order lookup by number + contact evidence, atomic stock commit (conditional update — no overselling), inventory movement audit trail, restock on cancel/return.

**Digital delivery** — PDFs stored in `private-assets/` **outside** the public dir; entitlements granted only after server-verified payment (idempotent); download endpoint checks ownership/guest-token + paid state + active/expiry/count/revocation, increments race-safely, writes audit events, streams the file (no permanent URLs, no storage paths exposed).

**Payments** — provider adapter (`src/lib/payments.ts`) with `PAYMENT_PROVIDER=disabled|mock`. `mock` is a dev-only simulated gateway (guarded against production) that demonstrates the verified-callback pattern: the gateway signs the result (HMAC), the server validates signature + order reference + amount + currency before marking paid; replays are idempotent. A forged browser redirect/callback **cannot** mark an order paid.

**Admin** (`/admin`, server-side role check on every API + layout guard) — KPI dashboard with real counts + config warnings, products/variants CRUD with publish guard (digital variants need private PDF + explicit rights confirmation), cover upload, categories/collections, coupons, orders with validated status transitions + tracking + private notes + COD collection + refunds, digital entitlement comp grants (audited), store settings (branding, shipping, download defaults, announcement), audit log + notification outbox.

**Notifications** — every transactional email is recorded in `NotificationOutbox`. With no email provider configured they are stored as `skipped_no_provider` and the admin sees a warning — the system never pretends an email was sent.

## Environment variables

Copy `.env.example` → `.env`. Required by service:

| Service | Variables | Required? |
|---|---|---|
| Core | `DATABASE_URL`, `AUTH_SECRET` (≥16 chars; **required in production**) | always |
| Admin seed | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | seeding only |
| Payments | `PAYMENT_PROVIDER` (`disabled`/`mock`), `PAYMENT_MERCHANT_KEY` (mock HMAC secret) | optional |
| Email | `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM_ADDRESS` | optional — outbox degrades gracefully |
| Courier | `COURIER_PROVIDER=manual` (+ client id/secret when a real API is contracted) | optional |
| Site | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME` | defaults ok |

## Integration status (exact)

- **Payments:** `mock` (dev-only simulated gateway, HMAC-verified callbacks). NOT connected to aamarpay/SSLCOMMERZ/bKash — implement the adapter in `src/lib/payments.ts` per the provider's official docs when merchant credentials exist.
- **Email:** not configured → durable outbox + admin warning. Wire a provider (e.g. Resend) in `src/lib/notifications.ts`.
- **Courier:** manual fulfilment; tracking ID/courier fields stored and shown; no API integration.

## Key modules

```
prisma/schema.prisma      commerce schema (money = integer poisha)
src/lib/money.ts          integer money + bn-BD formatting
src/lib/auth.ts           HMAC-signed session cookies, requireAdmin
src/lib/catalog.ts        safe public DTOs, filters, search
src/lib/cart.ts           DB cart, live revalidation, COD eligibility
src/lib/orders.ts         transactional order creation, stock policy
src/lib/payments.ts       provider adapter + verified callbacks
src/lib/entitlements.ts   grants + download authorization + streaming
src/lib/admin-service.ts  admin operations w/ guards + audit
src/app/api/*             REST endpoints (see worklog.md CONTRACTS)
src/app/admin/*           admin UI (role-guarded)
```

## Production launch checklist

1. Replace demo data (admin → products); delete demo users/orders; confirm rights for **every** PDF.
2. Set `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`; re-run seed; rotate anything that leaked.
3. Configure a real payment gateway (adapter in `src/lib/payments.ts`), test server-to-server verification in sandbox, then a low-value live test.
4. Configure email provider + sender domain.
5. Set `NEXT_PUBLIC_SITE_URL`; review policy pages with real business terms.
6. Review `QA_ACCEPTANCE_CRITERIA.md` from the build pack and re-verify on a real mobile device.
