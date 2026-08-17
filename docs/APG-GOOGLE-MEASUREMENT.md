# Australian Product Guide — Google measurement and search setup

Status date: 2026-08-17

## Production identity

Primary public domain: `https://australianproductguide.au`

Current Vercel project: `au-product-guide`

Authoritative source: GitHub `main`

## Google Analytics 4

Measurement ID: `G-PV16VQTVY4`

Implementation: `lib/google-platform.js`, with consumer privacy controls layered through `lib/privacy-experience.js`.

Privacy-minimised configuration:

- GA4 is **opt-in**. `analytics_storage` is denied by default and the Google Analytics library is not loaded until the visitor allows analytics.
- Essential APG browsing, search, comparison, recommendation, local workspace and requested account-session functionality remain available without analytics consent.
- Google Signals disabled.
- Advertising storage, advertising user-data and advertising personalisation consent remain denied.
- Advertising personalisation signals disabled.
- GA page-location value uses origin + pathname only, excluding query strings from the configured page location.
- Visitors can choose `Allow analytics`, `Necessary only`, or manage the analytics choice, and can reopen `Cookie preferences` from the site footer.
- The consent preference is versioned and stored in first-party browser storage so the choice persists; withdrawing analytics removes APG-accessible `_ga*` cookies and updates Google Consent Mode to denied.
- Analytics data contributes zero points to APG product suitability or affiliate rankings.

The consent design is intentionally privacy-forward for Australian shoppers. It supports clear, timely notice and choice around analytics collection without presenting core APG functionality as conditional on accepting analytics.

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

HTML verification route:

`/google2e35d1ac089ebb56.html`

Expected response body:

`google-site-verification: google2e35d1ac089ebb56.html`

Production sitemap:

`https://australianproductguide.au/sitemap.xml`

## Release controls

For material changes to analytics, advertising, account data collection or third-party tracking:

1. review the collection purpose, necessity, disclosures and consent/choice model;
2. update the Privacy Policy and relevant consumer notice before activation;
3. preserve APG recommendation and retailer-ranking neutrality;
4. verify Content Security Policy and third-party endpoints;
5. verify the public Production runtime, including default consent state and preference controls;
6. re-run Production smoke and SEO/trust-route checks.

Do not activate remarketing, advertising pixels, cross-site tracking or materially broader personalisation without a fresh privacy and governance review.
