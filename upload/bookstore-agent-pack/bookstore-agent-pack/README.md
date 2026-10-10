# Bookstore E-commerce Build Pack

> A research-backed product and engineering brief for a polished bookstore that sells physical books, PDF/eBooks, and configurable bundles.

## What this pack is for

Give these files to your coding agent **inside the repository it should work on**. The agent should inspect the existing codebase first, then implement the storefront and commerce flows instead of merely generating a mockup.

## Files

- `MASTER_CODING_AGENT_PROMPT.md` — copy/paste this into your coding agent. It tells the agent how to use the rest of the pack and what to build.
- `PRODUCT_REQUIREMENTS.md` — product scope, user journeys, features, and business rules.
- `UI_UX_SPEC.md` — art direction, page-by-page UX, responsive behavior, and copy direction.
- `TECHNICAL_ARCHITECTURE.md` — recommended stack, modules, payment/delivery integrations, and environment variables.
- `DATA_MODEL_AND_SECURITY.md` — entities, relationships, access rules, and digital-file security.
- `IMPLEMENTATION_PLAN.md` — practical build order with milestone gates.
- `QA_ACCEPTANCE_CRITERIA.md` — test cases and Definition of Done.
- `RESEARCH_AND_DECISIONS.md` — benchmarks, source links, and decisions based on research.

## Defaults and assumptions

- Primary market: Bangladesh.
- Currency: BDT (৳); prices are stored as integer poisha or integer taka consistently. Prefer integer poisha for payment calculations and document the choice.
- Language: Bengali-first content with English-ready structure; allow both Bengali and English UI labels where appropriate. Do not machine-translate book titles or author names.
- Product formats: hard copy, PDF/eBook, and optionally a bundle of both. Availability and pricing are configured per title/variant.
- Physical-only orders may use Cash on Delivery (COD). Digital products require successful online payment before download access. A mixed cart must use online payment unless the implementation deliberately splits it into clearly linked physical/digital sub-orders.
- Store name, logo, contact details, return rules, delivery charges, and payment provider credentials are not supplied. Keep these configurable; use clearly labelled placeholders and do not invent real merchant details.
- Only sell PDFs/eBooks for which the business owns or has distribution rights. Do not scrape or seed unauthorized copyrighted book files.

## Recommended first-release stack for a new/empty repository

Next.js App Router + TypeScript + Tailwind CSS + an accessible component system, Supabase Postgres/Auth/Storage, and a transactional email provider. Use a payment-provider adapter around a Bangladesh-capable gateway such as aamarPay or SSLCOMMERZ, subject to merchant onboarding and current provider requirements. Keep physical courier integration behind an adapter; start with manual fulfilment and add Pathao or another provider when API credentials and requirements are confirmed.

If the repository already has a working stack, preserve it unless there is a clear technical blocker. Do not rewrite a functioning app just to match this recommendation.

## Non-negotiable implementation principles

1. Real, persistent product, cart, order, inventory, and download entitlement logic. No fake checkout success.
2. Product format is selected explicitly and price/stock reflect that selection.
3. Digital files live in private storage. Do not expose source file paths or permanent public URLs.
4. Grant digital access only after server-side payment verification or an explicitly authorized admin comp.
5. Verify payment callbacks/webhooks server-side and process them idempotently.
6. Never request or store a buyer's bKash/Nagad PIN or OTP.
7. Admin operations must be authenticated and role-protected on the server, not just hidden in the UI.
8. No false ratings, fake testimonials, fake stock warnings, fake discounts, or fake delivery promises.
9. Responsive, accessible, SEO-friendly pages with loading, empty, error, and success states.
10. Before completion, run the available lint/type-check/test/build commands and report what did and did not pass.
