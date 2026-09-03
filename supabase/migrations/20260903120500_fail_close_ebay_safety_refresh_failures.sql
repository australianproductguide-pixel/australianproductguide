-- APG governed eBay image lifecycle: fail closed on non-transient identity/safety failures.
--
-- A previously verified image may later fail a fresh eBay detail check because the listing changed,
-- item specifics reveal a different model/variant, or the maintained guard becomes more precise.
-- Such failures must not remain display-eligible while recovery is attempted. Move verified rows to
-- non-display review immediately for identity, accessory, condition, parts-category, brand, variant,
-- price/media and hero-guard failures. Network/time-out/rate-limit failures retain the prior verified
-- row temporarily and continue ordinary bounded retry behaviour.

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
  safety_failure boolean;
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
  safety_failure := bounded_error in (
    'EBAY_DETAIL_IDENTITY_MISMATCH',
    'EBAY_DETAIL_ACCESSORY',
    'EBAY_DETAIL_USED',
    'EBAY_DETAIL_PARTS_CATEGORY',
    'EBAY_DETAIL_VARIANT_MISMATCH',
    'EBAY_DETAIL_BRAND_MISMATCH',
    'EBAY_DETAIL_PRICE_INVALID',
    'EBAY_DETAIL_MEDIA_MISSING',
    'EBAY_HERO_GUARD_REJECTED'
  );

  if current_row.status = 'verified' and safety_failure then
    update public.apg_ebay_image_state
    set status = 'review',
        last_attempted_at = now(),
        next_refresh_at = now(),
        claim_until = null,
        consecutive_failures = new_failures,
        recovery_required = true,
        last_error_code = left('SAFETY_REVIEW:' || bounded_error,120),
        updated_at = now()
    where slug = p_slug
    returning * into current_row;
    return current_row;
  end if;

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

-- Reconcile current rows already identified by the latest second-pass detail check.
update public.apg_ebay_image_state
set status='review',
    next_refresh_at=now(),
    claim_until=null,
    last_error_code=left('SAFETY_REVIEW:' || last_error_code,120),
    updated_at=now()
where status='verified'
  and recovery_required=true
  and last_error_code in (
    'EBAY_DETAIL_IDENTITY_MISMATCH',
    'EBAY_DETAIL_ACCESSORY',
    'EBAY_DETAIL_USED',
    'EBAY_DETAIL_PARTS_CATEGORY',
    'EBAY_DETAIL_VARIANT_MISMATCH',
    'EBAY_DETAIL_BRAND_MISMATCH',
    'EBAY_DETAIL_PRICE_INVALID',
    'EBAY_DETAIL_MEDIA_MISSING',
    'EBAY_HERO_GUARD_REJECTED'
  );

comment on function public.apg_record_ebay_image_refresh_failure(text,text,text) is
'Capability-gated eBay image refresh failure recorder. Non-transient product-identity and safety failures move verified imagery immediately to non-display review for recovery; transient service failures retain bounded retry behaviour.';
