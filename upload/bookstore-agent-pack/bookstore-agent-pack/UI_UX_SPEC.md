# UI/UX Specification

## 1. Art direction: an editorial bookstore, not a generic marketplace

The storefront should feel like a thoughtful independent bookshop with the clarity of a modern commerce product. Borrow the editorial curation and collection-led browsing patterns of established book retailers, but do not copy their layouts or brand assets.

### Visual keywords

Quiet, literary, warm, tactile, restrained, confident, beautifully typeset, human, premium but approachable.

### Working brand name

Use a configurable placeholder such as `পাতা / PATA` until the owner supplies a final name. Do not hard-code this placeholder throughout components; centralise it in store settings/config.

### Palette (design tokens, not mandatory exact hex if current design system exists)

- Warm paper: `#F7F4EE` — main background
- Card white: `#FFFEFB` — book cards and form surfaces
- Ink: `#242520` — primary text
- Muted ink: `#77766E` — secondary text
- Forest/sage: `#63715B` — quiet supporting accent
- Oxblood: `#7A263A` — primary CTA/active accent, used sparingly
- Hairline: `#E4DED4` — borders/dividers
- Success / warning / error: accessible semantic tokens with sufficient contrast, not decorative colours

Keep the overall page light and calm. Avoid gradients everywhere, neon colours, huge rounded cards, glassmorphism, excessive shadows, floating blobs, and a template-like “AI startup landing page” aesthetic.

### Typography

- English editorial display: a high-quality serif such as `Cormorant Garamond`, `DM Serif Display`, or the project's existing equivalent.
- Body/UI: `Inter`, `Geist`, or a readable sans-serif already in the codebase.
- Bengali: a legible Bengali-capable family such as `Noto Sans Bengali` for interface/body, with tested fallbacks.
- Verify actual glyph support and loading behavior. Avoid using an English-only display font for Bengali strings if it produces missing glyphs.
- Use a deliberate type scale. Display headings are expressive; prices, buttons, filters, and form labels remain compact and utilitarian.

## 2. Layout and spacing

- Mobile-first, with a centered content container around 1180–1280px on large screens.
- Use an 8px spacing rhythm (or existing design tokens) and intentional negative space.
- Thin dividers, subtle card surfaces, minimal corner radii (4–10px), and almost no elevation except popovers/drawers.
- Product cover images must be consistent in aspect ratio, cropped predictably, and large enough to read as book covers.
- Desktop catalogue: 4–5 columns depending on viewport; tablet: 3; mobile: 2. Never force a single-column product grid on common mobile widths unless accessibility requires it.
- Main pages should feel designed at 360px width and expand gracefully to widescreen; no horizontal overflow.

## 3. Global navigation

### Announcement strip

Optional, configurable and dismissible. Use for one truthful message such as “দেশজুড়ে বই পৌঁছে দিই” or a real shipping/promotion announcement. Never invent a free-shipping promise.

### Header

- Wordmark on the left.
- Search entry prominent enough to be useful; on mobile, use a clear search icon that opens a real search field/page.
- Navigation: বইসমূহ / Shop, বিভাগ / Categories, নতুন বই / New Arrivals, ডিজিটাল / eBooks, আমাদের কথা / About.
- Right-side actions: account, wishlist if available, cart with item count.
- Sticky behavior may be used if it does not crowd mobile viewport.
- Keep the header compact; avoid 3–4 stacked navigation bars.

### Footer

Newsletter only if a real list/subscription flow exists; social links only if configured. Include support/contact, policies, categories, delivery/return information, social channels, and payment logos only for enabled methods. No fake social proof.

## 4. Home page composition

The home page should lead with discovery, not a giant generic hero.

1. Announcement strip (optional).
2. Header/search/navigation.
3. Editorial hero: compact eyebrow, confident Bengali headline, one-sentence promise, primary CTA “সব বই দেখুন”, secondary CTA “ডিজিটাল বই”. Pair with an art-directed stack/arrangement of real catalogue covers, not random unlicensed cover art. A quiet abstract/texture background is acceptable.
4. Quick category row: e.g. উপন্যাস, আত্মউন্নয়ন, ব্যবসা, ইতিহাস, শিশু-কিশোর, একাডেমিক. Render only categories that exist in data.
5. “এখন পড়ছেন সবাই” / Popular picks: use real sales or explicitly curated admin-selected picks; never fabricate bestseller claims.
6. New arrivals row.
7. A clear “এক বই, আপনার পছন্দের ফরম্যাটে” module explaining Hard Copy / PDF / Bundle with simple iconography and clear labels.
8. Curated collection/editor's shelf module, populated from admin-managed collection records.
9. Brief trust/service strip: secure checkout, careful packaging, instant digital access after verified payment, support details—only claims the implementation can fulfil.
10. Journal/reading notes section only if real content exists.
11. Footer.

Do not render empty modules. If the database has no products yet, display a designed setup empty state for admins and a useful storefront message to visitors.

## 5. Product card

Each card should include:

- Cover artwork with a calm backdrop and consistent aspect ratio.
- Optional small label only when grounded: New, Featured, or actual discount.
- Title and author.
- Price or “From ৳X” when multiple formats have different prices.
- Small format labels/icons for available Hard Copy, PDF, Bundle formats.
- Quick-add only if a default variant is unambiguous; otherwise the action opens format selection/product details.
- Wishlist action only if real persistence exists.
- Real review rating only with genuine review records and an explicit count.

Keep the cover as the visual anchor. Do not use cards filled with multiple badges, paragraphs, or tiny metadata.

## 6. Shop/category/search pages

