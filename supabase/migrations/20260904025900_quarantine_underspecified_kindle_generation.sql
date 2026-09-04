-- APG product-image identity quarantine: Kindle Paperwhite 16GB.
--
-- The maintained APG identity currently says only "Amazon Kindle Paperwhite 16GB" and does not
-- identify a generation. The newly discovered eBay candidate is explicitly a 12th-generation
-- Paperwhite. That may be a valid current retail variant, but APG's current exact-product image
-- presentation would describe it as the exact maintained product. Until the maintained product
-- generation is reconciled, keep this candidate non-display and prevent automatic second-pass
-- promotion. This is an identity-quality safeguard, not a rejection of the product itself.

do $$
begin
  update public.apg_ebay_image_state
  set status='review',
      recovery_required=true,
      last_error_code='IDENTITY_UNDERSPECIFIED:KINDLE_GENERATION',
      next_refresh_at=greatest(next_refresh_at, now() + interval '7 days'),
      claim_until=null,
      updated_at=now()
  where slug='amazon-kindle-paperwhite-16gb'
    and status='review';

  insert into private.apg_ebay_image_cycle_log(action,due_discovery,due_review,request_id,note)
  values('idle',0,0,null,'KINDLE_GENERATION_QUARANTINE: 12th-gen candidate held non-display until maintained product identity specifies generation');
end;
$$;
