# Supabase source reconciliation

This directory is the repository-side source for APG Supabase changes that are reconciled from the live Australian Product Guide project.

## Current reconciliation status

- `functions/delete-account/index.ts` mirrors the active `delete-account` Edge Function currently deployed in Supabase.
- `migrations/20260819071815_harden_client_table_privileges.sql` mirrors the applied least-privilege migration of the same name.
- Historical migrations created before this repository directory was introduced remain recorded in Supabase migration history and are not yet represented here. They must be reconstructed and verified before this directory is treated as a complete from-zero database bootstrap.

## Rules

- Never commit service-role keys, database passwords or other secrets.
- Database DDL changes should be applied through a named migration and then reconciled here.
- Edge Function source should be kept aligned with the deployed Supabase version.
- Production data must never be committed to this repository.
