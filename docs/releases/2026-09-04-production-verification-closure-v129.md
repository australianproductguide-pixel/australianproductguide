# APG Production Verification closure v129.0

**Date:** 4 September 2026 (Australia/Sydney)  
**Classification:** Controlled release candidate until the exact merged SHA passes Production Verification  
**Scope:** My APG breadcrumb accessibility and post-deployment runtime stability only

## Trigger

The v128.2 Google discoverability and safe-performance release passed its pre-Production source, security, browser, commerce and repeated Lighthouse gates. After the exact release was merged and deployed, the Production HTTP contract passed, but the browser matrix recorded intermittent HTTP 500 responses during the first deployment-start window. The same Production run also identified two serious My APG breadcrumb accessibility findings:

1. insufficient contrast for the current breadcrumb item; and
2. the Home breadcrumb link was not distinguishable from surrounding text without relying on colour.

The site returned to stable HTTP 200 responses after the initial deployment-start interval, but APG does not treat a READY deployment or later recovery as sufficient closure on its own.

## Changes

1. Add a route-scoped, versioned My APG accessibility stylesheet.
2. Give the current breadcrumb item a WCAG-compatible dark text colour.
3. Give the Home breadcrumb link a persistent underline as a non-colour cue while retaining its established link colour.
4. Inject the stylesheet only on `/my-apg/` through the existing outer delivery layer; do not add another recommendation, state or routing engine.
5. Require five consecutive successful runtime rounds across Home and My APG before the heavyweight Production browser suite begins.
6. Reset the stable-round count after any HTTP, redirect, release-marker or network failure.
7. Add dedicated source QA for route scope, idempotence, versioned caching, accessibility styling and stable-window enforcement.

## Explicitly unchanged

- product evidence, eligibility, suitability and recommendation logic;
- affiliate relationships, retailer participation and recommendation scoring;
- Search, Compare, Decision Lab, Scout and My APG state semantics;
- privacy, consent, authentication and account data controls;
- canonical, robots, sitemap and structured-data behaviour;
- Home CSS bundle composition and its fail-closed signature control; and
- agentic-browsing permissions.

## Release gates

The candidate must not be represented as GREEN until the exact source and deployment lineage passes:

- APG Release Gate;
- CodeQL;
- exact Vercel Preview SHA reconciliation;
- Google discoverability browser and five-run Lighthouse certification;
- Amazon automation compliance, destination integrity and Deals visual assurance;
- exact Production deployment reconciliation;
- Production HTTP contract;
- Production browser, visual, measurement and accessibility certification; and
- durable Current State, Release Register, Change Log and issue-record reconciliation.

A repeated lab score is certification evidence for the tested environment, not a guarantee of every real-user field experience.
