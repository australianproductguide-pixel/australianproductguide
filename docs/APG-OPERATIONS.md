# Australian Product Guide — Operating & Release Playbook

Status: CURRENT

## 1. Operating principle

Australian Product Guide (APG) exists to answer: **What should I actually buy for my situation, and why?**

Accuracy, evidence, explainable suitability and Australian relevance take priority over catalogue scale, affiliate conversion and technical novelty.

## 2. Source-of-truth hierarchy

When sources conflict, investigate and resolve them in this order:

1. latest explicit owner instruction;
2. live Production — `https://australianproductguide.au`;
3. GitHub `main` — this repository;
4. current APG Google Drive operating records;
5. Vercel deployment/configuration state;
6. superseded Venture Lab history.

Volatile facts such as deployment SHAs, prices, catalogue counts, retailer coverage and API/program requirements must be freshly verified when material.

## 3. Authoritative systems

- Production: `https://australianproductguide.au`
- GitHub: `australianproductguide-pixel/australianproductguide`
- Vercel project: `au-product-guide`
- Supabase: the dedicated APG Sydney project, with schema migrations and Edge Function source reconciled under `supabase/`
- APG Google Drive workspace: dedicated `Australian Product Guide (APG)` folder under the Venture Lab operating structure
- Operating Backend & Product Register: maintained in the private APG Drive workspace
- Venture Brief: maintained in the private APG Drive workspace

Internal Drive IDs, credentials, API tokens and private account identifiers should not be published in this public repository.

## 4. Drive operating taxonomy

- `00 – Governance & Operating Model`
- `01 – Product Data & Catalogue`
- `02 – Evidence, Sources & Research`
- `03 – Retailers, Affiliate & Commercial`
- `04 – Product, UX & Design`
- `05 – Engineering, Architecture & Automation`
- `06 – SEO, Analytics & Growth`
- `07 – QA, Releases & Production Evidence`
- `08 – Trust, Compliance, Privacy & Legal`
- `09 – Roadmap, Experiments & Decisions`
- `99 – Archive & Superseded`

Current records belong in the relevant numbered domain. Superseded material should be clearly labelled and moved to `99` rather than left beside current operating artefacts.

## 5. Architecture guardrails

Preserve APG's readable, lightweight, SSR-first architecture:

`HTML/CSS -> server-rendered structured data -> progressive enhancement -> lightweight JavaScript`

Avoid opaque bundles, unnecessary frameworks, client-only rendering and infrastructure complexity without a demonstrated consumer or operating benefit.

GitHub `main` remains the authoritative Production source. Vercel deploys from GitHub; it must not become a parallel source repository. Supabase database changes must use named migrations and be reconciled to GitHub, and deployed Edge Function source must remain aligned with the repository copy.

## 6. Evidence and product controls

For material product claims, prefer:

1. Australian manufacturer pages, manuals and support/warranty material;
2. exact Australian retailer evidence for local model and availability checks;
3. credible independent professional evidence;
4. consumer feedback only when methodology and limitations are clear.

Maintain traceability for exact model/variant identity, source, review date, confidence and any material uncertainty.

Do not invent hands-on testing, reviews, ratings, awards, staff, laboratories, customer numbers, partnerships or authority signals.

## 7. Recommendation and commercial separation

Recommendations should follow:

`budget + needs + priorities + deal-breakers -> best match + alternatives + explanation`

Affiliate relationships, retailer availability and commission contribute **zero recommendation points**.

For Amazon Australia, use exact product links only when exact model/variant identity is verified. Otherwise use a transparent model-specific search fallback. Never guess ASINs.

## 8. Imagery controls

Use genuine product imagery only when lawful, correctly matched and provenance is recorded. Do not scrape, fabricate or misappropriate real-product imagery.

APG-authored decision visuals may be used where genuine product photography rights are not yet verified, provided the presentation does not imply it is product photography.

## 9. Authoritative CI and release controls

