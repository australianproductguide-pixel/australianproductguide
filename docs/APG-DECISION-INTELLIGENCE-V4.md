# Australian Product Guide — Decision Intelligence v4

Status: **implemented foundation / governed release candidate**  
Date: 17 August 2026

## Purpose

Decision Intelligence v4 moves APG from fixed tag-led ranking toward a shared, explainable decision state. It remains deterministic where facts, constraints and scoring should be reproducible. It does **not** introduce ungoverned self-modification, new personal-data collection, paid model infrastructure or commission-weighted ranking.

## Versioned contracts

- Decision engine: `decision-engine-v4`
- Decision policy: `decision-policy-v4.0`
- Decision-state schema: `decision-state-v1`
- Search ranking: `search-ranking-v4`
- Product intelligence graph: `product-intelligence-v1`
- Intelligence quality: `intelligence-quality-v1`

## Implemented in v4

### Structured decision state

APG reconstructs a bounded state containing category, AUD budget and whether it is a hard ceiling, required capabilities, excluded capabilities, excluded brands, soft preferences with priority strength, category-specific numeric constraints, and existing category intent. Scout reuses that canonical state rather than concatenating an unlimited conversation transcript.

### Hard constraints versus preferences

Explicit maximum budgets and proven conflicts are eligibility rules, not small score penalties. A known product above an explicit maximum budget cannot be an eligible recommendation. If a required feature, current price or numeric fact is missing from maintained evidence, APG marks the product **unverified** rather than assuming either pass or fail.

### Explainable recommendation contract

The public response exposes why the leading option won, what held it back, what nearly won, when the answer could change, categorical confidence, hard-constraint state and Pareto-frontier alternatives. Raw internal score values remain private because they can create false precision.

### Category-aware decision signals

The existing maintained category model remains the base signal layer. v4 adds dynamic shopper weighting, structured TV screen-size and washing-machine capacity constraints, explicit feature/brand exclusions, hard required capabilities and AUD budget treatment. More category-specific structured attributes should be added as evidence depth grows.

### Search v4

Search keeps APG's lexical/model/category discovery and adds the v4 decision state as a reranking and eligibility layer. When every maintained candidate conflicts with a hard constraint, Search returns a transparent no-match state rather than repopulating the result set with conflicting products.

### Scout v4

Scout is now a governed client of the shared decision API. It keeps category, budget, hard requirements, excluded brands, soft priorities, numeric constraints and category intent as canonical state across refinements. New instructions are placed ahead of prior canonical state so the shopper's latest refinement wins. “Another $500” and “cheaper” can update the budget ceiling deterministically.

### Product intelligence graph

APG exposes on-demand product/category nodes with universal identity, maintained tags/specifications, contextual priorities, evidence/freshness, comparable products, cheaper/premium alternatives when maintained price permits, and explicit predecessor/successor links only when already recorded. v4 does **not** infer lifecycle claims from model names.

### Intelligence quality gate

The release gate checks representative Australian buying journeys, hard-budget enforcement, public constraint status and absence of affiliate/commercial fields from recommendation scoring. It emits a machine-readable quality snapshot for CI and Production inspection.

## Commercial separation

Product suitability and where-to-buy remain separate concerns. `commercialRecommendationWeight` is fixed at `0`. Retailer presence, affiliate status, ASINs and commission do not appear in v4 recommendation scoring.

## Controlled-learning boundary

This release provides versioned policy, structured state, evaluation and observable quality outputs. It deliberately does not persist new behavioural feedback or change weights automatically. A future learning loop must follow:

`observe → propose → offline evaluate → compare with baseline → approve → deploy → monitor → retain or roll back`

Any new behavioural/personalisation data collection requires a separate privacy/data review and explicit approval before activation.

## Known limitations

1. Maintained current price is incomplete across much of the catalogue, so some budget decisions remain explicitly unverified.
2. Structured specification depth varies materially by category.
3. Lifecycle/successor relationships are only used when explicitly recorded.
4. Search does not yet use embeddings or a learned semantic reranker.
5. Scout is a deterministic APG decision client, not yet a full LLM tool-orchestration agent.
6. The product graph is generated from current maintained data; it is not yet a separately curated graph store.
7. Current 75-inch TV coverage is insufficient for the target example, so APG must disclose the coverage gap rather than invent an exact model.

## Next intelligence release

Prioritise deeper structured attributes and exact Australian multi-retailer price evidence for the highest-intent categories, formalise a typed Scout tool contract, add a maintained benchmark set of difficult/adversarial decisions, and only then evaluate semantic retrieval or LLM orchestration where measured decision quality justifies cost and complexity.
