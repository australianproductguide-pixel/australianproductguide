create or replace function public.apg_mcp_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  claims jsonb;
  is_mcp_operator boolean := false;
begin
  claims := coalesce(event->'claims', '{}'::jsonb);

  if claims ? 'client_id' and nullif(claims->>'client_id','') is not null then
    select coalesce(o.enabled, false)
      into is_mcp_operator
      from public.apg_mcp_operators o
     where o.user_id = (event->>'user_id')::uuid;

    if is_mcp_operator then
      claims := jsonb_set(claims, '{aud}', to_jsonb('https://australianproductguide.au/mcp'::text), true);
      claims := jsonb_set(claims, '{apg_mcp}', 'true'::jsonb, true);
      event := jsonb_set(event, '{claims}', claims, true);
    end if;
  end if;

  return event;
end;
$$;

grant execute on function public.apg_mcp_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.apg_mcp_access_token_hook(jsonb) from authenticated, anon, public;
