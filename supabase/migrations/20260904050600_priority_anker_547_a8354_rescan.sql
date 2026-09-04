-- APG governed product imagery: targeted Anker 547 USB-C Hub rescan.
--
-- Anker's official product/support evidence maps the 547 USB-C Hub (7-in-2, for MacBook) to
-- model A8354. Search Plan v1.5 now uses A8354 as a retrieval alias for this exact APG product.
-- This only improves retrieval: exact-product, family/variant, condition, Australian-market and
-- independent second-pass controls remain mandatory before imagery can become public.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'VERIFIED_MODEL_RESCAN_A8354',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'anker-547-usb-c-hub-7-in-2';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'ANKER_547_VERIFIED_MODEL_RESCAN: official Anker model A8354; exact-product acceptance controls unchanged');
end;
$$;
