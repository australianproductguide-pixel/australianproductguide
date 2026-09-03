# APG Google Discoverability and Safe Performance Delivery v128.2

**Date:** 3 September 2026  
**Status:** DRAFT RELEASE CANDIDATE — branch and Preview only; Production unchanged  
**Source baseline:** `58d7c98c7e646ffcd3583ecae5e5dd3de880c5f0`

## Evidence assessed

This candidate responds to the Google Search Console and PageSpeed evidence supplied on 3 September 2026:

- Web Search: 43 clicks, 3,737 impressions, 1.15% CTR and average position 38.31 across the active 16–31 August period.
- Generative AI Features: 124 property-level impressions. These are retrieval/exposure signals, not proof of citation, recommendation or click-through.
- Indexing: 600 indexed URLs, 713 not indexed and 1,313 known URLs, including 711 in `Discovered – currently not indexed` and zero in `Crawled – currently not indexed`.
- PageSpeed mobile: 76 Performance, 100 Accessibility, 100 Best Practices, 100 SEO and 3/3 agentic browsing; FCP 3.3 seconds, LCP 4.4 seconds, TBT 10 ms and CLS 0.
- PageSpeed desktop: 95 Performance, 100 Accessibility, 100 Best Practices, 100 SEO and 3/3 agentic browsing; FCP 0.8 seconds, LCP 1.1 seconds, TBT 0 ms and CLS 0.

The evidence points to mobile resource delivery and rendering as the immediate performance constraint, not JavaScript execution or layout instability. Exact comparison pages are already the strongest organic acquisition family. Category and finder pages receive broad impressions but currently convert few of them into clicks.

## Safe v128.2 scope

1. Permanently redirect the verified historical Philips STH5030/80 product alias to the maintained Australian STH5030/20 product URL.
2. Permanently redirect the matching historical comparison alias to the maintained STH5030/20 comparison URL.
3. Discard query strings on both aliases, return a static redirect body and apply the redirects before downstream rendering. This prevents request data being reflected into redirect responses.
4. Add explicit `media` conditions to four stylesheets whose source is already completely viewport-scoped:
   - desktop Home/Header v126: `(min-width:981px)`;
   - desktop About and Trust contrast v127: `(min-width:921px)`;
   - mobile header wordmark v75: `(max-width:920px)`; and
   - mobile menu polish v21: `(max-width:920px)`.
5. Apply immutable one-year caching only to versioned `/assets/...?v=...` responses.
6. Add a v128.2 HTML marker and response header for release verification.
7. Add dedicated regression QA, include it in the PageSpeed/deployment source gate and restore the `qa:full` alias required by the existing release workflow.

## Explicitly unchanged

- product eligibility, evidence, suitability and recommendation logic;
- affiliate relationships, retailer participation and commercial scoring;
- canonical URLs other than the two verified alias redirects;
- visible structured data, robots directives and sitemap generation;
- privacy and consent controls;
- Search, Compare, Decision Lab, Scout and My APG semantics;
- crawler and agentic-browsing permissions; and
- Production until separately approved.

The v128.2 candidate deliberately does not rewrite governed product-image URLs, broadly defer the established CSS cascade, restore recursive live-handler CSS capture, mass-generate pages or change recommendation engines.

## Release gates

The candidate remains a draft until all hard gates are satisfied:

1. Branch is based on current `main` and contains only the intended files.
2. Dedicated v128.2 regression QA passes.
3. Full `npm run qa:full` source gate passes against the frozen candidate SHA.
4. CodeQL and other security checks pass with no new high-severity alert.
5. Exact Vercel Preview SHA is `READY` and reconciled.
6. Representative desktop and mobile browser checks pass for Home, Search, category, product, comparison, Decision Lab, Scout, trust and retailer journeys.
7. Both aliases return 308 and both maintained targets return 200 with their intended self-canonical identity.
8. Canonicals, JSON-LD, robots, sitemap index, private-route controls and consent behaviour remain correct.
9. Accessibility, Best Practices and SEO remain 100 in comparable Lighthouse testing.
10. Agentic browsing remains 3/3.
11. Five comparable PageSpeed runs are recorded per device and assessed using the median, not a single favourable run.
12. Operational target is mobile Performance of at least 90 and LCP at or below 2.5 seconds where realistically achievable, and desktop Performance of at least 95, without visible or functional regression.
13. Production promotion requires explicit approval and final source-SHA, deployment and public-runtime reconciliation.
14. After a material Production release, Current State, Release Register, Change Log and open issue records must be reconciled.

A permanent PageSpeed score of 100 is not represented as a guarantee. A 100 lab score is a stretch outcome; repeatable consumer performance and preserved quality controls are the release objective.

## Rollback

Remove the v128.2 outer wrapper from `api/index.js`, remove the runtime and dedicated QA script, and restore the prior package scripts. No underlying recommendation or product-data engine is modified.

## Next programme after this baseline

- add answer-first, Australian-model-specific decision blocks to the highest-opportunity comparison pages;
- improve category and finder snippet alignment, differentiation and internal linking;
- tier the 1,313 known URLs so crawl and sitemap signals favour maintained, differentiated pages;
- retire superseded CSS through a build-time programme rather than recursive live-handler capture;
- trial governed responsive product-image delivery in a separately certified Preview; and
- earn independent reviews, citations and backlinks through original Australian product intelligence rather than directory spam or paid link schemes.
