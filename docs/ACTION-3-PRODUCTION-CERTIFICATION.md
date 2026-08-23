# Action 3 — Production Certification

Status: CERTIFIED / COMPLETE
Date: 2026-08-23

Action 3 Search Commerce v90.1 and its Production certification chain are complete.

The exact-SHA Production Verification gate passed against Git commit `2b211f4db3832a0fba9479e9dacccc61ee0d3cad` in GitHub Actions run `32627086503`.

The certified gate proved:

- Production HTTP contract;
- desktop and mobile Chromium critical journeys;
- GA consent, privacy and governed affiliate-event transport behaviour;
- desktop and mobile footer/navigation behaviour;
- desktop, mobile and tablet visual evidence;
- accessibility gate;
- final `APG Production Verification` GitHub commit status.

The certification sequence also resolved the remaining measurement-test issues without weakening APG's privacy or event-integrity requirements:

- PR #277 corrected the Production certification consent interaction and current consent-storage key;
- PR #278 prevented consented Google Analytics Enhanced Measurement from observing the raw Search `q` parameter by removing Search query/hash state immediately before GA loads;
- PR #279 extended the bounded affiliate-event transport observation window to accommodate normal GA batching latency;
- PR #280 corrected the certification parser to inspect newline-delimited batched `g/collect` payloads while preserving the requirement for exactly one `affiliate_click` and exactly one `amazon_shopping_click`.

The APG Operating Backend has been reconciled to GREEN and issue `APG-A3-002` is closed. Action 3 is therefore complete and the Action 4 gate is cleared.

This documentation update changes no consumer-facing recommendation, retailer, Search, ranking or affiliate logic.
