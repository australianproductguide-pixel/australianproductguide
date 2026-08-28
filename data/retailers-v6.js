'use strict';
const base=require('./retailers');
const amazon=require('./amazon-au-mappings-v33');
const ebay=require('./ebay-epn-interim-v1');
const commerce=require('./commerce-eligibility-v114');
const {TAG}=amazon;

function amazonRetailerFor(product){
  if(!commerce.isCommerceEligible(product))return null;
  const record=amazon.getAmazonAuRecord(product);
  const direct=Boolean(record.asin);
  return {
    retailer:'Amazon Australia',
    productIdentifier:record.asin,
    asin:record.asin,
    amazonAuAsin:record.asin,
    kind:record.linkType,
    exactUrl:direct?record.url:null,
    affiliateUrl:record.url,
    url:record.url,
    imageUrl:null,
    imageSource:'No approved Amazon product-image mapping connected',
    imageSourceType:null,
    imageProvenance:'No Amazon image is displayed until it is obtained through a current Amazon Associates-approved mechanism for the matching product or later through an authorised Amazon API. Product-page scraping and reverse-engineered image URLs are prohibited.',
    imageVerified:false,
    verified:record.verifiedAt,
    verifiedAt:record.verifiedAt,
    amazonVerifiedAt:record.verifiedAt,
    variant:record.variantMatch,
    availabilityConfidence:record.confidence==='HIGH'?'high':'unverified-exact-listing',
    amazonMatchStatus:record.matchStatus,
    amazonModelMatch:record.modelMatch,
    amazonVariantMatch:record.variantMatch,
    amazonAffiliateTag:record.affiliateTag,
    amazonExceptionReason:record.exceptionReason,
    recommendationWeight:0,
    note:record.note
  };
}

function classifyPathway(row){
  const kind=String(row?.kind||'').toLowerCase();
  const match=String(row?.amazonMatchStatus||row?.matchStatus||'').toUpperCase();
  if(row?.exactModel===true||match==='EXACT_VERIFIED')return 'exact-product';
  if(match==='VARIANT_VERIFIED'||row?.variantVerified===true)return 'verified-variant';
  if(row?.productIdentifier&&row?.exactUrl)return 'exact-product';
  if(row?.exactUrl&&!/search|collection|promotion/.test(kind))return 'exact-product';
  if(row?.pathwayType==='product-search'||/search/.test(kind))return 'product-search';
  if(row?.pathwayType==='collection'||/collection|promotion/.test(kind))return 'collection';
  return 'availability-unverified';
}
function pathwayScore(row){
  const pathway=classifyPathway(row);
  return {
    'exact-product':600,
    'verified-variant':550,
    'product-search':300,
    'collection':150,
    'availability-unverified':100
  }[pathway]||0;
}
function freshnessValue(row){
  const value=row?.verifiedAt||row?.verified||row?.checkedAt||row?.amazonVerifiedAt||'';
  const parsed=Date.parse(value);
  return Number.isFinite(parsed)?parsed:0;
}
function orderRetailers(rows){
  return (rows||[]).filter(Boolean).map((row,index)=>({row,index,pathway:classifyPathway(row),score:pathwayScore(row),fresh:freshnessValue(row)}))
    .sort((a,b)=>b.score-a.score||b.fresh-a.fresh||String(a.row.retailer||'').localeCompare(String(b.row.retailer||''),'en-AU')||a.index-b.index)
    .map(({row,pathway})=>({
      ...row,
      pathwayType:row.pathwayType||pathway,
      pathwayLabel:{
        'exact-product':'Exact product',
        'verified-variant':'Verified variant',
        'product-search':'Product search',
        'collection':'Collection',
        'availability-unverified':'Availability unverified'
      }[pathway],
      recommendationWeight:0,
      retailerOrderingBasis:'pathway specificity, verification freshness and deterministic retailer-name tie-break; commission and retailer participation contribute zero points'
    }));
}

function retailersFor(product){
  // Product identity and safety are upstream of commerce. If the shared catalogue gate is red,
  // no retailer programme can create a purchase/search pathway. For eligible products, exact and
  // verified pathways outrank searches; searches outrank collections. Commercial participation
  // and commission contribute zero ordering or recommendation points.
  if(!commerce.isCommerceEligible(product))return [];
  const nonAmazon=base.retailersFor(product).filter(row=>row.retailer!=='Amazon Australia');
  const amazonRow=amazonRetailerFor(product);
  const ebayRow=ebay.ebayRetailerFor(product);
  return orderRetailers([amazonRow,ebayRow,...nonAmazon]);
}

const suppressedDirect=new Set(Object.entries(amazon.EXCEPTIONS)
  .filter(([,row])=>row.status==='UNVERIFIED')
  .map(([slug])=>slug));

module.exports={
  ...base,
  TAG,
  direct:amazon.VERIFIED,
  retailersFor,
  additions:amazon.VERIFIED,
  modelSearch:amazon.searchUrl,
  suppressedDirect,
  amazon,
  amazonRetailerFor,
  ebay,
  ebayRetailerFor:ebay.ebayRetailerFor,
  commerce,
  classifyPathway,
  pathwayScore,
  orderRetailers
};
