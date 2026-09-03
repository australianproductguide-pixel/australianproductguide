-- APG eBay image safety boundary: palm/wrist rests are accessories, never product heroes.
--
-- A Keychron K2 Pro rediscovery result exposed a vocabulary gap in the JavaScript accessory
-- classifier: an exact-model-compatible silicone palm rest could carry the target model in eBay
-- item specifics and therefore reach non-display review. Keep the public system fail-closed at
-- the data boundary as well. Any attempt to write a palm/wrist-rest listing into review or
-- verified state is rejected regardless of caller. The current bad review row is retired and
-- its discovery retry is backed off so quota is not immediately spent rediscovering the same
-- accessory. Retailer/image state continues to contribute zero recommendation weight.

create or replace function private.apg_reject_ebay_accessory_image_state()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
begin
  if new.status in ('review','verified')
     and lower(coalesce(new.title,'')) ~ '(palm|wrist)[[:space:]-]*rest' then
    raise exception 'APG_EBAY_ACCESSORY_TITLE:palm-or-wrist-rest'
      using errcode='22023';
  end if;
  return new;
end;
$function$;

drop trigger if exists apg_reject_ebay_accessory_image_state on public.apg_ebay_image_state;
create trigger apg_reject_ebay_accessory_image_state
before insert or update of status,title,item_id,legacy_item_id,image_url
on public.apg_ebay_image_state
for each row
execute function private.apg_reject_ebay_accessory_image_state();

update public.apg_ebay_image_state
set status='retired',
    recovery_required=true,
    claim_until=null,
    next_refresh_at=now()+interval '30 days',
    last_error_code='RETIRED_ACCESSORY_TITLE_PALM_REST',
    updated_at=now()
where slug='keychron-k2-pro'
  and lower(coalesce(title,'')) ~ '(palm|wrist)[[:space:]-]*rest';

update private.apg_ebay_image_discovery_state
set last_status='no-match',
    last_error_code='ACCESSORY_TITLE_PALM_REST',
    next_attempt_at=greatest(next_attempt_at,now()+interval '7 days'),
    claim_until=null,
    updated_at=now()
where slug='keychron-k2-pro';

comment on function private.apg_reject_ebay_accessory_image_state() is
'Fail-closed APG eBay image-state trigger: palm-rest and wrist-rest accessory listings cannot enter review or verified image state.';
