'use strict';

// APG eBay image continuity worker v1.2.
// Invoked only by the Supabase pg_cron dispatcher using a one-time, short-lived capability.
// Shopper product-page requests never call eBay. This worker refreshes existing exact-item
// evidence, recovers ended/invalid listings, and uses only spare ordinary Browse quota to discover
// a tightly bounded number of new exact-product images. Retailer participation and imagery always
// contribute zero recommendation points.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-hero-exact-guard-v2');

const VERSION='1.2';
const REFRESH_QUOTA_RESERVE=500;
const MAX_BATCH=24;
const CONCURRENCY=3;
const MAX_RECOVERY_CALLS=5;
const MAX_DISCOVERY_PRODUCTS_PER_RUN=2;
const MAX_DISCOVERY_CALLS_PER_PRODUCT=5;
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const DISCOVERY_SLUGS=[...PRODUCT_MAP.keys()];

function clean(value){return String(value==null?'':value).trim();}
function bool(value){return value===true||value==='true';}
function ordinaryBrowseRows(summary){
  const rows=Array.isArray(summary&&summary.resources)?summary.resources:[];
  const exact=rows.filter(row=>/^buy\.browse$/i.test(clean(row&&row.resource)));
  return exact.length?exact:rows.filter(row=>!/item\.bulk/i.test(clean(row&&row.resource)));
}
function ordinaryBrowseRemaining(summary){
  const values=ordinaryBrowseRows(summary).map(row=>Number(row&&row.remaining)).filter(Number.isFinite);
  return values.length?Math.min(...values):null;
}
function quotaPublic(summary){
  return {
    remaining:ordinaryBrowseRemaining(summary),
    reserve:REFRESH_QUOTA_RESERVE,
    resetAt:summary&&summary.resetAt||null,
    ordinaryResources:ordinaryBrowseRows(summary).map(row=>({resource:row.resource,limit:row.limit,remaining:row.remaining,count:row.count,reset:row.reset}))
  };
}
function transientVerificationFailure(result){
  const code=clean(result&&result.code);
  const status=Number(result&&result.errorStatus);
  if(['EBAY_BROWSE_TIMEOUT','EBAY_BROWSE_NETWORK_ERROR','EBAY_BROWSE_RATE_LIMITED','EBAY_BROWSE_OAUTH_ERROR'].includes(code))return true;
  return Number.isFinite(status)&&status>=500;
}
function stagedAccepted(candidate){
  if(!candidate)return null;
  return {status:'accept',accepted:{...candidate,detailVerified:true,exactModel:true,recommendationWeight:0},review:null,candidates:[]};
}
function refreshPayload(candidate,verifiedAt=new Date().toISOString()){
  return {
    itemId:candidate.itemId,legacyItemId:candidate.legacyItemId,title:candidate.title,condition:candidate.condition,price:candidate.price,
    imageUrl:candidate.imageUrl,imageSource:candidate.imageSource||'ebay-listing',itemWebUrl:candidate.itemWebUrl,
    itemAffiliateWebUrl:candidate.itemAffiliateWebUrl||null,verificationLevel:candidate.verificationLevel,
    verificationEvidence:candidate.verificationEvidence||{},detailVerified:true,exactModel:true,recommendationWeight:0,verifiedAt
  };
}
function replacementPayload(candidate,heroEligible,verifiedAt=new Date().toISOString()){
  return {
    ...refreshPayload(candidate,verifiedAt),heroEligible:heroEligible===true,
    matchScore:candidate.score==null?null:candidate.score,
    matchReasons:Array.isArray(candidate.reasons)?candidate.reasons:[],matchFlags:Array.isArray(candidate.flags)?candidate.flags:[]
  };
}
function discoveryPayload(product,candidate,heroEligible,verifiedAt=new Date().toISOString()){
  return {
    slug:product.slug,
    productName:[product.brand,product.name].filter(Boolean).join(' '),
    ...replacementPayload(candidate,heroEligible,verifiedAt)
  };
}
async function quota(){
  const payload=await ebay.getRateLimits({apiName:'browse',apiContext:'buy',timeoutMs:6000});
  return ebay.summariseRateLimits(payload,{apiName:'browse',apiContext:'buy'});
}
async function consumeCapability(triggerToken,workerToken){
  const result=await supabase.rpc('apg_consume_ebay_refresh_trigger',{p_trigger_token:triggerToken,p_worker_token:workerToken},{timeoutMs:3500});
  return result===true||(Array.isArray(result)&&result[0]===true);
}
async function finishCapability(workerToken){try{await supabase.rpc('apg_finish_ebay_refresh_worker',{p_worker_token:workerToken},{timeoutMs:3500});}catch{}}
async function claim(workerToken,limit){
  const result=await supabase.rpc('apg_claim_ebay_image_refresh_batch',{p_proof:workerToken,p_limit:limit},{timeoutMs:5000});
  return Array.isArray(result)?result:[];
}
async function claimDiscovery(workerToken,limit){
  if(limit<1)return [];
  const result=await supabase.rpc('apg_claim_ebay_image_discovery_batch',{
    p_proof:workerToken,p_slugs:DISCOVERY_SLUGS,p_limit:Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,limit)
  },{timeoutMs:7000});
  return Array.isArray(result)?result:[];
}
async function recordSuccess(workerToken,slug,candidate){
  return supabase.rpc('apg_record_ebay_image_refresh_success',{p_proof:workerToken,p_slug:slug,p_payload:refreshPayload(candidate)},{timeoutMs:5000});
}
async function recordFailure(workerToken,slug,code){
  return supabase.rpc('apg_record_ebay_image_refresh_failure',{p_proof:workerToken,p_slug:slug,p_error_code:clean(code)||'EBAY_REFRESH_FAILED'},{timeoutMs:5000});
}
async function recordReplacement(workerToken,slug,oldItemId,candidate){
  return supabase.rpc('apg_replace_ebay_image_state',{
    p_proof:workerToken,p_slug:slug,p_expected_old_item_id:oldItemId,p_payload:replacementPayload(candidate,true)
  },{timeoutMs:5000});
}
async function recordDiscoveryResult(workerToken,slug,status,errorCode=null){
  return supabase.rpc('apg_record_ebay_image_discovery_result',{
    p_proof:workerToken,p_slug:slug,p_status:status,p_error_code:clean(errorCode)||null
  },{timeoutMs:5000});
}
async function insertDiscoveredState(workerToken,product,candidate){
  return supabase.rpc('apg_insert_ebay_image_state',{
    p_proof:workerToken,p_payload:discoveryPayload(product,candidate,true)
  },{timeoutMs:6000});
}
function claimedCandidate(row){
  return {
    itemId:clean(row&&row.item_id),legacyItemId:clean(row&&row.legacy_item_id),title:'',condition:'',price:null,imageUrl:null,imageSource:null,
    itemWebUrl:null,itemAffiliateWebUrl:null,score:100,status:'accept',reasons:['previously-exact-verified-item'],flags:[],exactModel:true,
    modelCoverage:1,nameCoverage:1,priceRatio:null,detailVerified:true,verificationLevel:clean(row&&row.verification_level)||'detail-title-model',
    verificationEvidence:row&&row.verification_evidence&&typeof row.verification_evidence==='object'?row.verification_evidence:{},
    marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',recommendationWeight:0
  };
}
function detailVariantText(detail){
  const aspects=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects.map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' '):'';
  return `${clean(detail&&detail.title)} ${aspects}`.trim();
}
function structuredBrandMatches(product,brands,title){
  const expected=enrichment.norm(product&&product.brand);
  if(!expected)return false;
  const titleBrand=enrichment.norm(title).includes(expected);
  if(!titleBrand)return false;
  if(!brands.length)return true;
  return brands.some(value=>{
    const candidate=enrichment.norm(value);
    return candidate===expected||candidate.includes(expected)||expected.includes(candidate);
  });
}
function exactDetailCandidate(row,product,detail){
  if(!detail||typeof detail!=='object')return {ok:false,reason:'missing-detail',code:'EBAY_DETAIL_MISSING'};
  const prior=claimedCandidate(row);
  const itemId=clean(detail.itemId)||prior.itemId;
  const legacyItemId=clean(detail.legacyItemId)||prior.legacyItemId;
  if(itemId!==prior.itemId&&legacyItemId!==prior.legacyItemId)return {ok:false,reason:'detail-item-identity-mismatch',code:'EBAY_DETAIL_IDENTITY_MISMATCH'};
  const title=clean(detail.title);const condition=clean(detail.condition);
  if(!title)return {ok:false,reason:'detail-title-missing',code:'EBAY_DETAIL_TITLE_MISSING'};
  if(enrichment.listingLooksAccessory(title,product))return {ok:false,reason:'detail-accessory-or-part-language',code:'EBAY_DETAIL_ACCESSORY'};
  if(enrichment.listingLooksUsed(title,condition))return {ok:false,reason:'detail-used-or-refurbished',code:'EBAY_DETAIL_USED'};
  if(enrichment.detailedCategoryRisk(detail))return {ok:false,reason:'detail-parts-category',code:'EBAY_DETAIL_PARTS_CATEGORY'};
  const identityConflict=enrichment.materialIdentityConflict(product,detailVariantText(detail));
  if(identityConflict.conflict)return {ok:false,reason:`detail-${identityConflict.reason}`,code:'EBAY_DETAIL_VARIANT_MISMATCH'};
  const brands=enrichment.detailedBrandEvidence(detail);
  if(!structuredBrandMatches(product,brands,title))return {ok:false,reason:'detail-brand-mismatch',code:'EBAY_DETAIL_BRAND_MISMATCH'};
  const modelEvidence=enrichment.detailedModelEvidence(detail);
  const imageUrl=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl);
  const itemWebUrl=clean(detail.itemWebUrl);const itemAffiliateWebUrl=clean(detail.itemAffiliateWebUrl);
  const price=detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:null;
  if(!imageUrl||!itemWebUrl||!itemAffiliateWebUrl)return {ok:false,reason:'detail-image-or-item-url-missing',code:'EBAY_DETAIL_MEDIA_MISSING'};
  if(!price||!price.value||price.currency!=='AUD')return {ok:false,reason:'detail-price-missing-or-non-aud',code:'EBAY_DETAIL_PRICE_INVALID'};
  const categoryPath=clean(detail.categoryPath)||null;
  const candidate={
    ...prior,itemId,legacyItemId,title,condition,price,imageUrl,
    imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
    itemWebUrl,itemAffiliateWebUrl,itemEndDate:clean(detail.itemEndDate)||null,
    verificationLevel:modelEvidence.length?'detail-model-evidence':'detail-title-model',
    verificationEvidence:{brands,model:modelEvidence,categoryPath},detailVerified:true,exactModel:true,recommendationWeight:0
  };
  const accepted=stagedAccepted(candidate);
  const guard=exactGuard.evaluate(product,accepted,products,{now:Date.now()});
  if(!guard.eligible)return {ok:false,reason:`hero-${guard.reason}`,code:'EBAY_HERO_GUARD_REJECTED'};
  return {ok:true,candidate:accepted.accepted,guard};
}
async function verifyExisting(row,product){
  let detail;
  try{detail=await ebay.getItem(clean(row&&row.item_id),{referenceId:`apg:${product.slug}:image-refresh`,timeoutMs:10000});}
  catch(error){
    const failure={ok:false,reason:'detail-verification-error',code:clean(error&&error.code)||'EBAY_DETAIL_ERROR',errorStatus:Number(error&&error.status)||null};
    failure.transient=transientVerificationFailure(failure);return failure;
  }
  return exactDetailCandidate(row,product,detail);
}
async function recoverExact(row,product){
  try{
    const enriched=familyGuard.applyToEnrichment(product,await enrichment.enrichProduct(product));
    const guard=exactGuard.evaluate(product,enriched,products,{now:Date.now()});
    if(enriched&&enriched.status==='accept'&&guard.eligible&&enriched.accepted&&enriched.accepted.detailVerified===true){
      return {ok:true,candidate:{...enriched.accepted,exactModel:true,recommendationWeight:0},guard};
    }
    return {ok:false,reason:`recovery-${guard&&guard.reason||enriched&&enriched.status||'no-match'}`,code:'EBAY_RECOVERY_NO_EXACT_MATCH'};
  }catch(error){return {ok:false,reason:'recovery-error',code:clean(error&&error.code)||'EBAY_RECOVERY_ERROR',errorStatus:Number(error&&error.status)||null};}
}
async function processRow(row,workerToken,budget){
  const slug=clean(row&&row.slug);const product=PRODUCT_MAP.get(slug);
  if(!product){await recordFailure(workerToken,slug,'UNKNOWN_APG_PRODUCT');return {slug,status:'failed',reason:'unknown-product',callsReserved:0};}
  if(bool(row&&row.recovery_required)){
    if(budget.remaining<MAX_RECOVERY_CALLS)return {slug,status:'deferred',reason:'quota-reserved-for-recovery',callsReserved:0};
    budget.remaining-=MAX_RECOVERY_CALLS;
    const recovered=await recoverExact(row,product);
    if(recovered.ok){await recordReplacement(workerToken,slug,clean(row.item_id),recovered.candidate);return {slug,status:'replaced',callsReserved:MAX_RECOVERY_CALLS};}
    await recordFailure(workerToken,slug,recovered.code||recovered.reason);return {slug,status:'failed',reason:recovered.reason,callsReserved:MAX_RECOVERY_CALLS};
  }
  if(budget.remaining<1)return {slug,status:'deferred',reason:'quota-reserved-for-refresh',callsReserved:0};
  budget.remaining-=1;
  const verified=await verifyExisting(row,product);
  if(verified.ok){await recordSuccess(workerToken,slug,verified.candidate);return {slug,status:'refreshed',callsReserved:1};}
  await recordFailure(workerToken,slug,verified.code||verified.reason);
  return {slug,status:'failed',reason:verified.reason,transient:verified.transient===true,callsReserved:1};
}
async function pooled(rows,workerToken,budget){
  const output=new Array(rows.length);let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;if(index>=rows.length)return;
      try{output[index]=await processRow(rows[index],workerToken,budget);}
      catch(error){output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',reason:clean(error&&error.code)||'REFRESH_WORKER_ERROR'};}
    }
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,rows.length)},run));return output;
}
async function discoverOne(row,workerToken,budget){
  const slug=clean(row&&row.slug);const product=PRODUCT_MAP.get(slug);
  if(!product){await recordDiscoveryResult(workerToken,slug,'error','UNKNOWN_APG_PRODUCT');return {slug,status:'error',reason:'unknown-product',callsReserved:0};}
  if(budget.remaining<MAX_DISCOVERY_CALLS_PER_PRODUCT){
    await recordDiscoveryResult(workerToken,slug,'deferred','DISCOVERY_QUOTA_RESERVED');
    return {slug,status:'deferred',reason:'quota-reserved',callsReserved:0};
  }
  // Reserve the maximum call budget before any network work. enrichProduct performs one search
  // plus no more than four detail checks, so this cannot erode the protected ordinary-call pool.
  budget.remaining-=MAX_DISCOVERY_CALLS_PER_PRODUCT;
  let enriched;
  try{enriched=familyGuard.applyToEnrichment(product,await enrichment.enrichProduct(product));}
  catch(error){
    const code=clean(error&&error.code)||'EBAY_DISCOVERY_ERROR';
    await recordDiscoveryResult(workerToken,slug,'error',code);
    return {slug,status:'error',reason:code,callsReserved:MAX_DISCOVERY_CALLS_PER_PRODUCT};
  }
  const guard=exactGuard.evaluate(product,enriched,products,{now:Date.now()});
  if(enriched&&enriched.status==='accept'&&guard.eligible===true&&enriched.accepted&&enriched.accepted.detailVerified===true){
    const candidate={...enriched.accepted,exactModel:true,recommendationWeight:0};
    try{
      await insertDiscoveredState(workerToken,product,candidate);
      await recordDiscoveryResult(workerToken,slug,'accepted',null);
      return {slug,status:'accepted',callsReserved:MAX_DISCOVERY_CALLS_PER_PRODUCT};
    }catch(error){
      const code=clean(error&&error.code)||'EBAY_DISCOVERY_STATE_WRITE_FAILED';
      await recordDiscoveryResult(workerToken,slug,'error',code).catch(()=>{});
      return {slug,status:'error',reason:code,callsReserved:MAX_DISCOVERY_CALLS_PER_PRODUCT};
    }
  }
  const status=enriched&&enriched.status==='review'?'review':'no-match';
  await recordDiscoveryResult(workerToken,slug,status,guard&&guard.reason||enriched&&enriched.status||'NO_EXACT_MATCH');
  return {slug,status,reason:guard&&guard.reason||null,callsReserved:MAX_DISCOVERY_CALLS_PER_PRODUCT};
}
async function discoverPooled(rows,workerToken,budget){
  const output=new Array(rows.length);let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;if(index>=rows.length)return;
      try{output[index]=await discoverOne(rows[index],workerToken,budget);}
      catch(error){output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',reason:clean(error&&error.code)||'DISCOVERY_WORKER_ERROR'};}
    }
  }
  await Promise.all(Array.from({length:Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,rows.length)},run));return output;
}
function countStatuses(rows,initial){
  const counts={...initial};for(const row of rows||[])counts[row&&row.status]=(counts[row&&row.status]||0)+1;return counts;
}

