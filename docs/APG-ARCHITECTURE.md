# Australian Product Guide — Current Technical Architecture

Status: **CURRENT**

This document describes the current operating architecture. Historical versioned source remains recoverable in Git history and some cumulative server wrappers retain historical filenames because they are still genuine dependencies. A filename that looks old is not automatically a legacy path.

## 1. Authoritative production chain

```text
GitHub australianproductguide-pixel/australianproductguide
  main
    -> Vercel au-product-guide
      -> australianproductguide.au
```

- GitHub `main` is the application source of truth.
- Vercel is the build/deployment/runtime layer.
- `australianproductguide.au` is the current consumer truth.
- Supabase is the account/runtime-data service, not a product-catalogue source.
- APG Drive is the durable operating/governance/release record, not executable application source.

## 2. Application entry and request model

Vercel serves genuine files from `public/` through the filesystem/CDN path before falling back to the application runtime. Dynamic requests are handled by the single Node entry point:

```text
api/index.js
  -> lib/interaction-runtime-v55.js
  -> current cumulative server runtime
  -> SSR HTML / generated assets / APIs
```

The architecture remains intentionally SSR-first. Normal destination navigation uses native links and GET forms. JavaScript is retained for genuine in-page interaction such as shortlist/save state, suggestions, menus, privacy/account controls and Scout conversation.

`npm run qa:architecture` calculates current reachability from `api/index.js`; source is deleted only after it is outside the runtime graph and other maintained references have been checked.

## 3. Current capability ownership

| Capability | Current authoritative implementation | Notes |
| --- | --- | --- |
| Destination navigation | Interaction Runtime v55 | Native browser GET/link navigation; retired browser recovery/router assets are stripped from final consumer HTML. |
| Universal Search | Search server contract v52 + Intelligence Core v54 | Exact-model, typo, brand/category, natural-language and constraint-aware search. |
| Decision Lab | Decision Engine V4 through current Decision Lab server composition | Server-rendered decision profile, shortlist, reasoning and verification needs. Older base engine module remains an intentional imported dependency of V4. |
| Comparison | SSR custom compare + Compare State Handoff v56 | Browser shortlist is canonicalised to product slugs before native GET handoff. |
| Scout | Scout Concierge v5 | Deterministic APG conversational layer; no paid model dependency required. |
| My APG | Current account platform + local workspace client | Local-first with optional account sync. |
| Authentication | Supabase Auth through current account server layer | Server-authorised account/session boundaries. |
| Catalogue/evidence | `data/` + cumulative Catalogue Intelligence v48/v49 server layers | 482 maintained products / 90 categories / 178 brands at current certified baseline. |
| Amazon Australia | Current canonical product mapping + affiliate helpers | 30 verified direct paths, 452 model-specific tagged fallbacks at current certified baseline; no guessed ASINs. |
| Retailer evidence | Current exact-model retailer registry/overlays | Commercial participation has zero recommendation weight. |
| Analytics | consent-gated GA4 + Vercel Analytics + sparse first-party RUM controls | Private My APG/query data is deliberately minimised/excluded from public telemetry. |

## 4. Supabase runtime ownership

The clean target schema contains only runtime data APG currently uses.

### CURRENT — REQUIRED

- `apg_workspace_items` — user-owned My APG sync records. Current application and Scout use it.
- `apg_communication_preferences` — optional account communication-consent state. Current account API uses it.
- Supabase Auth — account identity and sessions.
- `delete-account` Edge Function — authenticated self-service deletion and cascade cleanup.
- `apg_set_updated_at()` — timestamp trigger helper used by current tables where applicable.
- RLS and current table privileges — required security boundary.

### SUPERSEDED / UNUSED schema

Empty database scaffolding with no current server/Edge dependency is retired using forward migrations. Migration history is not rewritten; the history remains sufficient to understand or reconstruct prior schema if ever needed.

There are currently no APG Storage buckets or objects.

## 5. Source versus generated assets

### SOURCE

- `api/`, `lib/`, `data/`
- `public/` maintained static assets
- `scripts/` QA/automation source
- `.github/workflows/`
- `supabase/migrations/` and `supabase/functions/`
- `docs/`

### GENERATED / EPHEMERAL

- release evidence under `artifacts/`
- GitHub Actions artifacts
- Vercel build output/deployment objects
- runtime/generated asset responses

Generated output must not become a competing hand-maintained source of truth.

## 6. Build and deployment policy

Normal releases extend the existing current architecture rather than creating a new application beside it.

Release types:

- **HOTFIX** — urgent Production defect; smallest reversible fix, deploy as soon as safe.
- **STANDARD** — grouped normal improvements; source QA first, Preview only where useful, then one Production deployment.
- **MAJOR** — substantial architecture/intelligence/product change; deliberate Preview/manual certification where justified before Production.

Routine feature-branch Vercel Previews are suppressed. GitHub carries the heavier source/contract assurance; Vercel runs the smaller deploy gate. Production verification stays low-volume but covers representative Search, Decision Lab, Scout, comparison, account boundary, catalogue, trust and SEO routes.

## 7. Data ownership

| Data class | Authoritative owner |
| --- | --- |
| Application source and executable catalogue/intelligence data | GitHub `main` |
| Deployment/runtime state | Vercel `au-product-guide` |
| Consumer Production experience | `australianproductguide.au` |
| User identity/session and optional synced workspace/preferences | Supabase |
| Operating governance, release records and audit trail | APG Google Drive |
| Historical source versions | Git history / release records |

No new runtime store should duplicate an existing authoritative data class without a documented reason and migration plan.

## 8. Consolidation rule

Before adding a new Search engine, Decision implementation, Scout layer, product-card system, affiliate helper, account model or database table:

1. inspect the current authoritative implementation;
2. extend or modify it where practical;
3. add a new path only when the current component cannot safely meet the requirement;
4. migrate consumers deliberately;
5. retire the superseded path once dependency checks pass.

**Do not build another Australian Product Guide beside the existing one. Build the next improvement into the authoritative current APG.**
