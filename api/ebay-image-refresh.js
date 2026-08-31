'use strict';

// APG eBay image continuity worker v1.0.
// Invoked only by the Supabase pg_cron dispatcher using a one-time, short-lived capability.
// Shopper product-page requests never call eBay. This worker refreshes exact-item evidence in
// the background, retries failures, and only replaces a listing after the full APG exact-model
// guards pass. Retailer participation and imagery always contribute zero recommendation points.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-hero-exact-guard-v2');

const VERSION='1.0';
const REFRESH_QUOTA_RESERVE=500;
const MAX_BATCH=24;
const CONCURRENCY=3;
const MAX_RECOVERY_CALLS=5;
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));

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
  return {
    status:'accept',
    accepted:{
      ...candidate,
      detailVerified:true,
      exactModel:true,
      recommendationWeight:0
    },
    review:null,
    candidates:[]
  };
}
function refreshPayload(candidate,verifiedAt=new Date().toISOString()){
  return {
    itemId:candidate.itemId,
    legacyItemId:candidate.legacyItemId,
    title:candidate.title,
    condition:candidate.condition,
    price:candidate.price,
    imageUrl:candidate.imageUrl,
    imageSource:candidate.imageSource||'ebay-listing',
    itemWebUrl:candidate.itemWebUrl,
    itemAffiliateWebUrl:candidate.itemAffiliateWebUrl||null,
    verificationLevel:candidate.verificationLevel,
    verificationEvidence:candidate.verificationEvidence||{},
    detailVerified:true,
    exactModel:true,
    recommendationWeight:0,
    verifiedAt
  };
}
function replacementPayload(candidate,heroEligible,verifiedAt=new Date().toISOString()){
  return {
    ...refreshPayload(candidate,verifiedAt),
    heroEligible:heroEligible===true,
    matchScore:candidate.score==null?null:candidate.score,
    matchReasons:Array.isArray(candidate.reasons)?candidate.reasons:[],
    matchFlags:Array.isArray(candidate.flags)?candidate.flags:[]
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
async function finishCapability(workerToken){
  try{await supabase.rpc('apg_finish_ebay_refresh_worker',{p_worker_token:workerToken},{timeoutMs:3500});}catch{}
}
async function claim(workerToken,limit){
  const result=await supabase.rpc('apg_claim_ebay_image_refresh_batch',{p_proof:workerToken,p_limit:limit},{timeoutMs:5000});
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
    p_proof:workerToken,
    p_slug:slug,
    p_expected_old_item_id:oldItemId,
    p_payload:replacementPayload(candidate,true)
  },{timeoutMs:5000});
}
function claimedCandidate(row){
  return {
    itemId:clean(row&&row.item_id),
    legacyItemId:clean(row&&row.legacy_item_id),
    title:'',
    condition:'',
    price:null,
    imageUrl:null,
    imageSource:null,
    itemWebUrl:null,
    itemAffiliateWebUrl:null,
    score:100,
    status:'accept',
    reasons:['previously-exact-verified-item'],
    flags:[],
    exactModel:true,
    modelCoverage:1,
    nameCoverage:1,
    priceRatio:null,
    detailVerified:true,
    verificationLevel:clean(row&&row.verification_level)||'detail-title-model',
    verificationEvidence:row&&row.verification_evidence&&typeof row.verification_evidence==='object'?row.verification_evidence:{},
    marketplaceId:'EBAY_AU',
    source:'eBay Buy Browse API',
    recommendationWeight:0
  };
}
async function verifyExisting(row,product){
  const candidate=claimedCandidate(row);
  const verified=await enrichment.verifyDetailedCandidate(product,candidate);
  if(!verified||verified.ok!==true)return {ok:false,reason:clean(verified&&verified.reason)||'detail-verification-failed',code:clean(verified&&verified.code),errorStatus:Number(verified&&verified.errorStatus)||null,transient:transientVerificationFailure(verified)};
  const accepted=stagedAccepted(verified.candidate);
  const guard=exactGuard.evaluate(product,accepted,products,{now:Date.now()});
  if(!guard.eligible)return {ok:false,reason:`hero-${guard.reason}`,code:'EBAY_HERO_GUARD_REJECTED',transient:false};
  return {ok:true,candidate:accepted.accepted,guard};
}
async function recoverExact(row,product){
  try{
    const enriched=familyGuard.applyToEnrichment(product,await enrichment.enrichProduct(product));
    const guard=exactGuard.evaluate(product,enriched,products,{now:Date.now()});
    if(enriched&&enriched.status==='accept'&&guard.eligible&&enriched.accepted&&enriched.accepted.detailVerified===true){
      return {ok:true,candidate:{...enriched.accepted,exactModel:true,recommendationWeight:0},guard};
    }
    return {ok:false,reason:`recovery-${guard&&guard.reason||enriched&&enriched.status||'no-match'}`,code:'EBAY_RECOVERY_NO_EXACT_MATCH'};
  }catch(error){
    return {ok:false,reason:'recovery-error',code:clean(error&&error.code)||'EBAY_RECOVERY_ERROR',errorStatus:Number(error&&error.status)||null};
  }
}
async function processRow(row,workerToken,budget){
  const slug=clean(row&&row.slug);
  const product=PRODUCT_MAP.get(slug);
  if(!product){await recordFailure(workerToken,slug,'UNKNOWN_APG_PRODUCT');return {slug,status:'failed',reason:'unknown-product',callsReserved:0};}
  if(bool(row&&row.recovery_required)){
    if(budget.remaining<MAX_RECOVERY_CALLS)return {slug,status:'deferred',reason:'quota-reserved-for-recovery',callsReserved:0};
    budget.remaining-=MAX_RECOVERY_CALLS;
    const recovered=await recoverExact(row,product);
    if(recovered.ok){await recordReplacement(workerToken,slug,clean(row.item_id),recovered.candidate);return {slug,status:'replaced',callsReserved:MAX_RECOVERY_CALLS};}
    await recordFailure(workerToken,slug,recovered.code||recovered.reason);
    return {slug,status:'failed',reason:recovered.reason,callsReserved:MAX_RECOVERY_CALLS};
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
    while(true){const index=cursor++;if(index>=rows.length)return;try{output[index]=await processRow(rows[index],workerToken,budget);}catch(error){output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',reason:clean(error&&error.code)||'REFRESH_WORKER_ERROR'};}}
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,rows.length)},run));
  return output;
}

