# APG eBay Partner Network Interim Integration v1

Status: RELEASE CANDIDATE — requires Vercel preview GREEN and Production verification before LIVE classification.
Reviewed: 28 August 2026.

## Objective
Add transparent eBay Australia retailer choice while developer/API access is pending, without treating affiliate participation as recommendation evidence and without pretending collection destinations are exact product listings.

## Governed interim destinations
APG currently governs six owner-supplied eBay Australia EPN destinations: refurbished Sony, refurbished Samsung seasonal, refurbished HP, refurbished Dyson seasonal, refurbished laptops/netbooks, and refurbished tablets/eBook readers.

Tracking controls preserve: `campid=5339198634`, `mkrid=705-53470-19255-0`, `siteid=15`, `toolid=20014`, `mkcid=1`, `mkevt=1`, and a blank `customid` until a non-personal APG placement taxonomy is separately validated.

## Consumer protection rules
- eBay interim destinations are collection/promotion pathways, not exact product offers.
- `exactModel=false`, price is not maintained, live stock is not claimed, and recommendation weight is zero.
- Consumers are told to verify exact model/variant, seller, condition, warranty, delivery and current price before purchase.
- Amazon remains the existing first retailer pathway where present; eBay is additive.
- Unrelated products must not receive an eBay collection CTA.
- eBay collection destinations must not be emitted as exact Product structured-data Offers.

## Renderer and disclosure
Relevant product pages use retailer-specific CTA wording such as “Browse refurbished Sony options on eBay Australia”. Proximal commercial disclosure is multi-retailer:

**Paid retailer links. APG may earn a commission from qualifying purchases. Retailer participation and commission do not influence product suitability, ranking or recommendations.**

The detailed Affiliate Disclosure retains the required Amazon Associate statement and adds eBay Partner Network disclosure. Privacy disclosure covers affiliate attribution parameters and prohibits personal information in eBay custom tracking IDs.

## Creative strategy
Only exact authorised eBay Partner Network Creative Gallery assets may be used, with provenance retained. Do not redraw eBay logos, scrape eBay imagery, fabricate product imagery, or place generic banners throughout core decision flows. Preferred future placement is restrained contextual Certified Refurbished/Tech discovery creative on relevant category surfaces. No Production creative asset is included in this release candidate.

## API Phase 2 — PLANNED
When eBay developer access is approved, APG may progress from collection pathways to evidence-bound listing intelligence. Required fields include exact item/model identity, condition/refurbishment grade, seller/store, Australian delivery, current availability, price/currency, freshness timestamp and governed affiliate destination. Existing collection pathways should remain fallback options where exact listing evidence is unavailable.

## Release gates
Before LIVE classification: deploy QA must pass; Sony, Samsung, HP, Dyson, generic laptop, generic tablet and unrelated-product controls must render correctly; desktop/mobile semantic and responsive contracts must remain coherent; EPN parameters must survive rendered output; proximal disclosure must be visible; exact/price/stock/warranty inference must remain absent; Production must be verified at the exact main SHA; and APG Current State, Release Register and Change Log must be reconciled.

Seasonal Samsung and Dyson destinations require near-term freshness review. eBay developer/API approval and authorised Creative Gallery asset provenance remain PLANNED rather than LIVE.
