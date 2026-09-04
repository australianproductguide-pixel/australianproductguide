-- APG governed product imagery: targeted Anker 547 rescan under discovery worker v2.6 / guard v3.0.
--
-- The verified Anker Official Store AU listing (item 405185320395) contains the legitimate
-- whole-product wording "Compatible with ..." after the exact marketed product identity. That
-- wording was conservatively caught by the generic accessory-language screen. Guard v3.0 now has
-- a product-scoped exception requiring the exact Anker 547 identity and safe USB-hub marketplace
-- leaf, and strips only the trailing host-compatibility clause for internal guard evaluation.
-- Worker v2.6 permits this exception only for the evidence-backed direct item. All normal exact
-- identity, category, sibling, bundle, condition, AUD-price, active-listing and second-pass checks
-- remain mandatory.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'DISCOVERY_V26_HOST_COMPATIBILITY_RESCAN',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'anker-547-usb-c-hub-7-in-2';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'ANKER_547_V26_RESCAN: product-scoped host-compatibility exception for verified direct item 405185320395; fail-closed controls unchanged');
end;
$$;
