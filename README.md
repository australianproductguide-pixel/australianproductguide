# Australian Product Guide

Authoritative source repository for the Australian Product Guide consumer website.

## Architecture

`main` -> Vercel Production. Vercel runs the reproducible static build and serves only `public/`; ordinary page requests do not depend on serverless rendering.

The build uses Vercel's `VERCEL_PROJECT_PRODUCTION_URL` to generate canonical URLs, structured-data URLs, `robots.txt`, and `sitemap.xml`. For local builds, set `SITE_ORIGIN` explicitly.

## Current maintained scope

- 48 category/service pathways
- 4 live comparison categories
- 37 maintained product records
- 137 intended canonical/indexable URLs
- search, filtering, comparison and four Help Me Choose journeys
- Amazon Australia Associates tag `auproductguid-22`, disclosed and excluded from recommendation scoring

## Build and QA

```bash
SITE_ORIGIN=https://example.com npm run build
```

The build runs site generation, SEO/trust optimisation, affiliate integration, link/semantic/accessibility/SEO audits, matcher tests, then exports the public site to `public/`.

## Governance

Australian Product Guide is operationally separate from other Venture Lab projects. Do not reuse unrelated project names, hosts or configuration here. Commercial relationships never change suitability scoring. Product coverage is desk-researched/specification-based unless explicitly stated otherwise.
