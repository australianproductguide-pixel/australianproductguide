# APG Brand Fidelity v32.5.2 — semantic mobile reconciliation

**Date:** 18 August 2026  
**Outer presentation layer:** Brand Conformity v34  
**Status:** Release candidate until exact Production certification succeeds.

This correction exists because manual review of the exact v32.5.1 Production tablet/mobile screenshot artefact identified a residual duplicate **Decision Lab** link above the approved primary Decision Lab and Ask Scout controls. The earlier focused gate counted unclassified `.mobile-power` elements only, while the residual legacy item was a separate anchor to `/decision-lab/` with a different class.

v32.5.2 changes the acceptance boundary from a CSS class to the consumer-facing semantic destination. Within the mobile navigation there may be exactly one `/decision-lab/` destination in total and it must be the approved primary control. The server-rendered transform removes every other mobile-nav Decision Lab anchor regardless of legacy class; CSS hides any later direct duplicate; and bounded client reconciliation removes any later semantic duplicate without MutationObserver.

The intended visible mobile hierarchy is:

1. Decision Lab — primary APG Blue action.
2. Ask Scout — differentiated light-blue secondary action.
3. Popular products.
4. Research & compare.
5. Trust & transparency.

The focused exact-Production certification counts **all** top-level mobile-nav anchors to `/decision-lab/`, not merely `.mobile-power` controls. It requires exactly one total and one visible destination, checks the Decision Lab → Ask Scout → accordion vertical order using rendered rectangles, rejects visible unclassified power actions, checks document width, and captures separate tablet and mobile screenshots for manual review.

v32.5.2 remains an upstream fidelity layer beneath Brand Conformity v34. It does not change catalogue data, product suitability, retailer ranking, affiliate weighting, Scout decision logic, accounts/authentication, analytics consent or privacy controls. The current v34 whole-site palette normalisation remains intact.

Completion requires the final merged GitHub `main` SHA to be the exact Vercel Production SHA, successful legacy and v34 visual certifications plus **APG v32.5.2 Mobile Visual Certification**, manual review of the final tablet/mobile screenshots, and a clear post-release Vercel error/fatal log window.
