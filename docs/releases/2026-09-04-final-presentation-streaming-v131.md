# APG final presentation streaming stability v131.0

**Date:** 4 September 2026 (Australia/Sydney)  
**Classification:** Emergency Production availability candidate until exact merged-SHA verification is green  
**Incident:** Canonical Home continued returning intermittent `FUNCTION_INVOCATION_FAILED` responses after v130.1, while the private Home assembly diagnostic succeeded through the governed `final` stage and representative non-Home routes remained healthy.

## Production evidence and root-cause isolation

- Production/main SHA before this candidate: `5fee3f54c8e7a27d6465e8363a53c9d48db4e3fa`.
- Production deployment: `dpl_CLRauRw6MeW4McrcfPUQ5cLo9JpX`.
- Canonical `/` continued returning function-level HTTP 500 responses on fresh query probes.
- `/search/` and representative non-Home routes returned HTTP 200.
- `/api/home-assembly-diagnostic?target=final` returned HTTP 200 with the complete Home response.
- Therefore the remaining fault was isolated to the three layers after `final`: desktop Home/header v126.2, desktop About & trust contrast v127.0, and Google delivery v128.2/v130.1.
- Inspection confirmed both v126.2 and v127.0 active wrappers attempted `res.setHeader(...)` inside their overridden `res.end`. A large streamed Home response could already have committed headers at that point, causing the function invocation to fail before v130.1 observability headers were emitted.

## Change

1. Add `final-presentation-stability-v131-runtime` as the active response boundary for the existing v126.2 and v127.0 visual modules.
2. Preserve the exact established CSS, JavaScript, asset paths, versions, injection order and desktop behaviour.
3. Set invariant desktop presentation headers before downstream rendering can commit a response.
4. Refuse to mutate HTML or headers after `headersSent` becomes true.
5. Pass committed streaming responses through byte-for-byte.
6. Return the unchanged downstream body if a presentation-only transform throws, with an explicit fallback header and structured runtime log.
7. Preserve dynamic v126/v127 CSS and JavaScript asset routes.
8. Expose `desktopHome`, `desktopTrust` and `googleDelivery` as separate private noindex Home assembly diagnostic boundaries.
9. Make the diagnostic endpoint itself pre-commit and streaming-safe.
10. Add a dedicated streaming regression covering buffered HTML, split streamed HTML, HEAD requests, asset routes, post-commit mutation blocking, fallback semantics and diagnostic-stage lineage.

## Explicitly unchanged

- product evidence, eligibility, suitability and recommendation logic;
- hard constraints, decision state and recommendation traces;
- affiliate relationships, retailer participation and recommendation weighting;
- Search, Compare, Decision Lab, Scout and My APG semantics;
- consent, analytics, authentication and privacy controls;
- canonicals, robots, sitemaps and JSON-LD;
- v126.2/v127.0 presentation CSS and JavaScript;
- v128.2 Home CSS bundle and v130.1 source-bound manifest; and
- agentic-browsing permissions.

## Required release gates

The candidate must remain unmerged until its frozen SHA passes:

- APG Release Gate, including v131 streaming and updated lineage diagnostics;
- CodeQL with no new material alert;
- Amazon Shopping Assurance;
- exact Vercel Preview source/deployment lineage;
- 16/16 representative browser routes;
- 3/3 agentic browsing;
- five mobile and five desktop Lighthouse runs meeting the maintained thresholds;
- Deals visual and Amazon link-integrity checks; and
- repeated preview Home and unique-query probes with zero HTTP 500 responses.

After merge, incident closure additionally requires:

- exact merged SHA equals exact Production deployment SHA;
- repeated canonical and unique-query Home probes across cold and warm rounds;
- HTTP 200 from `final`, `desktopHome`, `desktopTrust` and `googleDelivery` diagnostic stages;
- expected v126.2, v127.0, v131.0, v128.2 and v130.1 response headers;
- representative Production browser, accessibility and agentic verification;
- no new material Production function errors during the observation window; and
- reconciliation of Current State, Release Register, Change Log and Issue Register.
