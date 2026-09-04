-- APG governed product imagery: Search Plan v1.6 / exact guard v2.9 targeted rescan.
--
-- Material changes on 4 Sep 2026:
--   * Anker 547 retrieval corrected to Australian model A8371 plus the exact UPC exposed by the
--     Anker Official Store eBay AU listing (194644118723), superseding the prior A8354 attempt.
--   * Brother MFC-J4440DW gains verified eBay AU product ID 20048317709.
--   * Canon PIXMA TS7760 gains Australian GTIN 4549292221350 as a retrieval alias.
--   * Exact guard v2.9 recognises the tightly bounded eBay leaf "USB Cables, Hubs & Adapters" as
--     capable of containing legitimate whole USB-C hub products, then re-runs all base identity,
--     sibling, bundle, condition, AUD-price, URL and active-listing controls.
--
-- These changes improve retrieval / remove a marketplace taxonomy false negative only. They do
-- not bypass independent second-pass verification or give retailer/affiliate data recommendation
-- weight.

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      last_status = 'review',
      last_error_code = 'SEARCH_PLAN_V16_GUARD_V29_RESCAN',
      next_attempt_at = planned_at + (
        case slug
          when 'anker-547-usb-c-hub-7-in-2' then 0
          when 'brother-mfc-j4440dw' then 1
          when 'canon-pixma-ts7760' then 2
          when 'ugreen-revodok-1071-usb-c-hub' then 3
          when 'ugreen-revodok-pro-106-usb-c-hub' then 4
          else 30
        end * interval '1 second'
      ),
      claim_until = null,
      updated_at = now()
  where slug in (
    'anker-547-usb-c-hub-7-in-2',
    'brother-mfc-j4440dw',
    'canon-pixma-ts7760',
    'ugreen-revodok-1071-usb-c-hub',
    'ugreen-revodok-pro-106-usb-c-hub'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'SEARCH_PLAN_V1_6_GUARD_V2_9_RESCAN: Anker AU identity correction; Brother ePID; Canon AU GTIN; bounded USB hub taxonomy override');
end;
$$;
