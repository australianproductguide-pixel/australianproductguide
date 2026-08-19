create table if not exists public.apg_communication_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_updates boolean not null default false,
  consented_at timestamptz,
  withdrawn_at timestamptz,
  consent_source text,
  consent_version text not null default '2026-08-16-v1',
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apg_communication_consent_state check (
    (email_updates = true and consented_at is not null and withdrawn_at is null)
    or email_updates = false
  )
);

alter table public.apg_communication_preferences enable row level security;
revoke all on table public.apg_communication_preferences from anon;
grant select, insert, update, delete on table public.apg_communication_preferences to authenticated;

drop policy if exists communication_select_own on public.apg_communication_preferences;
create policy communication_select_own on public.apg_communication_preferences for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists communication_insert_own on public.apg_communication_preferences;
create policy communication_insert_own on public.apg_communication_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists communication_update_own on public.apg_communication_preferences;
create policy communication_update_own on public.apg_communication_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists communication_delete_own on public.apg_communication_preferences;
create policy communication_delete_own on public.apg_communication_preferences for delete to authenticated using ((select auth.uid()) = user_id);