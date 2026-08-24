# APG Action 8 — Supabase Auth, RLS and Account Security Certification

**Certification date:** 24 August 2026  
**Supabase project:** `gozovvhofdsshjuixcys` (Australian Product Guide, `ap-southeast-2`)  
**Canonical Production:** `https://australianproductguide.au`  
**Application baseline inspected:** GitHub `main` SHA `11da53a4797691fbd0f520a1319bcfdde2af91e3` and corresponding live Production account surface  
**Overall outcome:** **PARTIAL — RLS/privileged-boundary GREEN; complete hosted-email/account-lifecycle certification still unverified; leaked-password protection approval/plan blocked**

## 1. Live Supabase architecture

Fresh live inspection on 24 August 2026 confirmed the deliberately small APG public runtime schema:

- `public.apg_workspace_items` — RLS enabled; current item types: `saved_product`, `compare_shortlist`, `recent_product`, `recent_search`, `decision_history`, `saved_comparison`, `saved_guide`.
- `public.apg_communication_preferences` — RLS enabled; `email_updates` defaults `false`.
- `public.apg_mcp_operators` — RLS enabled; security-sensitive operator allow-list.
- Supabase Storage buckets: **0**.
- Active Edge Functions: **1** — `delete-account`, live version 4, `verify_jwt=true`.
- Public functions: `apg_mcp_access_token_hook`, `apg_set_updated_at`, `rls_auto_enable`.
- Trigger: `apg_workspace_items_set_updated_at` → `apg_set_updated_at()`.
- Auth hook: `apg_mcp_access_token_hook` is an active security component for the OAuth/MCP operator pathway. It is `SECURITY DEFINER`, executable by `supabase_auth_admin`, and revoked from `authenticated`, `anon` and `public`.

The historical public-table scaffolding (`apg_user_preferences`, `apg_retailer_observations`, `apg_price_alert_preferences`) is not present in the current public schema and remains **HISTORICAL / SUPERSEDED**. It must not be recreated merely to match older documentation.

## 2. Ownership and deletion semantics

All three current public tables bind user state through `user_id -> auth.users.id`.

Foreign-key deletion behaviour is `ON DELETE CASCADE` for:

- `apg_workspace_items.user_id`;
- `apg_communication_preferences.user_id`;
- `apg_mcp_operators.user_id`.

`delete-account` v4:

- requires a valid JWT at the Edge Function boundary;
- validates the bearer token against Supabase Auth;
- derives the deletion target from the authenticated user identity;
- does not accept a caller-supplied arbitrary target user UUID;
- keeps the service-role credential inside the server-side Edge Function environment;
- deletes the authenticated Auth user, relying on the current FK cascade model for user-bound public rows;
- returns generic consumer-safe failure messages rather than secrets.

This design prevents a normal caller from choosing another account as the deletion target. A destructive end-to-end deletion of a disposable newly-created account was **not executed in this run** because a safe fresh-email disposable account and complete email-confirmation journey were not available through the connected tooling. Do not represent account deletion as fully lifecycle-certified until that final test is completed.

## 3. RLS policy state

Current policy structure:

### `apg_workspace_items`

Authenticated owner-only policies exist for SELECT, INSERT, UPDATE and DELETE. Ownership derives from `(select auth.uid()) = user_id`. INSERT and UPDATE use `WITH CHECK` to prevent forged ownership or changing a row to another user's identity.

### `apg_communication_preferences`

Authenticated owner-only policies exist for SELECT, INSERT, UPDATE and DELETE. Ownership derives from `(select auth.uid()) = user_id`. INSERT and UPDATE use `WITH CHECK`.

### `apg_mcp_operators`

Only the authenticated user's own operator row may be selected. Ordinary authenticated clients have no INSERT/UPDATE/DELETE table privileges. The current policy is:

```sql
alter policy "mcp operators can read own access"
on public.apg_mcp_operators
to authenticated
using ((select auth.uid()) = user_id);
```

The optimisation above is already applied in live Supabase as migration `20260824055011_optimize_apg_mcp_operator_rls_initplan` and is restored to GitHub source control alongside this certification record.

## 4. Adversarial RLS certification

Controlled Production-database testing used temporary fixture rows and PostgreSQL role/JWT contexts equivalent to `anon`, `authenticated`, and `service_role`. Existing consumer research was not deleted. All fixtures were removed at test completion.

