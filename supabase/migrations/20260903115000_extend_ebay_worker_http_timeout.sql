-- APG eBay image automation: align pg_net response timeout with bounded worker duration.
--
-- The first Search Plan v1 discovery tranche completed successfully inside Vercel, but the
-- dispatcher used a 10-second HTTP timeout and therefore recorded a pg_net timeout before the
-- three-product worker returned. Increase only the private server-to-server response budget to
-- 30 seconds. This does not increase product count, search breadth, eBay quota, public page
-- latency or concurrency. The single-flight capability and 500-call worker reserve remain.

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
    headers := jsonb_build_object('Content-Type','application/json','User-Agent','APG-Supabase-Image-Discovery/2.4'),
    timeout_milliseconds := 30000
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
    headers := jsonb_build_object('Content-Type','application/json','User-Agent','APG-Supabase-Image-Second-Pass/1.3'),
    timeout_milliseconds := 30000
  ) into request_id;

  return request_id;
end;
$function$;
