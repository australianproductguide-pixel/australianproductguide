-- APG exact-image guard v2.8 targeted rescan.
--
-- These APG products are themselves legitimate accessory/peripheral product classes and had
-- plausible whole-product eBay candidates rejected because a parent marketplace category used
-- the word "Accessories". Guard v2.8 allows only explicit APG-category/terminal-leaf pairs and
-- then re-runs every other exact-product control.
--
-- Historical latest operational attempts before this pass:
--   Anker Prime 100W GaN wall charger: 4
--   Belkin BoostCharge Pro 3-in-1 Qi2 charging stand: 9
--   Belkin BoostCharge Pro Qi2 15W charging pad: 9
--   Corsair HS55 Stereo: 9
--   NOCO Boost Plus GB40: 8
--   UGREEN Nexode 12000mAh 100W power bank: 1

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      next_attempt_at = planned_at + (
        case slug
          when 'corsair-hs55-stereo' then 0
          when 'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad' then 1
          when 'belkin-boostcharge-pro-3-in-1-qi2-charging-stand' then 2
          when 'anker-prime-100w-gan-wall-charger' then 3
          when 'noco-boost-plus-gb40' then 4
          when 'ugreen-nexode-power-bank-12000mah-100w' then 5
          else 30
        end * interval '1 second'
      ),
      claim_until = null,
      updated_at = now()
  where slug in (
    'corsair-hs55-stereo',
    'belkin-boostcharge-pro-qi2-15w-wireless-charging-pad',
    'belkin-boostcharge-pro-3-in-1-qi2-charging-stand',
    'anker-prime-100w-gan-wall-charger',
    'noco-boost-plus-gb40',
    'ugreen-nexode-power-bank-12000mah-100w'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'GUARD_V2_8_PRIORITY_RESCAN: accessory-class whole-product leaves; historical attempts 4/9/9/9/8/1 preserved in migration');
end;
$$;
