# APG Search Console Depth Playbook

Status: CURRENT
Owner: Australian Product Guide
Effective: 2026-08-23

## Purpose

Use observed Google Search Console demand to improve existing Australian Product Guide decision pages before expanding catalogue breadth. Search demand is a prioritisation signal, never permission to create thin pages or lower APG evidence standards.

## Primary opportunity band

Prioritise canonical pages with an average Google position of **4–15** because they are already close to high-visibility results and usually offer the strongest near-term return from better evidence, intent alignment and internal linking.

Priority order:

1. Existing position 4–10 pages with meaningful impressions and a clearly matched buying/comparison intent.
2. Existing position 11–15 pages with meaningful impressions and strong decision intent.
3. Pages outside 4–15 only where a material factual, indexing, cannibalisation or consumer-quality issue requires correction.
4. New pages only after existing opportunity pages have been improved and the evidence gate below is met.

Do not optimise on average position alone. Review impressions, page/query relevance, current content quality, cannibalisation, device mix and whether the page genuinely answers the searcher's decision.

## Existing-page improvement sequence

For each priority page:

1. Verify the exact Australian product/model entities and canonical URL.
2. Verify current manufacturer/manual/support evidence for decision-critical facts.
3. Strengthen the page's actual decision value: who each product suits, meaningful differences, compromises, deal-breakers and what to verify before purchase.
4. Improve title/description only where they better describe the page; do not rewrite metadata merely to insert keywords.
5. Add relevant internal links between the product, category, buying guide, comparison hub and finder.
6. Check structured data, canonical, indexability, sitemap membership and redirects.
7. Confirm desktop/mobile rendered quality and no regressions.
8. Record the change date and compare subsequent Search Console performance over a sensible observation window.

## New comparison evidence gate

A new model-vs-model comparison may be created only when all of the following are true:

- both product identities and Australian variants are verified;
- the pair represents a real consumer choice, not merely two catalogue neighbours;
- there are decision-distinct differences or trade-offs worth explaining;
- APG has enough credible evidence to explain those differences without invented detail;
- the page can contain materially useful original decision guidance rather than a templated specification swap;
- the comparison does not create keyword cannibalisation with an existing canonical page;
- comparison-route governance caps remain satisfied;
- affiliate availability or commission contributes zero points to the decision to create or recommend the comparison.

No automated combinatorial pair generation is permitted from Search Console query strings.

## Query-pattern expansion rule

When a query pattern performs well, expand the **decision pattern**, not the wording. For example, evidence that exact model comparisons are understood by Google supports researching other genuinely useful exact-model comparisons. It does not justify manufacturing every possible `A vs B` permutation.

## Quality and trust controls

- APG remains desk-researched unless explicitly documented otherwise.
- Never imply hands-on testing that did not occur.
- Prefer exact Australian manufacturer, manual/support and retailer evidence.
- Preserve a ranking URL with a permanent redirect if a verified product-identity correction requires a canonical URL change.
- Do not expose private Search Console exports or unpublished commercial metrics in the public repository.
- Do not use fake freshness; substantive review dates change only after substantive verification.
- Do not make unsupported `best` or winner claims.

## Current application: Philips garment steamers

Search Console surfaced the Philips 3000-vs-5000 garment-steamer comparison as an early page-one opportunity. The follow-up evidence review identified that APG's legacy 5000-Series entity used `STH5030/80`, while the current Philips Australia product page identifies the Australian model as `STH5030/20`.

APG v85 therefore treats the correct response as **depth + entity correction + equity preservation**:

- verify and deepen the Australian `STH5030/20` entity from Philips Australia;
- retain the useful comparison architecture;
- move canonical product/comparison routes to the corrected model identity;
- permanently redirect the legacy `/80` URLs to the corrected `/20` URLs;
- keep the old routes out of indexable-route/sitemap generation;
- do not create additional garment-steamer comparisons solely because one query ranked well.

## Ongoing Search Console review

For each new Search Console export, create an internal opportunity list ranked broadly by:

`near-page-one position + meaningful impressions + decision intent + evidence readiness + strategic category value`

Then apply human editorial judgement. The score is a triage aid, not an automatic publishing system.