async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  const triggerToken=clean(req.body&&req.body.triggerToken);
  const workerToken=clean(req.body&&req.body.workerToken);
  if(triggerToken.length<40||workerToken.length<40)return res.status(401).json({ok:false,status:'unauthorized'});

  let consumed=false;
  try{consumed=await consumeCapability(triggerToken,workerToken);}catch{return res.status(503).json({ok:false,status:'capability-check-unavailable'});}
  if(!consumed)return res.status(401).json({ok:false,status:'unauthorized'});

  try{
    let currentQuota;
    try{currentQuota=await quota();}catch(error){return res.status(503).json({ok:false,status:'quota-check-failed',version:VERSION,errorCode:clean(error&&error.code)||'EBAY_QUOTA_CHECK_FAILED'});}
    const remaining=ordinaryBrowseRemaining(currentQuota);
    const info=quotaPublic(currentQuota);
    if(!Number.isFinite(remaining))return res.status(503).json({ok:false,status:'ordinary-quota-unknown',version:VERSION,quota:info});
    const usable=Math.max(0,remaining-REFRESH_QUOTA_RESERVE);
    if(usable<1)return res.status(200).json({ok:true,status:'quota-paused',version:VERSION,quota:info,processed:0});

    const batchLimit=Math.max(1,Math.min(MAX_BATCH,usable));
    const rows=await claim(workerToken,batchLimit);
    if(!rows.length)return res.status(200).json({ok:true,status:'nothing-due',version:VERSION,quota:info,processed:0});
    const budget={remaining:usable};
    const results=await pooled(rows,workerToken,budget);
    const counts={refreshed:0,replaced:0,failed:0,deferred:0,error:0};
    for(const row of results)counts[row&&row.status]=(counts[row&&row.status]||0)+1;
    return res.status(200).json({ok:true,status:'completed',version:VERSION,processed:results.length,counts,quota:info});
  }finally{
    await finishCapability(workerToken);
  }
}

handler.VERSION=VERSION;
handler.REFRESH_QUOTA_RESERVE=REFRESH_QUOTA_RESERVE;
handler.MAX_BATCH=MAX_BATCH;
handler.CONCURRENCY=CONCURRENCY;
handler.ordinaryBrowseRows=ordinaryBrowseRows;
handler.ordinaryBrowseRemaining=ordinaryBrowseRemaining;
handler.transientVerificationFailure=transientVerificationFailure;
handler.stagedAccepted=stagedAccepted;
handler.refreshPayload=refreshPayload;
handler.replacementPayload=replacementPayload;
handler.claimedCandidate=claimedCandidate;
module.exports=handler;
