-- APG governed product imagery: targeted Anker 547 rescan under discovery v2.7 / guard v3.2.
--
-- The previous evidence-backed direct eBay AU item 405185320395 is now reported ended by Browse
-- and is superseded. Current public eBay AU search evidence on 4 Sep 2026 exposes Brand New item
-- 398051289895 with the exact marketed identity "Anker 547 USB-C Hub (7-In-2)" and compatible-host
-- wording. Anker AU / Anker Support independently map this marketed product to model A8371.
--
-- Worker v2.7 retrieves only this evidence-bound item directly. Guard v3.2 permits the named-model
-- fallback only for this exact APG slug + Browse item ID after the product-scoped host-compatibility
-- and safe USB-hub category checks. All title/category/sibling/bundle/voltage/condition/AUD-price/
-- URL/active-listing controls and the independent second pass remain mandatory. Recommendation and
-- affiliate/commercial weight remain zero.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'DISCOVERY_V27_GUARD_V32_CURRENT_DIRECT_RESCAN',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'anker-547-usb-c-hub-7-in-2';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'ANKER_547_V27_V32_RESCAN: supersede ended 405185320395 with current exact item 398051289895; fail-closed controls unchanged');
end;
$$;
