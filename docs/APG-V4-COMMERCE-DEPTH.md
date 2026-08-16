# APG Evidence & Retailer Depth v4

Status: IMPLEMENTING / NOT YET PRODUCTION
Date: 2026-08-16

## Objective
Deepen APG evidence, retailer precision, lawful product imagery, optional account sync and measurable real-world performance without weakening recommendation independence.

## Amazon product content
- Do not scrape Amazon HTML, image assets or product-data pages.
- Use exact individual Amazon Australia product identifiers only after model/variant identity is independently verified.
- Use Amazon Creators API (or another currently authorised Associates product-data mechanism) for Amazon Product Advertising Content, including image URLs.
- Treat API-supplied Amazon image URLs as volatile content; do not permanently copy Amazon-hosted imagery into APG.
- Recommendation score contribution from affiliate availability remains 0.
- Price-history or price-alert functionality for Amazon must not be activated unless the applicable Amazon programme terms and permissions allow APG's intended use.

## Imagery state
Current genuine third-party product photography remains unavailable until authorised API content is connected. APG-owned decision illustrations remain the fallback. The application CSP is prepared to display authorised Amazon media URLs when an exact matching product record is populated.

## Retailer depth
Target state per product:
1. exact product identity verified against a manufacturer/primary source;
2. exact Australian Amazon listing where independently verified;
3. at least one non-Amazon Australian retailer where a credible exact local listing exists;
4. dated availability/price observation kept separate from stable product facts;
5. no retailer commission weight in ranking.

## Live commerce data
APG should store observations, not overwrite stable facts. Each observation should record retailer, product, observed URL, observed price/availability if supported, observation time, source mechanism and confidence. Volatile observations must carry expiry/recheck logic before consumer display.

## Accounts
My APG remains usable without login. Optional Supabase-backed sync stores only authenticated-user workspace records and preferences. RLS enforces per-user ownership. Self-service account deletion deletes the authenticated user and cascades synced workspace rows.

## Measurement
Synthetic QA remains a release gate. Real-world optimisation should additionally use Search Console, privacy-appropriate analytics and field Core Web Vitals once those services are explicitly connected and configured. Synthetic tests must not be presented as real-user performance.

## Governance
- GitHub main should be protected by required PR checks once repository ruleset/branch-protection mutation is available.
- Existing broad Google Drive link sharing should be tightened when permission-removal tooling or manual admin access is available.
- Neither governance item should be represented as complete until independently verified.
