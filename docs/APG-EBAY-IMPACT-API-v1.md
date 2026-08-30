# APG eBay Partner Network / impact.com API v1

Status: **PLANNED / CODE PREPARED — NOT PRODUCTION-CERTIFIED**

Date: 2026-08-30

## Purpose

This integration gives Australian Product Guide a governed server-side connection to the eBay Partner Network account hosted on impact.com. It is intended to support:

- eBay program/campaign metadata;
- ads and approved creative assets;
- product catalogs and catalog-item candidate data;
- product image URLs supplied in catalog data;
- additional image URLs supplied in catalog data;
- GTIN, MPN, manufacturer, condition, price and stock fields when supplied;
- deals and promotions;
- reporting and click exports; and
- creation of eBay Australia deep tracking links.

It **does not** replace the separate eBay Buy Browse API workstream for live eBay Australia listings, listing imagery, prices, seller data and availability.

## Security state

The first production Auth Token was disclosed in a conversation while setup was being completed. It must therefore be treated as exposed and **must be reset before any production use**.

Do not store any Account SID or Auth Token in GitHub, source files, documentation, client JavaScript, analytics payloads, logs or public endpoints.

Required server-side environment variables:

```text
EBAY_EPN_ACCOUNT_SID
EBAY_EPN_AUTH_TOKEN
EBAY_EPN_API_VERSION=16
```

The replacement Auth Token should be entered directly into the hosting platform's environment-variable UI. It must not be pasted into a chat, issue, pull request or source file.

## Architecture

```text
APG canonical product identity
        |
        +-- manufacturer / primary evidence
        |
        +-- impact.com / EPN catalog candidate data
        |      +-- title / description
        |      +-- GTIN / MPN / manufacturer
        |      +-- image URL / additional image URLs
        |      +-- price / currency / stock if supplied
        |      +-- promotion metadata
        |
        +-- eBay Buy Browse API (separate workstream)
               +-- live eBay AU listings
               +-- item/listing images
               +-- live price / availability
               +-- seller / condition / item specifics

Verified retail destination
        |
        +-- EPN tracking-link generation
```

The impact.com connection is an evidence/commerce input. It must not become a competing APG recommendation engine.

## Governance rules

1. Affiliate participation, payout or commission contributes **zero** recommendation weight.
2. Catalog search results are candidates, not automatically verified exact matches.
3. A product image URL from impact.com is not automatically approved for APG display. Identity and image-rights/provenance controls must both pass.
4. Current price, availability and promotion fields are volatile and must carry source/freshness timestamps when persisted.
5. Unknown or conflicting product identity must fail honestly rather than be guessed.
6. Tracking-link creation is restricted to HTTPS eBay Australia deep links.
7. The client exposes no account, identity, finance, user-management or destructive API writes.
8. The only intended POST operation in v1 is governed tracking-link creation.
9. No credential value may be returned by diagnostics or logged.

## Implemented source

`lib/ebay-impact-api-v1.js`

Current supported operations:

- list/retrieve joined programs using the Partner API campaign endpoints;
- list ads;
- list/retrieve catalogs;
- list/search/retrieve catalog items;
- list/retrieve promotions;
- list/retrieve program deals;
- list reports and retrieve report metadata;
- export clicks; and
- create a regular/vanity tracking link for an HTTPS eBay Australia destination.

`safeProductProjection()` deliberately marks impact.com product data as `exactModel: false` and `recommendationWeight: 0`. A later identity-validation layer must promote a candidate only when APG's exact-product evidence gate is satisfied.

## Product imagery

impact.com catalog items can expose a primary `ImageUrl` and `AdditionalImageUrls`. APG may retain these as **candidate image evidence**, together with the catalog/campaign/item identifiers and retrieval time.

Do not make them canonical APG product imagery until all of the following are true:

- exact brand/model/variant identity is sufficiently established;
- the image corresponds to that exact product/variant;
- use under the relevant eBay/impact.com programme and API terms is confirmed;
- provenance is retained; and
- freshness/revalidation rules are defined.

The eBay Buy Browse API remains the preferred second source for live eBay AU listing imagery and listing-level product data once production access is approved.

## Activation sequence

1. Reset the exposed impact.com Auth Token.
2. Add the replacement credentials directly to Vercel as server-side environment variables.
3. Keep the feature branch non-production while credentials and scopes are validated.
4. Run `node scripts/ebay-impact-api-v1-qa.js`.
5. Perform a read-only live check against joined programs, catalogs and catalog search.
6. Confirm the eBay Australia program ID and whether an eBay product catalog/feed is actually exposed to this account.
7. Confirm returned image/product fields and catalogue freshness.
8. Test one governed eBay AU deep tracking link.
9. Add candidate identity matching and provenance persistence; do not auto-promote first search results.
10. Obtain/configure separate eBay Buy Browse API production access.
11. Run release QA and reconcile production SHA, deployment, runtime and durable APG operating records before marking GREEN.

## Release state

Creating the token or receiving a READY deployment does not constitute production certification. This integration remains **not GREEN** until the replacement secret is configured, live read-only API checks pass, product/image provenance is validated, and APG release gates are reconciled.
