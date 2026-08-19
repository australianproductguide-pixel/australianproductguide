-- APG least-privilege hardening.
-- RLS remains the row-level control while table grants are limited to operations
-- the authenticated client actually needs. Anonymous users have no table grants
-- on private APG account data.

revoke all privileges on table public.apg_workspace_items from anon;
revoke all privileges on table public.apg_user_preferences from anon;
revoke all privileges on table public.apg_price_alert_preferences from anon;

revoke truncate, references, trigger on table public.apg_workspace_items from authenticated;
revoke truncate, references, trigger on table public.apg_user_preferences from authenticated;
revoke truncate, references, trigger on table public.apg_price_alert_preferences from authenticated;

grant select, insert, update, delete on table public.apg_workspace_items to authenticated;
grant select, insert, update, delete on table public.apg_user_preferences to authenticated;
grant select, insert, update, delete on table public.apg_price_alert_preferences to authenticated;
