# APG Google Product Discovery & Amazon-Compliant Acquisition v60

**Status:** CURRENT implementation contract from 22 August 2026, effective with the v60 release to `main` and Production verification.

## Objective

Maximise Australian Product Guide's legitimate visibility for high-intent Australian shopping searches while preserving APG's actual role as an independent editorial comparison and decision-support publisher rather than pretending APG is the merchant of record.

The target acquisition journey is:

`Google query -> substantive APG page -> comparison / recommendation / explanation -> deliberate retailer or Amazon Australia click -> retailer checkout`

Affiliate relationships, retailer availability and commission continue to contribute zero recommendation points.

## Current policy decision

### Google Merchant Center affiliate catalogue: DO NOT IMPLEMENT

Under the current APG business model, APG does not sell the maintained products or provide the product checkout. Google Merchant Center Shopping/free-listing requirements are built around products that can be purchased from the advertiser's own online store and restrict affiliate/pay-per-click product-link models outside applicable Comparison Shopping Service arrangements.

APG must therefore not create or submit its maintained affiliate catalogue as a Google Merchant Center product feed unless a future business-model or policy change is separately reviewed and approved.

### Google organic product discovery: IMPLEMENT

APG should use the Google surfaces that match its real editorial model:

- crawlable SSR product, category, comparison, finder and buying-guide pages;
- accurate canonical URLs and sitemaps;
- editorial Product/Review structured data on individual product decision pages;
- pros and cons derived only from maintained APG editorial content;
- BreadcrumbList structured data;
- descriptive, rights-cleared imagery where identity and rights are verified;
- strong category and semantic internal linking;
- Search Console measurement and indexation monitoring.

### Google Search Ads: CONTROLLED FUTURE OPTION

Ordinary paid search may be tested only after separate owner approval for spend and campaign launch. Any approved campaign must land on a substantive APG page first. It must not send or redirect the search user directly to Amazon Australia or another affiliate destination.

## v60 technical controls

APG already publishes one canonical `Product` entity and one `BreadcrumbList` on each maintained product decision page. The `google-product-discovery-v60` runtime enriches that existing canonical `Product` entity rather than creating a competing duplicate.

The final product-page structured-data architecture contains:

- the established canonical `Product` entity;
- the established `Brand` and APG identity fields;
- APG's maintained product/category/source identity enrichment;
- the established `BreadcrumbList` linking Home -> category -> product;
- a v60 APG-authored `Review` using Google's supported `Team` reviewer type;
- `positiveNotes` from the product's maintained highlights;
- `negativeNotes` from the product's maintained watch/trade-off content;
- exact product imagery only when the existing APG image-provenance gate verifies product identity, rights and the published image source;
- a maintained manufacturer model only when that model field exists in APG's evidence record.

The v60 enrichment deliberately does **not** introduce:

- `Offer`;
- price or priceCurrency;
- availability or stock;
- aggregateRating;
- reviewRating;
- fabricated customer reviews;
- guessed GTIN/model or retailer claims;
- category/editorial imagery presented as exact product photography;
- a second competing Product entity.

This keeps APG's structured data aligned with what the page and evidence base can actually support.

## Google Images controls

APG should maximise image discovery without weakening imagery governance.

Current approach:

1. category editorial imagery remains crawlable and can be used for category/social discovery where its provenance is maintained;
2. product pages do not claim an exact product image merely to improve search appearance;
3. exact product imagery can enter Product structured data automatically only after the existing product-image verification contract passes;
4. Amazon Program Content must not be repurposed as external Google advertising creative unless the applicable Amazon licence expressly permits that use;
5. image alt/caption context must describe what the image actually depicts rather than implying product testing or ownership.

## Amazon Associates acquisition controls

For Amazon Australia traffic, the compliant APG architecture is:

`Search result / ad -> APG editorial page -> deliberate user click on APG Special Link -> Amazon Australia`

Controls:

- never use an Amazon Special Link as the Google ad final URL;
- never use a thin APG bridge page or automatic redirect to Amazon;
- keep the APG page useful and substantive before the affiliate click;
- preserve the Amazon Associates disclosure and APG's broader commercial disclosure;
- keep recommendation scoring independent of commission and retailer economics;
- do not guess ASINs or variants;
- do not copy or scrape Amazon price, availability or imagery outside the permissions of the applicable Associates/API licence.

## Paid-search guardrails if later approved

No paid campaign is authorised by this v60 workstream. If the owner later approves a controlled test:

- final URLs must be canonical `australianproductguide.au` editorial pages;
- target generic, high-intent buying needs and comparison queries;
- exclude Amazon proprietary/trademark terms and relevant variants/misspellings as negative keywords where required;
- do not describe APG as Amazon, an Amazon store, an authorised Amazon representative or the seller;
- do not use Amazon-supplied Program Content as external ad creative unless independently permitted;
- preserve truthful claims about desk research, prices, availability and testing status;
- start with a small measured test and stop if acquisition cost is not supported by attributable downstream value.

## Measurement framework

Use the existing Google Search Console and GA4 infrastructure rather than creating another analytics stack.

Organic measures:

- indexed product/category/guide pages;
- eligible/impression-bearing rich-result surfaces where reported;
- non-brand shopping-intent impressions;
- organic clicks and CTR by query/page;
- Google Images impressions/clicks where available;
- organic landing-page engagement;
- APG comparison/Decision Lab usage;
- outbound retailer/Amazon CTA clicks, subject to APG's privacy and consent controls.

Any future paid-search test should additionally measure CPC, landing-page engagement, deliberate affiliate outbound rate and attributable commercial return. Paid media must not be scaled on click volume alone.

## Release and QA gates

The v60 release must fail if product structured data introduces merchant or unsupported commerce/rating fields. QA covers all 482 maintained product records and verifies:

- enrichment of the existing canonical Product entity rather than duplicate Product creation;
- APG's Google-supported `Team` review authorship;
- at least two maintained pros/cons statements for Google's editorial pros/cons treatment;
- preservation of canonical product identity, category and primary-source fields;
- preservation of the established BreadcrumbList without duplication;
- rights-gated product imagery;
- absence of `Offer`, price, availability, aggregateRating and reviewRating;
- idempotent runtime injection;
- no Product-schema leakage onto category pages, which retain the established CollectionPage architecture.

Production closure requires GitHub `main`, the Vercel Production deployment and rendered canonical pages to reconcile.

## Policy monitoring

Amazon Associates and Google discovery/advertising rules are volatile controls, not permanent assumptions. APG should periodically re-check official first-party policies and notify the owner when a material change affects:

- Merchant Center eligibility;
- Google product structured-data requirements;
- paid-search landing-page rules;
- Amazon paid/boosted traffic attribution;
- Special Link routing;
- Amazon trademark bidding restrictions;
- Program Content / imagery use;
- price and availability display;
- affiliate disclosure requirements.

## Official policy baseline reviewed 22 August 2026

- Amazon Australia Associates Program policies: https://affiliate-program.amazon.com.au/help/operating/policies
- Google Merchant Center affiliate / purchase requirements: https://support.google.com/merchants/answer/12756116
- Google Merchant Center online-store purchase requirements: https://support.google.com/merchants/answer/10249082
- Google Search Product snippet structured data: https://developers.google.com/search/docs/appearance/structured-data/product-snippet

If these sources or APG's business model change materially, re-perform the policy analysis before changing acquisition architecture.
