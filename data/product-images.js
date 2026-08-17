const REVIEWED='2026-08-17';

/**
 * Canonical product-image registry.
 *
 * This file is intentionally retailer-neutral. A product may have one current
 * verified hero image, with a documented source, rights basis and exact-match
 * status. Amazon Program Content must only be entered when it was obtained
 * through an Amazon Associates-approved mechanism for the matching product.
 *
 * Supported source types:
 * - amazon_associates_approved
 * - manufacturer_authorised
 * - retailer_authorised
 * - other_licensed
 *
 * Amazon manual phase:
 * Basic Display / other approved Associates image -> registry -> APG renderer.
 * Do not scrape Amazon product pages or reverse-engineer image URLs.
 *
 * Future phase:
 * authorised Amazon API provider -> validation/freshness layer -> registry-like
 * provider output -> APG renderer. API image content must follow the applicable
 * Amazon caching and linking rules rather than being treated as APG-owned media.
 */
const images={};

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
    imageRightsBasis:record.image_rights_basis||record.imageRightsBasis||null,
    imageVerified:record.image_verified===true||record.imageVerified===true,
    imageVerifiedAt:record.image_verified_at||record.imageVerifiedAt||null,
    imageProductMatch:record.image_product_match||record.imageProductMatch||'unverified',
    imageAlt:record.image_alt||record.imageAlt||`${product.brand} ${product.name}`,
    imageStatus:record.image_status||record.imageStatus||'needs_review',
    imageNotes:record.image_notes||record.imageNotes||null,
    amazonProgramContent:record.amazonProgramContent===true||record.image_source_type==='amazon_associates_approved'||record.imageSourceType==='amazon_associates_approved',
    imageLinkUrl:record.image_link_url||record.imageLinkUrl||record.amazon_affiliate_url||record.amazonAffiliateUrl||null
  };
}

function validationErrors(product,record){
  const x=normaliseImageRecord(product,record),errors=[];
  if(!x)return errors;
  if(!ALLOWED_SOURCE_TYPES.has(x.imageSourceType))errors.push('invalid image source type');
  if(!ALLOWED_STATUSES.has(x.imageStatus))errors.push('invalid image status');
  if(!ALLOWED_MATCHES.has(x.imageProductMatch))errors.push('invalid product-match status');
  if(x.imageStatus==='verified'){
    if(!x.imageVerified)errors.push('verified status without imageVerified=true');
    if(!x.imageUrl)errors.push('verified image without image URL');
    if(!x.imageRightsBasis)errors.push('verified image without rights basis');
    if(!x.imageVerifiedAt)errors.push('verified image without verification date');
    if(x.imageProductMatch==='unverified')errors.push('verified image with unverified product match');
  }
  if(x.amazonProgramContent){
    if(!x.asin)errors.push('Amazon Program Content without verified ASIN');
    if(!x.amazonAffiliateUrl)errors.push('Amazon Program Content without affiliate destination');
    if(!x.imageLinkUrl)errors.push('Amazon Program Content without image link destination');
    if(x.imageLinkUrl!==x.amazonAffiliateUrl)errors.push('Amazon Program Content image must link to its matching Amazon affiliate destination');
  }
  return errors;
}

function imageFor(product){return normaliseImageRecord(product,images[product.slug]);}

module.exports={REVIEWED,images,imageFor,validationErrors,ALLOWED_SOURCE_TYPES,ALLOWED_STATUSES,ALLOWED_MATCHES};
