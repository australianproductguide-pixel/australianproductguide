'use strict';

// APG eBay image continuity worker v1.5.
// Independent second-pass detail verification for governed eBay product imagery.
// A review/recovery row is always re-fetched and tested against the current guard before a
// replacement search is attempted. v1.5 aligns the second pass with the evidence-bound direct
// item path used by primary discovery: an exact registered item may survive generic host-
// compatibility wording only when the product-scoped exact guard also recognises the same title
// and safe marketplace leaf. All other accessory/part checks remain fail-closed.
// Public browsing remains registry-only and makes no eBay Browse calls. Affiliate availability
// never affects identity or recommendation weight.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const searchPlan=require('../lib/ebay-image-search-plan-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='1.5';
const REFRESH_QUOTA_RESERVE=500;
const MAX_BATCH=8;
const CONCURRENCY=2;
const MAX_RECOVERY_SEARCH_QUERIES=4;
const MAX_RECOVERY_DETAIL_CHECKS=6;
const MAX_RECOVERY_CALLS=MAX_RECOVERY_SEARCH_QUERIES+MAX_RECOVERY_DETAIL_CHECKS;
const MAX_DISCOVERY_PRODUCTS_PER_RUN=2;
const MAX_DISCOVERY_CALLS_PER_PRODUCT=MAX_RECOVERY_CALLS;
const VERIFIED_DIRECT_REFRESH_ITEMS=Object.freeze({
  'anker-547-usb-c-hub-7-in-2':'v1|398051289895|0'
});
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const DISCOVERY_SLUGS=[...PRODUCT_MAP.keys()];

