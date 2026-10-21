# APG P0 Home bundle packaging recovery — v128.2

**Status:** RELEASE CANDIDATE — Production closure pending  
**Date:** 3 September 2026  
**Incident:** canonical Production Home returned `FUNCTION_INVOCATION_FAILED` after the otherwise certified v128.2 merge  
**Unaffected scope observed:** representative non-Home routes continued to return valid responses

## Cause and containment

The v128.2 Home delivery layer reads `public/assets/home-v128-bundle.css` from the deployed function package. Vercel generated the bundle during the build, but the path did not exist in Git source and was therefore not reliably traced into the Home function package.

This release candidate:

1. adds the deterministic Home CSS bundle to Git source so the existing Vercel `includeFiles` rule can package the final build artefact reliably;
2. preserves the existing build-time regeneration, signature verification and fail-closed fallback to the established stylesheet cascade;
3. aligns the premium-experience source QA with the current `/assets/home-v128-bundle.css` delivery path rather than the superseded v113 path; and
4. changes no product evidence, eligibility, recommendations, retailer weighting, privacy controls, structured data, robots, sitemap, account semantics or agentic-browsing permissions.

## Materialisation evidence

The bundle was generated twice in one clean Node 24 GitHub runner and both outputs were required to be byte-for-byte identical. The accepted artefact was verified as:

- 544,660 bytes;
- 53 source stylesheets;
- stylesheet-link signature `69378df1a5f50c8965113dbfc040eb32cc4ba692be83aa460ed7ad4ab3a8d63e`;
- required Home, header, eBay and Scout selectors present; and
- temporary materialisation workflow removed before release review.

## Mandatory closure gates

The incident is not closed until the exact candidate SHA has:

- passed Release Gate, CodeQL and Amazon/Deals assurance;
- reconciled to a READY Vercel Preview deployment;
- passed representative browser journeys, 3/3 agentic browsing and repeated Lighthouse thresholds;
- merged through the normal GitHub → Vercel pipeline; and
- returned HTTP 200 from canonical Production Home with the v128.2 runtime marker, Home-bundle marker and immutable bundle asset verified.

A READY deployment alone is not GREEN certification.
