# APG eBay Browse API Sandbox validation

Status: **VALIDATION IN PROGRESS — PREVIEW ONLY**

Date: 2026-08-30

The APG eBay Browse API Sandbox credentials are configured in Vercel environment variables. Secret values are not recorded here.

Required variables:

- `EBAY_BROWSE_CLIENT_ID`
- `EBAY_BROWSE_CLIENT_SECRET`
- `EBAY_BROWSE_ENVIRONMENT=sandbox`
- `EBAY_BROWSE_MARKETPLACE_ID=EBAY_AU`

The Preview-only health endpoint must verify both OAuth client-credentials authentication and a Browse API request before the integration can be considered Sandbox-authenticated.

Production activation remains prohibited until Production credentials, eBay Buy API access and APG release gates are separately satisfied.
