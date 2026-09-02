# Vercel Cost-Control Review — 2 September 2026

Status: CURRENT IMPLEMENTATION EVIDENCE

## Billing-cycle snapshot supplied by owner

Vercel Pro usage screen for the current 15 August–15 September billing cycle showed an infrastructure subtotal of 89.63 in the dashboard-displayed currency.

Largest metered lines shown:

| Product | Usage | Charge shown |
| --- | ---: | ---: |
| Build CPU Minutes | 288 CPU hours | 59.42 |
| Observability Events | 16.92M | 20.30 |
| Fast Origin Transfer | 16 GB | 4.45 |
| Fluid Active CPU | 20 hours | 3.61 |
| Function Invocations | 1.48M | 0.89 |
| Fluid Provisioned Memory | 45.67 GB hours | 0.68 |
| Edge Requests - Additional CPU Duration | 41 minutes | 0.23 |
| Web Analytics Events | 2.2K | 0.07 |

Fast Data Transfer (33 GB / 1 TB) and Edge Requests (5.99M / 10M) showed no charge in the supplied snapshot.

Build CPU plus Observability represented approximately 89% of the shown infrastructure subtotal. The dashboard screenshot did not identify the billing currency, so this record does not label the figures AUD or USD.

## Build/release finding

The dominant avoidable cost driver was release frequency rather than an intrinsically expensive build. During the intensive August build period, `main` accumulated a very high number of granular commits and Vercel produced repeated Production deployments.

A sampled current Vercel build restored the prior build cache, installed dependencies quickly, and used APG's deliberately lightweight prevalidated `vercel-build`. The control response is therefore release batching and safe build suppression, not feature removal or reduced build quality.

## Runtime request review

A Vercel runtime-log sample for the prior 24 hours showed concentrations including:

- `/api/account/me`: approximately 3,029 requests;
- `/api/ebay-marketplace-account-deletion`: approximately 1,911 requests;
- `/api/ebay-image-refresh`: approximately 317 requests;
- `/api/ebay-image-discovery-v2`: approximately 225 requests;
- `/api/account/scout`: approximately 259 requests.

Some asset-like paths also appeared in serverless request logs. These observations are investigation signals, not proof of waste.

### Account state

No account optimisation is being applied in this release. `/api/account/me` performs authentication/session checks and can reach Supabase. The observed volume occurred during a period with unusually heavy automated Production certification, so user polling cannot yet be cleanly separated from QA/bot traffic. Changing authentication behaviour without that attribution would create disproportionate privacy/session risk.

Action: establish a quieter post-release baseline before changing account-state request behaviour.

### eBay account-deletion callback

No change is being applied. The endpoint is a compliance-sensitive eBay marketplace account-deletion callback and intentionally acknowledges POST requests promptly without logging incoming identifiers. Repeated successful POSTs were observed, but their origin was not conclusively established.

Action: preserve the endpoint and investigate only if the pattern remains material after the build period or if primary eBay programme evidence indicates a configuration problem.

### Asset-like request paths

No speculative static-materialisation change is being applied. Several observed names did not map directly to physical `public/assets` files in source and may be generated/governed runtime assets.

Action: optimise only after exact provenance and cache semantics are proven.

## Changes implemented in this release candidate

1. Add a fail-safe Vercel Ignored Build Step.
2. Skip Vercel builds only for provably non-runtime changes under `.github/**`, `docs/**`, `ops/**`, `README.md` and `RELEASE`.
3. Build on any ambiguity, mixed change set, invalid prior Production SHA or diff failure.
4. Add regression QA and Release Gate invariants for the ignored-build control.
5. Suppress push-triggered Production Verification for the same non-runtime-only path set, avoiding a false wait for a Vercel Production deployment that was intentionally skipped.
6. Preserve manual Production Verification.
7. Establish release batching as the steady-state operating standard.

## Explicitly preserved

- consumer functionality and visual experience;
- Search, Compare, Decision Lab and Scout;
- SSR and public crawlability;
- product/evidence/retailer controls;
- Web Analytics;
- accessibility and browser certification for runtime releases;
- exact-SHA Production verification;
- eBay compliance callback;
- account authentication/session controls.

## Configuration follow-ups

Vercel documentation confirms Observability Plus can be disabled per project and spend/budget alerts are supported. The connected management surface used for this review did not expose a safe write action for those settings. They are therefore not silently changed in source code.

Any native spend guardrail should be notification-only and must not automatically pause APG Production. Observability Plus should be reassessed after release frequency stabilises so its actual steady-state event volume can be measured.
