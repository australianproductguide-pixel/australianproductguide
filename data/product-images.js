const REVIEWED='2026-08-29';

/**
 * Canonical product-image registry.
 *
 * Verified product photography lives in a data-only registry so approved image
 * mappings can be added without changing rendering code. A record is publishable
 * only when source, rights basis, verification date and product match all pass
 * validation below.
 *
 * Supported source types:
 * - amazon_associates_approved
 * - ebay_api_approved
 * - manufacturer_authorised
 * - retailer_authorised
 * - other_licensed
 *
 * Marketplace content must be obtained through the matching approved programme/API.
 * Never scrape Amazon/eBay product or listing pages, reverse-engineer image URLs or
 * treat marketplace content as APG-owned. eBay API imagery is intentionally dormant
 * until APG has approved production API access and an exact/same-model item binding.
 */
const images=require('./product-images-verified-v42.json');

const ALLOWED_SOURCE_TYPES=new Set(['amazon_associates_approved','ebay_api_approved','manufacturer_authorised','retailer_authorised','other_licensed']);
const ALLOWED_STATUSES=new Set(['verified','pending','unavailable','needs_review','superseded']);
const ALLOWED_MATCHES=new Set(['exact','same_model_immaterial_variant','unverified']);

function normaliseImageRecord(product,record){
  if(!record)return null;
  const sourceType=record.image_source_type||record.imageSourceType||null;
  return {
    productId:record.product_id||record.productId||product.productId||product.id||null,slug:product.slug,brand:product.brand,model:product.model||product.name,variant:record.variant||null,
    asin:record.asin||null,ebayItemId:record.ebay_item_id||record.ebayItemId||null,
    amazonUrl:record.amazon_url||record.amazonUrl||null,amazonAffiliateUrl:record.amazon_affiliate_url||record.amazonAffiliateUrl||null,
    ebayItemUrl:record.ebay_item_url||record.ebayItemUrl||null,ebayAffiliateUrl:record.ebay_affiliate_url||record.ebayAffiliateUrl||null,
    imageUrl:record.image_url||record.imageUrl||null,imageSource:record.image_source||record.imageSource||null,imageSourceType:sourceType,imageRightsBasis:record.image_rights_basis||record.imageRightsBasis||null,
    imageVerified:record.image_verified===true||record.imageVerified===true,imageVerifiedAt:record.image_verified_at||record.imageVerifiedAt||null,imageProductMatch:record.image_product_match||record.imageProductMatch||'unverified',
    imageAlt:record.image_alt||record.imageAlt||`${product.brand} ${product.name}`,imageStatus:record.image_status||record.imageStatus||'needs_review',imageNotes:record.image_notes||record.imageNotes||null,
    amazonProgramContent:record.amazonProgramContent===true||sourceType==='amazon_associates_approved',ebayApiContent:record.ebayApiContent===true||sourceType==='ebay_api_approved',
    imageLinkUrl:record.image_link_url||record.imageLinkUrl||record.amazon_affiliate_url||record.amazonAffiliateUrl||record.ebay_affiliate_url||record.ebayAffiliateUrl||null
  };
}
function validationErrors(product,record){
  const x=normaliseImageRecord(product,record),errors=[];if(!x)return errors;
  if(!ALLOWED_SOURCE_TYPES.has(x.imageSourceType))errors.push('invalid image source type');if(!ALLOWED_STATUSES.has(x.imageStatus))errors.push('invalid image status');if(!ALLOWED_MATCHES.has(x.imageProductMatch))errors.push('invalid product-match status');
  if(x.imageStatus==='verified'){if(!x.imageVerified)errors.push('verified status without imageVerified=true');if(!x.imageUrl)errors.push('verified image without image URL');if(!x.imageRightsBasis)errors.push('verified image without rights basis');if(!x.imageVerifiedAt)errors.push('verified image without verification date');if(x.imageProductMatch==='unverified')errors.push('verified image with unverified product match');}
  if(x.amazonProgramContent){if(!x.asin)errors.push('Amazon Program Content without verified ASIN');if(!x.amazonAffiliateUrl)errors.push('Amazon Program Content without affiliate destination');if(!x.imageLinkUrl)errors.push('Amazon Program Content without image link destination');if(x.imageLinkUrl!==x.amazonAffiliateUrl)errors.push('Amazon Program Content image must link to its matching Amazon affiliate destination');}
  if(x.ebayApiContent){if(!x.ebayItemId)errors.push('eBay API image without verified item ID');if(!x.ebayItemUrl)errors.push('eBay API image without API-returned item destination');if(!x.ebayAffiliateUrl)errors.push('eBay API image without EPN affiliate destination');if(!x.imageSource)errors.push('eBay API image without provenance source');if(!x.imageLinkUrl)errors.push('eBay API image without image link destination');if(x.imageLinkUrl!==x.ebayAffiliateUrl)errors.push('eBay API image must link to its matching EPN affiliate destination');}
  return errors;
}
function imageFor(product){return normaliseImageRecord(product,images[product.slug]);}
module.exports={REVIEWED,images,imageFor,validationErrors,ALLOWED_SOURCE_TYPES,ALLOWED_STATUSES,ALLOWED_MATCHES};