async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  const triggerToken=clean(req.body&&req.body.triggerToken);const workerToken=clean(req.body&&req.body.workerToken);
  if(triggerToken.length<40||workerToken.length<40)return res.status(401).json({ok:false,status:'unauthorized'});
  let consumed=false;
  try{consumed=await consumeCapability(triggerToken,workerToken);}catch{return res.status(503).json({ok:false,status:'capability-check-unavailable'});}
  if(!consumed)return res.status(401).json({ok:false,status:'unauthorized'});
  try{
    let currentQuota;
    try{currentQuota=await quota();}catch(error){return res.status(503).json({ok:false,status:'quota-check-failed',version:VERSION,errorCode:clean(error&&error.code)||'EBAY_QUOTA_CHECK_FAILED'});}
    const remaining=ordinaryBrowseRemaining(currentQuota);const info=quotaPublic(currentQuota);
    if(!Number.isFinite(remaining))return res.status(503).json({ok:false,status:'ordinary-quota-unknown',version:VERSION,quota:info});
    const usable=Math.max(0,remaining-REFRESH_QUOTA_RESERVE);
    if(usable<1)return res.status(200).json({ok:true,status:'quota-paused',version:VERSION,quota:info,processed:0,refresh:{processed:0},discovery:{processed:0}});

    const budget={remaining:usable};
    const batchLimit=Math.max(1,Math.min(MAX_BATCH,budget.remaining));
    const refreshRows=await claim(workerToken,batchLimit);
    const refreshResults=refreshRows.length?await pooled(refreshRows,workerToken,budget):[];

    const discoveryCapacity=Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,Math.floor(budget.remaining/MAX_DISCOVERY_CALLS_PER_PRODUCT));
    const discoveryRows=discoveryCapacity>0?await claimDiscovery(workerToken,discoveryCapacity):[];
    const discoveryResults=discoveryRows.length?await discoverPooled(discoveryRows,workerToken,budget):[];

    const refreshCounts=countStatuses(refreshResults,{refreshed:0,replaced:0,failed:0,deferred:0,error:0});
    const discoveryCounts=countStatuses(discoveryResults,{accepted:0,review:0,'no-match':0,deferred:0,error:0});
    const processed=refreshResults.length+discoveryResults.length;
    return res.status(200).json({
      ok:true,status:processed?'completed':'nothing-due',version:VERSION,processed,quota:info,
      refresh:{processed:refreshResults.length,counts:refreshCounts},
      discovery:{processed:discoveryResults.length,counts:discoveryCounts,maxProductsPerRun:MAX_DISCOVERY_PRODUCTS_PER_RUN}
    });
  }finally{await finishCapability(workerToken);}
}

