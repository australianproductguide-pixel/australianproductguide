-- APG eBay image registry: safely allow a retired product to be rediscovered.
--
-- A retired row is deliberately non-displayable. The discovery worker may later find a new
-- candidate that passes the current exact-model, regional/product-safety and hero-eligibility
-- guards, but the original insert-only RPC rejected that candidate because the slug already
-- existed. This migration allows only status='retired' rows to re-enter status='review'.
-- They remain non-displayable until the independent second-pass worker verifies them again.
-- Existing verified/review rows continue to reject duplicate discovery writes.

create or replace function public.apg_insert_ebay_image_state(p_proof text, p_payload jsonb)
returns public.apg_ebay_image_state
language plpgsql
security definer
set search_path to 'public', 'private', 'extensions', 'pg_catalog'
as $function$
declare
  out_row public.apg_ebay_image_state;
  existing_row public.apg_ebay_image_state;
  v_slug text := coalesce(p_payload->>'slug','');
  v_product_name text := coalesce(p_payload->>'productName','');
  v_item_id text := coalesce(p_payload->>'itemId','');
  v_legacy_id text := coalesce(p_payload->>'legacyItemId','');
  v_image text := coalesce(p_payload->>'imageUrl','');
  v_item_url text := coalesce(p_payload->>'itemWebUrl','');
  v_currency text := coalesce(p_payload#>>'{price,currency}','');
  v_verified_at timestamptz;
begin
  perform private.apg_require_worker_capability(p_proof);

  if v_slug !~ '^[a-z0-9][a-z0-9-]{1,160}$' or v_product_name='' then
    raise exception 'invalid APG product identity' using errcode='22023';
  end if;
  if coalesce((p_payload->>'detailVerified')::boolean,false) is distinct from true
     or coalesce((p_payload->>'exactModel')::boolean,false) is distinct from true
     or coalesce((p_payload->>'heroEligible')::boolean,false) is distinct from true
     or coalesce((p_payload->>'recommendationWeight')::integer,1) <> 0 then
    raise exception 'discovery payload is not strict exact zero-weight evidence' using errcode='22023';
  end if;
  if coalesce(p_payload->>'verificationLevel','') not in ('detail-model-evidence','detail-title-model') then
    raise exception 'unsupported verification level' using errcode='22023';
  end if;
  if v_item_id='' or v_legacy_id !~ '^[0-9]{6,24}$' then
    raise exception 'missing eBay item identity' using errcode='22023';
  end if;
  if v_image !~ '^https://i[.]ebayimg[.]com/' then
    raise exception 'unsupported eBay image URL' using errcode='22023';
  end if;
  if v_item_url !~ ('^https://www[.]ebay[.]com[.]au/itm/(?:[^/]+/)?' || v_legacy_id || '(?:$|[/?])') then
    raise exception 'unsupported eBay item URL' using errcode='22023';
  end if;
  if v_currency <> 'AUD' then
    raise exception 'discovery price must be AUD' using errcode='22023';
  end if;

  v_verified_at := coalesce(nullif(p_payload->>'verifiedAt','')::timestamptz,now());
  if v_verified_at > now()+interval '5 minutes' or v_verified_at < now()-interval '20 minutes' then
    raise exception 'discovery verification time outside allowed window' using errcode='22023';
  end if;

  select * into existing_row
  from public.apg_ebay_image_state
  where slug=v_slug
  for update;

  if found and existing_row.status <> 'retired' then
    raise exception 'image state already exists' using errcode='23505';
  end if;

  if found then
    update public.apg_ebay_image_state
    set product_name=v_product_name,
        marketplace_id='EBAY_AU',
        source='eBay Buy Browse API',
        status='review',
        detail_verified=true,
        exact_model=true,
        verification_level=p_payload->>'verificationLevel',
        verification_evidence=coalesce(p_payload->'verificationEvidence','{}'::jsonb),
        item_id=v_item_id,
        legacy_item_id=v_legacy_id,
        title=coalesce(p_payload->>'title',''),
        condition=coalesce(p_payload->>'condition',''),
        price_value=nullif(p_payload#>>'{price,value}',''),
        price_currency=v_currency,
        image_url=v_image,
        image_source=coalesce(nullif(p_payload->>'imageSource',''),'ebay-listing'),
        item_web_url=v_item_url,
        item_affiliate_web_url=nullif(p_payload->>'itemAffiliateWebUrl',''),
        match_score=nullif(p_payload->>'matchScore','')::numeric,
        match_reasons=coalesce(p_payload->'matchReasons','[]'::jsonb),
        match_flags=coalesce(p_payload->'matchFlags','[]'::jsonb),
        recommendation_weight=0,
        last_verified_at=v_verified_at,
        last_attempted_at=now(),
        next_refresh_at=now(),
        claim_until=null,
        consecutive_failures=0,
        recovery_required=false,
        last_error_code='PENDING_SECOND_PASS_REVIEW',
        updated_at=now()
    where slug=v_slug
    returning * into out_row;
    return out_row;
  end if;

  insert into public.apg_ebay_image_state(
    slug,product_name,marketplace_id,source,status,detail_verified,exact_model,verification_level,verification_evidence,
    item_id,legacy_item_id,title,condition,price_value,price_currency,image_url,image_source,item_web_url,item_affiliate_web_url,
    match_score,match_reasons,match_flags,recommendation_weight,last_verified_at,last_attempted_at,next_refresh_at,claim_until,
    consecutive_failures,recovery_required,last_error_code
  ) values (
    v_slug,v_product_name,'EBAY_AU','eBay Buy Browse API','review',true,true,p_payload->>'verificationLevel',coalesce(p_payload->'verificationEvidence','{}'::jsonb),
    v_item_id,v_legacy_id,coalesce(p_payload->>'title',''),coalesce(p_payload->>'condition',''),nullif(p_payload#>>'{price,value}',''),v_currency,
    v_image,coalesce(nullif(p_payload->>'imageSource',''),'ebay-listing'),v_item_url,nullif(p_payload->>'itemAffiliateWebUrl',''),
    nullif(p_payload->>'matchScore','')::numeric,coalesce(p_payload->'matchReasons','[]'::jsonb),coalesce(p_payload->'matchFlags','[]'::jsonb),0,
    v_verified_at,now(),now(),null,0,false,'PENDING_SECOND_PASS_REVIEW'
  ) returning * into out_row;
  return out_row;
end;
$function$;

comment on function public.apg_insert_ebay_image_state(text,jsonb) is
'Capability-gated strict eBay image discovery write. New slugs enter review. Retired slugs may be safely rediscovered into review only after the worker supplies strict exact-model, hero-eligible, zero-weight evidence; verified/review duplicates remain rejected.';
