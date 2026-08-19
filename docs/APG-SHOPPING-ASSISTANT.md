# APG Scout Concierge v5

Status: **CURRENT**

Production release date: 2026-08-19

## Purpose

Scout is Australian Product Guide's conversational shopping assistant and site concierge. It helps a consumer find products, compare trade-offs, refine a buying brief, understand APG, navigate current APG routes and use their own saved products when securely signed in.

Scout is an orchestration layer, not APG's source of truth.

## Release chronology

- **HISTORICAL — 2026-08-16:** the original APG Shopping Assistant launched as a lightweight guided flow over the deterministic Decision Engine. It primarily asked the shopper to choose a maintained category, budget and purchase priority before returning up to three matches.
- **FAILED / RECOVERED — 2026-08-19:** the first Scout v5 Production attempt at GitHub `486fc1297fd0c12b2b614ef3b4e21a67200d6847` reached a Vercel READY state but failed when the serverless runtime loaded because `lib/scout-concierge-v5-core.js` contained an unclosed template literal. The public health check caught the failure. Production was immediately restored to the last known-good Auth Password Policy v36.1 runtime at `df0f4fcef23ff6b6fc6600ac665612893d02a741`.
- **CURRENT — 2026-08-19:** the repaired Scout v5 core was released at GitHub `14f23387acd12ded5d47cf7160cd48459275b756`. A mandatory Vercel build gate now runs parser/module-load checks plus Scout conversation/security and Amazon AU mapping QA before deployment. Public Production health subsequently passed all ten v5 runtime checks and post-release runtime error/fatal logs were clear.

The failed release and recovery are intentionally retained as operating history rather than overwritten.

## Architecture

Scout v5 follows this pattern:

`Conversation + structured page context + structured decision state`

→ `intent routing`

→ APG tools and current structured data:

- Search: `lib/search-base.js`
- Decision Intelligence: `lib/decision-engine-v4.js`
- Product Intelligence / evidence / retailer records: `lib/product-intelligence-v41.js`
- Amazon AU mapping register: `data/amazon-au-mappings-v33.js`
- Current routes: `lib/routes.js`
- Authenticated My APG workspace: Supabase session + `apg_workspace_items`

→ concise consumer-facing response and actions.

Primary v5 files:

- `lib/scout-concierge-v5-core.js` — conversational intent, page-context validation, multi-turn decision state and product/site/account response orchestration.
- `lib/scout-concierge-v5.js` — secure `/api/account/scout` gateway and current APG data/tool orchestration.
- `lib/scout-concierge-v5-client.js` — progressive-enhancement chat client, structured session continuity and responsive/accessibility behaviour.
- `lib/scout-concierge-v5-brand.js` — current APG blue/navy design alignment.
- `lib/scout-amazon-v5.js` — verified Amazon AU direct/variant/fallback routing using the maintained v33 mapping register.
- `lib/scout-session-guard-v5.js` — clears visible/session Scout state across account identity changes before a fresh authenticated bootstrap.
- `lib/scout-health-v5.js` — privacy-safe Production runtime self-certification.
- `lib/scout-concierge-v5-runtime.js` — governing Scout wrapper and health/session-guard routes.
- `scripts/scout-v5-syntax-check.js` — mandatory parser/module-load release gate.
- `scripts/scout-concierge-v5-qa.js` — conversation, route, privacy, account-boundary and accessibility regression suite.
- `scripts/scout-amazon-v5-qa.js` — Amazon AU exact/variant/fallback regression suite.

The rest of APG remains SSR-first and usable if Scout JavaScript is unavailable.

## Current capabilities

Scout v5 currently supports:

- natural greetings, thanks and limited in-scope small talk;
- free-text product discovery and recommendations;
- budgets, hard constraints, exclusions and soft preferences through Decision Intelligence;
- multi-turn structured decision state across page navigation within the browser tab;
- referential product language using the current product page or recent Scout result references;
- product comparisons and contextual APG comparison links;
- current-page awareness for product, category/finder, comparison, guide, Decision Lab, Search and My APG surfaces;
- APG methodology, desk-research, affiliate and trust explanations;
- current APG route discovery without fabricated internal links;
- current category and buying-guide discovery;
- product facts from maintained APG records;
- verified exact-model retailer records with freshness language;
- Amazon Australia verified direct/variant mappings and approved model-specific search fallback from the current APG mapping register;
- explicit refusal to invent prices, stock, availability, ASINs, retailer records or page routes;
- authenticated saved-product listing, save and remove actions for the current My APG user only;
- privacy-safe display-name support only where a trusted authenticated `display_name`, `first_name` or `preferred_name` actually exists;
- generic authenticated greeting when no trusted display name exists — Scout never derives a name from an email address;
- aggregate Scout interaction/feedback events without sending the chat text as an analytics event property;
- graceful failure routes to Search and Decision Lab;
- mobile full-height chat using dynamic viewport units;
- keyboard focus trapping, Escape close, focus return and reduced-motion support.

