-- APG governed eBay image correction: RØDE NT-USB+.
--
-- The current image-state row for the maintained RØDE NT-USB+ microphone points to a listing for
-- coloured identification tags used with the NT-USB Mini. Product-image exact guard v2.5 now
-- rejects this accessory title. Retire the row fail-closed and return the product to the governed
-- discovery queue so a genuine whole-product NT-USB+ listing may be found under Search Plan v1.1.
-- No recommendation or retailer weighting is changed.

do $$
begin
  update public.apg_ebay_image_state
  set status='retired',
      recovery_required=true,
      claim_until=null,
      last_error_code='RETIRED_IDENTIFICATION_TAG_ACCESSORY',
      next_refresh_at=greatest(next_refresh_at, now() + interval '7 days'),
      updated_at=now()
  where slug='r-de-nt-usb'
    and status='verified'
    and lower(title) like '%identification tag%';

  if not found then
    raise exception 'RØDE NT-USB+ identification-tag image state was not found in expected state';
  end if;

  update private.apg_ebay_image_discovery_state
  set last_status='review',
      last_error_code='IDENTIFICATION_TAG_ACCESSORY_RETIRED',
      next_attempt_at=least(next_attempt_at, now() + interval '15 minutes'),
      claim_until=null,
      updated_at=now()
  where slug='r-de-nt-usb';
end;
$$;