-- APG governed product imagery: targeted Anker 547 rescan under exact guard v3.1.
--
-- eBay AU item 405185320395 remains the only evidence-backed direct named-identity item. Guard
-- v3.1 permits named identity fallback only when the exact APG slug, exact Browse item ID,
-- verified-direct retrieval path and product-scoped host-compatibility/category controls all match.
-- This does not bypass title/category/sibling/bundle/voltage/condition/AUD-price/URL/active-listing
-- checks or the independent second-pass verification gate. Recommendation/commercial weight = 0.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'GUARD_V31_VERIFIED_DIRECT_NAMED_RESCAN',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'anker-547-usb-c-hub-7-in-2';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'ANKER_547_GUARD_V3_1_RESCAN: exact official item 405185320395; direct named-identity fallback only after product-scoped host/category controls');
end;
$$;
