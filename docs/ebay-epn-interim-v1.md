# APG — eBay Partner Network interim integration v1

Status: PLANNED FOR REVIEW / NOT YET MERGED TO MAIN
Date: 28 August 2026
Branch: `feat/ebay-epn-interim-v1`

## Objective

Add eBay Australia as a useful second affiliate retailer pathway while eBay developer API access is pending, without weakening APG product identity, recommendation independence or retailer evidence standards.

## Current interim scope

Six owner-supplied EPN destinations are governed in `data/ebay-epn-interim-v1.js` under campaign ID `5339198634`:

- Sony refurbished collection
- Samsung refurbished seasonal promotion
- HP refurbished collection
- Dyson refurbished seasonal promotion
- refurbished laptops collection
- refurbished tablets collection

These destinations are collection/promotion pathways only. They are not exact product listings.

## Consumer presentation rules

1. eBay participation and commission contribute zero recommendation points.
2. Never describe a collection/promotion URL as an exact model match.
3. APG does not publish an interim eBay price, stock claim, seller claim, condition grade or warranty claim.
4. CTA wording should use `Browse refurbished ... on eBay Australia`, not `Buy this product`, unless listing-level identity is later verified.
5. Consumers must confirm model/variant, condition, seller, warranty, delivery and current price at eBay.
6. Samsung and Dyson seasonal URLs are volatile and require a shorter review window.
7. Brand-specific destinations take precedence over generic laptop/tablet collections to avoid duplicate eBay CTAs on one product.

## Creative strategy

Use eBay Partner Network Creative Gallery material only when the exact authorised asset is available and its usage terms are confirmed. Do not redraw the eBay logo, fabricate product imagery or scrape eBay creative.

Preferred placements, in order:

1. A restrained Certified Refurbished/value module on relevant category or refurbished-shopping discovery surfaces.
2. Contextual technology creative on laptop/tablet discovery pages where it adds useful navigation rather than generic advertising.
3. Brand refurbished creative only when the campaign remains live and the destination matches the page context.

Avoid generic banners in the APG global header, Decision Lab, Scout conversation flow or every product page. Retailer creative should support the decision journey rather than dominate it.

Creative asset status: `ASSET_PENDING`. No production banner should render until an authorised Creative Gallery asset has been added with provenance.

## Tracking

The six supplied links retain:

- `mkcid=1`
- `mkrid=705-53470-19255-0`
- `siteid=15`
- `campid=5339198634`
- `toolid=20014`
- `mkevt=1`

`customid` remains intentionally blank in v1. APG should introduce placement-level Custom IDs only after the desired EPN reporting taxonomy has been verified in the account, avoiding personal data in tracking values.

## Phase 2 — eBay API

Once developer access is approved, replace broad collection dependence with an evidence-governed eBay data adapter capable of validating, where permitted and available:

- exact item/model identity;
- condition and refurbished grade;
- seller/store identity;
- Australian delivery eligibility;
- current availability;
- current price and currency;
- listing freshness;
- item URL and affiliate attribution.

API-derived data must remain provenance-controlled and must not affect APG recommendation ranking through commission or retailer participation.

## Release gate

Before merge/deployment:

- run existing APG deploy QA including `scripts/ebay-epn-interim-v1-qa.js`;
- verify at least representative Sony, Samsung, HP, Dyson, laptop and tablet product pages visually;
- verify unrelated products do not receive an eBay CTA;
- verify all eBay CTAs retain the supplied EPN campaign parameters;
- confirm affiliate disclosure wording remains clear and proximal to paid retailer links;
- confirm no exact-model, price, stock or warranty claim is inferred from a collection URL;
- reconcile APG Current State / Release Register / Change Log if released.
