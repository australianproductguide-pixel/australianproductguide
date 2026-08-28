# APG eBay Partner Network Catalogue Integration v1.1

Status: RELEASE CANDIDATE — preview gates GREEN; requires main-branch merge, Production verification and operating-record reconciliation before LIVE classification.
Reviewed: 29 August 2026.

## Objective
Provide useful eBay Australia retailer choice across the maintained catalogue without pretending a search result or collection is an exact product listing. eBay participation contributes zero recommendation points. Product identity, lifecycle, Australian-market relevance, safety, official evidence and APG recommendation logic remain independent of affiliate availability.

## Current catalogue contract
APG maintains 482 products. The v1.1 eBay layer provides a governed model-specific eBay Australia search-result affiliate pathway for every maintained product that is eligible for a current Australian purchase pathway. Commerce now shares one fail-closed catalogue gate across Amazon, eBay and other retailer programmes.

Current release-candidate state:
- 470 model-specific eBay Australia product-search pathways;
- 11 resolved entity/market/lifecycle commerce exclusions;
- 0 unresolved entity cases at the final Action 4 v98 layer;
- 1 explicit safety/no-safe-purchase-path exception for recalled `anker-power-bank-20000mah-22-5w`;
- 6 separately governed refurbished collection/promotion discovery destinations;
- 0 exact eBay listing claims;
- 0 maintained eBay prices, stock claims, seller claims, condition-grade claims or warranty claims;
- 0 recommendation points from retailer participation or affiliate commission.

The 11 entity commerce exclusions are deliberate current-commerce exclusions, not an attempt to hide research gaps. Five are resolved non-Australian/regional-mismatch entities. Six are maintained historical/lifecycle records that remain useful for search/history but should not receive current Australian purchase pathways. The shared commerce gate overlays final Action 4 v98 onto v97 onto the older v96 ledger so corrected current-Australian identities can regain retailer choice while non-AU, historical and safety-suppressed records fail closed.

The model-search query for eligible products is generated from canonical APG brand + product name/model identity. Search-result linking was rechecked against eBay Partner Network guidance on 28 August 2026. Search-result pathways remain `exactModel=false` because APG has not verified an individual listing.

## Governed refurbished discovery destinations
The six owner-supplied eBay Australia EPN destinations remain: refurbished Sony, refurbished Samsung seasonal, refurbished HP, refurbished Dyson seasonal, refurbished laptops/netbooks, and refurbished tablets/eBook readers.

Tracking controls preserve: `campid=5339198634`, `mkrid=705-53470-19255-0`, `siteid=15`, `toolid=20014`, `mkcid=1`, `mkevt=1`, and a blank `customid` until a non-personal APG placement taxonomy is separately validated.

These six destinations are exposed as visible shopping-discovery cards on the APG homepage and Deals route. They are APG-native presentation using APG-generated iconography; no scraped eBay product imagery or fabricated eBay Creative Gallery asset is used.

## Consumer protection and pathway rules
- Product identity, lifecycle, Australian-market relevance and safety gate retailer eligibility first.
- Exact product > verified variant > product search > collection > availability unverified.
- Retailer ordering is deterministic and evidence-bound. Pathway specificity and verification freshness determine order; retailer participation and commission contribute zero points.
- Amazon is no longer hard-coded first. A stronger verified non-Amazon exact product pathway can outrank an Amazon or eBay search pathway.
- `Product search` and `Collection` are visibly distinct from `Exact product` and `Verified variant`.
- eBay search-result and collection pathways never imply an exact listing, live price, stock, seller, condition grade or warranty.
- Consumers are told to verify the exact model/variant, seller, condition, warranty, delivery, current price and availability at eBay before purchase.
- Any current non-AU, historical or safety-suppressed record receives no retailer rows after all retailer enrichment passes.
- eBay search or collection destinations must not be emitted as exact Product structured-data Offers.