| Actor | Operation | Expected | Result |
| --- | --- | --- | --- |
| Anonymous | workspace SELECT / INSERT / UPDATE / DELETE | DENY | PASS |
| Anonymous | communication preference SELECT / INSERT / UPDATE / DELETE | DENY | PASS |
| Anonymous | operator SELECT | zero rows | PASS |
| Anonymous | operator self-grant / write | DENY / no effect | PASS |
| User A | create own workspace row | ALLOW | PASS |
| User A | update own workspace row | ALLOW | PASS |
| User A | delete own workspace row | ALLOW | PASS |
| User A | read User B workspace row | zero rows | PASS |
| User A | update User B workspace row | zero rows | PASS |
| User A | delete User B workspace row | zero rows | PASS |
| User A | insert workspace row owned by User B | DENY | PASS |
| User A | change own workspace row ownership to User B | DENY | PASS |
| User A | read User B communication preference | zero rows | PASS |
| User A | update User B communication preference | zero rows | PASS |
| User A | delete User B communication preference | zero rows | PASS |
| User A | read User B operator state | zero rows | PASS |
| User A | create operator row for self | DENY | PASS |
| Service role | privileged server workspace access | ALLOW | PASS |

**RLS conclusion:** the current database ownership boundary is **GREEN**. `RLS enabled` is not the basis for this conclusion; the conclusion is based on actual adversarial own-user/cross-user/anonymous tests.

## 5. RLS performance adviser

The earlier reported `apg_mcp_operators` Auth init-plan warning has been remediated in live Supabase.

- Live migration: `20260824055011_optimize_apg_mcp_operator_rls_initplan`.
- Current policy uses `(select auth.uid())`.
- Supabase Performance Adviser on 24 August 2026: **0 findings**.
- Post-change adversarial RLS suite: **GREEN**.

No further RLS weakening or rewrite is warranted.

## 6. Security Adviser and leaked-password protection

Supabase Security Adviser on 24 August 2026 reports one remaining finding:

- **Leaked Password Protection Disabled**.

Current organisation plan is **Free**. Supabase documents leaked-password protection as available on **Pro and above**. APG already enforces its application-side v36.1 password rule for new passwords (minimum 12 characters with lower/upper/number/symbol; maximum 200), but that is a compensating strength rule and is **not** leaked-password screening.

Status: **BLOCKED — OWNER APPROVAL + PAID PLAN IMPLICATION**.

Do not enable or upgrade silently. See the decision section below.

## 7. Application/server Auth architecture

Production `/my-apg/` currently loads `/assets/account-platform.js` and uses APG first-party server routes. The active path stores Supabase access/refresh tokens in Secure, HttpOnly cookies through the server boundary.

The older `lib/account-sync-client.js` implementation contains token-in-`localStorage` logic but is not the Production account runtime loaded by `/my-apg/`; it is superseded code. Legacy presentation wrappers may still reference its CSS lineage. Do not describe the old client token model as the current Production security posture.

Signed-out Production probes on 24 August 2026 confirmed:

- `/api/account/me` returns only an unauthenticated state;
- `/api/account/workspace` returns HTTP 401 with a consumer-safe message;
- `/api/account/preferences` returns HTTP 401 with a consumer-safe message;
- malformed confirmation state is contained within the canonical APG account surface rather than exposing a raw Supabase/localhost destination.

## 8. Service-role certification

The service role is used for the privileged `delete-account` Edge Function path and remains server-side in the inspected implementation. No service-role secret is recorded in this document.

The public browser/account runtime uses APG's server endpoints and publishable Supabase configuration rather than embedding service-role credentials.

**Service-role conclusion:** PASS for inspected current implementation.

## 9. Hosted Auth / email state

Historical evidence from 17 August 2026 recorded a real signup whose email confirmation succeeded in Supabase but redirected the browser to localhost. APG subsequently introduced the first-party `/auth/confirm` token-hash callback and production-specific templates in source control.

For the 24 August 2026 Action 8 run:

- the first-party Production confirmation route is present and handles malformed input safely;
- current source requests canonical `https://australianproductguide.au` / My APG destinations;
- existing Auth users show confirmed accounts and prior successful sign-ins;
- Gmail search of the connected APG business mailbox did **not** provide a fresh current-release APG confirmation/recovery email suitable for certifying template delivery and redirect behaviour;
- the available Supabase connector does not expose a direct hosted Auth URL/template configuration read endpoint.

Therefore current hosted **Site URL, redirect allow-list, live email templates, sender configuration, recovery delivery, expiry/single-use behaviour and complete current-release email journey remain UNVERIFIED**, not failed and not assumed resolved.

A final release-grade test still requires a disposable fresh-email account:

signup → receive APG email → confirm on canonical domain → login → save/sync → second-session restore → preference change → recovery email → password reset → delete disposable account → independently verify Auth/public-row cleanup.

## 10. Session and signed-out behaviour

