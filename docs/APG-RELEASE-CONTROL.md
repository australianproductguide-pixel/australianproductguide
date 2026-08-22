# Australian Product Guide — Production Release Control

Status: CURRENT
Control owner: APG operating model
Canonical Production: `https://australianproductguide.au`
Authoritative source branch: GitHub `main`

## Release-completion rule

**NO APG RELEASE IS COMPLETE UNTIL PRODUCTION VERIFICATION IS GREEN AND THE OPERATING RECORDS ARE RECONCILED.**

The mandatory release chain is:

`GitHub main -> Vercel Production -> public runtime -> functional/visual/accessibility QA -> APG Production Verification GREEN -> Operating Backend reconciled -> RELEASE COMPLETE`

A GitHub commit, a successful source gate, a Vercel `READY` state, or an HTTP 200 response is not sufficient on its own.

## Exact-version control

Every Production certification must identify and retain:

- full Git SHA and abbreviated SHA;
- commit message and commit timestamp;
- Vercel Production deployment identifier and deployment status;
- Production deployment timestamp;
- canonical Production URL;
- QA start and completion timestamps;
- test-suite/control version;
- final GREEN / AMBER / RED result.

If a remediation changes `main` and creates a new Production deployment, certification must restart against the new exact SHA. Evidence from different deployments must not be combined into one release result.

## Meaning of status

### GREEN
All critical Production controls pass and no known P0/P1 release-blocking defect remains. GitHub `main`, Vercel Production, the public runtime and QA evidence identify the same release. The Operating Backend has been reconciled to that exact state.

### AMBER
Production remains operable but a material non-critical control, record reconciliation or P2 issue remains unresolved. AMBER is not release completion.

### RED
Critical functionality, release integrity or Production verification has failed, or the exact deployed version cannot be established. RED is not release completion.

## Automated Production contracts

`APG Production Verification` must automatically verify stable, observable contracts rather than marketing copy or cosmetic implementation details. The automated gate covers, at minimum:

- exact Git SHA -> Vercel Production -> public apex runtime reconciliation;
- canonical domain and critical HTTP routes;
- Search outcomes including exact product, brand/category, natural language, typo, budget/use case and no-result behaviour;
- Decision Lab submission and controlled result behaviour;
- Decision Engine version and commercial-neutrality contract;
- Scout availability and anonymous account boundary;
- representative product and comparison behaviour;
- Amazon Australia affiliate tagging on eligible paths;
- `robots.txt`, sitemap, trust routes and genuine 404 behaviour;
- desktop, tablet and mobile browser journeys;
- browser/runtime error collection;
- visual evidence capture;
- material accessibility barriers.

Tests must distinguish transport/network errors, HTTP failures, data failures and assertion failures in their diagnostics.

## QA design standard

Automated assertions must test contracts and outcomes. Do not fail a release because non-contractual copy, punctuation, whitespace or presentational wording changed.

Prefer HTTP status and final URL; semantic attributes and stable route/component contracts; structured JSON/API fields; actual user interactions and navigations; controlled no-result/error states; exact authenticated/anonymous server responses; and canonical structured-data/SEO behaviour.

Avoid opaque `curl | grep` pipelines and exact marketing-copy assertions where the wording itself is not the controlled requirement.

## Human review boundary

Automation is evidence, not a substitute for judgement. Visual matrices and accessibility evidence must be inspected for material issues such as clipping, overflow, broken imagery, contrast, obscured controls, poor wrapping, focus problems and unusable narrow-screen comparison or decision journeys.

Nuanced recommendation quality, consumer readability and visual quality remain human-review controls.

## Operating Backend reconciliation

After Production is GREEN, reconcile current-state operating records to the exact verified release. At minimum maintain the current Git SHA; Vercel Production deployment; release timestamp; canonical domain; verified catalogue product/category/brand metrics; verified Amazon Australia direct/fallback/unresolved coverage; Production QA result; and current application/runtime, Decision Engine and Scout identifiers.

Do not append a contradictory “current” record without superseding or correcting the old current-state fields. Catalogue metrics must be calculated from the authoritative current catalogue, not copied from page copy.

## Cost discipline

Use the sequence:

`inspect -> reproduce -> diagnose -> batch fixes -> source/static validation -> deliberate Preview only if needed -> one Production deployment -> full exact-SHA verification`

Do not use repeated Production builds as the debugging loop. Routine `fix/*`, `hotfix/*`, `feature/*`, `chore/*`, `apg/*` and `apg-*` branches are expected to remain suppressed from automatic Vercel Preview deployment under the repository deployment policy.

## Release evidence and residual issues

The final release record must state any residual P0/P1/P2/P3 issue and mark it `OPEN`, `BLOCKED`, `DEFERRED` or `UNVERIFIED`. A control must not be marked GREEN by hiding or reclassifying a known release-blocking defect.

This file is a durable repository control. Changes that weaken the release-completion rule require an explicit governance decision rather than an incidental implementation change.
