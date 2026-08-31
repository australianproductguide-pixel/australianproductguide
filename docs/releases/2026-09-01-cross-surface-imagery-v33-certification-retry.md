# Cross-Surface Product Imagery v33.1 — Production certification retry

Date: 2026-09-01 (Australia/Sydney)

Runtime implementation parent: `ce48dc6bced16a22396f26c18b5dc6d887e6e3f6`

This documentation-only commit retriggers the normal GitHub → Vercel → Production certification pipeline after the first Production build was safely blocked by an external Google Analytics Admin API HTTP 503 during `ACTION2_GOOGLE_CERTIFICATION_V89`.

No consumer-facing runtime, recommendation, product identity, retailer, affiliate, evidence, Search, Compare, Decision Lab, Scout, accessibility, SEO or product-image logic is changed by this file.

The Cross-Surface Product Imagery v33.1 implementation remains subject to all existing release gates. In particular:

- canonical product identity must be established before an exact image can be attached to a product representation;
- exact-model, provenance, freshness and recovery controls remain fail-closed;
- brand identity remains the fallback when an eligible exact product image is unavailable;
- retailer imagery remains excluded from canonical `Product.image` structured data;
- retailer participation, affiliate relationships and commission contribute zero recommendation points;
- Production is not certified GREEN unless the retriggered exact-SHA Production Verification completes successfully.

The failed Vercel deployment was `dpl_9MSvvr6qhmWRANjwj4zKx6VUAdA4`; its failure reason was external Google API unavailability, not an APG test regression.
