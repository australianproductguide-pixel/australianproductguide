-- APG 482-product image completion programme: one-time Search Plan v1 rescan.
--
-- The production discovery worker has moved from v2.3 to v2.4, with broader exact-model,
-- product-name, category-hint, explicit-alias, source-model, GTIN and ePID search plans.
-- This migration brings every unresolved catalogue product forward for one controlled pass under
-- the materially improved search plan, while preserving the existing single-flight scheduler,
-- per-product attempt history, independent second pass and 500-call daily quota reserve.
--
-- The 300 unresolved/retired products are deterministically staggered across 48 hours rather
-- than released as one burst. At the current scheduler limit of three products per 30-minute
-- cycle, this remains within six products per hour and cannot create a public page dependency.

do $$
declare
  affected integer := 0;
  planned_at timestamptz := now();
begin
  update private.apg_ebay_image_discovery_state d
  set next_attempt_at = least(
        d.next_attempt_at,
        planned_at
          + interval '5 minutes'
          + (mod(abs(hashtext(d.slug)::bigint), 2880) * interval '1 minute')
      ),
      updated_at = now()
  where (d.claim_until is null or d.claim_until <= now())
    and not exists (
      select 1
      from public.apg_ebay_image_state s
      where s.slug=d.slug
        and s.status in ('verified','review')
        and s.detail_verified=true
        and s.recommendation_weight=0
    );

  get diagnostics affected = row_count;

  insert into private.apg_ebay_image_cycle_log(
    action,due_discovery,due_review,request_id,note
  ) values (
    'idle',0,0,null,
    format('SEARCH_PLAN_V1_RESCAN_SCHEDULED:%s unresolved products across 48 hours',affected)
  );
end;
$$;
