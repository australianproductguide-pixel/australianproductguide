-- APG governed product imagery: targeted Anker 547 rescan under discovery worker v2.5.
--
-- eBay AU item 405185320395 was independently verified on 4 Sep 2026 as the Anker Official Store
-- listing for the exact marketed product "Anker 547 USB-C Hub (7-in-2)". It is Brand New, sold
-- directly by Anker in Australia and exposes UPC 194644118723. Search Plan v1.6 did not reliably
-- return that listing, so worker v2.5 retrieves this one evidence-backed item directly before
-- falling back to ordinary search. Direct retrieval does not bypass any detail, category,
-- family/variant, exact identity, condition, AUD-price, active-listing or second-pass control.

do $$
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'DISCOVERY_V25_VERIFIED_DIRECT_ITEM_RESCAN',
      next_attempt_at = now(),
      claim_until = null,
      updated_at = now()
  where slug = 'anker-547-usb-c-hub-7-in-2';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'ANKER_547_DIRECT_ITEM_V25_RESCAN: verified Anker Official Store AU item 405185320395; all exact-product and second-pass controls unchanged');
end;
$$;
