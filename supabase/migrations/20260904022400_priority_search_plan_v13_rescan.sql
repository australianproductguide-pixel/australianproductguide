-- APG Search Plan v1.3 priority rescan.
--
-- The two rows below exhausted many attempts under materially older search-plan behaviour.
-- Their historical attempt counts are preserved in this migration and the cycle log; resetting
-- only the operational retry counter gives the changed v1.3 query logic one immediate bounded pass.
-- It does not bypass exact-product acceptance, second-pass verification, single-flight execution
-- or the 500-call Browse reserve.
--
-- Prior operational attempts at authoring time:
--   Philips Beardtrimmer BT5515/15: 9
--   VIOFO A329: 8

do $$
declare
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state
  set attempts = 0,
      next_attempt_at = case slug
        when 'philips-beardtrimmer-series-5000-bt5515-15' then planned_at
        when 'viofo-a329' then planned_at + interval '1 second'
        else next_attempt_at
      end,
      claim_until = null,
      updated_at = now()
  where slug in (
    'philips-beardtrimmer-series-5000-bt5515-15',
    'viofo-a329'
  );

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'SEARCH_PLAN_V1_3_PRIORITY_RESCAN: reset operational retry priority only; historical attempts Philips=9, VIOFO=8');
end;
$$;
