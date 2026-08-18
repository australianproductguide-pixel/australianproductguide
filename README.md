# Australian Product Guide

Authoritative source repository for **Australian Product Guide (APG)** — an Australian product-search, comparison, decision-support and shopping-discovery platform.

**Production:** https://australianproductguide.au

## Source of truth and deployment

`APG operating work -> GitHub main -> Vercel project au-product-guide -> Production`

`main` is the Production code source of truth. GitHub pushes deploy automatically to the dedicated Vercel project. Google Drive is the durable operating record for catalogue, evidence, governance, commercial controls, QA/release evidence and roadmap decisions. Supabase is the optional account/sync backend; it is not a competing catalogue source.

## Current architecture

APG deliberately remains lightweight, readable and SSR-first:

- one Vercel Node Function through `api/index.js`;
- Evidence & Commerce Depth v27 over the verified Platform Cohesion v26 / My APG account-governance v25 chain;
- governed integration of Priority Commerce Depth v42 and Research View v43 without replacing the current account/authentication chain;
- server-rendered crawlable HTML with progressive enhancement for search, comparison, sharing, Decision Lab, Scout, My APG and optional account sync;
- structured catalogue, evidence, retailer and imagery-provenance registries in `data/`;
- first-party, consent-gated outcome instrumentation for aggregate search/Scout/comparison/retailer-pathway quality signals;
- no required client framework, paid vector database, external search provider or opaque compressed deployment bundle.

## Maintained consumer scope

Current maintained scope at 18 August 2026:

<!-- APG_CATALOGUE_SNAPSHOT_START -->
- **482 maintained products**;
- **90 populated categories**;
- **178 represented brands**;
<!-- APG_CATALOGUE_SNAPSHOT_END -->
- **23 independently verified exact Amazon Australia product destinations** remain in the maintained exact-link set;
- other Amazon pathways use transparent model-specific search/further-verification fallbacks rather than guessed ASINs;
- commercial relationships contribute **zero recommendation points**.

High-intent depth includes televisions, laptops, robot vacuums, washing machines, coffee machines, wireless headphones, smartphones and earbuds. Catalogue expansion is subordinate to evidence quality, exact model identity and useful decision coverage.

`scripts/catalogue-docs-reconciliation-v27.js` derives the catalogue snapshot from the canonical product-intelligence graph and fails CI if this README drifts from the maintained source.

## Search, Research View and controlled learning

The canonical search contract is `search-ranking-v4`: maintained lexical/model discovery is combined with the governed Decision Intelligence state for category interpretation, budget handling, hard constraints, exclusions and explainable reranking.

Platform Cohesion v26 activates the maintained **Research View v43** inside the current Production account/governance chain. Natural-language shopping questions can therefore surface:

- the interpreted buying brief;
- current best fit and alternatives from maintained APG data;
- reasons, compromises and verification needs;
- source/freshness context;
- follow-up refinements that preserve the original question;
- a direct comparison path when suitable.

Evidence & Commerce Depth v27 adds controlled quality observability before any more complex semantic-search infrastructure is considered. When a visitor has opted into the existing analytics choice, APG may record coarse outcomes such as a result-count bucket, interpreted category, whether a hard-constraint fallback occurred, comparison selection and verified retailer-pathway use. It does not intentionally send free-text search/Scout queries, finder answers, account identifiers or URL query strings in these v27 outcome events.

APG does **not** currently require a vector database or external semantic-search provider. The governed decision is to observe aggregate outcomes first and introduce additional infrastructure only if measured failure patterns demonstrate a consumer benefit.

## Scout

Scout is a conversational interface to APG decision data rather than a generic chatbot. It uses the same maintained product and Decision Intelligence foundations as Search and Decision Lab.

Evidence & Commerce Depth v27 adds:

- deterministic scenario evaluation as part of the intelligence release gate;
- same-tab structured shopping-context continuity for category, budget, constraints and priorities;
- an explicit “forget session context” control;
- no persistence of raw Scout conversation text in the v27 continuity layer;
- no affiliate or retailer weighting in recommendation order.

The structured continuity state is stored in browser `sessionStorage`, expires after the tab/session window and is separate from optional My APG cloud sync.

## Comparison and mobile experience

Prepared comparisons remain server rendered. Desktop retains the full evidence table; Platform Cohesion v26 progressively labels the same table and presents it as decision-point cards on narrow screens rather than forcing a desktop table into a mobile viewport. The original table semantics remain available for accessibility and no-JavaScript fallback behaviour.

## Retailer architecture

Retailer data remains separate from suitability logic. Platform Cohesion v26 reconciles the exact-model retailer rendering from Priority Commerce Depth v42 into the current account-governance chain. Evidence & Commerce Depth v27 expands the exact-destination registry across additional high-intent products and adds independent Australian retailer destinations where exact model/configuration identity has been verified.