- Breadcrumbs at top.
- Clear heading and optional category intro.
- Compact sort control and filter entry; desktop side filter or well-designed horizontal filter row, mobile filter drawer.
- Active filters appear as removable chips; include “সব মুছুন / Clear all”.
- Filter groups: category, format, author, language, price, availability.
- Product grid with skeleton loading state, retry on error, and useful empty state.
- Pagination or “load more” must preserve URL/state and be keyboard-accessible.
- Search results show the query and can search title/author/ISBN. Provide typo-tolerant search only if supported by the chosen backend.

## 7. Product detail page

Desktop two-column layout: cover/gallery at left, purchase/content column at right. On mobile, gallery first, then title/meta/purchase block.

Required content:

- Breadcrumbs, cover, title, author line, optional publisher/ISBN metadata.
- Rating/review count only if authentic data exists.
- Concise synopsis with expand/collapse when long.
- Format selector as accessible segmented choices/radio cards: “হার্ড কপি”, “PDF / eBook”, “হার্ড কপি + PDF”. Show only available variants, their individual prices, delivery/download labels, and availability.
- Price updates when format changes.
- Quantity stepper for physical/bundle; digital formats default to 1 and cannot be stacked unless the product policy explicitly allows multiple licences.
- Primary CTA: “কার্টে যোগ করুন”. Show pending state and prevent double submission.
- Physical: stock/availability, configurable delivery estimate, delivery charge guidance, return-policy link.
- Digital: file format/size only if useful, compatible-device note, “পেমেন্ট যাচাইয়ের পর ডাউনলোড অ্যাক্সেস পাবেন” copy. A preview is displayed only for an authorised preview asset.
- Bundle: explain both included items and show the bundle price clearly.
- Details accordion: edition, language, publisher, pages, ISBN, dimensions, binding, rights/format terms as applicable.
- Related books based on shared categories/tags or admin-curated data.

Sticky buy controls on mobile can be considered but must not obscure browser/navigation controls or accessibility focus.

## 8. Cart

- Each line displays cover, title, selected format, unit price, quantity where applicable, and remove action.
- Distinguish digital vs physical labels visually and textually.
- Show subtotal, discount, physical-shipping estimate if address-dependent, and total or clearly label shipping as calculated at checkout.
- Coupon field with helpful success/error messages.
- If mixed digital/physical cart uses online payment only, explain this before checkout rather than after form submission.
- Empty cart includes “বই খুঁজে দেখুন” CTA and curated suggestions when available.

## 9. Checkout

Aim for a calm single-page or short two-step checkout. Avoid forcing account creation.

### Contact

Name, phone, email. Validate on server and provide inline accessible errors.

### Address (only when physical items exist)

Recipient name, mobile number, district/city, area/upazila, full street/address, postcode if applicable, delivery notes optional. Keep fields local-market appropriate; do not require nonessential data.

### Payment

Show only enabled options. COD only for physical-only carts. The gateway can present bKash/Nagad/card/wallet options based on merchant configuration. Never ask for a payment PIN/OTP on the bookstore site.

### Summary

Items + format, subtotal, discount, shipping, total, policies/consent, place-order/pay button. All values are server-confirmed. Show a busy state and protect against repeat submissions.

### States

Pending payment, verified success, gateway cancelled/failed, out of stock, coupon invalid, address error, and recoverable network error all get clear messaging and recovery paths.

## 10. Account, order tracking, and digital library

- Customers should be able to reach orders and digital items without exposing guessable IDs as authorization.
- Prefer magic-link sign-in or an existing secure auth system. Guest checkout can use a signed, high-entropy, expiring order/download link.
- “My orders” shows human-readable order number, date, total, payment state, physical fulfilment timeline, and download area if eligible.
- Digital library cards show title, purchased format, entitlement status, expiry/download count if configured, and a Download button.
- Disabled download button includes the reason (payment pending, link expired, download limit reached, entitlement revoked) without revealing internal security details.

## 11. Admin UI

Visual tone can be more utilitarian than the storefront. Prioritize task speed and data clarity.

- Sidebar navigation, compact top bar, searchable/filterable tables, clear status chips, responsive drawers/forms.
- Product editor uses tabs/sections: Basic info, metadata, categories/collections, offers/variants, inventory, images, digital assets/rights, SEO, publish status.
- Digital asset upload must state that only owned/licensed files may be published; require explicit rights confirmation per asset/offer.
- Orders table with date/status/payment/search filters. Detail page separates payment events, items, shipping and private admin notes.
- Destructive actions require confirmation; show success/error toast and persist the result.
- Forms preserve data on recoverable failure and validate on both client and server.

## 12. Interaction and motion

- Small purposeful transitions (150–250ms), not parallax or scroll-jacking.
- Respect `prefers-reduced-motion`.
- Drawers/dialogs trap focus correctly, close on Escape, restore focus, and have accessible labels.
- Buttons show pending/disabled states; errors never rely on colour alone.
- Use semantic HTML and keyboard navigation. Ensure visible focus rings, readable contrast, touch targets around 44px, and text zoom/reflow support.

## 13. Content and imagery rules

- Use actual uploaded book covers when supplied.
- For demos, create tasteful generated CSS/local placeholder covers clearly treated as demo content. Do not hotlink retailer cover art or invent real publication details.
- Use real Bengali copy written naturally; do not leave Lorem Ipsum in launch-critical areas.
- Sample books/ratings/orders must be labelled demo and excluded from production analytics.
- Images need alt text. Decorative images use empty alt text.

## 14. Responsive QA sizes

Check at minimum: 360×800, 390×844, 768×1024, 1024×768, 1366×900, and 1440×900. Check both Bengali and English text lengths, browser zoom to 200%, keyboard-only navigation, slow loading, no products, and large product titles.