## Renderer and disclosure
Eligible product pages render a model-specific CTA such as “Search eBay Australia for Sony WH-1000XM6” with `data-ebay-epn-pathway="product-search"`, an identity-query marker and `data-ebay-exact-model="false"`.

The nearby commercial disclosure is:

**Paid retailer links. APG may earn a commission from qualifying purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.**

The detailed Affiliate Disclosure retains the required Amazon Associate statement and covers eBay Partner Network product-search and collection pathways. Privacy disclosure covers affiliate attribution parameters and prohibits personal information in eBay custom tracking IDs.

## Visible shopping discovery
Homepage and `/deals/` must expose all six governed eBay refurbished/promotion cards under “eBay Australia shopping discovery”. The visible section must state that retailer pathways are separate from APG recommendations and that APG does not treat collection/promotion destinations as exact product listings.

No eBay logo or retailer imagery is presented as an authorised Creative Gallery asset in v1.1. A future official Creative Gallery asset may be added only when the exact authorised asset and provenance are retained.

## QA contract
Deployment QA must certify:
- 482 maintained products counted from canonical source;
- 470 model-specific eBay search pathways;
- 11 resolved entity/market/lifecycle exclusions, zero unresolved entity cases, plus one recall/no-safe-purchase-path safety exception;
- all exclusions fail closed across all retailer programmes after every retailer-enrichment pass;
- all required EPN tracking parameters;
- zero exact-listing/price/stock/seller/condition/warranty inference;
- zero recommendation weight;
- retailer-neutral deterministic ordering;
- representative product rendering across at least 12 distinct categories;
- no eBay commerce on non-AU, historical or safety-suppressed products;
- six visible eBay discovery cards on homepage and Deals;
- proximal commercial disclosure;
- sponsored/nofollow/noopener semantics;
- device-neutral SSR and established v112 responsive presentation;
- no scraped or unauthorised retailer imagery.

## Wider catalogue certification
This eBay v1.1 release does **not** itself certify that every maintained APG product has completed external manufacturer-source research, lifecycle/Australian-market validation, exact Amazon investigation or other-Australian-retailer research. Those remain part of the broader catalogue-wide product-evidence and multi-retailer certification programme and must continue to be measured product-by-product with explicit exceptions.

Current source QA records material evidence debt outside the eBay release. The Action 4 final depth gate reports 61 of 482 products at strong evidence depth and 421 below that threshold. Those figures are a source-level evidence-depth signal, not a claim that the remaining 421 products are invalid; they identify where APG needs deeper maintained decision evidence. Amazon exact-listing investigation and other-Australian-retailer certification also remain materially incomplete and must not be hidden by generic marketplace-search coverage.

## API Phase 2 — PLANNED
When approved eBay developer access is genuinely available, APG may progress from search/collection pathways to evidence-bound listing intelligence. Required fields include exact item/model identity, condition/refurbishment grade, seller/store, Australian delivery, current availability, price/currency, freshness timestamp and governed affiliate destination. Search and collection pathways remain honest fallbacks where exact listing evidence is unavailable.

## Release gates
Preview deployment `dpl_BPvMVGGD2JaGTneUsPECCoYPXU4p` reached READY with full build QA on the release candidate before the final documentation-only reconciliation commit. The final Production deployment must rerun the same source/build gates after merge with current `main`.

Before LIVE classification: Production must be reconciled to the exact merged main SHA and READY deployment; homepage, Deals, representative product pages, entity/lifecycle exclusion pages, recall safety page, Affiliate Disclosure and Privacy must be checked in public runtime; runtime errors must be checked; and APG Current State, Affiliate Register, Release Register, Vercel Release Register and Change Log must be reconciled.

Seasonal Samsung and Dyson destinations require near-term freshness review. eBay developer/API approval, listing-level verification and any authorised Creative Gallery asset provenance remain PLANNED rather than LIVE.
