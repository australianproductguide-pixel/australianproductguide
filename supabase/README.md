# Supabase source reconciliation

This directory is the repository-side source for APG Supabase changes reconciled from the live Australian Product Guide project.

## Current reconciliation status

- `functions/delete-account/index.ts` mirrors the active `delete-account` Edge Function currently deployed in Supabase.
- `migrations/` contains every migration currently recorded in the live Supabase migration history, in the same version order and with the SQL statements retained by Supabase.
- The current migration sequence is:
  - `20260816034859_create_apg_workspace_sync.sql`
  - `20260816034940_harden_rls_auto_enable_permissions.sql`
  - `20260816035344_create_retailer_observation_and_alert_tables.sql`
  - `20260816035400_document_locked_retailer_observations_policy.sql`
  - `20260816074808_create_apg_communication_preferences.sql`
  - `20260816075010_harden_apg_communication_permissions.sql`
  - `20260819071815_harden_client_table_privileges.sql`

This closes the migration-history source gap identified when the Supabase directory was introduced. The live Supabase project remains the verification target for applied state; GitHub `main` is the durable source record for future Supabase changes.

## Rules

- Never commit service-role keys, database passwords or other secrets.
- Database DDL changes should be applied through a named migration and reconciled here in the same change set.
- Edge Function source should remain aligned with the deployed Supabase version.
- Production data must never be committed to this repository.
- Before promoting schema changes, validate RLS, client grants, security advisors and application compatibility.
