# APG Action 7 — Scout + Decision Lab shared intelligence

**Current Action 7 runtime:** v101.4  
**Scout:** v5 (preserved; not rebuilt)  
**Decision Engine:** v4  
**Decision Lab:** v50.6  
**Action 4 category schema:** category-decision-schema-v2

## Purpose

Scout is APG's conversational decision interface. Decision Lab is APG's structured decision interface. Both use the same maintained product entities, Decision Engine, Action 4 decision evidence and Action 5 retailer truth. Action 7 adds orchestration, state continuity, central platform facts, uncertainty handling and cross-surface handoff; it does not introduce a second recommendation engine or a paid model dependency.

## Inputs

Scout accepts the current user turn plus bounded page context, current-session structured decision state, canonical product references and authenticated account context when available. Raw conversation history is not treated as permanent profile data.

## Structured decision state

The v4-compatible state is extended without introducing a parallel store. It retains category, budget, hard required/excluded tags, excluded or required brands, soft preferences, soft exclusions, numeric constraints, category intent and brand preference. Action 7 additionally carries a bounded shortlist, rejected products, evidence gaps, a pending high-information question and the latest recommendation trace.

Hard constraints, soft preferences, exclusions and priorities remain distinct. Explicit reversals such as removing a budget or re-allowing a brand reconcile the existing state rather than silently retaining obsolete constraints. Shortlists and evidence-gap arrays are bounded to avoid uncontrolled context growth.

## Retrieval and recommendation

Scout does not independently score products. Product decision requests are normalised into the shared structured state and resolved through the existing Decision Engine. Candidate ranking remains governed by maintained APG product data and Action 4's evidence-aware scoring patches. Retailer participation and affiliate status contribute zero recommendation weight.

The engine returns the shortlist and recommendation trace. Scout explains that trace conversationally, including the active requirements, supported reasons, evidence limitations and what nearly won where available. If the saved trace is absent on a follow-up, Action 7 deterministically reconstructs it from the existing structured state through the same Decision Engine rather than inventing an explanation.

## Category-aware questions

For migrated Action 4 categories, Scout selects unresolved decision criteria from the central category schema. It asks one high-information question when the brief is materially under-specified and stops asking once the decision is sufficiently constrained. The question layer therefore inherits maintained criteria rather than maintaining a separate chatbot questionnaire.

## Evidence and confidence

Action 7 uses five conversational evidence states:

- `KNOWN` — relevant maintained evidence is verified.
- `INFERRED` — the conclusion is an approved rule-derived interpretation of maintained facts.
- `WEAK_EVIDENCE` — some relevant evidence is verified but one or more material requested criteria remain weak or unverified.
- `UNAVAILABLE` — no approved verified evidence path exists for the material requested criterion.
- `CONFLICTING` — credible maintained evidence conflicts or source observations materially differ.

Unknown evidence is never converted into a neutral or positive score merely to produce a cleaner answer. Where Action 4 does not approve a criterion for ranking, Scout may discuss the limitation but does not create a hidden score.

## Retailer actions

Scout consumes the authoritative Amazon Australia mapping record. `EXACT_VERIFIED` produces **View on Amazon Australia**. `VARIANT_VERIFIED` uses controlled verified-variant wording. `SEARCH_FALLBACK` produces **Search this model on Amazon Australia**. Recalled/no-safe-path records expose no purchase action. Scout never constructs an ASIN itself.

The recommendation sequence remains fit first, explanation/trade-off second, retailer action last. High-intent exact-product requests may bypass unnecessary decision questions when the canonical product and safe retailer destination are already resolved.

## Platform facts

`platform-facts-v101` centralises Scout lookups for site routes, current Trust/policy content, social profiles and account capabilities. Trust routes derive from the central route registry, social destinations from the current social-profile registry, and methodology/affiliate/privacy/account answers from authoritative published content. Scout does not maintain an independent social list or guessed policy routes.

## Account and privacy boundary

Account-sensitive tools remain server-authorised. Canonical APG product identifiers, not raw retailer URLs, are used for saved-product actions. Supabase workspace policies enforce authenticated ownership with RLS. Display-name use remains optional and depends on intentionally available authenticated profile data. Action 7 does not add permanent raw-chat storage, inferred sensitive profiling or raw Scout text to analytics.

## Cross-surface handoff

Scout → Decision Lab transfers the resolved structured decision state through supported Decision Lab fields, not the raw conversation. Decision Lab → Scout exposes an **Ask Scout about these results** action so the user can continue with the resolved decision context. Comparison actions use canonical APG product slugs.

## Measurement

Action 7 inherits the existing Action 2 measurement contract. Aggregate Scout/Decision Lab interaction and retailer-click origin may be measured using non-sensitive structured fields. Raw conversation text is excluded. No parallel analytics scheme is introduced.

## Fallback

The core decision flow remains deterministic and does not depend on an external frontier model. If an optional future reasoning layer is unavailable, APG can still provide Search, Decision Lab, maintained shortlists, comparison, product guides and safe retailer actions. Any future recurring paid model escalation requires benchmark evidence and explicit approval.

## Evaluation

`action7-scout-evaluation-v101` contains the durable 28-scenario fixture catalogue. Release QA includes a paired same-scenario before/after benchmark, the 20-test core state/retailer/platform suite, expanded physical/compatibility/cross-surface checks, and the v101.4 five-way evidence-state certification. Correctness, hard-constraint compliance and evidence integrity outrank fluency.

## Cost architecture

Current Action 7 has no new paid external model dependency and no new recurring paid service. It reuses the existing APG Vercel project, server runtime, product data, Decision Engine, Action 4 evidence and Action 5 retailer mappings. Context is bounded and stable platform facts are served from structured current sources.

## Governance

Improvement remains controlled: observe failure → propose/remediate → benchmark → review → deploy → verify. Live user conversations do not autonomously rewrite category criteria, recommendation rules, product truth, retailer mappings or system instructions.