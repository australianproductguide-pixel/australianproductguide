-- APG eBay image safety boundary: known Zojirushi NS-ZCC10 low-voltage imports are not AU heroes.
--
-- A retired NS-ZCC10 row had correctly recorded APG_REGIONAL_VOLTAGE_MISMATCH_120V, but a
-- later discovery pass found another exact-model eBay AU listing whose title explicitly stated
-- 120V and allowed it to reach non-display review. Keep the persistence boundary fail-closed:
-- this APG product may not enter review/verified image state from an eBay listing advertising
-- 100V, 110V or 120V. A future genuinely Australian-compatible candidate can still be discovered.
-- No recommendation weighting is changed.

create or replace function private.apg_reject_ebay_regional_voltage_image_state()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
begin
  if new.status in ('review','verified')
     and new.slug='zojirushi-ns-zcc10-rice-cooker'
     and lower(coalesce(new.title,'')) ~ '(^|[^0-9])(100|110|120)[[:space:]]*v([^0-9]|$)' then
    raise exception 'APG_REGIONAL_VOLTAGE_MISMATCH_LOW_VOLTAGE_IMPORT'
      using errcode='22023';
  end if;
  return new;
end;
$function$;

drop trigger if exists apg_reject_ebay_regional_voltage_image_state on public.apg_ebay_image_state;
create trigger apg_reject_ebay_regional_voltage_image_state
before insert or update of status,title,item_id,legacy_item_id,image_url
on public.apg_ebay_image_state
for each row
execute function private.apg_reject_ebay_regional_voltage_image_state();

update public.apg_ebay_image_state
set status='retired',
    recovery_required=true,
    claim_until=null,
    next_refresh_at=now()+interval '30 days',
    last_error_code='APG_REGIONAL_VOLTAGE_MISMATCH_120V',
    updated_at=now()
where slug='zojirushi-ns-zcc10-rice-cooker'
  and lower(coalesce(title,'')) ~ '(^|[^0-9])(100|110|120)[[:space:]]*v([^0-9]|$)';

update private.apg_ebay_image_discovery_state
set last_status='no-match',
    last_error_code='APG_REGIONAL_VOLTAGE_MISMATCH_120V',
    next_attempt_at=greatest(next_attempt_at,now()+interval '30 days'),
    claim_until=null,
    updated_at=now()
where slug='zojirushi-ns-zcc10-rice-cooker';

comment on function private.apg_reject_ebay_regional_voltage_image_state() is
'Fail-closed APG eBay image-state trigger for known regional-voltage hazards. NS-ZCC10 listings explicitly advertising 100V/110V/120V cannot enter review or verified image state.';
