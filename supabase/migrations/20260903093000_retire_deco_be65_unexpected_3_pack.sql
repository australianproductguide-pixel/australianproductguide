-- APG eBay governed image correction: TP-Link Deco BE65.
--
-- The maintained APG product identity is TP-Link Deco BE65, while the current governed image-state
-- row points to an eBay listing explicitly sold as a 3 Pack. The current exact-image worker policy
-- correctly rejects this as unexpected-pack-count. Retire the row fail-closed and back discovery
-- off so a later genuine single-unit exact candidate can safely re-enter review through the normal
-- retired-rediscovery pathway. No recommendation or retailer weighting is changed.

do $$
begin
  update public.apg_ebay_image_state
  set status='retired',
      recovery_required=true,
      claim_until=null,
      last_error_code='RETIRED_UNEXPECTED_PACK_COUNT_3_PACK',
      next_refresh_at=greatest(next_refresh_at, now() + interval '7 days'),
      updated_at=now()
  where slug='tp-link-deco-be65'
    and status='verified'
    and lower(title) like '%3 pack%';

  if not found then
    raise exception 'Deco BE65 verified 3-pack image state was not found in expected state';
  end if;

  update private.apg_ebay_image_discovery_state
  set last_status='no-match',
      last_error_code='UNEXPECTED_PACK_COUNT_3_PACK',
      next_attempt_at=greatest(next_attempt_at, now() + interval '7 days'),
      claim_until=null,
      updated_at=now()
  where slug='tp-link-deco-be65';
end;
$$;
