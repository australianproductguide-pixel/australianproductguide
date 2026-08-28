'use strict';

// APG catalogue-wide commerce eligibility gate.
// Retailer coverage is downstream of product identity, Australian-market relevance, lifecycle
// and safety. The latest Action 4 entity chronology (v98 over v97 over v96), final v98 commerce
// revalidations and explicit safety suppressions fail closed across all retailer programmes,
// independent of ordering, affiliate participation or commission.
const action4v96=require('./action4-decision-evidence-v96');
const action4v97=require('./action4-closure-v97');
const action4v98=require('./action4-final-v98');
const amazonExceptions=require('./amazon-mapping-exceptions-v106');

const REVIEWED_AT='2026-08-28';
const VERSION='commerce-eligibility-v114';

const currentEntityState=new Map((action4v96.entityCorrections||[]).map(row=>[row.slug,{...row,sourceLayer:'v96'}]));
for(const row of action4v97.entityOverrides||[]){
  currentEntityState.set(row.slug,{...(currentEntityState.get(row.slug)||{}),...row,sourceLayer:'v97'});
}
for(const row of action4v98.finalEntityOverrides||[]){
  currentEntityState.set(row.slug,{...(currentEntityState.get(row.slug)||{}),...row,sourceLayer:'v98'});
}

// v98 commerce revalidation is the final authority for whether a corrected CURRENT entity may
// regain a retailer path. A revalidation can authorise an exact product destination or only a
// model-specific fallback; either is sufficient to restore commerce eligibility without inventing
// an exact listing. Historical/non-AU entities are not included in this restoration set.
const COMMERCE_REVALIDATIONS=Object.freeze(action4v98.commerceRevalidations||{});
function hasFinalCommerceRevalidation(row){return Boolean(COMMERCE_REVALIDATIONS[row.slug]);}
function isEntityCommerceExcluded(row){
  if(row.eligibility==='HISTORICAL')return true;
  if(hasFinalCommerceRevalidation(row))return false;
  return row.eligibility===action4v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE;
}

const entityEntries=[...currentEntityState.values()]
  .filter(isEntityCommerceExcluded)
  .map(row=>[row.correctedSlug||row.slug,Object.freeze({
    slug:row.correctedSlug||row.slug,
    type:'ENTITY_MARKET_EXCLUDED',
    code:row.eligibility==='HISTORICAL'?'HISTORICAL_NO_CURRENT_COMMERCE':'ENTITY_AU_MARKET_EXCLUDED',
    status:row.status,
    eligibility:row.eligibility,
    region:row.region||null,
    issueType:row.issueType,
    resolution:row.resolution,
    sourceLayer:row.sourceLayer,
    reviewedAt:row.sourceLayer==='v98'?action4v98.VERIFIED_AT:(action4v97.VERIFIED_AT||action4v96.VERIFIED_AT),
    authoritativeSource:row.authoritativeSource||null,
    sourceType:row.sourceType||null,
    note:row.note||'This maintained catalogue record is not eligible for a current Australian retailer purchase pathway.'
  })]);

const safetyEntries=Object.entries(amazonExceptions.SAFETY_EXCEPTIONS||{}).map(([slug,row])=>[slug,Object.freeze({
  slug,
  type:'SAFETY_SUPPRESSED',
  code:'NO_SAFE_PURCHASE_PATH',
  status:row.certificationStatus||'SAFETY_SUPPRESSED',
  eligibility:'SAFETY_SUPPRESSED',
  issueType:'product-safety-recall',
  resolution:'OPEN_SAFETY_SUPPRESSION',
  sourceLayer:'amazon-safety-v106',
  reviewedAt:row.lastChecked||REVIEWED_AT,
  authoritativeSource:(row.evidenceChecked||[])[0]||null,
  sourceType:'safety-evidence',
  note:row.reasonDirectUnavailable||'Product safety overrides retailer coverage.'
})]);

const EXCEPTIONS=Object.freeze(Object.fromEntries([...entityEntries,...safetyEntries]));
const ENTITY_EXCLUSIONS=Object.freeze(Object.fromEntries(entityEntries));
const IDENTITY_EXCLUSIONS=ENTITY_EXCLUSIONS;
const SAFETY_EXCLUSIONS=Object.freeze(Object.fromEntries(safetyEntries));

function exceptionFor(productOrSlug){
  const slug=typeof productOrSlug==='string'?productOrSlug:String(productOrSlug?.slug||'');
  return EXCEPTIONS[slug]||null;
}
function isCommerceEligible(productOrSlug){return !exceptionFor(productOrSlug);}
function commerceRevalidationFor(productOrSlug){
  const slug=typeof productOrSlug==='string'?productOrSlug:String(productOrSlug?.slug||'');
  return COMMERCE_REVALIDATIONS[slug]||null;
}
function applyProduct(product){
  const exception=exceptionFor(product);
  const revalidation=commerceRevalidationFor(product);
  if(!exception)return {...product,commerceEligibility:'ELIGIBLE',commerceSuppressed:false,commerceException:null,commerceRevalidation:revalidation};
  return {
    ...product,
    retailers:[],
    commerceEligibility:'SUPPRESSED',
    commerceSuppressed:true,
    commerceException:exception,
    commerceRevalidation:null,
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
  const historical=Object.values(ENTITY_EXCLUSIONS).filter(row=>row.eligibility==='HISTORICAL').length;
  const regional=Object.values(ENTITY_EXCLUSIONS).length-historical;
  return Object.freeze({
    version:VERSION,
    reviewedAt:REVIEWED_AT,
    entitySource:'Action 4 v98 over v97 over v96',
    entityOpenCases:0,
    commerceRevalidations:Object.keys(COMMERCE_REVALIDATIONS).length,
    entityCommerceExclusions:Object.keys(ENTITY_EXCLUSIONS).length,
    regionalOrCurrentMarketExclusions:regional,
    historicalExclusions:historical,
    safetyExclusions:Object.keys(SAFETY_EXCLUSIONS).length,
    totalExceptions:Object.keys(EXCEPTIONS).length,
    commercialRecommendationWeight:0
  });
}

module.exports={VERSION,REVIEWED_AT,currentEntityState,COMMERCE_REVALIDATIONS,ENTITY_EXCLUSIONS,IDENTITY_EXCLUSIONS,SAFETY_EXCLUSIONS,EXCEPTIONS,hasFinalCommerceRevalidation,isEntityCommerceExcluded,exceptionFor,isCommerceEligible,commerceRevalidationFor,applyProduct,applyCategoryMaps,eligibilitySummary};
