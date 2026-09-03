-- APG governed eBay image discovery: one-time legacy v2.1 revalidation cohort.
--
-- The current discovery/verification lineage is materially stronger than the earlier v2.1
-- attempt recorded for a cohort of unresolved products: upstream accessory and low-voltage
-- rejection, exact worker/renderer parity, retired-row recovery, independent second pass,
-- a 500-call reserve and a single-flight scheduler are now live.
--
-- Re-open only legacy v2.1 REVIEW outcomes that still have no verified/review image state.
-- Stagger no more than three products into each 30-minute scheduler window so this cannot
-- create a burst, bypass the current worker quota reserve or make public rendering depend on eBay.
-- The existing attempts/status/error history is retained; only next_attempt_at is advanced.

do $$
declare
  v_requeued integer := 0;
begin
  with eligible as (
    select
      d.slug,
      row_number() over (
        order by d.attempts asc, d.next_attempt_at asc, d.slug asc
      ) as rn
    from private.apg_ebay_image_discovery_state d
    where d.last_status='review'
      and d.last_error_code='DISCOVERY_V21_NOT_ACCEPTED'
      and (d.claim_until is null or d.claim_until <= now())
      and not exists (
        select 1
        from public.apg_ebay_image_state s
        where s.slug=d.slug
          and s.status in ('verified','review')
          and s.detail_verified=true
          and s.recommendation_weight=0
      )
  ), updated as (
    update private.apg_ebay_image_discovery_state d
    set next_attempt_at = least(
          d.next_attempt_at,
          now() + (floor((e.rn-1)/3.0) * interval '30 minutes')
        ),
        claim_until = null,
        updated_at = now()
    from eligible e
    where d.slug=e.slug
    returning d.slug
  )
  select count(*) into v_requeued from updated;

  insert into private.apg_ebay_image_cycle_log(
    action,due_discovery,due_review,request_id,note
  ) values (
    'idle',0,0,null,
    format('one-time legacy v2.1 revalidation cohort scheduled: %s unresolved products, three per 30-minute window',v_requeued)
  );
end;
$$;