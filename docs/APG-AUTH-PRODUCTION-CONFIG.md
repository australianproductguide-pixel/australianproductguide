# Australian Product Guide — production authentication configuration

**Status:** CURRENT OPERATING REQUIREMENT  
**Reviewed:** 17 August 2026  
**Supabase project:** `gozovvhofdsshjuixcys`  
**Canonical site:** `https://australianproductguide.au`

## Purpose

This is the production source-of-truth for My Australian Product Guide authentication configuration. It complements the application code in `lib/account-platform.js` and the first-party token-hash callback in `lib/auth-hardening-v23.js`.

## Current finding — 17 August 2026

A real email/password account was successfully created and Supabase recorded the email as confirmed. The confirmation email nevertheless redirected the browser to `localhost` after verification.

The application code already requests the production My APG redirect. The observed `localhost` fallback is therefore a **hosted Supabase Auth configuration defect**, not a failure to create or confirm the account.

Until the hosted Auth settings below are reconciled, the account can be confirmed successfully while still leaving the consumer on a broken post-confirmation page.

## Required Supabase Auth URL configuration

In **Authentication → URL Configuration** set:

- **Site URL:** `https://australianproductguide.au`
- **Additional Redirect URL:** `https://australianproductguide.au/my-apg/`
- Do not use `localhost` as the production Site URL.
- Add preview/local redirect URLs only for controlled non-production testing; do not use a broad production wildcard when an exact URL is sufficient.

The production code currently requests `https://australianproductguide.au/my-apg/` for signup and password recovery.

## Preferred first-party confirmation flow

APG v23 provides:

`https://australianproductguide.au/auth/confirm`

The branded templates in `docs/auth-email-templates/` send Supabase `TokenHash` to this APG endpoint. The endpoint:

1. accepts only supported email confirmation/recovery types;
2. exchanges the token hash directly with Supabase Auth;
3. stores the returned session in secure, HttpOnly APG cookies;
4. removes the auth token from the browser-facing URL;
5. redirects the shopper to My APG with a clear confirmation or recovery state.

This avoids the generic Supabase → URL-fragment → browser hand-off for the primary email flows and provides a controlled APG-branded destination.

## Required email templates

In **Authentication → Email Templates** configure at least:

### Confirm signup

**Subject:** `Confirm your Australian Product Guide account`

Use the complete HTML in:

`docs/auth-email-templates/confirmation.html`

The action URL is intentionally first-party and production-specific:

`https://australianproductguide.au/auth/confirm?token_hash={{ .TokenHash }}&type=email`

### Reset password

**Subject:** `Reset your Australian Product Guide password`

Use the complete HTML in:

`docs/auth-email-templates/recovery.html`

The action URL is:

`https://australianproductguide.au/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

## Email sender / SMTP

**CURRENT:** Supabase's default sending service can support development/early validation, but it does not provide the desired APG sender identity and is not the preferred production delivery arrangement.

**TARGET:** Configure custom SMTP with a verified Australian Product Guide sender identity such as an approved address at `@australianproductguide.au`.

Before activating custom SMTP:

- approve the provider and any cost/terms;
- verify the sending domain and SPF/DKIM requirements;
- use a monitored account/security reply path where appropriate;
- disable click/link tracking for authentication emails so confirmation links are not rewritten;
- keep marketing delivery separate from mandatory account/security email;
- test confirmation and recovery in major mail clients, including Outlook and Gmail.

No SMTP provider should be purchased or contractually activated without owner approval.

## Email/password provider settings

Required:

- Email provider enabled.
- Email confirmation required for new email/password accounts.
- Password recovery enabled.
- OTP/link expiry kept to a proportionate security window.
- Rate limits retained and reviewed before material public launch.
- CAPTCHA/bot protection assessed before higher-volume acquisition campaigns.

## Account privacy and recommendation neutrality

- Account creation remains optional for browsing, search, comparison and Decision Lab.
- Core account identity is limited to the managed auth user ID/email plus operational auth metadata.
- Product-research email preference remains a **separate opt-in** and defaults off.
- Account status, email preference and affiliate relationships contribute zero recommendation points.
- Synced shopper data remains protected by per-user RLS.
- Account deletion must remove the auth account and synced cloud records; browser-local history remains separately controlled by the user.

## Production acceptance tests

A release is not complete until all of the following pass on the canonical domain:

1. Create a new test account with a fresh email address.
2. Confirmation email is visibly Australian Product Guide branded.
3. Confirmation link opens `australianproductguide.au`, never `localhost`.
4. Confirmation results in a valid signed-in My APG session.
5. Sign out succeeds and the session is no longer authenticated.
6. Sign in succeeds with the confirmed email/password.
7. Unconfirmed email/password sign-in is rejected clearly.
8. Password reset email opens the first-party APG callback.
9. Recovery session exposes the new-password form and successfully updates the password.
10. Saved My APG research syncs only to the authenticated user's records.
11. Cross-account access is blocked by RLS.
12. Account deletion removes cloud account/workspace data.
13. Marketing/update preference remains off unless explicitly selected.
14. Mobile Safari and desktop Chrome/Safari complete the same account journey without dead ends.

## Operational ownership

Any future change to Site URL, redirect allow-list, auth templates, SMTP, provider settings, CAPTCHA, account data scope or retention is an authentication/privacy control change and must be reconciled in this document and release evidence.
