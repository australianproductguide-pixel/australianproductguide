'use strict';

const downstream=require('./action4-final-v981');
const {products}=require('../data');
const amazon=require('../data/amazon-au-mappings-v33');
const observability=require('./intelligence-observability-v27');

const VERSION='99.0';
const CHECKED_AT='2026-08-24';
const ORIGIN='https://australianproductguide.au';
const HIGH_INTENT_CATEGORIES=new Set(['televisions','laptops','robot-vacuums','washing-machines','coffee-machines','wireless-headphones','smartphones','earbuds']);
const MANUAL_PRIORITY_STATUSES=new Set(['REQUIRES_MANUAL_VALIDATION','REGIONAL_MISMATCH','IDENTITY_AMBIGUOUS']);

function daysBetween(a,b){
  const x=Date.parse(`${a}T00:00:00Z`),y=Date.parse(`${b}T00:00:00Z`);
  return Number.isFinite(x)&&Number.isFinite(y)?Math.floor((y-x)/86400000):null;
}
function currentness(record,product){
  const age=daysBetween(record.verifiedAt,CHECKED_AT);
  const reviewWindow=HIGH_INTENT_CATEGORIES.has(product.category)?14:30;
  if(age===null)return {status:'REQUIRES_RECHECK',ageDays:null,reviewWindowDays:reviewWindow,recheckDue:null};
  const due=new Date(`${record.verifiedAt}T00:00:00Z`);due.setUTCDate(due.getUTCDate()+reviewWindow);
  return {status:age>reviewWindow?'REVIEW_DUE':'CURRENT_VERIFIED',ageDays:age,reviewWindowDays:reviewWindow,recheckDue:due.toISOString().slice(0,10)};
}
function offerSnapshot(){
  const rows=[];
  for(const p of products){
    for(const o of p.offers||[]){
      if(!o||o.exactModel!==true||!o.url||!o.retailer)continue;
      rows.push({productId:p.slug,category:p.category,retailer:o.retailer,sourceType:o.sourceType||'unclassified',affiliate:o.affiliate===true,checkedAt:o.checkedAt||null,reviewDue:o.reviewDue||null,url:o.url});
    }
  }
  const manufacturer=rows.filter(x=>x.sourceType==='manufacturer-direct-au');
  const independent=rows.filter(x=>x.sourceType==='independent-retailer-au');
  const otherAffiliate=rows.filter(x=>x.affiliate&&!/amazon/i.test(x.retailer));
  return {
    exactDestinationCount:rows.length,
    productsWithExactDestinations:new Set(rows.map(x=>x.productId)).size,
    manufacturerDirectDestinations:manufacturer.length,
    manufacturerDirectProducts:new Set(manufacturer.map(x=>x.productId)).size,
    independentAuRetailerDestinations:independent.length,
    independentAuRetailerProducts:new Set(independent.map(x=>x.productId)).size,
    otherAffiliateRetailerDestinations:otherAffiliate.length,
    otherAffiliateRetailerProducts:new Set(otherAffiliate.map(x=>x.productId)).size,
    verifiedRetailers:new Set(rows.map(x=>x.retailer)).size
  };
}
function amazonSnapshot(){
  const states=[];
  const errors=[];
  const asinMap=new Map();
  for(const p of products){
    const r=amazon.getAmazonAuRecord(p);
    const row={productId:p.slug,category:p.category,status:r?.matchStatus||'UNVERIFIED',asin:r?.asin||null,url:r?.url||null,variant:r?.variantMatch||null,confidence:r?.confidence||'UNVERIFIED',verifiedAt:r?.verifiedAt||null,exceptionReason:r?.exceptionReason||null,recommendationWeight:r?.recommendationWeight};
    states.push(row);
    if(!p.slug)errors.push({productId:null,code:'MISSING_PRODUCT_ID'});
    if(!r||!r.url){errors.push({productId:p.slug,code:'MISSING_PATHWAY'});continue;}
    let u;try{u=new URL(r.url)}catch{errors.push({productId:p.slug,code:'MALFORMED_URL'});continue;}
    if(u.hostname!=='www.amazon.com.au')errors.push({productId:p.slug,code:'WRONG_AMAZON_DOMAIN'});
    if(u.searchParams.get('tag')!==amazon.TAG)errors.push({productId:p.slug,code:'INVALID_ASSOCIATES_TAG'});
    if(r.matchStatus==='EXACT_VERIFIED'||r.matchStatus==='VARIANT_VERIFIED'){
      if(!r.asin||!/^[A-Z0-9]{10}$/.test(r.asin))errors.push({productId:p.slug,code:'DIRECT_REQUIRES_VALID_ASIN'});
      if(!r.verifiedAt)errors.push({productId:p.slug,code:'VERIFIED_REQUIRES_DATE'});
      if(r.matchStatus==='VARIANT_VERIFIED'&&!r.variantMatch)errors.push({productId:p.slug,code:'VARIANT_REQUIRES_DESCRIPTION'});
      if(r.asin&&u.pathname!==`/dp/${r.asin}`)errors.push({productId:p.slug,code:'DIRECT_URL_ASIN_MISMATCH'});
      if(r.asin){const list=asinMap.get(r.asin)||[];list.push(p.slug);asinMap.set(r.asin,list);}
    } else if(r.matchStatus==='SEARCH_FALLBACK'){
      if(r.asin)errors.push({productId:p.slug,code:'FALLBACK_MUST_NOT_HAVE_ASIN'});
      if(u.pathname!=='/s'||!String(u.searchParams.get('k')||'').trim())errors.push({productId:p.slug,code:'FALLBACK_REQUIRES_MODEL_SEARCH'});
    } else errors.push({productId:p.slug,code:'UNRECOGNISED_AMAZON_STATE',status:r.matchStatus});
    if(r.recommendationWeight!==0)errors.push({productId:p.slug,code:'COMMERCIAL_WEIGHT_MUST_BE_ZERO'});
  }
  const collisions=[...asinMap].filter(([,slugs])=>slugs.length>1).map(([asin,slugs])=>({asin,productIds:slugs}));
  for(const c of collisions)errors.push({code:'ASIN_COLLISION',...c});
  const exact=states.filter(x=>x.status==='EXACT_VERIFIED');
  const variant=states.filter(x=>x.status==='VARIANT_VERIFIED');
  const fallback=states.filter(x=>x.status==='SEARCH_FALLBACK');
  const missing=states.length-exact.length-variant.length-fallback.length;
  const freshness=[...exact,...variant].map(x=>{const p=products.find(p=>p.slug===x.productId);return {...x,currentness:currentness(x,p)};});
  const stale=freshness.filter(x=>x.currentness.status!=='CURRENT_VERIFIED');
  return {total:states.length,exact:exact.length,variant:variant.length,fallback:fallback.length,missingPathways:missing,collisions,structuralErrors:errors,freshness:{verifiedMappings:freshness.length,current:freshness.length-stale.length,reviewDue:stale.length,items:freshness}};
}
function priorityQueue(){
  const rows=[];
  for(const p of products){
    const r=amazon.getAmazonAuRecord(p);
    if(r.matchStatus!=='SEARCH_FALLBACK')continue;
    const ex=amazon.EXCEPTIONS[p.slug]||null;
    const manual=ex&&MANUAL_PRIORITY_STATUSES.has(ex.status);
    const highIntent=HIGH_INTENT_CATEGORIES.has(p.category);
    const priority=manual?'P1':highIntent?'P2':'P3';
    rows.push({productId:p.slug,category:p.category,priority,reason:manual?ex.status:highIntent?'HIGH_INTENT_CATEGORY_SAFE_FALLBACK':'SAFE_FALLBACK',exception:ex?.status||null});
  }
  const rank={P1:1,P2:2,P3:3};rows.sort((a,b)=>rank[a.priority]-rank[b.priority]||a.category.localeCompare(b.category)||a.productId.localeCompare(b.productId));
  return {
    method:'Measured product/category demand is not yet available at sufficient granularity, so Action 5 does not fabricate demand weights. P1 is reserved for explicit identity/manual-validation exceptions. Existing high-intent category governance informs P2. All other truthful fallbacks remain P3 until real usage supports promotion.',
    inputs:{ga4Aggregate:'MEASURED_AGGREGATE_ONLY',searchConsoleAggregate:'MEASURED_AGGREGATE_ONLY',siteSearchProductDemand:'NOT_YET_MEASURED',decisionLabProductDemand:'NOT_YET_MEASURED',scoutProductDemand:'NOT_YET_MEASURED',comparisonProductDemand:'NOT_YET_MEASURED',productIdentity:'MEASURED',amazonMappingConfidence:'MEASURED',categoryPlanningSignals:'HISTORICAL_NOT_USED_AS_MEASURED_DEMAND'},
    counts:{P1:rows.filter(x=>x.priority==='P1').length,P2:rows.filter(x=>x.priority==='P2').length,P3:rows.filter(x=>x.priority==='P3').length},
    queue:rows
  };
}
function policyControl(){return {
  reviewedAt:CHECKED_AT,
  basis:'Amazon.com.au Associates Program Operating Agreement and Participation Requirements reviewed 24 August 2026; APG continues to use tagged Special Links, prohibits artificial clicks/sessions and does not automate Amazon destination navigation.',
  associatesTag:amazon.TAG,
  automatedAmazonRequests:0,
  automationMode:'APG_INTERNAL_CONTRACT_VALIDATION_ONLY',
  priceAvailabilityMode:'NOT_CLAIMED_AS_LIVE_WITHOUT_AUTHORISED_CURRENT_SOURCE',
  scraping:'NOT_INTRODUCED'
};}
function snapshot(){
  const a=amazonSnapshot(),retailers=offerSnapshot(),legacyRetailers=observability.retailerSnapshot(),priority=priorityQueue();
  const gateChecks={
    catalogueReconciles:a.total===products.length&&products.length===482,
    pathwayCoverage:a.missingPathways===0&&a.exact+a.variant+a.fallback===a.total,
    retailerStatesDistinct:a.exact>0&&a.variant>0&&a.fallback>0,
    noStructuralErrors:a.structuralErrors.length===0,
    noAsinCollisions:a.collisions.length===0,
    recommendationNeutral:products.every(p=>amazon.getAmazonAuRecord(p).recommendationWeight===0),
    verifiedMappingsCurrent:a.freshness.reviewDue===0,
    broaderRetailerRecountReconciles:retailers.exactDestinationCount===legacyRetailers.exactOfferCount&&retailers.productsWithExactDestinations===legacyRetailers.productsWithExactOffers,
    demandTruthPreserved:priority.inputs.siteSearchProductDemand==='NOT_YET_MEASURED'&&priority.inputs.decisionLabProductDemand==='NOT_YET_MEASURED'
  };
  const blockers=Object.entries(gateChecks).filter(([,ok])=>!ok).map(([key])=>key);
  return {version:VERSION,checkedAt:CHECKED_AT,amazon:a,retailers,priority,policy:policyControl(),analyticsTaxonomy:['direct_asin','verified_variant','search_fallback'],gate:{status:blockers.length?'AMBER':'GREEN',checks:gateChecks,blockers}};
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=function(name,value){if(String(name).toLowerCase()==='x-apg-action5-retailer-integrity')return originalSetHeader(name,'v'+VERSION);return originalSetHeader(name,value);};
  originalSetHeader('X-APG-Action5-Retailer-Integrity','v'+VERSION);
  if(path==='/api/intelligence/action5-retailer-integrity'){
    res.statusCode=200;originalSetHeader('Content-Type','application/json; charset=utf-8');originalSetHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));
  }
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION5_RETAILER_INTEGRITY_VERSION:VERSION,action5RetailerSnapshot:snapshot,amazonSnapshot,offerSnapshot,priorityQueue,policyControl});
module.exports=handler;
