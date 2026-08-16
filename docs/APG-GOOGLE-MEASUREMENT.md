# Australian Product Guide — Google measurement and search setup

Status date: 2026-08-16

## Production identity

Planned primary public domain: `https://australianproductguide.au`

Current Vercel project: `au-product-guide`

Authoritative source: GitHub `main`

The custom `.au` domain has been registered in Vercel and must be attached to the existing `au-product-guide` project before canonical cutover.

## Google Analytics 4

Measurement ID: `G-PV16VQTVY4`

Implementation: `lib/google-platform.js`, loaded globally through `api/index.js`.

Privacy-minimised configuration:

- GA4 enabled globally on HTML pages.
- Google Signals disabled.
- Advertising personalisation signals disabled.
- Advertising consent types denied.
- Analytics storage enabled.
- GA page-location value uses origin + pathname only, excluding query strings from the configured page location.
- Google Analytics domains are explicitly allowed by Content Security Policy.
- Analytics data contributes zero points to APG product suitability or affiliate rankings.

## Google Search Console

HTML verification route:

`/google2e35d1ac089ebb56.html`

Expected response body:

`google-site-verification: google2e35d1ac089ebb56.html`

After the `.au` custom domain is attached and live, verify the new production property in Google Search Console and submit:

`https://australianproductguide.au/sitemap.xml`

## Domain migration controls

Before making `australianproductguide.au` canonical:

1. Attach the registered domain to the existing `au-product-guide` Vercel project.
2. Confirm HTTPS and DNS propagation.
3. Verify homepage, robots.txt, sitemap.xml, Search Console verification route and GA4 tag on the `.au` host.
4. Update canonical host behaviour and permanently redirect public Vercel production aliases to the `.au` domain.
5. Re-run Production smoke and SEO/trust-route checks.

Do not claim Search Console ownership or GA4 collection as verified until public runtime checks pass.
