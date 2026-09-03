# APG Home delivery stability and runtime-manifest hotfix v130.1

**Date:** 4 September 2026 (Australia/Sydney)  
**Classification:** Emergency Production availability candidate until exact merged-SHA verification is green  
**Incident:** Canonical Home returned intermittent `FUNCTION_INVOCATION_FAILED` responses after v129.0, while representative non-Home routes and the Production HTTP contract remained substantially healthy.

## Evidence and isolation

- The affected Production deployment was READY at source SHA `799b95ad93c58ae83b21489278c2cabc9c0c3f5d`.
- Production verification and direct probes recorded repeated HTTP 500 responses on `/`.
- The v128.2 Home CSS bundle itself built successfully and retained its exact deterministic signature and digest.
- The final delivery boundary still read and hashed the generated 544,660-byte CSS file inside the public function package, transformed the large Home response and attempted some response-header changes from `res.end`.
- Those presentation-only operations were not required for recommendation, evidence, retailer, privacy, Search, Compare, Decision Lab, Scout or account semantics.

## Change

1. Record the exact deterministic Home bundle metadata in a small source-controlled manifest.
2. Remove live CSS-file reads and full CSS-payload hashing from the public request path.
3. Remove `public/assets/**/*.css` from the public `api/index.js` function package; the browser continues to receive the generated bundle through Vercel's filesystem route.
4. Retain broad CSS packaging only for the private noindex Home assembly diagnostic.
5. Keep exact stylesheet-link signature validation; stale metadata fails closed to the established stylesheet cascade.
6. Set invariant verification headers before downstream rendering.
7. Prohibit presentation mutation after response headers have committed.
8. Return the unchanged downstream body if a presentation-only transform fails, with an explicit fallback header and structured runtime log.
9. Add a >500 KB repeated Home/query-variant stress regression, post-commit response tests and package-isolation assertions.

## Exact manifest

- Source SHA: `799b95ad93c58ae83b21489278c2cabc9c0c3f5d`
- Source stylesheets: 53
- Expanded bytes: 579,692
- Bundle bytes: 544,660
- Brotli bytes: 64,246
- Gzip bytes: 83,924
- Link signature: `cf2eea99e8877e6c40a4f1e758a9ea90300c207ce5f8022ed4dc4c56d8070d81`
- Bundle SHA-256: `8e16038f1b5056d5efd1f225aab457d9d26af78e07794520c6dddefc9b59d1be`

## Explicitly unchanged

- product evidence, eligibility, suitability and recommendation logic;
- affiliate relationships, retailer participation and recommendation scoring;
- Search, Compare, Decision Lab, Scout and My APG state semantics;
- privacy, consent, authentication and account controls;
- canonical, robots, sitemap and structured-data behaviour;
- the exact Home CSS cascade and generated bundle bytes;
- v129.0 My APG accessibility repairs; and
- agentic-browsing permissions.

## Required release and incident-closure gates

The candidate must remain unmerged until its frozen SHA passes:

- APG Release Gate, including the v130.1 stability regression;
- CodeQL;
- Vercel Preview source/deployment lineage;
- repeated preview Home and query-variant requests with zero HTTP 500 responses;
- representative desktop, mobile and tablet journeys;
- accessibility and visual checks;
- five-run mobile and desktop Lighthouse thresholds;
- Amazon link integrity and Deals visual assurance; and
- 3/3 agentic browsing.

After merge, incident closure additionally requires:

- exact merged SHA equals exact Production deployment SHA;
- repeated canonical `/` and unique-query Home probes return 200 across cold and warm rounds;
- Home exposes the v128.2 bundle-manifest and v130.1 stability headers;
- full Production HTTP, browser, visual and accessibility certification passes;
- zero new material Production function errors during the observation window; and
- Current State, Release Register, Change Log and Issue Register are reconciled.
