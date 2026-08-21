create table if not exists public.apg_mcp_operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  note text
);

alter table public.apg_mcp_operators enable row level security;

create policy "mcp operators can read own access"
on public.apg_mcp_operators
for select
to authenticated
using (auth.uid() = user_id);

insert into public.apg_mcp_operators (user_id, enabled, note)
select id, true, 'Initial APG owner/operator bootstrap for private ChatGPT MCP access'
from auth.users
where (select count(*) from auth.users) = 1
on conflict (user_id) do update set enabled = true;
