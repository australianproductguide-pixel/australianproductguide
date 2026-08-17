# My Australian Product Guide — account profile & customer journey v24

**Status:** RELEASE CANDIDATE  
**Prepared:** 18 August 2026  
**Account remains optional:** yes

## Objective

Provide a professional end-to-end account journey without turning Australian Product Guide into a consumer-profiling service.

Core journey:

1. Create account with email/password.
2. Keep product-research email consent separate and off by default.
3. Show a clear pending-confirmation state rather than leaving the consumer with only a status sentence.
4. Allow confirmation email resend without exposing whether an arbitrary email has an account.
5. Return confirmed consumers to My APG through the first-party `/auth/confirm` flow.
6. Present a real signed-in My APG profile/settings experience.
7. Allow workspace sync, password change, sign-out, communication-preference management, data export and account deletion.
8. Keep browser-local use available before, during and after account use.

## Signed-in profile

The v24 profile includes:

- email address;
- verified-email status;
- account creation date;
- last sign-in date/time;
- sign-in provider;
- counts of synced saved/comparison/decision/recent records;
- latest synced-record timestamp;
- explicit sync control;
- password change;
- sign-out;
- optional product-research email preference;
- downloadable My APG JSON data export;
- permanent account deletion.

APG does not collect name, date of birth, phone number, postal address or demographic profile merely to make the profile page appear richer.

## Account deletion control

Deletion is intentionally high-friction relative to normal account actions because it is irreversible.

The consumer must:

1. open **Privacy & data**;
2. select **Start account deletion**;
3. enter the current password to re-confirm the active email/password identity;
4. type `DELETE` exactly;
5. separately choose whether browser-local My APG research should also be cleared;
6. select **Permanently delete account**.

The existing authenticated APG deletion route invokes the Supabase `delete-account` Edge Function. Shopper-owned APG records reference `auth.users` with cascading deletion, so deleting the Auth user removes the linked cloud records. Browser-local research is independent and is preserved unless the consumer explicitly ticks the local-clear option.

## Data export

The profile can prepare a local JSON export containing:

- account metadata available to the signed-in consumer;
- synced My APG workspace records;
- communication preference state;
- browser-local My APG workspace from the current device.

Authentication tokens and passwords are not included.

## Confirmation journey

After successful signup that requires verification, v24 shows a dedicated confirmation panel with:

- the email address used;
- concise three-step instructions;
- confirmation resend control;
- a way to return to the form and use a different email.

The resend response is deliberately generic to reduce account-enumeration risk.

## Security/privacy design

- Existing secure HttpOnly APG session-cookie model is retained.
- Profile browser code never receives or stores access/refresh tokens.
- Server-side state-changing account routes preserve production-origin checks.
- Account status, profile state and communication preferences contribute zero recommendation or retailer-ranking weight.
- Product-research email consent remains separate from account/security emails.
- Core APG browsing, search, comparison and Decision Lab remain available without an account.

## Hosted Supabase dependency still requiring verification

Application-side v24 does not change the outstanding hosted Supabase Auth settings identified in v23. Before fresh-account acceptance can be called fully end-to-end certified, Production Auth URL configuration and branded confirmation/recovery templates must be reconciled in the hosted Supabase project. Custom SMTP remains an owner-approved commercial decision rather than an automatic release dependency for the profile UI itself.
