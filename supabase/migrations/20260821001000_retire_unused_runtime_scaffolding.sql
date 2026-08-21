-- APG ecosystem reconciliation v57.
-- These three tables are empty, have no current server/Edge runtime references,
-- and represent unactivated scaffolding rather than current Production capability.
-- Historical create migrations remain intact for auditability/reconstruction.

drop table if exists public.apg_price_alert_preferences;
drop table if exists public.apg_retailer_observations;
drop table if exists public.apg_user_preferences;
