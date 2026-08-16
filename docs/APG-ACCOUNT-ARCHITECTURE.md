# APG optional consumer account architecture

**Status:** PLANNED / NOT ACTIVATED  
**Reviewed:** 16 August 2026  
**Approval gate:** New authentication/database processor and material privacy change require explicit owner approval before activation.

## Recommendation

Keep **anonymous, browser-local My APG as the default** and add optional cross-device sync only for shoppers who choose to create an account.

Recommended managed stack if approved: **Supabase Auth + Postgres with Row Level Security (RLS)**.

Why it fits APG:

- managed authentication rather than custom password handling;
- authentication and the saved-research data store can live in one managed platform;
- row-level policies can restrict each shopper to their own saved records;
- APG can keep the public shopping site SSR-first and isolate account JavaScript to My APG/account flows;
- local data can continue to work without authentication and can be selectively imported after sign-up.

Alternatives reviewed:

- **Firebase Authentication + Firestore/Security Rules:** mature and viable, including anonymous-to-registered account flows, but moves APG toward a more Firebase-specific data model.
- **Clerk:** highly polished authentication/user-management UX, but APG would still need a separate durable data store and authorisation model for saved product research.

## Privacy-minimising data model

Do not create a broad consumer profile. Minimum proposed account identity:

- managed authentication user ID;
- verified email address only when needed for sign-in/recovery;
- created/updated/deletion timestamps;
- optional consent timestamps only for features that genuinely require consent.

Do **not** require name, date of birth, phone number, address, demographic profile or marketing preferences for core account creation.

Proposed shopper-owned tables:

- `saved_products(user_id, product_slug, created_at)`
- `saved_comparisons(user_id, comparison_payload, created_at, updated_at)`
- `saved_decisions(user_id, privacy_minimised_input, product_slugs, created_at, updated_at)`
- `saved_guides(user_id, guide_slug, created_at)`
- `recent_items(user_id, item_type, item_slug, created_at)` — optional; off by default if local history is sufficient
- `alert_preferences(...)` — FUTURE only, separately opt-in

Every shopper-owned row must be protected by RLS so authenticated users can access only rows whose `user_id` matches the authenticated subject.

## Local-first migration

1. Shopper uses APG with no account.
2. My APG stores shortlist/saved/recent/decision history locally in the browser.
3. Shopper optionally chooses **Sync My APG across devices**.
4. Explain what will be uploaded before authentication begins.
5. After verified account creation, let the shopper select which local modules to sync.
6. Upload only selected records.
7. Keep local operation available when logged out.
8. Account deletion must delete shopper-owned server records and revoke authentication access.

Never silently turn browser-local history into a server-side profile.

## Security controls required before launch

- managed authentication only; no APG-built password database;
- email verification for email/password accounts;
- secure session/token handling using provider-supported patterns;
- RLS enabled on every exposed shopper-data table;
- deny-by-default policies with owner-only row access;
- rate limiting/bot controls appropriate to sign-up, reset and login routes;
- CSRF/session protections appropriate to the chosen integration pattern;
- no service-role/admin secret exposed to browser code;
- secrets only in approved Vercel environment variables;
- account deletion and session revocation path tested;
- audit the provider's data residency/subprocessor/retention terms before activation;
- Privacy Policy and Terms updated before the first real account is created;
- breach/incident response and access-control ownership documented.

## Product controls required before launch

Account creation remains optional. Comparing products, Decision Lab and basic My APG must continue to work anonymously.

Required flows:

- Create account
- Log in / log out
- Passwordless and/or password recovery flow as approved
- Verify email where applicable
- View synced My APG data
- Remove individual saved records
- Export/access account data where operationally appropriate
- Delete account and synced data
- Privacy settings / sync controls

## Privacy and policy changes required before activation

Privacy Policy must disclose at minimum:

- account identity data collected;
- authentication/database provider and relevant processing role;
- purposes for collection and use;
- server-side saved research categories;
- retention and deletion approach;
- cross-device synchronisation behaviour;
- security and access controls at a truthful, non-sensitive level;
- how consumers request access/correction/deletion;
- whether any data leaves Australia, based on freshly verified provider configuration and terms.

Terms should describe account responsibilities, availability, acceptable use and deletion/termination without reducing Australian Consumer Law rights.

## Activation decision

**NOT ACTIVATED in Platform v3.** The codebase may prepare UI and interfaces, but no external authentication/database service, server-side shopper profile or account login should go live until explicit approval is recorded.
