# APG Production Release Control

**Status:** CURRENT control

This document defines the minimum release-completion rule for Australian Product Guide (APG). It is an operating control, not a deployment note.

## Release-completion rule

> **No APG release is complete until Production Verification is GREEN and the Operating Backend describes the exact version consumers are actually using.**

A Vercel deployment being `READY`, a commit existing on GitHub `main`, or pre-deployment CI passing is not sufficient by itself.

The required chain is:

`GitHub main` → `Vercel Production` → `australianproductguide.au` public runtime → functional/browser/accessibility QA → `APG Production Verification` GREEN → Operating Backend reconciled → **RELEASE COMPLETE**

## Authoritative release identity

Every Production verification record must be traceable to one exact release and record at least:

```text
Git SHA
abbreviated Git SHA
commit message and timestamp
Vercel deployment ID
Vercel Production status and deployment timestamp
Production URL
canonical domain
QA started
QA completed
verification suite/version
result
```

Do not combine evidence from different deployments. If a fix creates a new SHA/deployment, relevant Production verification must run again against the new release.

## Release status meanings

### GREEN

All critical Production controls pass and no known P0/P1 release-blocking defect remains. GitHub `APG Production Verification` must be successful and the Operating Backend must be reconciled to the exact Production release before the release itself is considered complete.

### AMBER

Production is operating, but a material non-critical defect, verification gap or operating-record discrepancy remains. AMBER is not a completed green release.

### RED

Critical functionality, integrity or verification has failed, or the exact Production release cannot be established reliably.

Never mark the Operating Backend GREEN while GitHub Production Verification is red.

## Automated Production contracts

Routine verification should test stable contracts and outcomes rather than presentation copy. The required automated control set includes:

- exact Git SHA visible at the canonical public runtime after the successful Production deployment;
- HTTP and canonical route health;
- Search representative outcomes, including exact product, brand, category, natural-language, typo, budget/use-case and honest no-match behaviour;
- Decision Lab server-rendered result contract;
- Decision Engine runtime/version and commercial-neutrality contract;
- Scout availability, response and anonymous account boundary;
- representative product and comparison semantics;
- signed-out account boundary;
- robots.txt and sitemap controls;
- trust routes;
- genuine 404 behaviour;
- critical browser interactions;
- desktop/mobile visual matrix plus tablet portrait/landscape evidence;
- meaningful accessibility checks with serious/critical barriers treated as release blockers.

Transport, HTTP, data and assertion failures must be distinguishable in diagnostic output. Do not use `curl | grep -q` pipelines under `pipefail` for HTTP status/content contracts; save or parse the response and report the expected and actual outcome.

## Human QA retained

Automation does not certify visual quality or recommendation judgement by itself. For material releases, inspect representative Production evidence for:

- header, logo and navigation;
- Search;
- homepage and Maintained Australian Research banner;
- category and product pages;
- comparison;
- Decision Lab;
- Scout;
- My APG/account surfaces;
- footer/trust navigation;
- desktop, tablet and mobile wrapping, clipping, overflow, imagery, contrast and control visibility;
- recommendation quality and whether Decision Engine outputs change rationally when constraints/priorities change.

## Operating Backend reconciliation

After Production verification is genuinely GREEN, reconcile the APG Operating Backend current-state records to the same release. At minimum update/reconcile:

- exact Production Git SHA;
- current Vercel Production deployment ID and status;
- actual release date/time;
- canonical domain (`australianproductguide.au`);
- current verified catalogue metrics derived from the authoritative catalogue;
- current Amazon Australia mapping coverage (verified exact/variant links, search fallbacks, unmatched/unverified) without treating a fallback as exact coverage;
- QA status;
- current application/runtime identifiers, including Decision Engine and Scout where maintained;
- Release Register and Vercel Release Register so only the genuinely current release is marked current.

Do not append a contradictory “current” record while leaving older records marked current.

## Cost discipline

Production builds are not the debugging loop. Use:

`inspect` → `reproduce` → `batch fixes` → `local/source validation` → appropriate preview where required → **one intended Production deployment** → complete Production verification.

A genuine hotfix may require a second build, but repeated Production builds for one assertion at a time are a control failure.

## Ownership principle

GitHub is authoritative source control. Vercel is deployment/runtime evidence. Public Production proves what consumers receive. Production Verification proves critical contracts and interactions. The APG Operating Backend is the durable operating record. These layers must reconcile before the release is complete.
