const REVIEWED='2026-08-24';

/**
 * Canonical product-image registry.
 *
 * Verified product photography lives in a data-only registry so approved image
 * mappings can be added without changing rendering code. A record is publishable
 * only when source, rights basis, acquisition/verification dates, attribution
 * requirements and product match all pass validation below.
 *
 * Supported source types:
 * - amazon_associates_approved
 * - manufacturer_authorised
 * - retailer_authorised
 * - other_licensed
 *
 * Amazon Program Content must be obtained through a current Associates-approved
 * mechanism for the matching product. Never scrape Amazon product pages,
 * reverse-engineer image URLs or treat Amazon Program Content as APG-owned.
 * Amazon image URLs are ephemeral: verified Amazon records must carry an
 * acquisition timestamp and an expiry no more than 24 hours later.
 */
const images=require('./product-images-verified-v42.json');

const ALLOWED_SOURCE_TYPES=new Set([
  'amazon_associates_approved',
  'manufacturer_authorised',
  'retailer_authorised',
  'other_licensed'
]);
const ALLOWED_STATUSES=new Set(['verified','pending','unavailable','needs_review','superseded']);
const ALLOWED_MATCHES=new Set(['exact','same_model_immaterial_variant','unverified']);

function normaliseImageRecord(product,record){
  if(!record)return null;
  return {
    productId:record.product_id||record.productId||product.productId||product.id||null,
    slug:product.slug,
    brand:product.brand,
    model:product.model||product.name,
    variant:record.variant||null,
    asin:record.asin||null,
    amazonUrl:record.amazon_url||record.amazonUrl||null,
    amazonAffiliateUrl:record.amazon_affiliate_url||record.amazonAffiliateUrl||null,
    imageUrl:record.image_url||record.imageUrl||null,
    imageSource:record.image_source||record.imageSource||null,
    imageSourceType:record.image_source_type||record.imageSourceType||null,
    imageSourceReference:record.image_source_reference||record.imageSourceReference||null,
    imageSourceAuthor:record.image_source_author||record.imageSourceAuthor||null,
    imageRightsBasis:record.image_rights_basis||record.imageRightsBasis||null,
    imageRightsLicence:record.image_rights_licence||record.imageRightsLicence||null,
    imageRightsUrl:record.image_rights_url||record.imageRightsUrl||null,
    imageAcquiredAt:record.image_acquired_at||record.imageAcquiredAt||null,
    imageVerified:record.image_verified===true||record.imageVerified===true,
    imageVerifiedAt:record.image_verified_at||record.imageVerifiedAt||null,
    imageProductMatch:record.image_product_match||record.imageProductMatch||'unverified',
    imageAlt:record.image_alt||record.imageAlt||`${product.brand} ${product.name}`,
    imageStatus:record.image_status||record.imageStatus||'needs_review',
    imageNotes:record.image_notes||record.imageNotes||null,
    imageAttributionRequired:typeof record.image_attribution_required==='boolean'?record.image_attribution_required:(typeof record.imageAttributionRequired==='boolean'?record.imageAttributionRequired:null),
    imageAttributionText:record.image_attribution_text||record.imageAttributionText||null,
    imageAmazonRestrictions:record.image_amazon_restrictions||record.imageAmazonRestrictions||null,
    imageUrlExpiresAt:record.image_url_expires_at||record.imageUrlExpiresAt||null,
    amazonProgramContent:record.amazonProgramContent===true||record.image_source_type==='amazon_associates_approved'||record.imageSourceType==='amazon_associates_approved',
    imageLinkUrl:record.image_link_url||record.imageLinkUrl||record.amazon_affiliate_url||record.amazonAffiliateUrl||null
  };
}

function validDate(value){return !!value&&!Number.isNaN(Date.parse(value));}

function validationErrors(product,record,{now=Date.now()}={}){
  const x=normaliseImageRecord(product,record),errors=[];
  if(!x)return errors;
  if(!ALLOWED_SOURCE_TYPES.has(x.imageSourceType))errors.push('invalid image source type');
  if(!ALLOWED_STATUSES.has(x.imageStatus))errors.push('invalid image status');
  if(!ALLOWED_MATCHES.has(x.imageProductMatch))errors.push('invalid product-match status');
  if(x.imageStatus==='verified'){
    if(!x.imageVerified)errors.push('verified status without imageVerified=true');
    if(!x.imageUrl)errors.push('verified image without image URL');
    if(!x.imageSource)errors.push('verified image without named source');
    if(!x.imageSourceReference)errors.push('verified image without source reference');
    if(!x.imageRightsBasis)errors.push('verified image without rights basis');
    if(!x.imageRightsLicence)errors.push('verified image without rights/licence identifier');
    if(!x.imageAcquiredAt||!validDate(x.imageAcquiredAt))errors.push('verified image without valid acquired date');
    if(!x.imageVerifiedAt||!validDate(x.imageVerifiedAt))errors.push('verified image without valid verification date');
    if(x.imageProductMatch==='unverified')errors.push('verified image with unverified product match');
    if(!x.variant)errors.push('verified image without variant shown/controlled');
    if(typeof x.imageAttributionRequired!=='boolean')errors.push('verified image without attribution requirement decision');
    if(x.imageAttributionRequired&&!x.imageAttributionText)errors.push('verified image requires attribution but has no attribution text');
  }
  if(x.amazonProgramContent){
    if(!x.asin)errors.push('Amazon Program Content without verified ASIN');
    if(!x.amazonAffiliateUrl)errors.push('Amazon Program Content without affiliate destination');
    if(!x.imageLinkUrl)errors.push('Amazon Program Content without image link destination');
    if(x.imageLinkUrl!==x.amazonAffiliateUrl)errors.push('Amazon Program Content image must link to its matching Amazon affiliate destination');
    if(!x.imageAmazonRestrictions)errors.push('Amazon Program Content without recorded Amazon-specific restrictions');
    if(!x.imageAcquiredAt||!validDate(x.imageAcquiredAt))errors.push('Amazon Program Content without valid acquisition timestamp');
    if(!x.imageUrlExpiresAt||!validDate(x.imageUrlExpiresAt))errors.push('Amazon Program Content without valid image URL expiry');
    if(validDate(x.imageAcquiredAt)&&validDate(x.imageUrlExpiresAt)){
      const acquired=Date.parse(x.imageAcquiredAt),expires=Date.parse(x.imageUrlExpiresAt);
      if(expires<=acquired)errors.push('Amazon image URL expiry must be after acquisition');
      if(expires-acquired>24*60*60*1000)errors.push('Amazon image URL retention exceeds 24 hours');
      if(x.imageStatus==='verified'&&expires<=now)errors.push('verified Amazon image URL has expired and must be refreshed');
    }
  }
  return errors;
}

function imageFor(product){return normaliseImageRecord(product,images[product.slug]);}

module.exports={REVIEWED,images,imageFor,validationErrors,ALLOWED_SOURCE_TYPES,ALLOWED_STATUSES,ALLOWED_MATCHES};
