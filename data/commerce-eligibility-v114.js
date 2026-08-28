'use strict';

// APG catalogue-wide commerce eligibility gate.
// Retailer coverage is downstream of product identity and safety. Unresolved catalogue
// identity and explicit safety suppressions fail closed across *all* retailer programmes,
// independent of retailer ordering, affiliate participation or commission.
const action4=require('./action4-decision-evidence-v96');
const amazonExceptions=require('./amazon-mapping-exceptions-v106');

const REVIEWED_AT='2026-08-28';
const VERSION='commerce-eligibility-v114';

const identityEntries=(action4.entityCorrections||[])
  .filter(row=>row.eligibility===action4.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE)
  .map(row=>[row.correctedSlug||row.slug,Object.freeze({
    slug:row.correctedSlug||row.slug,
    type:'IDENTITY_UNVERIFIED',
    code:'ENTITY_UNVERIFIED_EXCLUDE',
    status:row.status,
    issueType:row.issueType,
    resolution:row.resolution,
    reviewedAt:action4.VERIFIED_AT,
    note:row.note||'Exact/current Australian product identity is not sufficiently bound for a retailer purchase pathway.'
  })]);

const safetyEntries=Object.entries(amazonExceptions.SAFETY_EXCEPTIONS||{}).map(([slug,row])=>[slug,Object.freeze({
  slug,
  type:'SAFETY_SUPPRESSED',
  code:'NO_SAFE_PURCHASE_PATH',
  status:row.certificationStatus||'SAFETY_SUPPRESSED',
  issueType:'product-safety-recall',
  resolution:'OPEN_SAFETY_SUPPRESSION',
  reviewedAt:row.lastChecked||REVIEWED_AT,
  note:row.reasonDirectUnavailable||'Product safety overrides retailer coverage.'
})]);

const EXCEPTIONS=Object.freeze(Object.fromEntries([...identityEntries,...safetyEntries]));
const IDENTITY_EXCLUSIONS=Object.freeze(Object.fromEntries(identityEntries));
const SAFETY_EXCLUSIONS=Object.freeze(Object.fromEntries(safetyEntries));

function exceptionFor(productOrSlug){
  const slug=typeof productOrSlug==='string'?productOrSlug:String(productOrSlug?.slug||'');
  return EXCEPTIONS[slug]||null;
}
function isCommerceEligible(productOrSlug){return !exceptionFor(productOrSlug);}
function applyProduct(product){
  const exception=exceptionFor(product);
  if(!exception)return {...product,commerceEligibility:'ELIGIBLE',commerceSuppressed:false,commerceException:null};
  return {
    ...product,
    retailers:[],
    commerceEligibility:'SUPPRESSED',
    commerceSuppressed:true,
    commerceException:exception,
    retailerSuppressionReason:exception.code,
    retailerSuppressionReviewedAt:exception.reviewedAt||REVIEWED_AT
  };
}
function applyCategoryMaps(categoryMaps){
  const seen=new Set();
  for(const map of categoryMaps||[]){
    for(const category of Object.values(map||{})){
      if(!category||seen.has(category))continue;
      seen.add(category);
      category.products=(category.products||[]).map(applyProduct);
    }
  }
}
function eligibilitySummary(){
  return Object.freeze({
    version:VERSION,
    reviewedAt:REVIEWED_AT,
    identityExclusions:Object.keys(IDENTITY_EXCLUSIONS).length,
    safetyExclusions:Object.keys(SAFETY_EXCLUSIONS).length,
    totalExceptions:Object.keys(EXCEPTIONS).length,
    commercialRecommendationWeight:0
  });
}

module.exports={VERSION,REVIEWED_AT,IDENTITY_EXCLUSIONS,SAFETY_EXCLUSIONS,EXCEPTIONS,exceptionFor,isCommerceEligible,applyProduct,applyCategoryMaps,eligibilitySummary};
