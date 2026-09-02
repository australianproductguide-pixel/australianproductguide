# APG Steady-State Cost Control & Release Efficiency Standard

Status: CURRENT
Effective: 2 September 2026

## Purpose

Australian Product Guide (APG) must control infrastructure cost without degrading consumer capability, decision quality, accessibility, SEO, security, evidence standards or release assurance.

The operating objective is to reduce avoidable build and telemetry consumption by improving release discipline rather than by weakening the product.

## 1. Release batching is the default

Routine engineering work must be completed on a focused non-deploying branch and grouped into one coherent release candidate. Small related fixes should be accumulated and validated together rather than committed individually to `main`.

The preferred steady-state pattern is:

`focused branch -> APG Release Gate -> one merge to main -> one Vercel Production deployment -> APG Production Verification -> operating-record reconciliation`

Urgent P0/P1 recovery work may use an expedited path, but the same exact-SHA verification and reconciliation requirements remain.

## 2. Main is a release branch, not a working branch

`main` remains APG's deployable-source authority. Routine incremental experimentation and one-assertion-at-a-time debugging must not occur directly on `main` where each commit can create a Production build and post-release certification workload.

Vercel branch controls continue to suppress automatic Preview builds for normal APG working branches.

## 3. Fail-safe ignored-build control

Vercel uses `node scripts/vercel-ignore-build.js` as the Ignored Build Step.

A Vercel build may be skipped only when the complete Git change set since Vercel's previous successful Production SHA is provably confined to these non-runtime paths:

- `.github/**`
- `docs/**`
- `ops/**`
- `README.md`
- `RELEASE`

Any runtime, data, asset, dependency, configuration or mixed change must build normally.

The control is deliberately fail-safe for availability: if the previous Production SHA is missing or invalid, the diff cannot be read, the change set is empty/ambiguous, or any changed path is outside the allowlist, the build proceeds.

`vercel.json` itself is intentionally not skippable.

## 4. Post-production verification remains strong

APG Production Verification remains mandatory for intended runtime releases and is not reduced to save money.

For a change that is provably documentation/operations/workflow-only and is therefore intentionally not deployed by Vercel, the push-triggered Production Verification workflow is also skipped. This prevents a false wait for a Production deployment that should not exist.

Manual Production Verification remains available through `workflow_dispatch` when required.

## 5. Observability and analytics

Web Analytics remains enabled unless a separate evidence-led decision demonstrates otherwise. Its consumer/business measurement value must not be sacrificed for trivial savings.

Observability Plus should be reviewed periodically against actual operating value and event volume. Disabling or materially reducing it requires an explicit configuration decision after confirming that essential incident detection and release assurance remain available.

High event volume should first be investigated for automated QA loops, unnecessary polling, crawler/bot traffic and duplicated serverless handling before functionality is removed.

## 6. Runtime-efficiency rules

Optimisation must target demonstrable waste only. Examples include duplicated account-state requests, repeated non-user polling, avoidable dynamic handling of true static assets and unnecessary background enrichment calls.

Do not cache personalised/private responses in a way that could leak user data or serve stale identity state. Do not suppress compliance endpoints, including retailer/programme callbacks, merely because their request count appears unusual.

## 7. Spend guardrails

Cost alerts must be non-disruptive. APG should receive early warning of abnormal spend or usage, but automated controls must not pause Production, remove public domains or otherwise interrupt the consumer site merely because a spend threshold is reached.

A hard production kill-switch requires separate explicit owner approval.

## 8. Review cadence

During the post-build stabilisation period, review Vercel usage weekly with particular attention to:

- Build CPU Minutes
- Observability Events
- Function Invocations
- Fast Origin Transfer
- Edge Requests
- Fast Data Transfer
- unusual request-path concentrations

After a stable baseline is established, compare subsequent periods against that baseline rather than against the intensive August 2026 build phase.

## 9. Control ownership and evidence

Material cost-control changes must be recorded with the exact source SHA, Production deployment, verification outcome and any unresolved manual configuration actions.

Cost reduction is successful only if it is both cheaper and operationally equivalent or better for consumers.
