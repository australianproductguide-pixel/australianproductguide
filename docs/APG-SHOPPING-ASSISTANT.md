# APG Shopping Assistant v1

Status: CURRENT

Launch date: 2026-08-16

## Purpose

The APG Shopping Assistant is a lightweight conversational layer over APG's existing deterministic Decision Engine. It helps Australian shoppers move from a broad product need to an explainable shortlist without introducing a third-party generative-AI dependency.

## Current consumer flow

1. Shopper opens the floating **Ask APG** control.
2. Chooses or searches for a maintained APG category.
3. Selects a budget ceiling.
4. Selects a purchase priority.
5. APG calls its first-party `/api/decision` endpoint.
6. The assistant shows up to three fit suggestions with reasons and known gaps.
7. Shopper can open the product, compare the leading two suggestions, open the full category finder, or refine the decision in Decision Lab.

## Recommendation integrity

- Product matching is based on maintained APG catalogue data and the shopper's stated preferences.
- Affiliate relationships and commercial signals contribute zero recommendation points.
- Match labels describe fit to stated preferences, not hands-on product test scores.
- Starter-evidence products remain subject to deeper specification verification before stronger claims are made.
- A partial-word intent parsing defect discovered during launch QA was corrected so aliases such as `app` cannot be accidentally detected inside unrelated words such as `cappuccino`.

## Privacy and data flow

- No third-party AI model is called in v1.
- No external AI API cost is incurred by the assistant.
- Category search is performed client-side using APG's first-party search index.
- The decision request sends selected category, budget and priority terms to APG's own decision endpoint.
- V1 does not provide an unrestricted personal free-text chatbot input.

## Architecture

- `lib/assistant-platform.js` — progressive enhancement wrapper, assistant UI and first-party CSS/JS assets.
- `lib/decision-engine.js` — deterministic intent interpretation, matching and explainable result generation.
- `api/index.js` — production entry point, loading the assistant platform above the Google/canonical-domain layer.
- `/assets/assistant.css` — assistant presentation.
- `/assets/assistant.js` — client interaction logic.
- `/api/decision` — first-party recommendation endpoint.

The rest of APG remains server-rendered and fully usable if the assistant JavaScript is unavailable.

## Verified launch checks

- Production deployment READY on Vercel.
- Assistant launcher and panel injected into live `.au` HTML.
- Assistant CSS: HTTP 200.
- Assistant JavaScript: HTTP 200.
- Search index: HTTP 200 with maintained category records.
- Representative coffee-machine decision request: HTTP 200 with correct category/budget/milk intent and no false Apple signal.
- Production error/fatal runtime logs: none observed during launch verification.

## Planned evolution

Potential later phases, subject to evidence of consumer value and explicit privacy/cost review:

- natural-language free-text intent capture;
- more category-specific priority sets;
- richer follow-up questions and deal-breaker handling;
- session continuation through My APG;
- privacy-safe assistant usage analytics without recording shopper free text;
- optional generative-AI explanation layer only if it can remain grounded in APG evidence and preserve recommendation neutrality.
