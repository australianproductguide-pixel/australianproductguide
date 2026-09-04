-- APG product-image completion v1.2
-- Owner objective: move the maintained catalogue toward genuine product photography for every product.
--
-- Safety invariants are unchanged:
-- * public page requests make zero live eBay Browse calls;
-- * the worker remains single-flight and capability-gated;
-- * per-run product limits and the 500-call Browse reserve remain enforced in application code;
-- * candidates must pass independent second-pass exact-product verification before becoming public;
-- * retailer/image availability contributes zero recommendation points.
--
-- This migration only increases the background cadence from 15 to 10 minutes and brings unresolved
-- products forward for re-evaluation under Search Plan v1.2. It does not weaken match thresholds.

do $$
begin
  perform cron.unschedule('apg-ebay-image-cycle-v1');
exception
  when others then null;
end;
$$;

select cron.schedule(
  'apg-ebay-image-cycle-v1',
  '*/10 * * * *',
  'select private.apg_dispatch_ebay_image_cycle();'
);

update private.apg_ebay_image_discovery_state d
set next_attempt_at = least(
      d.next_attempt_at,
      now()
        + interval '2 minutes'
        + (mod(abs(hashtext(d.slug)::bigint), 720) * interval '1 minute')
    ),
    updated_at = now()
where (d.claim_until is null or d.claim_until <= now())
  and not exists (
    select 1
    from public.apg_ebay_image_state s
    where s.slug=d.slug
      and s.status='verified'
      and s.detail_verified=true
      and s.exact_model=true
      and s.recommendation_weight=0
  );

insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
values('idle',0,0,null,'SEARCH_PLAN_V1_2_COMPLETION_RESCAN: unresolved catalogue re-staggered across 12h; scheduler 10m; safeguards unchanged');
