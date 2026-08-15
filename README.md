# Australian Product Guide

Authoritative source repository for the Australian Product Guide consumer comparison and shopping-discovery website.

**Production:** https://au-product-guide.vercel.app

## Deployment chain

`ChatGPT / development -> GitHub main -> Vercel project au-product-guide -> Production`

`main` is the Production source of truth. GitHub pushes deploy automatically to the dedicated Vercel project and the Production smoke workflow independently verifies the clean public alias after deployment.

## Current architecture

The recovered Production architecture is deliberately small and readable:

- one Vercel Node Function: `api/index.js`
- request/router layer: `lib/app.js`
- server-rendered, crawlable HTML pages in `lib/`
- structured maintained catalogue in `data/`
- small progressive-enhancement script for comparison selection, mobile navigation, search suggestions and recently viewed products
- no external frontend framework, font dependency or client-side rendering requirement
- no compressed opaque bundle architecture
- no unrelated Australian Tradie code, data or branding

The request host is used for canonical URLs, structured-data URLs, `robots.txt` and `sitemap.xml`, with the clean Vercel Production alias as the safe fallback.

## Maintained consumer scope

- 48 category pathways
- 4 live maintained comparison categories
- 37 maintained product records
  - 10 coffee machines
  - 8 air fryers
  - 9 robot vacuums
  - 10 wireless headphones
- 139 canonical/indexable routes
- 56 prepared product-vs-product comparison routes
- noindex custom comparison for 2–4 selected products
- universal intent-aware search across products, brands, categories, use cases and budget signals
- four Help Me Choose journeys, including the seven-question deterministic coffee-machine matcher
- 16 maintained brand pages
- professional trust centre including methodology, editorial standards, sources, coverage, updates, corrections, privacy and terms

Research-queue categories remain noindex until their evidence set and maintenance workflow are ready.

## Retailer architecture

Retailer data is stored separately from suitability logic. A product can hold multiple retailer records over time.

Amazon Australia records use one of two explicit states:

- `affiliate-direct`: an exact individual Amazon Australia product page has been independently verified for the maintained model
- `affiliate-search`: a model-specific Amazon Australia search fallback is retained because an exact individual listing has not been independently verified

The Amazon Associates tag is `auproductguid-22`. Affiliate availability and commission contribute **zero points** to recommendation scoring. Never invent an ASIN or construct an unverified direct product URL to increase direct-link coverage.

No additional retailer affiliate programme or commercial agreement is activated merely because the data structure supports it.

## Evidence standards

Current maintained guidance is primarily **desk-researched / specification-based** unless a page explicitly documents a different testing status.

Consequential claims should prefer:

1. Australian manufacturer product pages, manuals and warranty material;
2. Australian retailer evidence for exact local model/availability checks;
3. attributed independent professional evidence where appropriately used;
4. consumer-feedback signals only where their methodology and limitations are clear.

The site must not invent hands-on testing, user reviews, awards, staff, laboratories, partnerships, customer numbers or authority signals.

## Search and personalisation

Server-rendered search remains the authoritative result experience. The lightweight client layer adds autocomplete suggestions, a device-local 2–4 product comparison tray and recently viewed product convenience.

The current site does not require customer accounts or cloud profiles. Browser local storage used for those convenience features is disclosed in the Privacy Policy.

## QA and release controls

`.github/workflows/source-qa.yml` validates the assembled source on branch pushes before promotion to Production, including:

- JavaScript syntax and module loading
- catalogue/route invariants
- exact retailer direct/fallback counts
- representative intent-search behaviour
- seven deterministic coffee matcher regression profiles

`.github/workflows/production-smoke.yml` runs on `main` after Vercel deployment and verifies the anonymous public Production alias, sitemap/canonicals, all 139 indexable routes, search/finder journeys, retailer controls, schema and absence of legacy Tradie contamination.

## Governance

Australian Product Guide is operationally separate from other Venture Lab projects. Keep its brand, data, repository, Vercel project, retailer records and communications separate unless an explicit decision changes that structure.

Commercial relationships never change suitability scoring. Product and retailer claims must be truthful, sourceable and dated where material.
