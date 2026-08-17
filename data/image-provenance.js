const {REVIEWED,imageFor,validationErrors}=require('./product-images');
const IMAGE_REVIEWED=REVIEWED;

/**
 * Central product-image control.
 *
 * Verified product photography may come from the canonical registry or a
 * backwards-compatible retailer/media record. Templates receive only a safe,
 * normalised display object; unverified or invalid image records never render.
 */
function registryImage(product){
  const media=imageFor(product);
  if(!media||media.imageStatus!=='verified'||media.imageVerified!==true)return null;
  const errors=validationErrors(product,media);
  if(errors.length)return null;
  return {
    slug:product.slug,
    kind:'verified-third-party-product-image',
    source:media.imageSource||'Verified third-party source',
    sourceType:media.imageSourceType,
    rights:media.imageRightsBasis,
    reviewed:media.imageVerifiedAt||IMAGE_REVIEWED,
    productPhotography:true,
    amazonProgramContent:media.amazonProgramContent===true,
    asin:media.asin||null,
    displayUrl:media.imageUrl,
    displayLabel:`Product image via ${media.imageSource||'verified source'}`,
    alt:media.imageAlt||`${product.brand} ${product.name}`,
    imageLinkUrl:media.imageLinkUrl||null,
    matchStatus:media.imageProductMatch,
    status:media.imageStatus,
    note:media.imageNotes||'Product-specific image source, rights basis and exact-match status verified.'
  };
}

function legacyRetailerImage(product){
  const media=(product.retailers||[]).find(r=>r.imageUrl&&r.imageVerified===true);
  if(!media)return null;
  const amazon=/amazon/i.test(media.retailer||'')||/amazon/i.test(media.imageSource||'');
  const affiliateUrl=media.affiliateUrl||media.url||null;
  if(amazon&&(!media.asin||!affiliateUrl||!affiliateUrl.includes('tag=auproductguid-22')))return null;
  return {
    slug:product.slug,
    kind:'verified-third-party-product-image',
    source:media.imageSource||media.retailer||'Verified third-party source',
    sourceType:media.imageSourceType|| (amazon?'amazon_associates_approved':'retailer_authorised'),
    rights:media.imageProvenance||'Verified permitted delivery method recorded in retailer data',
    reviewed:media.imageVerifiedAt||media.verified||IMAGE_REVIEWED,
    productPhotography:true,
    amazonProgramContent:amazon,
    asin:media.asin||null,
    displayUrl:media.imageUrl,
    displayLabel:`Product image via ${media.imageSource||media.retailer||'verified source'}`,
    alt:media.imageAlt||`${product.brand} ${product.name}`,
    imageLinkUrl:amazon?affiliateUrl:(media.imageLinkUrl||null),
    matchStatus:media.imageProductMatch||'exact',
    status:'verified',
    note:media.note||'Product-specific image source and delivery method verified.'
  };
}

function imageStatus(product){
  const verified=registryImage(product)||legacyRetailerImage(product);
  if(verified)return verified;
  return {
    slug:product.slug,
    kind:'apg-owned-decision-illustration',
    source:'Australian Product Guide',
    sourceType:'apg_owned_illustration',
    rights:'APG-authored SVG/CSS decision visual',
    reviewed:IMAGE_REVIEWED,
    productPhotography:false,
    amazonProgramContent:false,
    asin:null,
    displayUrl:null,
    displayLabel:null,
    alt:`Australian Product Guide visual for ${product.brand} ${product.name}`,
    imageLinkUrl:null,
    matchStatus:'unverified',
    status:'pending',
    note:'No third-party product photograph is displayed until a permitted source, rights basis and product match are verified.'
  };
}

module.exports={IMAGE_REVIEWED,imageStatus,registryImage,legacyRetailerImage};
