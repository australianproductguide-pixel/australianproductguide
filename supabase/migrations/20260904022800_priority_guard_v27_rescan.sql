-- APG exact-image guard v2.7 targeted rescan.
--
-- These products previously reached plausible eBay whole-product candidates but were rejected
-- because a broad parent marketplace category contained the word "Accessories". Guard v2.7 now
-- permits only a known whole-product terminal leaf for the corresponding APG category, then
-- re-runs the complete exact-product guard. It does not permit an accessory/parts leaf and does
-- not weaken title, model, bundle, pack, voltage, condition, URL, AUD-price or listing-state checks.
--
-- Historical operational attempts before this priority pass:
--   VIOFO A329: 1 under the latest v1.3 pass (plus older attempts recorded in prior migrations)
--   Logitech C920s HD Pro Webcam: 9
--   UGREEN Nexode Power Bank 12000mAh 100W: 3

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      next_attempt_at = case slug
        when 'viofo-a329' then planned_at
        when 'logitech-c920s-hd-pro-webcam' then planned_at + interval '1 second'
        when 'ugreen-nexode-power-bank-12000mah-100w' then planned_at + interval '2 seconds'
        else next_attempt_at
      end,
      claim_until = null,
      updated_at = now()
  where slug in (
    'viofo-a329',
    'logitech-c920s-hd-pro-webcam',
    'ugreen-nexode-power-bank-12000mah-100w'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'GUARD_V2_7_PRIORITY_RESCAN: VIOFO A329 + Logitech C920s + UGREEN Nexode; historical latest attempts 1/9/3 recorded in migration');
end;
$$;
