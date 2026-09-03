# APG Home runtime availability hotfix v130.0

**Date:** 4 September 2026 (Australia/Sydney)  
**Classification:** Emergency Production availability candidate until exact merged-SHA verification is green  
**Incident:** Canonical Home returned repeated `FUNCTION_INVOCATION_FAILED` responses after v129.0, while the noindex full-assembly diagnostic and representative non-Home routes remained healthy.

## Evidence and isolation

- The exact Production deployment was READY at source SHA `799b95ad93c58ae83b21489278c2cabc9c0c3f5d`.
- Canonical `/` and unique query variants repeatedly returned HTTP 500 with Vercel function-invocation failure responses.
- `/api/home-assembly-diagnostic?target=runtime` returned 200.
- `/api/home-assembly-diagnostic?target=final` returned the complete assembled Home at 200.
- The diagnostic `final` stage bypasses only the desktop Home wrapper, desktop About & trust wrapper and v128 outer delivery wrapper.
- The two desktop wrappers are simple asset injectors. The v128 Home path uniquely opened and hashed the 544,660-byte generated CSS payload and caused the public function to package the full CSS tree.

## Change

1. Record the exact deterministic Home bundle metadata in a small source-controlled manifest.
2. Remove live `fs.readFileSync` and full-CSS SHA-256 work from the public Home request path.
3. Keep exact stylesheet-link signature validation; stale metadata still fails closed to the established stylesheet cascade.
4. Keep the generated bundle as a static Vercel filesystem asset.
5. Remove the full `public/assets/**/*.css` include from the public `api/index.js` function package.
6. Retain broad CSS packaging only for the private noindex Home assembly diagnostic.
7. Add a >500 KB repeated Home/query-variant stress regression and explicit infrastructure assertions.

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

The candidate must remain unmerged until its frozen SHA passes Release Gate, CodeQL, Vercel Preview lineage, representative browser/agentic certification, five-run mobile and desktop Lighthouse thresholds, Amazon link integrity and Deals visual assurance.

After merge, incident closure additionally requires:

- exact merged SHA equals exact Production deployment SHA;
- repeated canonical `/` and unique-query Home probes return 200 across cold/warm rounds;
- Home exposes the v128.2 and static-manifest verification headers;
- full Production browser/visual/accessibility certification passes;
- zero new Production function errors during the observation window; and
- Current State, Release Register, Change Log and Issue Register are reconciled.
