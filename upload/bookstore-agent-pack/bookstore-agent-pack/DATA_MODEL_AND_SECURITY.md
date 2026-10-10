# Data Model and Security Notes

This is a logical model. Adapt names and types to the repository's ORM/database, but preserve relationships and security invariants.

## 1. Core entities

### `profiles` / `users`

- `id` (auth user ID or internal UUID)
- `display_name`
- `email` (unique where available)
- `phone` (optional, normalized)
- `role` (`customer`, `admin`, any additional roles explicitly required)
- `preferred_locale`
- `created_at`, `updated_at`

Admin role assignment must not be self-service. Keep admin access in server-checked claims or a role table.

### `products`

- `id`
- `slug` (unique)
- `title`
- `subtitle`
- `description`
- `author_names` or normalized author relationship
- `publisher`, `isbn`, `language`, `publication_date/year`, `page_count`, `binding`, `edition`, optional physical dimensions
- `cover_asset_id` and optional gallery relationship
- `status` (`draft`, `published`, `archived`)
- `featured`, `new_arrival`, optional admin-curated collection links
- `seo_title`, `seo_description`
- timestamps

### `product_variants` / `offers`

- `id`, `product_id`
- `format_type` (`physical`, `digital`, `bundle`)
- `sku` unique where provided
- `price_minor` (integer poisha), optional `compare_at_price_minor` only for legitimate reference pricing
- `currency` (default `BDT`)
- `is_active`
- `stock_on_hand` for physical/bundle variants; nullable/not applicable for digital-only
- `weight_grams` for courier calculations if needed
- `download_asset_id` for digital/bundle offers where entitled
- `download_limit`, `download_expiry_days` (nullable to use store defaults)
- `rights_confirmed_at`, `rights_confirmed_by` or equivalent explicit rights audit
- timestamps

Constraints: digital variants must reference a valid authorised downloadable asset before publishing; physical/bundle variants must have inventory policy; no negative prices or stock.

### `categories`, `product_categories`, `collections`, `collection_products`

Use a many-to-many product/category model. Collections are admin-curated editorial groupings such as “নতুন প্রকাশনা” or “পড়ার জন্য বাছাই করা”. Keep collection title/description/slug/cover/order/status in the database.

### `assets`

- `id`
- `product_id` nullable for shared assets
- `kind` (`cover`, `gallery`, `public_preview`, `private_pdf`, `other`)
- `storage_provider`, `bucket`, `storage_path`
- `mime_type`, `size_bytes`, optional checksum
- `is_private`, `rights_confirmed_at`, `rights_confirmed_by`
- `created_by`, timestamps

Keep private storage path server-only. Public API should select a safe asset projection (e.g. public image URL only for authorised public assets). Never return raw `private_pdf.storage_path`.

### `customers` / `addresses`

Address records should be attached to an authenticated customer when possible, with snapshot copies on order rows so historical delivery details don't change if an address is later edited.

- Recipient name, phone, district/city, area/upazila, address lines, postcode if needed, optional delivery instructions.
- Avoid storing extra sensitive information that checkout doesn't need.

### `orders`

- `id` UUID; `order_number` human-readable and unique/non-guessable enough for presentation but not treated as authorization
- `customer_id` nullable for guest orders
- `guest_email`, `guest_phone` where required
- `guest_access_token_hash` and token expiry where guest capability links are used
- `status` and separate `payment_status`
- `currency`, `subtotal_minor`, `discount_minor`, `shipping_minor`, `total_minor`
- coupon reference/snapshot, billing/contact snapshot, shipping address snapshot
- payment provider/reference fields only where suitable; keep detailed attempts in `payments`
- `customer_note` and separate private `admin_note`
- timestamps

### `order_items`

- `id`, `order_id`, `product_id`, `variant_id`
- immutable snapshots: `product_title`, `author_display`, `format_type`, `sku`, `unit_price_minor`, `quantity`, `line_subtotal_minor`, `line_discount_minor`, `line_total_minor`
- `digital_asset_id` snapshot/reference where applicable
- `created_at`

Historical items must not change display/amount if a product title or price changes later.

### `payments`

- `id`, `order_id`, provider, provider transaction/reference ID, idempotency key
- `amount_minor`, `currency`, `status`
- provider response metadata safely redacted
- `verified_at`, `created_at`, `updated_at`

Unique constraint on provider + verified provider transaction ID or equivalent replay key.

### `download_entitlements`

- `id`, `order_item_id`, `customer_id` nullable, `asset_id`
- `status` (`active`, `expired`, `revoked`)
- `max_downloads`, `download_count`, `expires_at`
- `granted_by` (`payment`, `admin_comp`, etc.) with a reason for manual grants
- `created_at`, `revoked_at`