Structured Australian retailer offers may be shown only when the product record carries an exact-model destination and verification metadata. Observed price or stock is date-stamped context, not a live feed or a claim of whole-of-market lowest price. v27 intentionally leaves newly added independent-retailer prices as live-at-retailer unless APG can maintain the specific observation to its freshness standard.

Amazon Australia records retain explicit exact-versus-search states. The Amazon Associates tag is `auproductguid-22`. Never invent an ASIN or construct an unverified exact product destination.

## Product imagery

APG maintains a governed photography registry. Genuine photography is publishable only where exact model identity, source, rights basis and verification are documented. Amazon Program Content additionally requires a verified matching Amazon pathway and an Associates-approved delivery mechanism. Where authorised exact-model photography is unavailable, APG uses honest category-correct decision visuals rather than fabricated product photography.

The catalogue-wide genuine-photography rollout remains **PARTIAL**. Evidence & Commerce Depth v27 exposes image-coverage gaps through the intelligence observability layer but does not weaken the rights/match gate merely to increase visual coverage.

## Intelligence observability and model governance

v27 exposes internal, noindex/no-store quality snapshots for retailer coverage, imagery coverage, Scout scenario evaluation and the combined decision-intelligence release gate. The governed learning cycle is:

`OBSERVE -> IDENTIFY -> PROPOSE -> EVALUATE -> APPROVE -> DEPLOY -> MONITOR -> RETAIN OR ROLLBACK`

Production models do not self-modify from behavioural signals. Model/search changes remain versioned, auditable and subject to QA/human approval. Affiliate status and retailer participation remain zero-weight factors.

## Evidence and trust

APG guidance is primarily **desk-researched / specification-based** unless a page explicitly documents another testing status. Consequential claims should prefer:

1. exact Australian manufacturer product pages, manuals, support and warranty material;
2. exact Australian retailer evidence for local model/availability checks;
3. attributed independent professional evidence where appropriate;
4. consumer-feedback signals only where methodology and limitations are clear.

APG must not claim hands-on testing that did not occur. Product family, size and configuration differences must be disclosed where material.

## My APG, privacy and authentication

My APG remains **local-first** and usable without an account. Optional cross-device sync uses the APG Supabase project in Sydney with Row Level Security over user-owned tables and self-service export/deletion controls. Account status and communication preferences contribute zero product-recommendation points.

Google Analytics remains opt-in: analytics storage defaults to denied and the Google Analytics script loads only after the visitor allows analytics. Advertising storage and personalisation remain denied. v27 feature-outcome events use the same consent gate.

Hosted Supabase Authentication Site URL/redirect/email-template configuration and compromised-password protection are provider-level administration controls and are not changed by ordinary APG application releases. They must be verified separately through an authorised Supabase administration surface before being represented as complete.

## Performance, accessibility and visual QA

Visual richness should come from efficient CSS, lawful imagery and progressive enhancement rather than unnecessary framework bundles or third-party scripts. Maintain keyboard-operable navigation/search, labelled forms, strong focus states, adequate touch targets, readable contrast, reduced-motion handling and no unintended horizontal overflow.

APG maintains Production screenshot regression infrastructure using headless Chrome/Puppeteer across desktop, laptop, tablet and mobile viewports. v27 adds a dedicated evidence-commerce visual certification workflow for representative Search, Scout, high-intent category, exact-retailer product, comparison, Decision Lab and My APG surfaces.

## Release QA

Evidence & Commerce Depth v27 has dedicated controls for:

- canonical 482 / 90 / 178 catalogue truth;
- automated README catalogue reconciliation;
- verified exact-model Australian retailer destinations;
- retailer neutrality and non-fabricated pricing;
- image-rights registry validity and truthful coverage reporting;
- deterministic Scout scenario evaluation;
- consent-gated, coarse feature telemetry without raw query persistence;
- structured Scout session continuity without raw conversation storage;
- governed intelligence observability and no Production self-modification;
- preservation of the v26 Research View, account, SEO, privacy and mobile stack.

Existing catalogue, freshness, Decision Intelligence, account, platform-integrity, product-image, Amazon and governance suites remain part of release discipline.

A release is not closed merely because code merged: reconcile GitHub `main`, Vercel Production, the canonical public site and APG Google Drive records.

## Governance

Australian Product Guide remains operationally separate from unrelated ventures, especially Australian Tradie Software Matcher. Product, retailer, price, imagery, freshness and authority claims must be truthful, sourceable and dated where material. Never invent testing, reviews, awards, partnerships, customers, rankings or commercial performance.
