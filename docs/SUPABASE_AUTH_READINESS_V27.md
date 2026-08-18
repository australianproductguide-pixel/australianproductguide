# APG hosted Supabase Auth readiness — v27

Status: **OWNER / HOSTED-CONFIG ACTION REQUIRED**

This runbook records the provider-level controls that cannot be safely changed by an ordinary APG application release through the currently connected Supabase tool surface.

## Target hosted configuration

### URL Configuration

- Site URL: `https://australianproductguide.au`
- Production auth callback: `https://australianproductguide.au/auth/confirm`
- Do not leave a localhost Site URL as the hosted Production default.
- Keep redirect allow-list entries as narrow as practical in Production. Preview/local patterns should be separately justified rather than used as the Production default.

APG's server callback in `lib/auth-hardening-v23.js` accepts Supabase `token_hash` confirmation and recovery requests at `/auth/confirm`, verifies them against Supabase Auth and stores the resulting session in secure HttpOnly cookies before returning the consumer to My APG.

### Email templates

The maintained branded templates are:

- `docs/auth-email-templates/confirmation.html`
- `docs/auth-email-templates/recovery.html`

Hosted Supabase should use the matching token-hash callback pattern so confirmation and recovery return to the APG first-party `/auth/confirm` endpoint rather than a localhost or generic Supabase destination.

### Password security

Recommended hosted controls, subject to plan availability and owner approval:

- minimum password length at least 8 characters;
- leaked-password protection enabled where the Supabase plan supports it;
- maintain the existing APG current-password/re-authentication protections for consequential account actions;
- consider stronger character rules only if the usability/security trade-off is acceptable for APG consumers.

Supabase documents leaked-password protection as using the Pwned Passwords service and notes that the feature is available on Pro Plan and above. Do not represent it as active until the hosted project setting has been verified.

## Acceptance test after owner changes

1. Create a brand-new test account with a fresh email address.
2. Confirm that the received email is APG-branded and does not send the user to localhost.
3. Open the confirmation link and confirm it reaches `https://australianproductguide.au/auth/confirm?...` and then returns to My APG as confirmed.
4. Sign out and sign in with the new account.
5. Request password recovery and confirm the recovery email returns through the same first-party callback with `type=recovery`.
6. Choose a new password and verify sign-in works with it.
7. If leaked-password protection has been enabled, verify a known-compromised password is rejected without recording or exposing the password used for the test.
8. Remove the test account through the normal My APG deletion flow.
9. Record the hosted-setting verification date in the APG Operating Backend.

## Governance

Do not store Supabase management access tokens, service-role keys or SMTP credentials in this repository. Any Management API or Dashboard update must be performed through an authorised owner/admin session and secrets must remain in the provider's secure configuration surface.
