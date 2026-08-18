'use strict';
const base=require('./retailers');
const amazon=require('./amazon-au-mappings-v33');
const {TAG}=amazon;

function amazonRetailerFor(product){
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

function retailersFor(product){
  // Keep Amazon identity authoritative in one v33 record while preserving any
  // non-Amazon retailer rows supplied by the base layer or later catalogue passes.
  const nonAmazon=base.retailersFor(product).filter(row=>row.retailer!=='Amazon Australia');
  return [amazonRetailerFor(product),...nonAmazon];
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
  amazonRetailerFor
};
