# APG Scout Concierge v5

Status: RELEASE CANDIDATE

Candidate date: 2026-08-19

## Purpose

Scout is Australian Product Guide's conversational shopping assistant and site concierge. It is designed to help a consumer find products, compare trade-offs, refine a buying brief, understand APG, navigate current APG routes and use their own saved products when securely signed in.

Scout is an orchestration layer, not APG's source of truth.

## Historical state

The original APG Shopping Assistant launched on 2026-08-16 as a lightweight guided flow over the deterministic Decision Engine. It primarily asked the shopper to select a maintained category, budget and purchase priority before returning up to three matches. It did not provide unrestricted free-text conversation or account-aware personalisation.

That v1 behaviour is HISTORICAL once Scout v5 is verified on Production.

## Scout v5 architecture

Scout v5 follows this pattern:

`Conversation + structured page context + structured decision state`

→ `intent routing`

→ APG tools and current structured data:

- Search: `lib/search-base.js`
- Decision Intelligence: `lib/decision-engine-v4.js`
- Product Intelligence / evidence / retailer records: `lib/product-intelligence-v41.js`
- Current routes: `lib/routes.js`
- Authenticated My APG workspace: Supabase session + `apg_workspace_items`

→ concise consumer-facing response and actions.

Primary v5 files:

- `lib/scout-concierge-v5-core.js` — conversational intent, page context validation, multi-turn decision state, product/site/account response orchestration.
- `lib/scout-concierge-v5.js` — current runtime wrapper and secure `/api/account/scout` gateway.
- `lib/scout-concierge-v5-client.js` — progressive-enhancement chat client, structured session continuity and responsive/accessibility behaviour.
- `lib/scout-concierge-v5-brand.js` — APG design-token alignment.
- `scripts/scout-concierge-v5-qa.js` — deterministic conversation, route, privacy and security regression suite.
- `.github/workflows/scout-concierge-v5.yml` — pull-request and `main` QA gate.

The rest of APG remains server-rendered and usable if Scout JavaScript is unavailable.

## Current v5 capabilities

The release candidate supports:

- natural greeting, thanks and limited in-scope small talk;
- free-text product discovery and recommendations;
- budgets, hard constraints, exclusions and soft preferences through Decision Intelligence;
- multi-turn structured decision state across page navigation within the browser tab;
- referential product language using the current product page or recent Scout result references;
- product comparisons and contextual comparison links;
- current-page awareness for product, category/finder, comparison, guide, Decision Lab, Search and My APG surfaces;
- APG methodology, desk-research, affiliate and trust explanations;
- current APG route discovery without fabricated links;
- current category/guide discovery;
- product facts from maintained APG product records;
- verified exact-model retailer records with freshness language;
- explicit refusal to invent prices, availability, ASINs, retailer records or page routes;
- authenticated saved-product listing, save and remove actions for the current My APG user only;
- privacy-safe authenticated display-name support where an explicit `display_name`, `first_name` or `preferred_name` exists in trusted authenticated user metadata;
- generic greeting when no trusted display name exists — Scout never derives a name from an email address;
- aggregate Scout interaction/feedback events without sending chat text as an analytics event property;
- graceful failure routes to Search and Decision Lab;
- mobile full-height chat using dynamic viewport units;
- keyboard focus trapping, Escape close and reduced-motion support.

## Recommendation and factuality rules

Scout uses the following boundary:

- APG catalogue fact → retrieve from maintained APG data.
- Product fit / recommendation → Decision Intelligence.
- Product comparison facts → maintained product data / Product Intelligence.
- Price / retailer destination → structured retailer record with freshness metadata.
- Account data/action → authenticated My APG server tool.
- Site route → current APG route map.
- Explanation / conversational phrasing → Scout orchestration layer.

Affiliate relationships and commercial signals contribute zero recommendation points.

Scout must not claim hands-on product testing unless APG has explicitly documented it. APG guidance remains desk-researched unless explicitly stated otherwise.

## Privacy and authentication

- Scout does not deliberately persist the raw chat transcript across page navigation.
- Only structured decision state and recent maintained product references are stored in `sessionStorage` for same-tab continuity.
- Authenticated Scout requests use `/api/account/scout`, which sits under the existing refresh-cookie path and revalidates the Supabase session server-side.
- Saved-product reads/writes are bound to `auth.user.id` on the server and remain subject to existing Supabase RLS policies.
- Conversational input cannot supply an arbitrary privileged user ID.
- Scout never returns access tokens, refresh tokens, internal account IDs or database credentials.
- Cross-user account requests and hidden-instruction/secret extraction attempts are rejected.

## Personalisation boundary

Scout can use a trusted authenticated display name only when APG actually stores one in appropriate authenticated user metadata. Current account records should not be assumed to contain a name.

Introducing a new mandatory profile/name data field is outside this v5 release because that would be a separate privacy/data-model decision requiring explicit approval and corresponding privacy/governance review.

## Cost model

Scout v5 adds no new paid generative-model or third-party AI dependency. It uses APG's existing first-party search, deterministic Decision Intelligence, Product Intelligence and account infrastructure.

A future generative explanation/reasoning layer may be evaluated only if it can remain tool-grounded, cost-controlled, privacy-appropriate and commercially neutral, with explicit approval before introducing material recurring paid infrastructure.

## Release acceptance

Do not classify v5 as CURRENT until all of the following are verified:

- Scout v5 repository QA passes;
- existing APG regression workflows remain healthy;
- Vercel Production deployment is READY on the intended GitHub `main` SHA;
- Production serves the v5 JS and CSS assets;
- anonymous `/api/account/scout` bootstrap is healthy and reveals no private identifiers;
- representative product, comparison, methodology, affiliate, navigation and security conversations pass against Production;
- logged-out save attempts require sign-in rather than claiming success;
- authenticated account boundaries remain server-side and RLS-backed;
- mobile/desktop responsive behaviour has no known blocking defect;
- Production runtime error/fatal logs remain clear after verification.

## Known v5 boundary

Scout v5 is materially more conversational than the historical guided assistant, but it remains a governed first-party deterministic agent rather than an unrestricted general-purpose generative chatbot. That is deliberate for this release: factuality, explainability, privacy, commercial neutrality and zero-new-cost operation take priority over unconstrained language generation.