handler.VERSION=VERSION;handler.REFRESH_QUOTA_RESERVE=REFRESH_QUOTA_RESERVE;handler.MAX_BATCH=MAX_BATCH;handler.CONCURRENCY=CONCURRENCY;
handler.MAX_RECOVERY_CALLS=MAX_RECOVERY_CALLS;handler.MAX_DISCOVERY_PRODUCTS_PER_RUN=MAX_DISCOVERY_PRODUCTS_PER_RUN;
handler.MAX_DISCOVERY_CALLS_PER_PRODUCT=MAX_DISCOVERY_CALLS_PER_PRODUCT;handler.DISCOVERY_SLUGS=DISCOVERY_SLUGS;
handler.ordinaryBrowseRows=ordinaryBrowseRows;handler.ordinaryBrowseRemaining=ordinaryBrowseRemaining;handler.transientVerificationFailure=transientVerificationFailure;
handler.stagedAccepted=stagedAccepted;handler.refreshPayload=refreshPayload;handler.replacementPayload=replacementPayload;handler.discoveryPayload=discoveryPayload;
handler.claimedCandidate=claimedCandidate;handler.detailVariantText=detailVariantText;handler.structuredBrandMatches=structuredBrandMatches;
handler.exactDetailCandidate=exactDetailCandidate;handler.countStatuses=countStatuses;
module.exports=handler;
