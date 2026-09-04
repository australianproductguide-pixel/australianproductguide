-- APG Search Plan v1.5 targeted completion rescan.
--
-- Search Plan v1.5 adds evidence-backed retrieval identifiers without weakening any acceptance
-- rule. Current evidence added on 4 Sep 2026:
--   JBL Flip 7: eBay AU product ID 4085773786 (MPN FLIP7)
--   Belkin BoostCharge Pro Qi2 15W pad: manufacturer model family WIA011
--   UGREEN Nexode Power Bank 12000mAh 100W: manufacturer SKU 35526
-- NOCO GB40 and Corsair HS55 already have verified ePIDs in the same register and remain queued.
--
-- Historical discovery attempts are not erased except for JBL Flip 7, whose retrieval mechanism
-- materially changed from generic text search to a verified ePID. Exact-product guard, independent
-- second pass, single-flight dispatch and the 500-call Browse reserve remain mandatory.

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set attempts = case when slug='jbl-flip-7' then 0 else attempts end,
      next_attempt_at = least(next_attempt_at, planned_at + (
        case slug
          when 'jbl-flip-7' then 0
          when 'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad' then 1
          when 'ugreen-nexode-power-bank-12000mah-100w' then 2
          when 'noco-boost-plus-gb40' then 3
          when 'corsair-hs55-stereo' then 4
          else 30
        end * interval '1 second'
      )),
      claim_until = null,
      updated_at = now()
  where slug in (
    'jbl-flip-7',
    'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad',
    'ugreen-nexode-power-bank-12000mah-100w',
    'noco-boost-plus-gb40',
    'corsair-hs55-stereo'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'SEARCH_PLAN_V1_5_PRIORITY_RESCAN: verified ePID/model identifiers for JBL/Belkin/UGREEN plus existing NOCO/Corsair ePIDs');
end;
$$;
