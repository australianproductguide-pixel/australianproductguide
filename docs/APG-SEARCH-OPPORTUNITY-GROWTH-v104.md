# APG Search Opportunity Growth — v104

Status: **STAGED / NOT YET PRODUCTION**  
Prepared: 25 August 2026  
Owner: Australian Product Guide

## Objective

Move APG from broad technical crawlability toward stronger Australian product-decision authority by deepening useful existing surfaces first, distributing those exact pages, earning credible third-party references and allowing observed Google Search Console demand to determine subsequent expansion.

The governing sequence is:

> RECONCILE CURRENT TRUTH → DEEPEN SIX DECISION AREAS → STRENGTHEN HEAD-TO-HEADS → DISTRIBUTE EXACT APG PAGES → EARN AUTHORITY → OBSERVE GSC → EXPAND ONLY WHERE DEMAND + EVIDENCE SUPPORT IT

## 1. About / Updates reconciliation

**Outcome: no corrective source-code rewrite required.**

The canonical Trust Centre source already derives product, populated-category and represented-brand counts from the maintained structured catalogue. The older 257-product / 48-category wording observed in search results is therefore treated as search-engine recrawl lag rather than a current APG source claim.

v104 deliberately does **not** create a second Trust Centre content layer or advance a review date just to create a freshness signal. The existing Trust Centre regression remains authoritative.

The correct recrawl signal is substantive consumer-page improvement and the normal sitemap / indexing pipeline, not a cosmetic About-page date change.

## 2. Six decision-depth categories

v104 adds a category-specific decision layer to these existing maintained categories:

1. Televisions
2. Laptops
3. Washing machines
4. Coffee machines
5. Robot vacuums
6. Smartphones

Each cohort receives:

- four decision gates before feature comparison;
- category-specific shortcuts/traps to avoid;
- four consequential checks to verify before purchase;
- a five-question comparison framework;
- links into the existing finder, buying guide and comparison journey.

No new catalogue category is created by v104.

## 3. Head-to-head quality

Existing curated pair pages in the six target categories receive an additional decision-first layer rather than a generic winner badge.

The layer shows:

- five questions that should decide the comparison;
- fit signals that differ between the products;
- evidence-date context where maintained;
- the category-specific comparison trap;
- links back to Help Me Choose and the category buying guide.

APG still does not claim a universal winner. The strongest choice is conditional on the shopper's priorities and acceptable compromise.

## 4. Exact-page social and Pinterest distribution

`lib/search-opportunity-growth-v104.js` builds a deterministic distribution queue from the current catalogue, curated pair registry and verified APG social registry.

For each of the six categories it prepares:

- one category-depth destination; and
- one selected curated head-to-head destination.

That produces up to **12 exact APG landing-page assets** without creating new SEO routes.

Drafts are prepared for:

- Facebook;
- Instagram;
- Threads;
- X;
- Pinterest; and
- LinkedIn.

### Publication gate

Every generated item is `READY_FOR_HUMAN_APPROVAL_NOT_PUBLISHED`.

No external post is published by v104. External publication remains a deliberate approval step.

### Link and imagery controls

- Social destinations are canonical APG research pages, not retailer or direct affiliate links.
- Category-level editorial imagery may be used only with its maintained provenance and only as contextual category imagery.
- A head-to-head defaults to the generic APG social card unless an exact product-comparison creative separately passes identity and rights/provenance checks.
- A post must remain useful without the click and must not imply APG hands-on tested a product unless that is separately documented.

## 5. Genuine external mentions and backlinks

v104 prepares an earned-authority queue; it does not buy, exchange or manufacture links.

Initial channel classes are:

- expert-source responses to relevant journalist call-outs;
- Australian startup / consumer-tech editorial tips when APG has a genuinely newsworthy milestone or original dataset;
- original non-promotional contributions where an editor accepts them;
- technology coverage when Decision Lab, Scout or APG's explainable decision architecture provides a real story.

Current prepared candidates include SourceBottle, Qwoted, Startup Daily, SmartCompany and techAU, subject to a fresh rules/eligibility check immediately before any submission.

The objective is **citation-worthy material**, not backlink volume.

Do not:

- buy links;
- exchange links for ranking benefit;
- mass-submit to generic directories;
- use stealth promotion in communities;
- manufacture consumer reviews, testing, traction or third-party endorsement;
- ask a journalist for a do-follow link as the purpose of the contact.

## 6. Search Console feedback loop

APG already has a first-party Search Console integration and the current Search Console depth playbook remains the operating basis.

The v104 operating loop is:

1. observe query and page impressions over a sensible period;
2. identify recurring/rising decision intent and near-page-one opportunities;
3. verify query-to-page relevance and possible cannibalisation;
4. inspect the existing page's evidence and decision usefulness;
5. deepen the existing canonical page first;
6. create a new route only when a genuine decision gap and evidence gate both exist;
7. observe the result before scaling the pattern.

A weekly APG Search Opportunities review has also been configured in ChatGPT to surface meaningful query/page changes when first-party data is accessible. It is explicitly instructed not to substitute estimated traffic if Search Console data cannot be read.

## 7. Expansion gate

New category or comparison expansion requires all of the following:

- observed search demand for a real Australian buying decision;
- enough credible exact-Australian evidence to answer it well;
- a materially differentiated consumer purpose;
- no avoidable canonical/cannibalisation conflict;
- crawlable SSR content and valid metadata/structured data;
- desktop/mobile quality and release QA;
- zero recommendation advantage from affiliate status, retailer availability or commission.

Search Console query text is **not** an automatic page generator.

## Completion gate for v104

v104 is ready for merge only when:

- source syntax is green;
- the dedicated v104 QA passes;
- the existing full APG source/release gate passes unchanged;
- Trust Centre regressions remain green;
- all six target category/guide/comparison journeys render the new decision layer correctly;
- no unintended new indexable routes are created;
- any preview deployment shows no material desktop/mobile regression;
- Production merge/deployment is separately approved and then verified against the exact Git SHA.
