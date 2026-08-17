# APG optional consumer account architecture

**Status:** CURRENT / ACTIVATED  
**Reviewed:** 17 August 2026  
**Canonical account surface:** `https://australianproductguide.au/my-apg/`  
**Authentication/data platform:** Supabase project `gozovvhofdsshjuixcys`, Sydney region

## Operating model

My Australian Product Guide is **local-first and account-optional**.

Consumers can browse, search, compare products, use Decision Lab and keep browser-local My APG research without creating an account. A consumer may optionally create an email/password account to sync selected My APG workspace data across signed-in devices.

Account status must never affect product suitability, retailer ranking or affiliate weighting.

## Current implementation

The live architecture uses:

- Supabase Auth for managed email/password authentication;
- server-side APG account endpoints under `/api/account/`;
- secure HttpOnly session cookies managed by APG;
- Supabase Postgres for synced workspace/preferences;
- Row Level Security on every shopper-owned APG table;
- an APG Edge Function for account deletion;
- browser-local storage as the signed-out/default workspace;
- separate, explicit communication preference storage for future product-research emails.

The application does not maintain its own password database and does not expose a Supabase service-role/secret key to browser code.

## Current shopper-owned data model

### `apg_workspace_items`

Stores selected synced My APG items such as saved products, comparison shortlist items, recent products, Decision Lab history, recent searches, saved comparisons and saved guides.

### `apg_user_preferences`

Reserved for account-specific user preferences.

### `apg_communication_preferences`

Stores the optional product-research email preference separately from account creation, including consent/withdrawal metadata. Default is off.

### `apg_price_alert_preferences`

Schema exists for future alert capability. It must not be represented as a fully operational alert service until retailer freshness and outbound delivery controls are separately verified.

All shopper-owned tables have RLS enabled and use owner-only policies based on the authenticated Supabase user ID.

## Authentication flows

### Create account

1. Consumer chooses **Create account** in My APG.
2. APG submits email/password to Supabase Auth through the server-side account route.
3. Email confirmation is required.
4. Once confirmed, the consumer can sign in and sync the browser-local workspace.

### Sign in / sign out

Password sign-in is brokered by APG's server route. Supabase access/refresh tokens are kept in secure HttpOnly cookies rather than exposed as persistent application data in browser JavaScript.

### Confirmation and recovery hardening

Auth Hardening v23 adds a first-party endpoint at `/auth/confirm` designed for Supabase token-hash email templates. It exchanges the token with Supabase server-side, sets the APG session cookies and returns the consumer to My APG.

Production hosted Auth configuration and branded templates are controlled by `docs/APG-AUTH-PRODUCTION-CONFIG.md`.

### Password recovery

My APG exposes a forgot-password flow. The preferred production email template returns the recovery token to `/auth/confirm`, which establishes the recovery session and opens the new-password control in My APG.

### Account deletion

Signed-in consumers can delete the account from My APG. The authenticated deletion function removes the auth account and related synced APG records. Browser-local data is separate and remains until the consumer clears it locally.

## Privacy-minimising identity

Do not expand the core consumer profile without a demonstrated product need and privacy review.

Current minimum identity is:

- managed authentication user ID;
- email address required for sign-in/recovery;
- provider-managed authentication/session metadata;
- timestamps necessary to operate the account;
- separately recorded consent metadata only where the consumer explicitly opts in.

Do **not** require name, date of birth, phone number, address or demographic profile for core account creation.

## Local-first sync principles

1. Signed-out use remains functional and browser-local.
2. Account creation is optional.
3. Synced data is scoped to My APG functionality, not a broad behavioural advertising profile.
4. Server-side records are keyed to the authenticated account and protected by RLS.
5. Account deletion removes cloud records; browser-local data remains independently controllable.
6. No silent conversion of browser-local history into a server-side profile outside the account/sync experience.

## Security controls

CURRENT controls include:

- managed Supabase authentication;
- email verification requirement;
- secure HttpOnly cookies;
- RLS enabled for shopper-owned tables;
- owner-only select/insert/update/delete policies;
- server-side origin restrictions on state-changing account routes;
- no service-role/admin secret in browser code;
- account deletion path;
- password recovery path;
- separate communication consent storage;
- privacy/terms account disclosures.

Controls requiring continuing operational verification:

- hosted Supabase Site URL and redirect allow-list;
- branded transactional email templates;
- custom SMTP/sender-domain configuration before scaled production use;
- auth rate limits and bot/CAPTCHA protection before material acquisition campaigns;
- mail-client confirmation/recovery testing;
- periodic Supabase security/performance advisor review;
- release regression testing of mobile and desktop account journeys.

## Known issue reconciled on 17 August 2026

A real signup confirmation was successfully processed by Supabase, but the browser was then redirected to `localhost`. The account record itself was confirmed; the defect was the hosted post-verification redirect configuration.

Application code already requested the canonical production My APG URL. The required hosted Supabase settings and branded first-party callback configuration are documented in `APG-AUTH-PRODUCTION-CONFIG.md`.

## Product and compliance requirements

- Account creation must remain optional for core shopping journeys.
- Recommendation logic must remain account- and affiliate-neutral.
- Marketing/product-research email consent must remain separate from mandatory account/security email.
- Privacy Policy and Terms must remain consistent with the actual data flows.
- Material changes to provider, data scope, retention, SMTP, account profiling or privacy settings require explicit owner approval and release reconciliation.
- Australian Consumer Law rights must not be reduced by account terms.

## Future enhancements

Potential future additions, subject to evidence and approval:

- Google/Apple social sign-in where it materially reduces friction;
- account data access/export tooling;
- product-specific price alerts after retailer freshness and notification delivery are proven;
- optional passkeys/MFA if account risk warrants the additional friction.

Do not add identity or personalisation complexity merely because Supabase supports it. APG's account exists to improve the shopping research experience, not to maximise consumer profiling.