## Recommendation and factuality boundary

Scout applies these rules:

- APG catalogue fact → retrieve from maintained APG data.
- Product fit / recommendation → Decision Intelligence.
- Product comparison fact → maintained product data / Product Intelligence.
- Price / retailer destination → structured retailer record with freshness metadata.
- Amazon AU destination → current v33 mapping register; never a guessed ASIN.
- Account data/action → authenticated My APG server tool.
- Site route → current APG route map.
- Explanation / conversational phrasing → Scout orchestration layer.

Affiliate relationships and commercial signals contribute zero recommendation points.

Scout must not claim hands-on product testing unless APG has explicitly documented it. APG guidance remains desk-researched unless explicitly stated otherwise.

## Privacy and authentication

- Scout does not deliberately persist the raw chat transcript across page navigation.
- Only structured decision state and recent maintained product references are stored in `sessionStorage` for same-tab continuity.
- Authenticated Scout requests use `/api/account/scout`, which sits behind the existing HttpOnly Supabase session and refresh-cookie boundary.
- Saved-product reads/writes bind the user identity from the authenticated server session and remain subject to existing Supabase RLS policies.
- Conversational input cannot supply an arbitrary privileged user ID.
- Scout never returns access tokens, refresh tokens, internal account IDs or database credentials.
- Cross-user account requests and hidden-instruction/secret extraction attempts are rejected.
- Successful sign-in, sign-out, account-session or account-deletion changes invalidate visible Scout state before it can reopen under a different identity.

## Personalisation boundary

Scout can use a trusted authenticated display name only when APG actually stores one in appropriate authenticated user metadata. The current account dataset should not be assumed to contain a name.

A new mandatory profile/name data field remains **PLANNED / NOT APPROVED** because it would be a separate privacy/data-model change requiring explicit approval and corresponding privacy/governance review.

## Cost model

Scout v5 adds no new paid generative-model or third-party AI dependency. It uses APG's existing first-party search, deterministic Decision Intelligence, Product Intelligence and account infrastructure.

A future generative explanation/reasoning layer may be evaluated only if it remains tool-grounded, cost-controlled, privacy-appropriate and commercially neutral, with explicit approval before introducing material recurring paid infrastructure.

## Release controls

Vercel now runs the following before a Scout v5 deployment can complete:

1. `node scripts/scout-v5-syntax-check.js`
2. `node scripts/scout-concierge-v5-qa.js`
3. `node scripts/scout-amazon-v5-qa.js`

The syntax gate parses all relevant Scout JavaScript modules and performs a module-load smoke check. This control was added after the first v5 release showed that Vercel could report a serverless build READY without having eagerly loaded the catch-all runtime module.

The public read-only endpoint `/api/scout/health` self-certifies route truth, security boundary, desk-research wording, affiliate neutrality, catalogue recommendation grounding, page context, name privacy, Amazon grounding, mobile/accessibility hooks and current APG branding without exposing user data.

## Verification status at release

Verified on Production on 2026-08-19:

- repaired GitHub `main` release reached Vercel Production READY;
- Vercel build-time parser/module-load gate passed;
- Scout conversation/security QA passed;
- Scout Amazon AU mapping QA passed;
- public `/api/scout/health` passed all 10 checks;
- homepage and current Scout JavaScript asset returned HTTP 200;
- anonymous `/api/account/scout` returned only `authenticated:false`, `displayName:null`, `savedCount:0`, privacy flags and capability metadata;
- no post-release Vercel runtime error/fatal logs were present during verification.

Still **UNVERIFIED** at this release point:

- a real signed-in end-user browser session using the current user's own credentials;
- visual/manual interaction testing by a human across every supported mobile browser and device.

Those limitations do not weaken the server-side authorisation boundary, which was inspected against current Supabase RLS and authenticated-session code, but they should not be represented as completed live-user QA.

## Known v5 boundary

Scout v5 is materially more conversational than the historical guided assistant, but it remains a governed first-party deterministic agent rather than an unrestricted general-purpose generative chatbot. That is deliberate for this release: factuality, explainability, privacy, commercial neutrality and zero-new-cost operation take priority over unconstrained language generation.
