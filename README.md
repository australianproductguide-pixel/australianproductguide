# Australian Product Guide

Authoritative source repository for **Australian Product Guide (APG)** — an Australian product-search, comparison, decision-support and shopping-discovery platform.

**Production:** https://australianproductguide.au

## Source of truth

`GitHub main -> Vercel au-product-guide -> australianproductguide.au`

GitHub `main` is the authoritative application source. Vercel is the deployment/runtime layer, not a second source repository. Supabase is the optional account/runtime-data backend, not a catalogue source. Google Drive contains durable APG operating, governance, evidence and release records.

For the full operating model see [`docs/APG-OPERATIONS.md`](docs/APG-OPERATIONS.md). For the current technical dependency map see [`docs/APG-ARCHITECTURE.md`](docs/APG-ARCHITECTURE.md).

## Current application architecture

APG deliberately remains readable, lightweight and SSR-first:

`HTML/CSS -> server-rendered structured data -> progressive enhancement -> lightweight JavaScript`

The current request path starts at `api/index.js` and composes the maintained server runtime. The important current capability contracts are:

- **Interaction Runtime v55** — native browser GET/link navigation is authoritative; superseded browser routers are removed from emitted consumer HTML.
- **Compare State Handoff v56** — comparison shortlist state is normalised to canonical maintained product slugs before the native SSR comparison handoff.
- **Search v52 + Intelligence Core v54** — exact-model retrieval, brand/category discovery, typo handling, natural-language intent, budget/constraint handling and explainable results.
- **Decision Engine V4** — current decision engine used by Decision Lab and shared decision logic. Older base modules that it imports remain intentional dependencies, not competing active engines.
- **Scout v5** — deterministic conversational interface over maintained APG product and decision intelligence; no paid model dependency is required for the current implementation.
- **My APG / account platform** — local-first workspace with optional Supabase-backed account sync, communication preferences and self-service account deletion.
- **Catalogue Intelligence v48/v49** — cumulative maintained evidence, product, retailer and research overlays used by the current runtime.

**Evidence & Commerce Depth v27** remains an active lower-level evidence/retailer/governance dependency inside the cumulative server chain; it is retained because the dependency audit proves it is still reachable, not because v27 is the current top-level application version.

Historical version numbers remain in some filenames because APG evolved through additive, tested releases. A versioned filename is not automatically obsolete. `npm run qa:architecture` verifies the live `api/index.js` dependency graph and identifies genuinely unreferenced candidates before source removal.

## Maintained consumer scope

<!-- APG_CATALOGUE_SNAPSHOT_START -->
- **482 maintained products**;
- **90 populated categories**;
- **178 represented brands**;
<!-- APG_CATALOGUE_SNAPSHOT_END -->

Current Amazon Australia control state:

- **30 verified direct ASIN/variant destinations**;
- **452 transparent model-specific Amazon Australia search fallbacks** where an exact current identity has not been safely verified;
- Associates tag: `auproductguid-22`;
- affiliate relationships, retailer availability and commission contribute **zero recommendation points**.

`scripts/catalogue-docs-reconciliation-v27.js` derives the catalogue snapshot from the canonical product-intelligence graph and fails CI if the maintained 482 / 90 / 178 block drifts from source.

## Search, Decision Lab and comparison

APG uses one current consumer decision architecture rather than parallel search/decision applications.

Search and Decision Lab share the maintained Decision Engine V4/intelligence contracts for category interpretation, budget handling, hard constraints, exclusions and explainable reranking. Search remains server-rendered and crawlable. Decision Lab accepts a natural-language buying brief and returns a server-rendered shortlist, reasons, trade-offs and verification needs.

Comparison is also server-rendered. Browser state is used only to maintain the shortlist; the destination is a normal canonical GET request such as `/compare/custom/?products=...`. This keeps comparison shareable, inspectable and resilient without a client-side router.

## Scout

Scout is APG's conversational decision interface, not a generic chatbot. It uses the same maintained product catalogue and decision intelligence as the rest of APG and supports product discovery, recommendations, comparison, product facts, retailer pathways, Amazon Australia, site navigation and optional signed-in saved-product actions.

The current Scout implementation does **not** require paid LLM inference. Account-sensitive actions remain server-authorised against the authenticated Supabase session. Affiliate and retailer status do not influence suitability order.

## My APG and Supabase

My APG is local-first and usable without an account. Optional account sync uses the dedicated APG Supabase project in Sydney.

Current Production-required data responsibilities are intentionally narrow:

- `apg_workspace_items` — saved products, compare shortlist, recent items/searches, Decision Lab history, saved comparisons and saved guides;
- `apg_communication_preferences` — optional account communication-consent state;
- Supabase Auth — account identity/session management;
- `delete-account` Edge Function — authenticated self-service account deletion.

Database migrations remain historical/reproducible records. Current schema changes are made with new forward migrations rather than rewriting migration history.

## Retailer and Amazon architecture

Retailer data is separate from suitability logic. Exact retailer links require exact model/configuration identity and evidence. Price or stock is not presented as a maintained live fact unless APG has a controlled freshness basis.

For Amazon Australia, use a direct product destination only where exact product/variant identity is verified. Otherwise retain the model-specific tagged search fallback. **Never guess ASINs.**

## Evidence and imagery

APG guidance is desk-researched/specification-based unless a page explicitly documents another testing status. Consequential claims should prefer exact Australian manufacturer pages/manuals/support material, exact Australian retailer evidence and credible independent evidence where appropriate.

Genuine product photography is published only where exact identity, rights/provenance and source are verified. The current catalogue does not claim authorised exact-product photography where that verification has not occurred; APG uses honest category-correct decision visuals instead of fabricated product imagery.

## Build, QA and deployment

The normal release path is:

`focused branch -> GitHub Release Gate -> optional deliberate Preview -> merge to main -> one Vercel Production build -> APG Production Verification`

Routine `apg/*`, `apg-*`, `cost-control-*`, `hotfix/*`, `fix/*`, `feature/*` and `chore/*` branch pushes are suppressed from automatic Vercel Preview deployment. Full source/architecture assurance runs on GitHub; Vercel runs the smaller deploy-safety gate.

Key commands:

- `npm run qa:deploy` — small deploy gate used by Vercel;
- `npm run qa:full` — full GitHub source/contract assurance;
- `npm run qa:architecture` — current runtime and Supabase dependency mapping.

A Vercel `READY` status alone does not close a release. Production must align to the GitHub `main` SHA and the post-merge Production verification must pass.

## Security, privacy and telemetry

Supabase user-owned tables use Row Level Security and account data is isolated by authenticated user ID. My APG private URLs are excluded from public analytics reporting. GA4 remains consent-gated. APG's sparse field-performance telemetry excludes automated browser sessions and intentionally avoids account IDs and URL query strings.

Hosted provider-level security settings that are not represented in source — such as Supabase leaked-password protection or Vercel Spend Management — must be separately verified before being claimed as configured.

## Governance

Australian Product Guide remains operationally separate from unrelated ventures, especially **Australian Tradie Software Matcher**. Product, retailer, price, imagery, freshness and authority claims must be truthful, sourceable and dated where material. Never invent testing, reviews, awards, partnerships, customers, rankings or commercial performance.
