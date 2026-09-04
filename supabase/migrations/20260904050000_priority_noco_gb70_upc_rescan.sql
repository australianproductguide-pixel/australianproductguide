-- APG governed product imagery: targeted NOCO Boost HD GB70 rescan.
--
-- The discovery plan now includes the verified UPC 046221150056 as a retrieval alias for
-- noco-boost-hd-gb70. This materially changes candidate retrieval, so reset discovery attempts
-- for this slug and make it eligible for a fresh pass. Acceptance remains fail-closed through
-- exact-product, family/variant, condition, Australian-market and independent second-pass guards.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'VERIFIED_UPC_RESCAN_046221150056',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'noco-boost-hd-gb70';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'NOCO_GB70_VERIFIED_UPC_RESCAN: retrieval alias 046221150056; exact-product acceptance controls unchanged');
end;
$$;
