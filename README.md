# Australian Product Guide

Authoritative source repository for **Australian Product Guide (APG)** — an Australian consumer product-comparison, decision-support and shopping-discovery platform.

**Production:** https://au-product-guide.vercel.app

## Source-of-truth and deployment chain

`APG operating work -> GitHub main -> Vercel project au-product-guide -> Production`

`main` is the Production code source of truth. GitHub pushes deploy automatically to the dedicated Vercel project. Release QA verifies the matching Git SHA, public runtime, crawlable routes, product/retailer controls and representative desktop/mobile journeys before a release is closed.

APG Google Drive is the durable operating record for catalogue, evidence, governance, commercial controls, QA/release evidence and roadmap decisions. Supabase is the single optional-account/data backend; it is not a competing catalogue source.

## Current architecture

APG deliberately remains small, readable and SSR-first:

- one Vercel Node Function: `api/index.js`
- request/router layer: `lib/app.js`
- server-rendered crawlable HTML pages in `lib/`
- structured maintained catalogue and retailer registry in `data/`
- progressive enhancement for search/autocomplete, comparison, sharing, Decision Lab, My APG and optional account sync
- no external frontend framework or client-side rendering requirement
- no compressed opaque deployment bundle
- no unrelated Australian Tradie code, data or branding

The request host is used for canonical URLs, structured-data URLs, `robots.txt` and `sitemap.xml`, with the clean Vercel Production alias as the safe fallback.

## Maintained consumer scope

Current Platform v5 release scope preserves the v4 catalogue while materially upgrading the consumer experience:

- **257 maintained products**
- **48 populated categories**
- **37 deep-evidence products** and **220 starter-evidence products**
- **112 represented brands**
- **144 maintained prepared pair comparisons**
- **722 canonical/indexable routes** before any later evidence-led catalogue expansion
- universal search across products, brands, categories, use cases and budget signals
- deterministic/explainable Decision Lab recommendation journeys
- global Compare, Buying Guides, Retailer Discovery, Brands and My APG surfaces
- professional trust centre covering methodology, editorial standards, sources, coverage, updates, corrections, affiliate disclosure, privacy and terms
- visible consumer HTML Sitemap plus XML sitemap

Starter evidence is deliberately labelled and must not be represented as equivalent to deep specification research.

## Retailer architecture

Retailer data is stored separately from suitability logic. A product can hold multiple retailer observations over time.

Amazon Australia records use explicit states:

- `affiliate-direct`: an exact individual Amazon Australia product page has been independently verified for the maintained model/variant
- `affiliate-search`: a model-specific Amazon Australia search fallback is retained because an exact individual listing has not yet been independently verified

The Amazon Associates tag is `auproductguid-22`. Affiliate availability and commission contribute **zero recommendation points**. Never invent an ASIN, substitute an adjacent product merely to increase coverage, or construct an unverified direct detail-page URL.

Amazon imagery must not be scraped from product pages. Exact Amazon product imagery may only be displayed when supplied through an authorised Amazon product-content mechanism for the matching verified identifier and used in accordance with the applicable programme requirements. Manufacturer or retailer imagery must likewise have appropriate provenance/permission. APG-owned/category illustration may be used where exact photography is unavailable but must not imply it is an exact-product photograph.

No additional retailer affiliate programme or commercial agreement is activated merely because the data structure supports it.

## Evidence and freshness standards

APG guidance is primarily **desk-researched / specification-based** unless a page explicitly documents another testing status. Do not imply hands-on testing that did not occur.

Consequential claims should prefer:

1. Australian manufacturer product pages, manuals, support and warranty material;
2. Australian retailer evidence for exact local model/availability checks;
3. attributed independent professional evidence where appropriate;
4. consumer-feedback signals only where methodology and limitations are clear.

Each maintained product supports freshness fields including first researched, substantive review, source verification, retailer check, price check, image verification, next review due, freshness status and evidence tier. The evidence queue should be reduced by genuine product-by-product verification, never by relabelling starter records.

## Search, comparison and decision intelligence

Search remains server-rendered and crawlable where appropriate, with lightweight visual autocomplete and noindex controls for thin/dynamic search surfaces. Decision Lab maps a shopper's budget, use case, priorities and deal-breakers into explainable maintained-product signals. Commercial relationships contribute zero score.

Prepared comparison pages are indexable where they are maintained and useful. Arbitrary custom comparisons and personal Decision Lab outputs remain `noindex,follow` so personal/thin combinations do not create uncontrolled indexable inventory.

## My APG and optional accounts

My APG is **local-first** and remains usable without an account. Optional cross-device sync is active through the existing **Australian Product Guide Supabase project in Sydney (`ap-southeast-2`)**.

- unauthenticated shoppers can still save/use local research on their device
- authenticated users can sync selected APG workspace records
- Row Level Security restricts synced records to their owning user
- self-service account deletion is available through a JWT-protected Edge Function and deletes synced APG workspace data
- account status does not affect recommendation suitability or retailer ranking

Do not expose Supabase service-role credentials or place privileged backend secrets in browser code.

## Performance and accessibility

APG preserves a lightweight SSR-first delivery model. Visual richness should come from efficient CSS, optimised lawful imagery and progressive enhancement rather than large framework bundles or unnecessary third-party scripts.

The consumer UI should maintain keyboard-operable navigation/search, visible focus states, semantic controls, labelled forms, adequate touch targets, reduced-motion support and honest image alt/provenance treatment.

A privacy-minimised first-party field Web Vitals endpoint samples performance metrics without query strings, cookies, email addresses, account IDs or persistent behavioural identifiers.

## QA and release controls

GitHub Actions cover source integrity, governance, catalogue freshness, Decision Intelligence, account sync, field Web Vitals and premium Platform v5 controls. Production smoke testing validates the exact Vercel Production deployment, canonical crawl/indexability, all product routes, retailer attribution, representative journeys and desktop/tablet/mobile rendering.

A release is not considered closed merely because code merged. The final state must reconcile GitHub `main`, matching Vercel Production, Supabase where relevant, the public site, and APG Google Drive release/operating records.

## Governance

Australian Product Guide is operationally separate from unrelated ventures, especially Australian Tradie Software Matcher. Keep APG brand, data, repository, Vercel project, Supabase project, retailer records and operating material separate unless an explicit decision changes that structure.

Commercial relationships never change suitability scoring. Product, retailer, price, imagery, freshness and authority claims must be truthful, sourceable and dated where material. Never invent testing, reviews, awards, partnerships, customer numbers, rankings or commercial performance.