Current application code uses Secure/HttpOnly cookies and first-party server refresh/session handling. Signed-out private API access is denied as described above. Existing Supabase Auth session rows and confirmed users show that live Auth has issued sessions historically.

A fresh current-release browser test for token refresh, logout/back-button cache behaviour, cross-device restore and expired-session mutation was not independently completed with disposable credentials in this run. Those stages remain **UNVERIFIED** for overall Action 8 completion, despite the underlying RLS boundary being GREEN.

## 11. Storage, sensitive-data minimisation and cost

- Supabase Storage buckets: 0.
- Public APG schema remains three tables; no new account tables were created.
- `apg_communication_preferences` defaults marketing/update email state to `false`.
- No duplicate public-table email column was identified; email identity remains owned by Supabase Auth.
- Database size observed during certification was approximately 35 MB.
- Auth user count at certification: 2 existing accounts; no disposable third account was created by this run.
- Supabase organisation plan: Free.
- Action 8 introduced no new recurring service or infrastructure cost. **Incremental recurring cost: AUD $0.**

## 12. Social login evaluation

Current Auth identity inventory is email-based only; no SSO providers or custom OAuth providers are configured for consumer login.

Given the very small current Auth-user base and no measured evidence in this run that email/password completion friction is materially constraining APG usage, adding Google/Apple/Facebook login would introduce provider credentials, redirect/configuration surface, privacy disclosures and maintenance without an evidence-based need.

**Decision: DO NOT ADD YET.** Social login remains an optional future enhancement requiring usage evidence and explicit owner approval.

## 13. Findings and completion status

| Severity | Finding | Status |
| --- | --- | --- |
| P0 | Cross-user access | CLOSED / NOT OBSERVED — adversarial suite GREEN |
| P1 | RLS ownership/write boundary | CLOSED — GREEN |
| P1 | Operator self-grant / privilege escalation | CLOSED — GREEN |
| P1 | Arbitrary-target account deletion | CLOSED by inspected design; destructive cross-user deletion not executed against real users |
| P2 | RLS performance init-plan warning | CLOSED — migration applied; Performance Adviser clean |
| P2 | Leaked-password protection disabled | BLOCKED — owner approval + Pro-plan implication |
| P2 | Fresh hosted Auth Site URL/redirect/template certification | UNVERIFIED — direct hosted-config read unavailable in connected tool path |
| P2 | Fresh signup/confirmation/recovery/delete disposable-account journey | UNVERIFIED — no safe fresh-email disposable account completed in this run |
| P3 | Superseded `account-sync-client.js` token-in-localStorage code remains in repository | DEFERRED CLEANUP — not loaded by current Production account surface |

## 14. Action 8 gate

### 8A — live inventory and Drive reconciliation

**PASS subject to Operating Backend update from this record.** Live three-table architecture is confirmed; historical scaffolding remains superseded.

### 8B — RLS certification

**PASS.** Anonymous denial, own-user operations, cross-user read/update/delete isolation, forged-owner denial and operator self-grant denial were demonstrated.

### 8C — leaked-password protection

**BLOCKED — OWNER APPROVAL / PLAN CHANGE REQUIRED.** No silent upgrade or enablement performed.

### 8D — RLS performance

**PASS.** Live optimisation migration applied, Performance Adviser clean, adversarial regression GREEN.

### 8E — hosted Auth

**PARTIAL / UNVERIFIED.** Application safeguards and canonical first-party callback are present, but current hosted Site URL/allow-list/template delivery has not been directly proven through the connected management path and fresh email journey.

### 8F — complete consumer account journey

**PARTIAL / UNVERIFIED.** Database security and signed-out boundary are proven, but a fresh disposable-account signup→email→verify→save→restore→preference→recovery→delete journey was not completed.

### 8G — social login

**PASS — DO NOT ADD YET.** No evidence currently justifies extra provider complexity.

## 15. Overall outcome

**ACTION 8 = PARTIAL, NOT YET FULLY CERTIFIED.**

The most important security question has a positive answer: the current live RLS model demonstrably prevents one authenticated user from reading, modifying or deleting another user's protected APG workspace/preferences, and ordinary users cannot self-grant MCP operator access. The operator policy performance warning is resolved without weakening access control, and the account-deletion function derives its target from authenticated identity.

The remaining completion blockers are evidence gaps rather than discovered cross-user compromise: current hosted Auth configuration/email delivery and a complete disposable-account lifecycle must still be demonstrated. Leaked-password protection additionally remains intentionally approval/plan-gated.

Do **not** mark the overall Action 8 roadmap item GREEN until those remaining lifecycle tests are completed on the same current Production release.
