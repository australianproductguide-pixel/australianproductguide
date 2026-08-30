# APG eBay EPN / impact.com Preview validation

Status: **VALIDATION IN PROGRESS — NOT PRODUCTION-CERTIFIED**

Date: 2026-08-30

## Environment configuration checkpoint

The Vercel project has been configured with the required server-side environment-variable names:

- `EBAY_EPN_ACCOUNT_SID`
- `EBAY_EPN_AUTH_TOKEN`
- `EBAY_EPN_API_VERSION`

The Vercel UI shows these variables scoped to **Preview and Production**. No credential values are stored in this repository or this record.

Because the variables were configured after the preceding feature-branch Preview deployment, this commit intentionally triggers a fresh Preview deployment so the eBay integration can be validated against the new environment configuration.

## Governance

- Secret values must never be committed, logged, returned by diagnostics, or exposed to client-side JavaScript.
- A Vercel `READY` state is a deployment prerequisite, not APG GREEN certification.
- Live API authentication, joined-program discovery, catalogue availability, candidate-product evidence, imagery provenance and one governed tracking-link test remain required before production certification.
- This validation commit does **not** authorise merge to `main` or Production promotion.
