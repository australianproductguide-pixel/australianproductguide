-- APG Search Plan v1.3 targeted completion rescan.
--
-- These unresolved products are known to materially benefit from v1.3 query normalisation:
-- * Philips BT5515/15: legitimate manufacturer slash-model notation is now retained and a
--   conservative BT5515 base alias is also searched.
-- * VIOFO A329: leading brand duplication is removed from model hints before query assembly.
--
-- This only advances their background discovery timestamps. Exact-product acceptance,
-- second-pass verification, single-flight execution and the 500-call quota reserve are unchanged.

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set next_attempt_at = case slug
        when 'philips-beardtrimmer-series-5000-bt5515-15' then planned_at
        when 'viofo-a329' then planned_at + interval '2 minutes'
        else next_attempt_at
      end,
      claim_until = null,
      updated_at = now()
  where slug in (
    'philips-beardtrimmer-series-5000-bt5515-15',
    'viofo-a329'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'SEARCH_PLAN_V1_3_TARGET_RESCAN: Philips BT5515/15 slash-model + VIOFO A329 brand normalisation');
end;
$$;
