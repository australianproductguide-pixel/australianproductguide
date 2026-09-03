# APG Google Discoverability & PageSpeed Static Delivery v127

**Date:** 3 September 2026  
**Status:** Source change proposed; Production certification required after merge/deployment.  
**Baseline source:** Google Search Console exports and PageSpeed Insights reports supplied 3 September 2026.

## Evidence-led scope

The supplied PageSpeed Insights reports showed:

- Mobile: 76 Performance, 100 Accessibility, 100 Best Practices, 100 SEO and 3/3 Agentic browsing; 3.3 s FCP, 4.4 s LCP, 10 ms TBT and 0 CLS.
- Desktop: 95 Performance, 100 Accessibility, 100 Best Practices, 100 SEO and 3/3 Agentic browsing; 0.8 s FCP, 1.1 s LCP, 0 ms TBT and 0 CLS.
- Largest actionable laboratory opportunities: render-blocking CSS and oversized homepage imagery.

Search Console showed strong early comparison-page and branded traction, 600 indexed pages, 711 discovered-currently-not-indexed pages, zero crawled-currently-not-indexed pages, no Breadcrumb invalid items and no non-HTTPS URLs in the supplied exports.

## Change

v127 adds a narrow outer transport wrapper and a deployment-time CSS build step:

1. Generates one static homepage critical CSS bundle during deployment rather than recursively re-entering the live handler.
2. Consolidates 16 established render-blocking homepage stylesheets while preserving their cascade order and retaining `site-optimised.css` as the stable first shell stylesheet.
3. Fails closed: if the build artifact is missing or unexpectedly small, the existing stylesheet cascade remains intact.
4. Defers only two known below-the-fold homepage stylesheets.
5. Applies the existing desktop header repair stylesheet only above 980 px so it does not block mobile rendering.
6. Requests responsive 500/800 px eBay image variants for lazy-loaded homepage situation cards while retaining the governed editorial fallback.
7. Leaves recommendations, evidence, product eligibility, retailer order, analytics, canonicals, structured data, crawler policy and agentic browsing semantics unchanged.
8. Adds source QA and restores the missing `qa:full` package entry used by the APG Release Gate.

## Required certification gates

- `node --check` across changed JavaScript.
- `pagespeed-static-delivery-v127-qa.js` passes.
- Existing full APG Release Gate passes.
- Vercel deployment reaches READY.
- Public Home returns 200 with native rendering and no serverless invocation error.
- The v127 response header and meta marker are present.
- Generated CSS bundle is publicly served with immutable caching.
- Homepage title, canonical, WebSite/Organisation structured data, primary H1 and trust copy remain present.
- Desktop About & trust and header autocomplete remain operational.
- Mobile header, Search, Decision Lab, Compare and Scout remain operational.
- Product imagery renders or fails closed to the governed editorial fallback.
- Lighthouse Accessibility, Best Practices and SEO remain 100; Agentic browsing remains 3/3.
- Performance is assessed through repeated matching mobile/desktop runs; no single lab score is treated as a guarantee.

## Rollback

Remove the v127 outer wrapper from `api/index.js`, restore the previous `vercel-build` command and delete the v127 files. The existing v113.5 fail-closed PageSpeed/agentic layer and prior stylesheet cascade remain untouched beneath the release.
