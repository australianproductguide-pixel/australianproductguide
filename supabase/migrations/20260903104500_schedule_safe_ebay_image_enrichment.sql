-- APG governed eBay product-image enrichment scheduler v1.
--
-- Goal: continue exact-product image discovery automatically without ever making public page
-- delivery depend on eBay and without allowing overlapping workers to race the same quota reserve.
--
-- Controls:
--   * one active dispatch capability at a time across discovery and second-pass verification;
--   * expired capabilities are removed automatically;
--   * no HTTP worker call is made when nothing eligible is due;
--   * second-pass review is prioritised before new discovery;
--   * the existing worker-level 500-call Browse reserve and queue back-off remain authoritative;
--   * the scheduler runs every 30 minutes, which bounds maximum worker frequency;
--   * public browsing remains registry-only and makes no eBay Browse calls.

create table if not exists private.apg_ebay_image_cycle_log (
  id bigint generated always as identity primary key,
  cycle_at timestamptz not null default now(),
  action text not null check (action in ('discovery','second-pass','idle','busy')),
  due_discovery integer not null default 0,
  due_review integer not null default 0,
  request_id bigint,
  note text
);

revoke all on table private.apg_ebay_image_cycle_log from public, anon, authenticated;

create or replace function private.apg_dispatch_ebay_image_refresh()
returns bigint
language plpgsql
security definer
set search_path to 'private', 'extensions', 'net', 'pg_catalog'
as $function$
declare
  trigger_token text;
  worker_token text;
  request_id bigint;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('apg-ebay-image-dispatch',0)) then
    return 0;
  end if;

  delete from private.apg_ebay_refresh_capabilities where expires_at <= now();

  if exists (
    select 1 from private.apg_ebay_refresh_capabilities
    where expires_at > now()
  ) then
    return 0;
  end if;

  trigger_token := encode(extensions.gen_random_bytes(32), 'hex');
  worker_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.apg_ebay_refresh_capabilities(trigger_sha256,worker_sha256,expires_at)
  values (
    encode(extensions.digest(trigger_token,'sha256'),'hex'),
    encode(extensions.digest(worker_token,'sha256'),'hex'),
    now() + interval '20 minutes'
  );

  select net.http_post(
    url := 'https://australianproductguide.au/api/ebay-image-discovery-v2',
    body := jsonb_build_object('triggerToken',trigger_token,'workerToken',worker_token),
    headers := jsonb_build_object('Content-Type','application/json','User-Agent','APG-Supabase-Image-Discovery/2.0'),
    timeout_milliseconds := 10000
  ) into request_id;

  return request_id;
end;
$function$;

create or replace function private.apg_dispatch_ebay_image_second_pass()
returns bigint
language plpgsql
security definer
set search_path to 'private', 'extensions', 'net', 'pg_catalog'
as $function$
declare
  trigger_token text;
  worker_token text;
  request_id bigint;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('apg-ebay-image-dispatch',0)) then
    return 0;
  end if;

  delete from private.apg_ebay_refresh_capabilities where expires_at <= now();

  if exists (
    select 1 from private.apg_ebay_refresh_capabilities
    where expires_at > now()
  ) then
    return 0;
  end if;

  trigger_token := encode(extensions.gen_random_bytes(32), 'hex');
  worker_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.apg_ebay_refresh_capabilities(trigger_sha256,worker_sha256,expires_at)
  values (
    encode(extensions.digest(trigger_token,'sha256'),'hex'),
    encode(extensions.digest(worker_token,'sha256'),'hex'),
    now() + interval '20 minutes'
  );

  select net.http_post(
    url := 'https://australianproductguide.au/api/ebay-image-refresh',
    body := jsonb_build_object('triggerToken',trigger_token,'workerToken',worker_token),
    headers := jsonb_build_object('Content-Type','application/json','User-Agent','APG-Supabase-Image-Second-Pass/1.0'),
    timeout_milliseconds := 10000
  ) into request_id;

  return request_id;
end;
$function$;

create or replace function private.apg_dispatch_ebay_image_cycle()
returns jsonb
language plpgsql
security definer
set search_path to 'private', 'public', 'extensions', 'net', 'pg_catalog'
as $function$
declare
  lock_ok boolean;
  active_capabilities integer := 0;
  due_discovery integer := 0;
  due_review integer := 0;
  request_id bigint := null;
  action text := 'idle';
  result jsonb;
begin
  lock_ok := pg_try_advisory_xact_lock(hashtextextended('apg-ebay-image-dispatch',0));
  if not lock_ok then
    insert into private.apg_ebay_image_cycle_log(action,note)
    values ('busy','advisory lock held by another dispatcher');
    return jsonb_build_object('ok',true,'status','busy');
  end if;

  delete from private.apg_ebay_refresh_capabilities where expires_at <= now();

  select count(*) into active_capabilities
  from private.apg_ebay_refresh_capabilities
  where expires_at > now();

  if active_capabilities > 0 then
    insert into private.apg_ebay_image_cycle_log(action,note)
    values ('busy','active worker capability already exists');
    return jsonb_build_object('ok',true,'status','busy','activeCapabilities',active_capabilities);
  end if;

  select count(*) into due_review
  from public.apg_ebay_image_state s
  where s.status='review'
    and s.detail_verified=true
    and s.exact_model=true
    and s.recommendation_weight=0
    and s.next_refresh_at <= now()
    and (s.claim_until is null or s.claim_until <= now());

  select count(*) into due_discovery
  from private.apg_ebay_image_discovery_state d
  where d.next_attempt_at <= now()
    and (d.claim_until is null or d.claim_until <= now())
    and not exists (
      select 1
      from public.apg_ebay_image_state s
      where s.slug=d.slug
        and s.status in ('verified','review')
        and s.detail_verified=true
        and s.recommendation_weight=0
    );

  if due_review > 0 then
    action := 'second-pass';
    request_id := private.apg_dispatch_ebay_image_second_pass();
  elsif due_discovery > 0 then
    action := 'discovery';
    request_id := private.apg_dispatch_ebay_image_refresh();
  else
    action := 'idle';
  end if;

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values (
    action,
    due_discovery,
    due_review,
    nullif(request_id,0),
    case when request_id=0 then 'dispatch suppressed by single-flight guard' else null end
  );

  delete from private.apg_ebay_image_cycle_log
  where cycle_at < now() - interval '14 days';

  result := jsonb_build_object(
    'ok',true,
    'status',case when request_id=0 then 'busy' else action end,
    'dueDiscovery',due_discovery,
    'dueReview',due_review,
    'requestId',nullif(request_id,0)
  );
  return result;
end;
$function$;

revoke all on function private.apg_dispatch_ebay_image_cycle() from public, anon, authenticated;

select cron.unschedule('apg-ebay-image-cycle-v1')
where exists (select 1 from cron.job where jobname='apg-ebay-image-cycle-v1');

select cron.schedule(
  'apg-ebay-image-cycle-v1',
  '*/30 * * * *',
  $$select private.apg_dispatch_ebay_image_cycle();$$
);

comment on function private.apg_dispatch_ebay_image_cycle() is
'APG governed eBay image scheduler. Runs at most one capability-gated worker at a time, prioritises non-display review verification, respects queue back-off, and makes no worker call when nothing is due.';
