-- APG eBay image lifecycle: stop repeatedly retrying stale review candidates.
--
-- Review rows are never public/display-eligible. Once the independent continuity worker has
-- failed to recover an exact replacement five consecutive times, retaining the same review row
-- only burns Browse quota on the same stale candidate. Retire it instead. The separate governed
-- discovery queue may later find a genuinely new candidate, and the retired-rediscovery boundary
-- allows that new candidate to re-enter review (never directly verified).
--
-- Verified rows are deliberately NOT auto-retired by this rule: a previously strict-verified
-- image may remain available while recovery is watched, consistent with the existing continuity
-- policy. Retailer/image status still contributes zero recommendation weight.

create or replace function public.apg_record_ebay_image_refresh_failure(
  p_proof text,
  p_slug text,
  p_error_code text
)
returns public.apg_ebay_image_state
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
declare
  current_row public.apg_ebay_image_state;
  next_delay interval;
  new_failures integer;
  retire_review boolean;
  bounded_error text := left(coalesce(nullif(p_error_code,''),'EBAY_REFRESH_FAILED'),120);
begin
  perform private.apg_require_worker_capability(p_proof);

  select * into current_row
  from public.apg_ebay_image_state
  where slug = p_slug
  for update;

  if not found then
    raise exception 'unknown image-state slug' using errcode='22023';
  end if;

  new_failures := coalesce(current_row.consecutive_failures,0) + 1;
  retire_review := current_row.status = 'review' and new_failures >= 5;

  if retire_review then
    update public.apg_ebay_image_state
    set status = 'retired',
        last_attempted_at = now(),
        next_refresh_at = now() + interval '30 days',
        claim_until = null,
        consecutive_failures = new_failures,
        recovery_required = true,
        last_error_code = left('REVIEW_RETIRED_AFTER_5_FAILURES:' || bounded_error,120),
        updated_at = now()
    where slug = p_slug
    returning * into current_row;
    return current_row;
  end if;

  next_delay := case
    when coalesce(current_row.consecutive_failures,0) = 0 then interval '20 minutes'
    when coalesce(current_row.consecutive_failures,0) = 1 then interval '30 minutes'
    else interval '45 minutes'
  end;

  update public.apg_ebay_image_state
  set last_attempted_at = now(),
      next_refresh_at = now() + next_delay,
      claim_until = null,
      consecutive_failures = new_failures,
      recovery_required = true,
      last_error_code = bounded_error,
      updated_at = now()
  where slug = p_slug
  returning * into current_row;

  return current_row;
end;
$function$;

comment on function public.apg_record_ebay_image_refresh_failure(text,text,text) is
'Capability-gated eBay image continuity failure recorder. Review candidates retire after five consecutive failed exact recoveries to prevent repeated quota churn; verified rows retain the existing recovery-watch behaviour.';

-- Reconcile the currently held review rows that have already reached the new lifecycle threshold.
-- They remain stored for audit but become non-display retired candidates. Their existing discovery
-- queue rows are preserved, so only the governed worker can attempt a genuinely fresh candidate.
update public.apg_ebay_image_state
set status = 'retired',
    next_refresh_at = now() + interval '30 days',
    claim_until = null,
    recovery_required = true,
    last_error_code = left('REVIEW_RETIRED_AFTER_5_FAILURES:' || coalesce(nullif(last_error_code,''),'EBAY_RECOVERY_NO_EXACT_MATCH'),120),
    updated_at = now()
where status = 'review'
  and consecutive_failures >= 5;
