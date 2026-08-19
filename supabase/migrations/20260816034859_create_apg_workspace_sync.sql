create extension if not exists pgcrypto;

create table public.apg_workspace_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('saved_product','compare_shortlist','recent_product','recent_search','decision_history','saved_comparison','saved_guide')),
  item_key text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, item_key)
);

create table public.apg_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.apg_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger apg_workspace_items_set_updated_at
before update on public.apg_workspace_items
for each row execute function public.apg_set_updated_at();

create trigger apg_user_preferences_set_updated_at
before update on public.apg_user_preferences
for each row execute function public.apg_set_updated_at();

alter table public.apg_workspace_items enable row level security;
alter table public.apg_user_preferences enable row level security;

create policy "workspace_select_own" on public.apg_workspace_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "workspace_insert_own" on public.apg_workspace_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "workspace_update_own" on public.apg_workspace_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "workspace_delete_own" on public.apg_workspace_items for delete to authenticated using ((select auth.uid()) = user_id);

create policy "preferences_select_own" on public.apg_user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_insert_own" on public.apg_user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.apg_user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "preferences_delete_own" on public.apg_user_preferences for delete to authenticated using ((select auth.uid()) = user_id);

create index apg_workspace_items_user_type_updated_idx on public.apg_workspace_items (user_id, item_type, updated_at desc);