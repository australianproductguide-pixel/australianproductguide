alter policy "mcp operators can read own access"
on public.apg_mcp_operators
to authenticated
using ((select auth.uid()) = user_id);
