'use strict';

// APG Amazon Australia catalogue certification v106.
// Latest owner instruction supersedes the v100 convention that a structurally safe search
// fallback is, by itself, sufficient for Action 5 completion. v106 preserves every existing
// retailer/safety safeguard while requiring product-level investigation evidence for each
// remaining fallback before the catalogue can be certified.
const downstream=require('./search-opportunity-depth-v104-runtime');
const platformState=require('./platform-state-v1');
const {products}=require('../data');
const amazon=require('../data/amazon-au-mappings-v33');
const exceptions=require('../data/amazon-mapping-exceptions-v106');

const VERSION='106.0';
const CHECKED_AT='2026-08-25';
const ORIGIN='https://australianproductguide.au';
const ENDPOINT='/api/intelligence/amazon-catalogue-certification';
const RECALL_SLUG='anker-power-bank-20000mah-22-5w';
const INACTIVE_STATES=new Set(['DISCONTINUED','SUPERSEDED','RETIRED']);

function pct(n,d){return d?Number((n*100/d).toFixed(2)):0;}
function amazonRecord(product){
  if(product.slug===RECALL_SLUG){
    return {matchStatus:'NO_SAFE_PATH_RECALL',asin:null,url:null,confidence:'HIGH',verifiedAt:'2026-08-24',affiliateTag:amazon.TAG,recommendationWeight:0};
  }
  return amazon.getAmazonAuRecord(product);
}
function validTaggedAmazonUrl(url){
  if(!url)return false;
  try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.amazon.com.au'&&u.searchParams.get('tag')===amazon.TAG;}catch{return false;}
}
function productIdentity(product){
  return {
    apgProductId:product.id||null,
    slug:product.slug,
    brand:product.brand||null,
    productName:product.name||null,
    model:product.model||product.name||null,
    category:product.category||null,
    apgUrl:`${ORIGIN}/products/${product.slug}/`,
    manufacturerEvidence:product.source||product.primarySource||null,
    entityStatus:product.entityStatus||'MAINTAINED'
  };
}
function exceptionRow(product,record){
  const documented=exceptions.DOCUMENTED[product.slug]||null;
  const currentFallbackUrl=record.url||null;
  const base={...productIdentity(product),currentAmazonDestination:currentFallbackUrl,currentPathwayType:'SEARCH_FALLBACK',currentAsin:null,affiliateTagPresent:validTaggedAmazonUrl(currentFallbackUrl),lastVerifiedDate:record.verifiedAt||null};
  if(documented){
    return {...base,verificationStatus:'DOCUMENTED_EXCEPTION',reasonDirectMappingUnavailable:documented.reasonDirectUnavailable,searchesPerformed:documented.searchesPerformed,evidenceChecked:documented.evidenceChecked,potentialCandidateAsin:documented.candidateAsin,whyCandidateRejected:documented.candidateRejectedBecause,lastChecked:documented.lastChecked,nextReviewDate:documented.nextReviewDate};
  }
  return {...base,verificationStatus:'INVESTIGATION_REQUIRED',reasonDirectMappingUnavailable:'Individual Amazon Australia direct-mapping investigation has not yet been evidenced to the v106 completion standard.',searchesPerformed:[],evidenceChecked:product.source?[product.source]:[],potentialCandidateAsin:null,whyCandidateRejected:null,lastChecked:null,nextReviewDate:null};
}
function directRow(product,record){
  return {...productIdentity(product),currentAmazonDestination:record.url,currentPathwayType:record.matchStatus,currentAsin:record.asin||null,affiliateTagPresent:validTaggedAmazonUrl(record.url),verificationStatus:record.matchStatus,confidence:record.confidence||null,variant:record.variantMatch||null,lastVerifiedDate:record.verifiedAt||null,evidenceChecked:[product.source,record.url].filter(Boolean),mappingNote:record.note||null};
}
function safetyRow(product){
  const x=exceptions.SAFETY_EXCEPTIONS[product.slug];
  return {...productIdentity(product),currentAmazonDestination:null,currentPathwayType:'NO_SAFE_PATH_RECALL',currentAsin:null,affiliateTagPresent:null,verificationStatus:'SAFETY_SUPPRESSED',reasonDirectMappingUnavailable:x?.reasonDirectUnavailable||'Retailer path intentionally suppressed for product-safety reasons.',searchesPerformed:x?.searchesPerformed||[],evidenceChecked:x?.evidenceChecked||[],potentialCandidateAsin:null,whyCandidateRejected:x?.candidateRejectedBecause||null,lastChecked:x?.lastChecked||'2026-08-24',nextReviewDate:x?.nextReviewDate||null};
}
function snapshot(){
  const direct=[],fallback=[],safety=[],errors=[];
  let exact=0,variant=0;
  for(const product of products){
    const record=amazonRecord(product);
    if(record.matchStatus==='EXACT_VERIFIED'||record.matchStatus==='VARIANT_VERIFIED'){
      if(record.matchStatus==='EXACT_VERIFIED')exact++;else variant++;
      const row=directRow(product,record);direct.push(row);
      if(!row.affiliateTagPresent)errors.push({productId:product.slug,code:'DIRECT_AFFILIATE_TAG_INVALID'});
      if(!record.asin||!/^[A-Z0-9]{10}$/.test(record.asin))errors.push({productId:product.slug,code:'DIRECT_ASIN_INVALID'});
      continue;
    }
    if(record.matchStatus==='SEARCH_FALLBACK'){
      const row=exceptionRow(product,record);fallback.push(row);
      if(!row.affiliateTagPresent)errors.push({productId:product.slug,code:'FALLBACK_AFFILIATE_TAG_INVALID'});
      continue;
    }
    if(record.matchStatus==='NO_SAFE_PATH_RECALL'){safety.push(safetyRow(product));continue;}
    errors.push({productId:product.slug,code:'UNCONTROLLED_RETAILER_STATE',status:record.matchStatus||null});
  }
  const documented=fallback.filter(x=>x.verificationStatus==='DOCUMENTED_EXCEPTION');
  const unresolved=fallback.filter(x=>x.verificationStatus==='INVESTIGATION_REQUIRED');
  const activeCurrent=products.filter(p=>!INACTIVE_STATES.has(String(p.entityStatus||'').toUpperCase())).length;
  const inactive=products.length-activeCurrent;
  const gateChecks={
    catalogueReconciles:direct.length+fallback.length+safety.length===products.length,
    everyProductInvestigated:unresolved.length===0,
    everyVerifiableDirectListingMapped:unresolved.length===0,
    directDestinationsStructurallyValid:direct.every(x=>x.affiliateTagPresent&&/^[A-Z0-9]{10}$/.test(x.currentAsin||'')),
    allAffiliateEligibleAmazonPathsTagged:[...direct,...fallback].every(x=>x.affiliateTagPresent===true),
    everyRemainingFallbackIndividuallyDocumented:fallback.every(x=>x.verificationStatus==='DOCUMENTED_EXCEPTION'),
    safetySuppressionPreserved:safety.length===1&&safety[0].slug===RECALL_SLUG,
    recommendationCommercialNeutrality:products.every(p=>amazonRecord(p).recommendationWeight===0),
    structuralErrorsZero:errors.length===0
  };
  const completionBlockers=Object.entries(gateChecks).filter(([,ok])=>!ok).map(([key])=>key);
  const status=completionBlockers.length?'NOT_CERTIFIED':fallback.length?'CERTIFIED_WITH_EXCEPTIONS':'CERTIFIED';
  return {
    version:VERSION,checkedAt:CHECKED_AT,status,
    authority:'Latest owner instruction dated 25 August 2026 supersedes the former v100 treatment of safe fallbacks as non-blocking maintenance.',
    catalogue:{total:products.length,activeCurrent,inactiveOrSuperseded:inactive},
    amazon:{exactVerified:exact,verifiedVariation:variant,totalVerifiedDirect:direct.length,searchFallback:fallback.length,noSuitableAmazonDestination:safety.length,brokenOrUncontrolled:errors.length,affiliateTagIntegrityPct:pct([...direct,...fallback].filter(x=>x.affiliateTagPresent).length,direct.length+fallback.length)},
    percentages:{exactDirectPct:pct(exact,products.length),totalVerifiedDirectPct:pct(direct.length,products.length),fallbackPct:pct(fallback.length,products.length),noDestinationPct:pct(safety.length,products.length),brokenPct:pct(errors.length,products.length)},
    investigation:{documentedFallbackExceptions:documented.length,investigationRequired:unresolved.length,documentedExceptionPct:pct(documented.length,fallback.length)},
    policy:{associatesTag:amazon.TAG,directLinkTarget:'AS_CLOSE_TO_100_PERCENT_AS_VERIFIABLY_POSSIBLE',guessing:'PROHIBITED',wrongVariantSubstitution:'PROHIBITED',amazonAutomation:'NO_AUTOMATED_AMAZON_DESTINATION_REQUESTS_OR_SCRAPING',recommendationWeightFromAffiliateAvailability:0},
    gate:{status,checks:gateChecks,blockers:completionBlockers,operatingBackendReconciliation:'REQUIRED_AFTER_EXACT_PRODUCTION_RELEASE'},
    verifiedDirect:direct,
    remainingExceptions:fallback,
    safetyExceptions:safety,
    structuralErrors:errors
  };
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname.replace(/\/+$/,'')||'/';}catch{}
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=function(name,value){if(String(name).toLowerCase()==='x-apg-amazon-catalogue-certification')return originalSetHeader(name,'v'+VERSION);return originalSetHeader(name,value);};
  originalSetHeader('X-APG-Amazon-Catalogue-Certification','v'+VERSION);
  if(path===platformState.ENDPOINT){
    res.statusCode=200;
    originalSetHeader('Content-Type','application/json; charset=utf-8');
    originalSetHeader('Cache-Control','no-store');
    originalSetHeader('X-APG-Platform-State','v'+platformState.VERSION);
    return res.end(JSON.stringify(platformState.snapshot({downstream,retailerSnapshot:snapshot(),env:process.env})));
  }
  if(path===ENDPOINT){res.statusCode=200;originalSetHeader('Content-Type','application/json; charset=utf-8');originalSetHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));}
  return downstream(req,res);
}

Object.assign(handler,downstream,{ACTION5_CATALOGUE_CERTIFICATION_VERSION:VERSION,amazonCatalogueCertificationSnapshot:snapshot,AMAZON_CATALOGUE_CERTIFICATION_ENDPOINT:ENDPOINT,PLATFORM_STATE_VERSION:platformState.VERSION,PLATFORM_STATE_ENDPOINT:platformState.ENDPOINT,platformStateSnapshot:(env=process.env)=>platformState.snapshot({downstream,retailerSnapshot:snapshot(),env})});
module.exports=handler;