function clean(value){return String(value==null?'':value).trim();}
function bool(value){return value===true||value==='true';}
function uniq(values){return [...new Set((values||[]).map(clean).filter(Boolean))];}
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
  const code=clean(result&&result.code),status=Number(result&&result.errorStatus);
  if(['EBAY_BROWSE_TIMEOUT','EBAY_BROWSE_NETWORK_ERROR','EBAY_BROWSE_RATE_LIMITED','EBAY_BROWSE_OAUTH_ERROR'].includes(code))return true;
  return Number.isFinite(status)&&status>=500;
}
function stagedAccepted(candidate){
  if(!candidate)return null;
  return {status:'accept',accepted:{...candidate,detailVerified:true,exactModel:true,recommendationWeight:0},review:null,candidates:[candidate],recommendationWeight:0};
}
function refreshPayload(candidate,verifiedAt=new Date().toISOString()){
  return {
    itemId:candidate.itemId,legacyItemId:candidate.legacyItemId,title:candidate.title,condition:candidate.condition,
    price:candidate.price,imageUrl:candidate.imageUrl,imageSource:candidate.imageSource||'ebay-listing',
    itemWebUrl:candidate.itemWebUrl,itemAffiliateWebUrl:candidate.itemAffiliateWebUrl||null,
    verificationLevel:candidate.verificationLevel,verificationEvidence:candidate.verificationEvidence||{},
    detailVerified:true,exactModel:true,recommendationWeight:0,verifiedAt
  };
}
function replacementPayload(candidate,heroEligible,verifiedAt=new Date().toISOString()){
  return {...refreshPayload(candidate,verifiedAt),heroEligible:heroEligible===true,matchScore:candidate.score==null?null:candidate.score,matchReasons:Array.isArray(candidate.reasons)?candidate.reasons:[],matchFlags:Array.isArray(candidate.flags)?candidate.flags:[]};
}
function discoveryPayload(product,candidate,heroEligible,verifiedAt=new Date().toISOString()){
  return {slug:product.slug,productName:[product.brand,product.name].filter(Boolean).join(' '),...replacementPayload(candidate,heroEligible,verifiedAt)};
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
  const result=await supabase.rpc('apg_claim_ebay_image_discovery_batch',{p_proof:workerToken,p_slugs:DISCOVERY_SLUGS,p_limit:Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,limit)},{timeoutMs:7000});
  return Array.isArray(result)?result:[];
}
async function recordSuccess(workerToken,slug,candidate){return supabase.rpc('apg_record_ebay_image_refresh_success',{p_proof:workerToken,p_slug:slug,p_payload:refreshPayload(candidate)},{timeoutMs:5000});}
async function recordFailure(workerToken,slug,code){return supabase.rpc('apg_record_ebay_image_refresh_failure',{p_proof:workerToken,p_slug:slug,p_error_code:clean(code)||'EBAY_REFRESH_FAILED'},{timeoutMs:5000});}
async function recordReplacement(workerToken,slug,oldItemId,candidate){return supabase.rpc('apg_replace_ebay_image_state',{p_proof:workerToken,p_slug:slug,p_expected_old_item_id:oldItemId,p_payload:replacementPayload(candidate,true)},{timeoutMs:5000});}
async function recordDiscoveryResult(workerToken,slug,status,errorCode=null){return supabase.rpc('apg_record_ebay_image_discovery_result',{p_proof:workerToken,p_slug:slug,p_status:status,p_error_code:clean(errorCode)||null},{timeoutMs:5000});}
async function insertDiscoveredState(workerToken,product,candidate){return supabase.rpc('apg_insert_ebay_image_state',{p_proof:workerToken,p_payload:discoveryPayload(product,candidate,true)},{timeoutMs:6000});}
function registeredDirectRefresh(row){
  const slug=clean(row&&row.slug),expected=clean(VERIFIED_DIRECT_REFRESH_ITEMS[slug]);
  return Boolean(expected&&clean(row&&row.item_id)===expected);
}
function claimedCandidate(row){
  const direct=registeredDirectRefresh(row);
  return {
    itemId:clean(row&&row.item_id),legacyItemId:clean(row&&row.legacy_item_id),title:'',condition:'',price:null,imageUrl:null,imageSource:null,
    itemWebUrl:null,itemAffiliateWebUrl:null,score:100,status:'accept',reasons:[direct?'verified-direct-item-retrieval':'previously-exact-verified-item'],flags:[],
    searchKind:direct?'verified-direct-item':'previously-verified-item',exactModel:true,modelCoverage:1,nameCoverage:1,priceRatio:null,detailVerified:true,
    verificationLevel:clean(row&&row.verification_level)||'detail-title-model',
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
  if(!expected||!enrichment.brandMatch(title,product&&product.brand))return false;
  if(!brands.length)return true;
  return brands.some(value=>enrichment.brandMatch(value,product&&product.brand));
}
function exactDetailCandidate(row,product,detail){
  if(!detail||typeof detail!=='object')return {ok:false,reason:'missing-detail',code:'EBAY_DETAIL_MISSING'};
  const prior=claimedCandidate(row),itemId=clean(detail.itemId)||prior.itemId,legacyItemId=clean(detail.legacyItemId)||prior.legacyItemId;
  if(itemId!==prior.itemId&&legacyItemId!==prior.legacyItemId)return {ok:false,reason:'detail-item-identity-mismatch',code:'EBAY_DETAIL_IDENTITY_MISMATCH'};
  const title=clean(detail.title),condition=clean(detail.condition);
  if(!title)return {ok:false,reason:'detail-title-missing',code:'EBAY_DETAIL_TITLE_MISSING'};
  if(enrichment.listingLooksUsed(title,condition))return {ok:false,reason:'detail-used-or-refurbished',code:'EBAY_DETAIL_USED'};
  const categoryPath=clean(detail.categoryPath)||null;
  const preliminary={...prior,itemId,legacyItemId,title,condition,verificationEvidence:{...(prior.verificationEvidence||{}),categoryPath}};
  const hostCompatibilitySafe=prior.searchKind==='verified-direct-item'&&exactGuard.hostCompatibilityWholeProductOverride(product,preliminary).ok;
  if(enrichment.listingLooksAccessory(title,product)&&!hostCompatibilitySafe)return {ok:false,reason:'detail-accessory-or-part-language',code:'EBAY_DETAIL_ACCESSORY'};
  if(enrichment.detailedCategoryRisk(detail))return {ok:false,reason:'detail-parts-category',code:'EBAY_DETAIL_PARTS_CATEGORY'};
  const identityConflict=enrichment.materialIdentityConflict(product,detailVariantText(detail));
  if(identityConflict.conflict)return {ok:false,reason:`detail-${identityConflict.reason}`,code:'EBAY_DETAIL_VARIANT_MISMATCH'};
  const brands=enrichment.detailedBrandEvidence(detail);
  if(!structuredBrandMatches(product,brands,title))return {ok:false,reason:'detail-brand-mismatch',code:'EBAY_DETAIL_BRAND_MISMATCH'};
  const modelEvidence=enrichment.detailedModelEvidence(detail);
  const imageUrl=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl);
  const itemWebUrl=clean(detail.itemWebUrl),itemAffiliateWebUrl=clean(detail.itemAffiliateWebUrl)||null;
  const price=detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:null;
  if(!imageUrl||!itemWebUrl)return {ok:false,reason:'detail-image-or-item-url-missing',code:'EBAY_DETAIL_MEDIA_MISSING'};
  if(!price||!price.value||price.currency!=='AUD')return {ok:false,reason:'detail-price-missing-or-non-aud',code:'EBAY_DETAIL_PRICE_INVALID'};
  const candidate={
    ...prior,itemId,legacyItemId,title,condition,price,imageUrl,
    imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
    itemWebUrl,itemAffiliateWebUrl,itemEndDate:clean(detail.itemEndDate)||null,
    verificationLevel:modelEvidence.length?'detail-model-evidence':'detail-title-model',
    verificationEvidence:{brands,model:modelEvidence,categoryPath},detailVerified:true,exactModel:true,recommendationWeight:0
  };
  const accepted=stagedAccepted(candidate),guard=exactGuard.evaluate(product,accepted,products,{now:Date.now()});
  if(!guard.eligible)return {ok:false,reason:`hero-${guard.reason}`,code:'EBAY_HERO_GUARD_REJECTED'};
  return {ok:true,candidate:accepted.accepted,guard};
}
async function verifyExisting(row,product){
  let detail;
  try{detail=await ebay.getItem(clean(row&&row.item_id),{referenceId:`apg:${product.slug}:image-refresh-v15`,timeoutMs:10000});}
  catch(error){const failure={ok:false,reason:'detail-verification-error',code:clean(error&&error.code)||'EBAY_DETAIL_ERROR',errorStatus:Number(error&&error.status)||null};failure.transient=transientVerificationFailure(failure);return failure;}
  return exactDetailCandidate(row,product,detail);
}
function searchRequest(plan){
  const out={limit:Number(plan&&plan.limit)||searchPlan.SEARCH_LIMIT,filter:clean(plan&&plan.filter)||searchPlan.NEW_CONDITION_FILTER};
  if(clean(plan&&plan.q))out.q=clean(plan.q);if(clean(plan&&plan.gtin))out.gtin=clean(plan.gtin);if(clean(plan&&plan.epid))out.epid=clean(plan.epid);if(clean(plan&&plan.categoryIds))out.categoryIds=clean(plan.categoryIds);
  return out;
}
function summaryImage(item){return clean(item&&item.image&&item.image.imageUrl)||clean(item&&item.thumbnailImages&&item.thumbnailImages[0]&&item.thumbnailImages[0].imageUrl)||null;}
function projectSummary(product,item,kind){
  const assessment=enrichment.scoreCandidate(product,item),title=clean(item&&item.title),itemId=clean(item&&item.itemId);
  if(!title||!itemId)return null;
  return {itemId,legacyItemId:clean(item&&item.legacyItemId)||null,title,condition:clean(item&&item.condition)||null,price:item&&item.price&&typeof item.price==='object'?{value:clean(item.price.value),currency:clean(item.price.currency)}:null,imageUrl:summaryImage(item),imageSource:'ebay-listing',itemWebUrl:clean(item&&item.itemWebUrl)||null,itemAffiliateWebUrl:clean(item&&item.itemAffiliateWebUrl)||null,score:Number(assessment&&assessment.score)||0,status:assessment&&assessment.status||'reject',reasons:Array.isArray(assessment&&assessment.reasons)?assessment.reasons:[],flags:Array.isArray(assessment&&assessment.flags)?assessment.flags:[],modelCoverage:Number(assessment&&assessment.modelCoverage)||0,nameCoverage:Number(assessment&&assessment.nameCoverage)||0,searchKind:clean(kind)||'unknown',exactModel:assessment&&assessment.exactModel===true,detailVerified:false,verificationLevel:null,marketplaceId:'EBAY_AU',source:'eBay Buy Browse API',recommendationWeight:0};
}
function strongSummaryCandidate(product,candidate){
  if(!candidate||!candidate.itemId||!candidate.title||enrichment.listingLooksAccessory(candidate.title,product)||enrichment.listingLooksUsed(candidate.title,candidate.condition)||enrichment.materialIdentityConflict(product,candidate.title).conflict)return false;
  const assessment=enrichment.scoreCandidate(product,{title:candidate.title,condition:candidate.condition,price:candidate.price,image:candidate.imageUrl?{imageUrl:candidate.imageUrl}:null,itemAffiliateWebUrl:candidate.itemAffiliateWebUrl});
  if(!assessment.brandOk)return false;
  const models=enrichment.modelTokens(product);
  if(models.length)return models.some(model=>enrichment.compact(candidate.title).includes(enrichment.compact(model)));
  const core=exactGuard.nameCore(product);
  return Boolean(core&&` ${enrichment.norm(candidate.title)} `.includes(` ${core} `))||candidate.nameCoverage>=0.5||candidate.score>=enrichment.REVIEW_SCORE;
}
async function searchExact(product,budget,{reference='recovery',maxQueries=MAX_RECOVERY_SEARCH_QUERIES,maxDetails=MAX_RECOVERY_DETAIL_CHECKS}={}){
  const plans=searchPlan.plansFor(product,{maxQueries}),seen=new Map(),searchErrors=[];let calls=0;
  for(let index=0;index<plans.length&&budget.remaining>0;index+=1){
    const plan=plans[index];budget.remaining-=1;calls+=1;let result;
    try{result=await ebay.searchItems(searchRequest(plan),{referenceId:`apg:${product.slug}:image-${reference}-v15:${index+1}`,timeoutMs:10000});}
    catch(error){searchErrors.push({kind:plan.kind,code:clean(error&&error.code)||'EBAY_SEARCH_ERROR'});continue;}
    for(const item of Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[]){
      const candidate=projectSummary(product,item,plan.kind);if(!strongSummaryCandidate(product,candidate))continue;
      const prior=seen.get(candidate.itemId);if(!prior||candidate.score>prior.score)seen.set(candidate.itemId,candidate);
    }
  }
  const candidates=[...seen.values()].sort((a,b)=>(b.score-a.score)||(b.modelCoverage-a.modelCoverage)||(b.nameCoverage-a.nameCoverage)).slice(0,maxDetails),rejects=[];
  for(const candidate of candidates){
    if(budget.remaining<1)break;budget.remaining-=1;calls+=1;
    let verified;try{verified=await enrichment.verifyDetailedCandidate(product,candidate);}catch(error){verified={ok:false,reason:clean(error&&error.code)||'DETAIL_VERIFY_ERROR'};}
    if(!verified.ok){rejects.push({itemId:candidate.itemId,reason:verified.reason||'detail-rejected'});continue;}
    const staged=stagedAccepted({...verified.candidate,score:candidate.score,reasons:candidate.reasons,flags:candidate.flags});
    const family=familyGuard.applyToEnrichment(product,staged);
    if(!family||family.status!=='accept'||!family.accepted){rejects.push({itemId:candidate.itemId,reason:family&&family.familyGuard&&family.familyGuard.reason||'family-variant-guard'});continue;}
    const guard=exactGuard.evaluate(product,family,products,{now:Date.now()});
    if(!guard.eligible){rejects.push({itemId:candidate.itemId,reason:guard.reason||'exact-guard'});continue;}
    return {ok:true,candidate:{...family.accepted,exactModel:true,detailVerified:true,recommendationWeight:0},guard,calls,plans:searchPlan.publicPlans(product,{maxQueries}),rejects,searchErrors};
  }
  return {ok:false,reason:'no-exact-current-candidate',code:'EBAY_RECOVERY_NO_EXACT_MATCH',calls,plans:searchPlan.publicPlans(product,{maxQueries}),rejects,searchErrors};
}
async function recoverExact(row,product,budget){return searchExact(product,budget,{reference:'recovery'});}
async function processRow(row,workerToken,budget){
  const slug=clean(row&&row.slug),product=PRODUCT_MAP.get(slug);
  if(!product){await recordFailure(workerToken,slug,'UNKNOWN_APG_PRODUCT');return {slug,status:'failed',reason:'unknown-product',calls:0};}
  if(budget.remaining<1)return {slug,status:'deferred',reason:'quota-reserved-for-detail-check',calls:0};
  budget.remaining-=1;let calls=1;const existing=await verifyExisting(row,product);
  if(existing.ok){await recordSuccess(workerToken,slug,existing.candidate);return {slug,status:bool(row&&row.recovery_required)?'restored':'refreshed',calls};}
  if(existing.transient===true){await recordFailure(workerToken,slug,existing.code||existing.reason);return {slug,status:'failed',reason:existing.reason,transient:true,calls};}
  if(!bool(row&&row.recovery_required)){await recordFailure(workerToken,slug,existing.code||existing.reason);return {slug,status:'failed',reason:existing.reason,calls};}
  const recovered=await recoverExact(row,product,budget);calls+=recovered.calls||0;
  if(recovered.ok){
    const oldItem=clean(row&&row.item_id),newItem=clean(recovered.candidate&&recovered.candidate.itemId);
    if(newItem&&newItem!==oldItem){await recordReplacement(workerToken,slug,oldItem,recovered.candidate);return {slug,status:'replaced',calls};}
    await recordSuccess(workerToken,slug,recovered.candidate);return {slug,status:'restored',calls};
  }
  await recordFailure(workerToken,slug,recovered.code||existing.code||recovered.reason||existing.reason);
  return {slug,status:'failed',reason:recovered.reason||existing.reason,calls};
}
async function pooled(rows,workerToken,budget){
  const output=new Array(rows.length);let cursor=0;
  async function run(){while(true){const index=cursor++;if(index>=rows.length)return;try{output[index]=await processRow(rows[index],workerToken,budget);}catch(error){output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',reason:clean(error&&error.code)||'REFRESH_WORKER_ERROR'};}}}
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,rows.length)},run));return output;
}
async function discoverOne(row,workerToken,budget){
  const slug=clean(row&&row.slug),product=PRODUCT_MAP.get(slug);
  if(!product){await recordDiscoveryResult(workerToken,slug,'error','UNKNOWN_APG_PRODUCT');return {slug,status:'error',reason:'unknown-product',calls:0};}
  const found=await searchExact(product,budget,{reference:'residual-discovery'});
  if(found.ok){
    try{await insertDiscoveredState(workerToken,product,found.candidate);await recordDiscoveryResult(workerToken,slug,'accepted',null);return {slug,status:'accepted',calls:found.calls||0};}
    catch(error){const code=clean(error&&error.code)||'EBAY_DISCOVERY_STATE_WRITE_FAILED';await recordDiscoveryResult(workerToken,slug,'error',code).catch(()=>{});return {slug,status:'error',reason:code,calls:found.calls||0};}
  }
  const status=found.rejects&&found.rejects.length?'review':'no-match';await recordDiscoveryResult(workerToken,slug,status,found.reason||'NO_EXACT_MATCH');return {slug,status,reason:found.reason,calls:found.calls||0};
}
async function discoverPooled(rows,workerToken,budget){
  const output=new Array(rows.length);let cursor=0;
  async function run(){while(true){const index=cursor++;if(index>=rows.length)return;try{output[index]=await discoverOne(rows[index],workerToken,budget);}catch(error){output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',reason:clean(error&&error.code)||'DISCOVERY_WORKER_ERROR'};}}}
  await Promise.all(Array.from({length:Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,rows.length)},run));return output;
}
function countStatuses(rows,initial){const counts={...initial};for(const row of rows||[])counts[row&&row.status]=(counts[row&&row.status]||0)+1;return counts;}
async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  const triggerToken=clean(req.body&&req.body.triggerToken),workerToken=clean(req.body&&req.body.workerToken);
  if(triggerToken.length<40||workerToken.length<40)return res.status(401).json({ok:false,status:'unauthorized'});
  let consumed=false;
  try{consumed=await consumeCapability(triggerToken,workerToken);}catch{return res.status(503).json({ok:false,status:'capability-check-unavailable'});}
  if(!consumed)return res.status(401).json({ok:false,status:'unauthorized'});
  try{
    let currentQuota;
    try{currentQuota=await quota();}catch(error){return res.status(503).json({ok:false,status:'quota-check-failed',version:VERSION,errorCode:clean(error&&error.code)||'EBAY_QUOTA_CHECK_FAILED'});}
    const remaining=ordinaryBrowseRemaining(currentQuota),info=quotaPublic(currentQuota);
    if(!Number.isFinite(remaining))return res.status(503).json({ok:false,status:'ordinary-quota-unknown',version:VERSION,quota:info});
    const usable=Math.max(0,remaining-REFRESH_QUOTA_RESERVE);
    if(usable<1)return res.status(200).json({ok:true,status:'quota-paused',version:VERSION,searchPlanVersion:searchPlan.VERSION,quota:info,processed:0,refresh:{processed:0},discovery:{processed:0}});
    const budget={remaining:usable};
    const refreshRows=await claim(workerToken,Math.max(1,Math.min(MAX_BATCH,budget.remaining)));
    const refreshResults=refreshRows.length?await pooled(refreshRows,workerToken,budget):[];
    const discoveryCapacity=Math.min(MAX_DISCOVERY_PRODUCTS_PER_RUN,Math.floor(budget.remaining/MAX_DISCOVERY_CALLS_PER_PRODUCT));
    const discoveryRows=discoveryCapacity>0?await claimDiscovery(workerToken,discoveryCapacity):[];
    const discoveryResults=discoveryRows.length?await discoverPooled(discoveryRows,workerToken,budget):[];
    const refreshCounts=countStatuses(refreshResults,{refreshed:0,restored:0,replaced:0,failed:0,deferred:0,error:0});
    const discoveryCounts=countStatuses(discoveryResults,{accepted:0,review:0,'no-match':0,deferred:0,error:0});
    const processed=refreshResults.length+discoveryResults.length;
    return res.status(200).json({ok:true,status:processed?'completed':'nothing-due',version:VERSION,searchPlanVersion:searchPlan.VERSION,guardVersion:exactGuard.VERSION,matcherVersion:enrichment.VERSION,processed,quota:info,budgetRemaining:budget.remaining,refresh:{processed:refreshResults.length,counts:refreshCounts,results:refreshResults},discovery:{processed:discoveryResults.length,counts:discoveryCounts,maxProductsPerRun:MAX_DISCOVERY_PRODUCTS_PER_RUN,results:discoveryResults}});
  }finally{await finishCapability(workerToken);}
}
handler.VERSION=VERSION;
handler.REFRESH_QUOTA_RESERVE=REFRESH_QUOTA_RESERVE;
handler.MAX_BATCH=MAX_BATCH;
handler.CONCURRENCY=CONCURRENCY;
handler.MAX_RECOVERY_CALLS=MAX_RECOVERY_CALLS;
handler.MAX_DISCOVERY_PRODUCTS_PER_RUN=MAX_DISCOVERY_PRODUCTS_PER_RUN;
handler.MAX_DISCOVERY_CALLS_PER_PRODUCT=MAX_DISCOVERY_CALLS_PER_PRODUCT;
handler.DISCOVERY_SLUGS=DISCOVERY_SLUGS;
handler.VERIFIED_DIRECT_REFRESH_ITEMS=VERIFIED_DIRECT_REFRESH_ITEMS;
handler.ordinaryBrowseRows=ordinaryBrowseRows;
handler.ordinaryBrowseRemaining=ordinaryBrowseRemaining;
handler.transientVerificationFailure=transientVerificationFailure;
handler.stagedAccepted=stagedAccepted;
handler.refreshPayload=refreshPayload;
handler.replacementPayload=replacementPayload;
handler.discoveryPayload=discoveryPayload;
handler.registeredDirectRefresh=registeredDirectRefresh;
handler.claimedCandidate=claimedCandidate;
handler.detailVariantText=detailVariantText;
handler.structuredBrandMatches=structuredBrandMatches;
handler.exactDetailCandidate=exactDetailCandidate;
handler.searchExact=searchExact;
handler.countStatuses=countStatuses;
module.exports=handler;
