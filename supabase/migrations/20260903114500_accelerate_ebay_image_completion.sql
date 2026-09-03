-- APG 482-product image completion programme: controlled acceleration.
--
-- The owner has set 482/482 genuine product-photo coverage as the formal goal. This migration
-- accelerates the already governed Search Plan v1 rescan without weakening any acceptance rule.
-- It keeps one worker at a time, the existing 500-call Browse reserve, the three-product worker
-- limit, per-product history and independent second-pass verification.
--
-- Capacity design:
--   * cron every 15 minutes;
--   * at most 3 discovery products per worker;
--   * at most 10 reserved Browse calls per product under worker v2.4;
--   * theoretical discovery ceiling 2,880 calls/day, leaving material room below the 5,000-call
--     daily limit for second-pass checks while preserving the worker's 500-call hard reserve;
--   * 300 unresolved/retired products are arranged into deterministic 3-product tranches across
--     approximately 25 hours rather than released as one burst.

select cron.unschedule('apg-ebay-image-cycle-v1')
where exists (select 1 from cron.job where jobname='apg-ebay-image-cycle-v1');

select cron.schedule(
  'apg-ebay-image-cycle-v1',
  '*/15 * * * *',
  $$select private.apg_dispatch_ebay_image_cycle();$$
);

with unresolved as (
  select
    d.slug,
    row_number() over (
      order by
        case d.last_status when 'review' then 0 when 'error' then 1 when 'no-match' then 2 else 3 end,
        d.attempts asc,
        d.next_attempt_at asc,
        d.slug asc
    ) as rn
  from private.apg_ebay_image_discovery_state d
  where (d.claim_until is null or d.claim_until <= now())
    and not exists (
      select 1
      from public.apg_ebay_image_state s
      where s.slug=d.slug
        and s.status in ('verified','review')
        and s.detail_verified=true
        and s.recommendation_weight=0
    )
), scheduled as (
  select
    slug,
    now() + (floor((rn-1)::numeric / 3) * interval '15 minutes') as scheduled_at
  from unresolved
), updated as (
  update private.apg_ebay_image_discovery_state d
  set next_attempt_at=least(d.next_attempt_at,s.scheduled_at),
      updated_at=now()
  from scheduled s
  where d.slug=s.slug
  returning d.slug,d.next_attempt_at
)
insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
select
  'idle',
  count(*) filter (where next_attempt_at <= now()),
  0,
  null,
  format('SEARCH_PLAN_V1_ACCELERATED:%s unresolved products in 3-product tranches every 15 minutes',count(*))
from updated;

comment on function private.apg_dispatch_ebay_image_cycle() is
'APG governed eBay image scheduler. Runs at most one capability-gated worker at a time, prioritises non-display review verification, respects per-product back-off after each attempt, dispatches only due work, and is scheduled every 15 minutes for the controlled 482-product image completion programme.';
