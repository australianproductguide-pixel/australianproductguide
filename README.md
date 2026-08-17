# Australian Product Guide

Authoritative source repository for **Australian Product Guide (APG)** — an Australian consumer product-comparison, decision-support and shopping-discovery platform.

**Production:** https://australianproductguide.au

## Source of truth and deployment

`APG operating work -> GitHub main -> Vercel project au-product-guide -> Production`

`main` is the Production code source of truth. GitHub pushes deploy automatically to the dedicated Vercel project. Google Drive is the durable operating record for catalogue, evidence, governance, commercial controls, QA/release evidence and roadmap decisions. Supabase is the optional account/sync backend; it is not a competing catalogue source.

## Current architecture

APG deliberately remains lightweight, readable and SSR-first:

- one Vercel Node Function through `api/index.js`;
- authority-depth v14 over semantic/readability/Scout v13 and illustrative consumer experience v12;
- privacy, accessibility and performance layers beneath the current production wrappers;
- server-rendered crawlable HTML with progressive enhancement for search, comparison, sharing, Decision Lab, Scout, My APG and optional account sync;
- structured catalogue and retailer/evidence registries in `data/`;
- no required client framework and no opaque compressed deployment bundle.

## Maintained consumer scope

Current Production scope:

- **471 maintained products**;
- **90 populated categories**;
- **176 represented brands**;
- **23 verified exact Amazon Australia product destinations**;
- **448 transparent model-specific Amazon search/further-verification fallbacks**;
- commercial relationships contribute **zero recommendation points**.

High-intent national categories include televisions, laptops, washing machines, fridges, dishwashers and smartphones. Televisions and laptops currently contain seven manufacturer-backed maintained models each. Authority-depth categories for coffee grinders, home printers and pizza ovens surface exact Australian manufacturer facts, documented decision factors and separately maintained retailer/support pathways.

Starter evidence remains explicitly labelled and must never be represented as equivalent to deeper specification research. APG does not invent live prices, ratings, reviews or hands-on testing.

## Consumer experience and Scout

The current homepage combines the institutional design with an illustrative “start with your situation” discovery layer. Readability controls use high-contrast text, stronger small-copy colours and visible focus states; in particular the decision-panel gold label is intentionally navy-on-gold rather than pale text on gold.

**Scout** is APG's original conversational shopping-guide character. Scout:

- accepts natural-language shopping needs, budgets, use cases and deal-breakers;
- preserves context across follow-up refinements;
- uses the existing deterministic `/api/decision` engine;
- shows fit reasons and compromises rather than an unexplained score;
- links into product evidence, Compare and Decision Lab;
- keeps retailer commission and affiliate availability out of suitability scoring.

National product visuals use APG-authored category-correct semantic SVGs where exact product photography is not rights-verified. Third-party product photography must never be scraped, fabricated or presented without verified delivery rights and exact model identity.

## Retailer architecture

Retailer data is stored separately from suitability logic. Amazon Australia records use explicit states:

- `affiliate-direct`: an exact individual Amazon Australia product page has been independently verified for the maintained model/variant;
- `affiliate-search`: a model-specific Amazon Australia search fallback is retained because an exact individual listing has not been independently verified.

The Amazon Associates tag is `auproductguid-22`. Never invent an ASIN or construct an unverified exact product destination.

APG is selectively adding **exact non-Amazon Australian retailer pathways** where model/configuration identity can be verified. Current examples include maintained LG C6, MacBook Air M5 and Bosch WGG244F0AU pathways, while authority-depth categories can expose verified Australian brand/retailer/support destinations. These links are kept separate from product-fit scoring. APG does **not** claim whole-of-market live price comparison.

Any new affiliate programme, paid feed, commercial agreement or consequential external commitment still requires explicit owner approval.

## Evidence and freshness

APG guidance is primarily **desk-researched / specification-based** unless a page explicitly documents another testing status. Consequential claims should prefer:

1. exact Australian manufacturer product pages, manuals, support and warranty material;
2. exact Australian retailer evidence for local model/availability checks;
3. attributed independent professional evidence where appropriate;
4. consumer-feedback signals only where methodology and limitations are clear.

Selected high-intent products surface independent professional evidence separately from manufacturer identity. Family, size and configuration differences must be disclosed; external reviewers' hands-on work must never be described as APG hands-on testing.

A scheduled GitHub Actions **freshness/model audit** validates catalogue identity, required provenance/freshness fields, overdue review windows and exact-Amazon identifier/tag integrity. It flags defects and review debt but does not auto-publish changed product facts.

## Search, comparison and decision intelligence

Search remains server-rendered and uses `noindex,follow` for thin/dynamic search-result combinations. The consumer layer tightens relevance for interpreted televisions, laptops, washing machines, fridges, dishwashers and smartphones so unrelated product-card noise is suppressed in the rendered experience.

Decision Lab and Scout use maintained product data and explainable signals based on budget, needs, priorities and deal-breakers. Commercial relationships contribute zero score. Prepared useful comparison pages can be indexable; arbitrary personal/custom combinations remain controlled to avoid thin SEO inventory.

## My APG, privacy and analytics

My APG remains **local-first** and usable without an account. Optional cross-device sync uses the existing APG Supabase project in Sydney (`ap-southeast-2`), with Row Level Security and self-service deletion controls already documented in the privacy/terms surfaces.

Google Analytics remains opt-in: analytics storage defaults to denied and the Google Analytics script loads only after the visitor allows analytics. Advertising storage and personalisation remain denied.

## Performance, accessibility and QA

Visual richness should come from efficient CSS, lawful imagery and progressive enhancement rather than unnecessary framework bundles or third-party scripts. Maintain keyboard-operable navigation/search, labelled forms, adequate touch targets, visible focus states, reduced-motion support and readable contrast.

GitHub Actions and release QA cover source integrity, catalogue controls, freshness, decision intelligence, account/platform controls and representative Production behaviour. A release is not closed merely because code merged: reconcile GitHub `main`, Vercel Production, the canonical public site and APG Google Drive records.

## Governance

Australian Product Guide remains operationally separate from unrelated ventures, especially Australian Tradie Software Matcher. Product, retailer, price, imagery, freshness and authority claims must be truthful, sourceable and dated where material. Never invent testing, reviews, awards, partnerships, customers, rankings or commercial performance.