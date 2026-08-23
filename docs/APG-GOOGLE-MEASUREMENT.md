# Australian Product Guide — search and measurement setup

Status date: 2026-08-23

## Production identity

Primary public domain: `https://australianproductguide.au`

Current Vercel project: `au-product-guide`

Authoritative source: GitHub `main`

## Current verified status

Production verification on 23 August 2026 established:

- Google Search Console integration: **connected**. The private Google integration can access one Search Console site and is configured for `sc-domain:australianproductguide.au`.
- Google Analytics 4 integration: **connected**. The private Google integration can access one GA4 property.
- Google authentication: **keyless**, using Vercel OIDC, Google Workload Identity Federation and service-account impersonation. No long-lived Google service-account private key is required by the APG runtime.
- Canonical robots and sitemap surfaces: **live**. `robots.txt`, `sitemap.xml` and `sitemap-index.xml` are available on the canonical domain; Search, custom comparison, My APG and API routes that should not be indexed are excluded appropriately.
- IndexNow: **implemented and initial production submission evidenced**. The canonical verification key is live at `/apg-20260819-discoverability-v1.txt`. Vercel runtime evidence from 19 August 2026 records HTTP 200 from the approved one-time IndexNow release executor; that executor returned 200 only after an external IndexNow 200/202 acceptance response. Ongoing outbound submission remains deliberately explicit-confirmation gated.
- Bing Webmaster Tools account ownership/import: **not yet evidenced**. APG is technically Bing-ready through canonical crawl controls, sitemaps and IndexNow, but no Bing console session, imported site ownership or genuine Bing verification token has been verified from the available APG systems. Do not fabricate an `msvalidate.01` token. Preferred completion path is to import the verified Google Search Console property into Bing Webmaster Tools, then confirm the canonical sitemap there.

## Google Analytics 4

Measurement ID: `G-PV16VQTVY4`

Implementation: `lib/google-platform.js`, with consumer privacy controls layered through `lib/privacy-experience.js` and the consent-safe funnel guard in `lib/analytics-funnel-v79.js`.

Privacy-minimised configuration:

- GA4 is **opt-in**. `analytics_storage` is denied by default and the Google Analytics library is not loaded until the visitor allows analytics.
- The v79 consent guard prevents GA event/config calls from being queued before analytics consent and blocks later event sending again if consent is withdrawn. Google Consent Mode commands remain available so the consent state itself can be applied correctly.
- Essential APG browsing, search, comparison, recommendation, local workspace and requested account-session functionality remain available without analytics consent.
- Google Signals disabled.
- Advertising storage, advertising user-data and advertising personalisation consent remain denied.
- Advertising personalisation signals disabled.
- GA page-location value uses origin + pathname only, excluding query strings from the configured page location.
- Visitors can choose `Allow analytics`, `Necessary only`, or manage the analytics choice, and can reopen `Cookie preferences` from the site footer.
- The consent preference is versioned and stored in first-party browser storage so the choice persists; withdrawing analytics removes APG-accessible `_ga*` cookies and updates Google Consent Mode to denied.
- Analytics data contributes zero points to APG product suitability or affiliate rankings.

### Privacy-minimised decision funnel events

After analytics consent only, APG can record a narrow event taxonomy covering decision usefulness rather than sensitive user content:

- `site_search` and `site_search_suggestion`;
- `product_view`;
- `comparison_view`, `comparison_started`, `comparison_product_added`, `comparison_product_removed`, `comparison_opened`;
- `decision_lab_view` and `decision_lab_submitted`;
- `finder_view` and `finder_submitted`;
- `product_saved` and `product_unsaved`;
- existing governed Amazon events such as `affiliate_click` and `amazon_shopping_click`;
- existing Scout interaction events where already implemented.

The v79 funnel layer does **not** send typed search terms, Decision Lab descriptions, Scout message text, account identifiers or raw URL query strings. Safe dimensions may include page/surface type, device bucket, product slug, category, comparison selection count and the existing non-sensitive affiliate context fields.

Production source/runtime checks verify the GA tag, consent configuration and event layer are deployed. An interactive browser session with analytics consent plus GA4 Realtime/DebugView should still be used when a console-level event-arrival proof is specifically required; source/runtime deployment alone is not represented as a Realtime receipt confirmation.

## Optional account invitation

APG remains local-first and an account is not required for core shopping journeys. A separate account invitation may appear only after a privacy choice has been made and the visitor has had time to use the site.

Current invitation behaviour:

- after approximately 90 seconds on the site, or from the third page view, whichever threshold is reached first;
- never on the My APG, Privacy or Terms pages;
- suppressed for authenticated users;
- dismissible, with a 30-day suppression period;
- no automatic marketing subscription;
- directs to the existing optional My APG account flow for cross-device research sync.

## Google Search Console

Configured canonical property:

`sc-domain:australianproductguide.au`

The Production Google Growth health endpoint confirms one Search Console property is accessible through APG's keyless Google integration.

Secondary HTML verification route:

`/google2e35d1ac089ebb56.html`

Expected exact response body:

`google-site-verification: google2e35d1ac089ebb56.html`

`lib/search-platform-verification-v80.js` keeps this canonical response byte-clean so presentation/social layers cannot decorate the verification content.

Production sitemap surfaces:

- `https://australianproductguide.au/sitemap.xml`
- `https://australianproductguide.au/sitemap-index.xml`

Normal deployment QA now includes Discoverability v1, IndexNow key/entity checks and the search-platform verification contract so these surfaces cannot silently regress without failing the release.

## Bing Webmaster Tools and IndexNow

### Current

Bing-facing technical readiness is strong:

- `bingbot` is explicitly allowed to crawl public APG content in `robots.txt` while private/non-indexable surfaces remain excluded;
- canonical APG sitemaps are publicly available;
- IndexNow verification is live;
- an initial approved IndexNow submission is evidenced as accepted;
- ongoing IndexNow execution remains governed rather than mass-submitting unchanged URLs.

### Remaining external console step

Bing Webmaster Tools ownership itself is not evidenced from the available connected systems. Complete it only through a genuine Bing account flow. Preferred path:

1. sign in to Bing Webmaster Tools with the intended APG operating account;
2. choose **Import from Google Search Console**;
3. import `australianproductguide.au`;
4. confirm the canonical sitemap/index is recognised;
5. record the resulting property/profile evidence in the APG footprint register.

Do not guess or fabricate Bing verification tokens.

## Release controls

For material changes to analytics, advertising, account data collection or third-party tracking:

1. review the collection purpose, necessity, disclosures and consent/choice model;
2. update the Privacy Policy and relevant consumer notice before activation;
3. preserve APG recommendation and retailer-ranking neutrality;
4. verify Content Security Policy and third-party endpoints;
5. verify the public Production runtime, including default consent state and preference controls;
6. re-run Production smoke, search-discoverability and SEO/trust-route checks.

Do not activate remarketing, advertising pixels, cross-site tracking or materially broader personalisation without a fresh privacy and governance review.