APG uses a deliberately small set of authoritative GitHub Actions. **Green means the relevant acceptance criteria passed; red means the release or control genuinely requires investigation.** Do not recreate version-specific standalone workflows for historical layers.

1. **APG Release Gate** — the primary pre-release source gate for pull requests and `main`. It covers syntax/build integrity, current runtime-chain reachability, catalogue/search/recommendation invariants, account/auth controls, affiliate and imagery controls, trust/governance controls and selected regression suites.
2. **APG Production Verification** — the post-merge Production certification. It waits for the exact GitHub SHA to reach Vercel Production, verifies the canonical domain is serving that SHA, then validates public routes, catalogue exports, account/auth boundaries, analytics, canonical crawl, product/Amazon contracts and representative browser journeys.
3. **APG Scheduled Controls** — time-driven freshness, review-debt, catalogue authority, retailer/Amazon, imagery and decision-quality monitoring. It creates evidence artefacts without auto-publishing product facts.
4. **APG CodeQL Security** — JavaScript/TypeScript security analysis on pull requests, `main` and a weekly schedule.

Dependabot is maintained separately in `.github/dependabot.yml` for dependency and GitHub Actions update pull requests.

Historical and version-specific QA logic should remain available as reusable `scripts/*-qa.js` controls where it still protects a current contract. Those scripts are invoked by an authoritative gate when relevant. Tests must validate **runtime-chain reachability or observable behaviour**, not assume that `api/index.js` directly imports an older wrapper.

## 10. Change flow

Preferred engineering flow:

1. inspect current Production, GitHub `main`, Vercel, Supabase where relevant, and relevant Drive records;
2. create a focused branch from the current `main` SHA;
3. make the smallest coherent change;
4. require **APG Release Gate** (and CodeQL where triggered) to pass;
5. inspect Vercel Preview and affected journeys;
6. merge only after Preview/source checks are acceptable;
7. verify Vercel Production is READY;
8. verify Production SHA equals GitHub `main`;
9. require **APG Production Verification** to pass;
10. verify public runtime and representative key journeys;
11. reconcile material release evidence or decisions in Drive.

A deployment is **not complete** merely because Vercel says READY.

## 11. Minimum release acceptance

Release acceptance should cover, where relevant:

- source syntax/module loading and build viability;
- current runtime wrapper-chain integrity;
- catalogue and route invariants;
- recommendation regression profiles;
- affiliate/retailer identity controls;
- imagery provenance;
- search, compare and Help Me Choose journeys;
- mobile/desktop presentation and accessibility;
- canonicals, robots, sitemap and structured data;
- trust/legal routes;
- public anonymous access and account/auth security boundaries;
- Vercel Analytics/public telemetry presence without leaking private My APG URL data;
- Supabase source/migration reconciliation where database changes occur;
- absence of unrelated Venture Lab/Tradie contamination;
- exact GitHub `main` -> Vercel Production SHA alignment.

## 12. Incident and rollback approach

If Production is materially degraded:

1. identify the affected deployment and last known-good Production deployment;
2. preserve evidence before making changes;
3. prefer a small reversible fix or Vercel rollback over broad emergency rewriting;
4. re-run APG Production Verification after recovery;
5. document the cause, impact, fix and prevention action in `07 – QA, Releases & Production Evidence` when material.

## 13. Automation principles

Automate repetitive controls where the inputs and acceptance criteria can be made explicit, including:

- source freshness checks;
- retailer/variant verification queues;
- imagery provenance checks;
- structured-data validation;
- route/link/SEO QA;
- deployment/SHA reconciliation;
- release reporting;
- analytics anomaly detection once sufficient traffic history exists.

Automation must preserve provenance, validation and human oversight for consequential recommendation, compliance and commercial decisions. Avoid duplicate workflows that test the same contract independently with different assumptions, because noisy false failures weaken the control environment.

## 14. Separation requirement

APG must remain operationally separate from unrelated ventures, especially Australian Tradie Software Matcher. Do not share code, data, credentials, affiliate records, customer data or public identities without an explicit decision and appropriate controls.