One entitlement per eligible paid order line/asset by default. Make creation idempotent.

### `download_events`

- `id`, `entitlement_id`, asset reference, event result (`authorized`, `denied`, `issued`), reason code, timestamp
- optional coarse security metadata if justified, with documented retention

Do not log signed URLs, access tokens, or raw secrets.

### `inventory_movements` (recommended)

- `id`, `variant_id`, `order_id` nullable, movement type (`reserve`, `sale`, `release`, `restock`, `adjustment`), quantity delta, actor/source, reason, timestamp

This creates an audit trail for inventory changes.

### `coupons` / `coupon_redemptions`

Code, discount type/value, active window, usage limits, per-customer limits, minimum spend, eligible product/category/format rules, and a redemption record tied to an order. Validate atomically to avoid concurrent over-redemption.

### `reviews` (optional)

Customer/order-linked review, product ID, rating, title/body, moderation status, verified-purchase marker. Only publish approved records. Rating summaries are computed from published reviews.

### `store_settings`, `notifications`, `admin_audit_logs`

Store settings contain branding, policy copy, support details, shipping zones, download defaults, and toggles. Protect changes to payment/download/security settings with admin role checks. Audit logs capture sensitive admin operations without writing secret values.

## 2. Key relations

- Product `1:N` variants/offers
- Product `M:N` categories
- Collection `M:N` products
- Order `1:N` order items
- Order `1:N` payment attempts/events
- Order item `0:N` download entitlements (usually one per asset)
- Entitlement `1:N` download events
- Variant `1:N` inventory movements
- Order `0:1` shipping/fulfilment record (or 1:N if split shipments are planned)

## 3. Authorization matrix

| Resource/action | Public visitor | Customer / guest token | Admin |
|---|---|---|---|
| Published product and public covers | Read | Read | Full manage |
| Draft products/private PDFs | No | No | Manage, server-side |
| Create checkout/order | Submit validated request | Own checkout/order | May create test/manual orders only through audited admin flow |
| Read order details | No | Own order via authenticated ownership or secure expiring capability | Read all orders |
| Change payment/order status | No | No | Permission-checked; gateway status remains system-verified |
| Download original PDF | No | Only with active paid entitlement | Explicit admin access if required and audited |
| Manage users/roles/settings | No | Own safe profile fields | Explicit role-protected |
| Change inventory/coupons | No | No | Permission-checked |

## 4. Required invariants

1. Public product endpoint never exposes private storage paths, source file URLs, guest tokens, payment secrets, or admin notes.
2. A PDF entitlement requires a paid/verified online payment, or a logged admin-comp grant.
3. A browser return URL never grants an entitlement by itself.
4. Payment verification compares provider transaction, order reference, amount, currency, and provider status.
5. Webhook processing is idempotent.
6. Stock cannot drop below zero because of concurrent checkout.
7. Coupon usage limits cannot be bypassed by parallel requests.
8. Customer-facing order lookup does not rely on sequential order IDs as a secret.
9. RLS and server-side checks both enforce owner boundaries where applicable.
10. Service-role keys remain server-only and never appear in logs/client bundle.
11. Admin role cannot be assigned by an ordinary customer mutation.
12. Cancel/refund/revoke changes disable future download access according to defined policy.

## 5. Download issuance flow

1. Request reaches server download endpoint/action.
2. Validate authenticated customer ownership or the guest token; compare hash in constant time where relevant.
3. Resolve entitlement and asset on the server.
4. Confirm order payment is verified and entitlement is active, not expired/revoked, and within the allowed count.
5. Transactionally reserve/increment the download count and write an event, or implement an equivalent race-safe policy.
6. Issue a short-lived URL to the private object or stream it from server-side storage.
7. Return only the short-lived delivery URL/stream response. Never persist or log the signed URL.

For signed URLs, the URL remains usable until its short expiry once issued. Keep the TTL low and do not promise instant revocation of an already-issued link.

## 6. Demo data and publishing safety

Demo product records may use clearly fictional names and locally generated placeholder cover graphics. Do not add copyrighted commercial book PDFs, arbitrary Google Drive URLs, or fake payment records to production seed data. Publishing a digital product requires explicit rights confirmation and a valid private asset.

## 7. Migration guidance

- Use the repo's migration tool (Supabase migrations, Prisma, Drizzle, etc.) rather than ad hoc production edits.
- Add foreign keys, uniqueness constraints, indexes for slugs/order numbers/payment references/entitlement lookups, and database checks for nonnegative values.
- Write rollback or recovery guidance for risky schema changes.
- Test RLS with at least two customer identities plus an admin identity.
