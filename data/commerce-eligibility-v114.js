'use strict';

// APG catalogue-wide commerce eligibility gate.
// Retailer coverage is downstream of product identity, Australian-market relevance, lifecycle
// and safety. The latest Action 4 entity chronology (v98 over v97 over v96) and explicit safety
// suppressions fail closed across *all* retailer programmes, independent of ordering, affiliate
// participation or commission.
const action4v96=require('./action4-decision-evidence-v96');
const action4v97=require('./action4-closure-v97');
const action4v98=require('./action4-final-v98');
const amazonExceptions=require('./amazon-mapping-exceptions-v106');

const REVIEWED_AT='2026-08-28';
const VERSION='commerce-eligibility-v114';

// Preserve chronology while resolving CURRENT truth. v97 reclassifies/resolves most v96 cases;
// v98 closes the final two open cases as historical. A resolved historical/non-AU record is not
// an unresolved identity problem, but it still must not receive a current Australian commerce path.
const currentEntityState=new Map((action4v96.entityCorrections||[]).map(row=>[row.slug,{...row,sourceLayer:'v96'}]));
for(const row of action4v97.entityOverrides||[]){
  currentEntityState.set(row.slug,{...(currentEntityState.get(row.slug)||{}),...row,sourceLayer:'v97'});
}
for(const row of action4v98.finalEntityOverrides||[]){
  currentEntityState.set(row.slug,{...(currentEntityState.get(row.slug)||{}),...row,sourceLayer:'v98'});
}

function isEntityCommerceExcluded(row){
  return row.eligibility===action4v96.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE||row.eligibility==='HISTORICAL';
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
// Backward-compatible alias while callers migrate from the older unresolved-identity terminology.
const IDENTITY_EXCLUSIONS=ENTITY_EXCLUSIONS;
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
  const historical=Object.values(ENTITY_EXCLUSIONS).filter(row=>row.eligibility==='HISTORICAL').length;
  const regional=Object.values(ENTITY_EXCLUSIONS).length-historical;
  return Object.freeze({
    version:VERSION,
    reviewedAt:REVIEWED_AT,
    entitySource:'Action 4 v98 over v97 over v96',
    entityOpenCases:0,
    entityCommerceExclusions:Object.keys(ENTITY_EXCLUSIONS).length,
    regionalOrCurrentMarketExclusions:regional,
    historicalExclusions:historical,
    safetyExclusions:Object.keys(SAFETY_EXCLUSIONS).length,
    totalExceptions:Object.keys(EXCEPTIONS).length,
    commercialRecommendationWeight:0
  });
}

module.exports={VERSION,REVIEWED_AT,currentEntityState,ENTITY_EXCLUSIONS,IDENTITY_EXCLUSIONS,SAFETY_EXCLUSIONS,EXCEPTIONS,isEntityCommerceExcluded,exceptionFor,isCommerceEligible,applyProduct,applyCategoryMaps,eligibilitySummary};
