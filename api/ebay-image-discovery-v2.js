'use strict';

// APG eBay image discovery worker v2.0
// Purpose: expand exact-product photography coverage without weakening identity controls.
// Unlike the legacy discovery pass, this worker uses several bounded search formulations and an
// image-specific detail verifier. An affiliate URL is NOT required to prove that an eBay image
// belongs to the exact maintained product; exact identity, AU item URL, AUD price, new condition,
// non-accessory status, variant safety and the existing hero exact guard remain mandatory.
// Shopper requests never invoke this endpoint. Retailer/image availability contributes zero
// recommendation weight.

const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-hero-exact-guard-v2');

const VERSION='2.0';
const QUOTA_RESERVE=500;
const MAX_PRODUCTS_PER_RUN=3;
const MAX_SEARCH_QUERIES_PER_PRODUCT=3;
const MAX_DETAIL_CHECKS_PER_PRODUCT=6;
const MAX_CALLS_PER_PRODUCT=MAX_SEARCH_QUERIES_PER_PRODUCT+MAX_DETAIL_CHECKS_PER_PRODUCT;
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const DISCOVERY_SLUGS=[...PRODUCT_MAP.keys()];

function clean(value){return String(value==null?'':value).trim();}
function uniq(values){return [...new Set((values||[]).map(clean).filter(Boolean))];}
function compact(value){return enrichment.compact(value);}
function norm(value){return enrichment.norm(value);}
function json(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.end(JSON.stringify(body));}
function readBody(req){return new Promise((resolve,reject)=>{let raw='';req.on('data',chunk=>{raw+=String(chunk||'');if(raw.length>20000){reject(new Error('body-too-large'));try{req.destroy();}catch{}}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch(error){reject(error);}});req.on('error',reject);});}
function ordinaryBrowseRows(summary){const rows=Array.isArray(summary&&summary.resources)?summary.resources:[];const exact=rows.filter(row=>/^buy\.browse$/i.test(clean(row&&row.resource)));return exact.length?exact:rows.filter(row=>!/item\.bulk/i.test(clean(row&&row.resource)));}
function ordinaryBrowseRemaining(summary){const values=ordinaryBrowseRows(summary).map(row=>Number(row&&row.remaining)).filter(Number.isFinite);return values.length?Math.min(...values):null;}
function quotaPublic(summary){return {remaining:ordinaryBrowseRemaining(summary),reserve:QUOTA_RESERVE,resetAt:summary&&summary.resetAt||null,ordinaryResources:ordinaryBrowseRows(summary).map(row=>({resource:row.resource,limit:row.limit,remaining:row.remaining,count:row.count,reset:row.reset}))};}
async function quota(){const payload=await ebay.getRateLimits({apiName:'browse',apiContext:'buy',timeoutMs:6000});return ebay.summariseRateLimits(payload,{apiName:'browse',apiContext:'buy'});}
async function consumeCapability(triggerToken,workerToken){const result=await supabase.rpc('apg_consume_ebay_refresh_trigger',{p_trigger_token:triggerToken,p_worker_token:workerToken},{timeoutMs:3500});return result===true||(Array.isArray(result)&&result[0]===true);}
async function finishCapability(workerToken){try{await supabase.rpc('apg_finish_ebay_refresh_worker',{p_worker_token:workerToken},{timeoutMs:3500});}catch{}}
async function claimDiscovery(workerToken,limit){const result=await supabase.rpc('apg_claim_ebay_image_discovery_batch',{p_proof:workerToken,p_slugs:DISCOVERY_SLUGS,p_limit:Math.max(0,Math.min(MAX_PRODUCTS_PER_RUN,limit))},{timeoutMs:7000});return Array.isArray(result)?result:[];}
async function recordDiscoveryResult(workerToken,slug,status,errorCode=null){return supabase.rpc('apg_record_ebay_image_discovery_result',{p_proof:workerToken,p_slug:slug,p_status:status,p_error_code:clean(errorCode)||null},{timeoutMs:5000});}
function discoveryPayload(product,candidate,verifiedAt=new Date().toISOString()){
  return {
    slug:product.slug,productName:[product.brand,product.name].filter(Boolean).join(' '),
    itemId:candidate.itemId,legacyItemId:candidate.legacyItemId,title:candidate.title,condition:candidate.condition,
    price:candidate.price,imageUrl:candidate.imageUrl,imageSource:candidate.imageSource||'ebay-listing',itemWebUrl:candidate.itemWebUrl,
    itemAffiliateWebUrl:candidate.itemAffiliateWebUrl||null,verificationLevel:candidate.verificationLevel,
    verificationEvidence:candidate.verificationEvidence||{},detailVerified:true,exactModel:true,recommendationWeight:0,
    verifiedAt,heroEligible:true,matchScore:candidate.score==null?null:candidate.score,
    matchReasons:Array.isArray(candidate.reasons)?candidate.reasons:[],matchFlags:Array.isArray(candidate.flags)?candidate.flags:[]
  };
}
async function insertDiscoveredState(workerToken,product,candidate){return supabase.rpc('apg_insert_ebay_image_state',{p_proof:workerToken,p_payload:discoveryPayload(product,candidate)},{timeoutMs:6000});}

function productNameWithoutBrand(product){
  const brand=norm(product&&product.brand);const words=clean(product&&product.name).split(/\s+/).filter(Boolean);
  if(!brand)return words.join(' ');
  return words.filter(word=>norm(word)!==brand).join(' ');
}
function searchQueries(product){
  const brand=clean(product&&product.brand);const name=clean(product&&product.name);const modelTokens=enrichment.modelTokens(product);const identity=enrichment.identityTokens(product);
  const exact=enrichment.queryFor(product);
  const model=modelTokens.join(' ');
  const nameNoBrand=productNameWithoutBrand(product);
  const identityCore=identity.slice(0,5).join(' ');
  const queries=[exact];
  if(name)queries.push([brand,nameNoBrand||name].filter(Boolean).join(' '));
  if(model)queries.push([brand,model,identityCore].filter(Boolean).join(' '));
  else if(identityCore)queries.push([brand,identityCore].filter(Boolean).join(' '));
  return uniq(queries).slice(0,MAX_SEARCH_QUERIES_PER_PRODUCT);
}
function summaryImage(item){return clean(item&&item.image&&item.image.imageUrl)||clean(item&&item.thumbnailImages&&item.thumbnailImages[0]&&item.thumbnailImages[0].imageUrl)||null;}
function projectSummary(product,item,queryIndex){
  const assessment=enrichment.scoreCandidate(product,item);const title=clean(item&&item.title);const itemId=clean(item&&item.itemId);if(!title||!itemId)return null;
  return {
    itemId,legacyItemId:clean(item&&item.legacyItemId)||null,title,condition:clean(item&&item.condition)||null,
    price:item&&item.price&&typeof item.price==='object'?{value:clean(item.price.value),currency:clean(item.price.currency)}:null,
    imageUrl:summaryImage(item),imageSource:'ebay-listing',itemWebUrl:clean(item&&item.itemWebUrl)||null,itemAffiliateWebUrl:clean(item&&item.itemAffiliateWebUrl)||null,
    score:Number(assessment&&assessment.score)||0,status:assessment&&assessment.status||'reject',reasons:Array.isArray(assessment&&assessment.reasons)?assessment.reasons:[],
    flags:Array.isArray(assessment&&assessment.flags)?assessment.flags:[],modelCoverage:Number(assessment&&assessment.modelCoverage)||0,nameCoverage:Number(assessment&&assessment.nameCoverage)||0,
    queryIndex
  };
}
function strongSummaryCandidate(product,candidate){
  if(!candidate||!candidate.itemId||!candidate.title)return false;
  if(enrichment.listingLooksAccessory(candidate.title,product)||enrichment.listingLooksUsed(candidate.title,candidate.condition))return false;
  if(enrichment.materialIdentityConflict(product,candidate.title).conflict)return false;
  if(!enrichment.scoreCandidate(product,{title:candidate.title,condition:candidate.condition,price:candidate.price}).brandOk)return false;
  const models=enrichment.modelTokens(product);
  if(models.length){const hay=compact(candidate.title);return models.some(model=>hay.includes(compact(model)));}
  return candidate.nameCoverage>=0.5||candidate.score>=enrichment.REVIEW_SCORE;
}
function detailVariantText(detail){const aspects=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects.map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' '):'';return `${clean(detail&&detail.title)} ${aspects}`.trim();}
function structuredBrandMatches(product,brands,title){const expected=norm(product&&product.brand);if(!expected||!norm(title).includes(expected))return false;if(!brands.length)return true;return brands.some(value=>{const candidate=norm(value);return candidate===expected||candidate.includes(expected)||expected.includes(candidate);});}
function stagedAccepted(candidate){return {status:'accept',accepted:{...candidate,detailVerified:true,exactModel:true,recommendationWeight:0},review:null,candidates:[candidate],recommendationWeight:0};}
async function verifyImageCandidate(product,candidate){
  let detail;try{detail=await ebay.getItem(candidate.itemId,{referenceId:`apg:${product.slug}:image-discovery-v2`,timeoutMs:10000});}catch(error){return {ok:false,reason:clean(error&&error.code)||'EBAY_DETAIL_ERROR'};}
  if(!detail||typeof detail!=='object')return {ok:false,reason:'detail-missing'};
  const title=clean(detail.title)||candidate.title;const condition=clean(detail.condition)||candidate.condition;
  if(!title||enrichment.listingLooksAccessory(title,product)||enrichment.listingLooksUsed(title,condition)||enrichment.detailedCategoryRisk(detail))return {ok:false,reason:'detail-product-safety-reject'};
  const identityConflict=enrichment.materialIdentityConflict(product,detailVariantText(detail));if(identityConflict.conflict)return {ok:false,reason:identityConflict.reason};
  const brands=enrichment.detailedBrandEvidence(detail);if(!structuredBrandMatches(product,brands,title))return {ok:false,reason:'detail-brand-mismatch'};
  const imageUrl=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl)||candidate.imageUrl;
  const itemWebUrl=clean(detail&&detail.itemWebUrl)||candidate.itemWebUrl;const itemAffiliateWebUrl=clean(detail&&detail.itemAffiliateWebUrl)||candidate.itemAffiliateWebUrl||null;
  const itemId=clean(detail&&detail.itemId)||candidate.itemId;const legacyItemId=clean(detail&&detail.legacyItemId)||candidate.legacyItemId;
  const price=detail&&detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:candidate.price;
  if(!imageUrl||!itemWebUrl||!itemId||!legacyItemId)return {ok:false,reason:'detail-image-or-item-identity-missing'};
  if(!price||!price.value||price.currency!=='AUD')return {ok:false,reason:'detail-price-missing-or-non-aud'};
  const modelEvidence=enrichment.detailedModelEvidence(detail);const categoryPath=clean(detail&&detail.categoryPath)||null;
  const verified={...candidate,itemId,legacyItemId,title,condition,price,imageUrl,imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',itemWebUrl,itemAffiliateWebUrl,itemEndDate:clean(detail&&detail.itemEndDate)||null,detailVerified:true,exactModel:true,verificationLevel:modelEvidence.length?'detail-model-evidence':'detail-title-model',verificationEvidence:{brands,model:modelEvidence,categoryPath},recommendationWeight:0};
  let row=stagedAccepted(verified);row=familyGuard.applyToEnrichment(product,row);if(!row||row.status!=='accept'||!row.accepted)return {ok:false,reason:row&&row.familyGuard&&row.familyGuard.reason||'family-variant-guard'};
  const guard=exactGuard.evaluate(product,row,products,{now:Date.now()});if(!guard.eligible)return {ok:false,reason:`exact-guard:${guard.reason}`};
  return {ok:true,candidate:{...row.accepted,exactModel:true,detailVerified:true,recommendationWeight:0},guard};
}
async function discoverProduct(product,budget){
  const queries=searchQueries(product);const seen=new Map();let calls=0;
  for(let index=0;index<queries.length;index++){
    if(budget.remaining<1)break;budget.remaining-=1;calls+=1;
    let result;try{result=await ebay.searchItems({q:queries[index],limit:20},{referenceId:`apg:${product.slug}:image-search-v2:${index+1}`,timeoutMs:10000});}catch(error){continue;}
    for(const item of Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[]){const candidate=projectSummary(product,item,index);if(!candidate||!strongSummaryCandidate(product,candidate))continue;const prior=seen.get(candidate.itemId);if(!prior||candidate.score>prior.score)seen.set(candidate.itemId,candidate);}
  }
  const candidates=[...seen.values()].sort((a,b)=>(b.score-a.score)||(b.modelCoverage-a.modelCoverage)||(b.nameCoverage-a.nameCoverage)).slice(0,MAX_DETAIL_CHECKS_PER_PRODUCT);
  const rejects=[];
  for(const candidate of candidates){
    if(budget.remaining<1)break;budget.remaining-=1;calls+=1;const verified=await verifyImageCandidate(product,candidate);if(verified.ok)return {ok:true,candidate:verified.candidate,queries,calls,candidateCount:candidates.length};rejects.push({itemId:candidate.itemId,score:candidate.score,reason:verified.reason});
  }
  return {ok:false,queries,calls,candidateCount:candidates.length,rejects:rejects.slice(0,4)};
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,status:'method-not-allowed',version:VERSION});
  let body;try{body=await readBody(req);}catch{return json(res,400,{ok:false,status:'invalid-json',version:VERSION});}
  const triggerToken=clean(body&&body.triggerToken),workerToken=clean(body&&body.workerToken);if(!triggerToken||!workerToken)return json(res,401,{ok:false,status:'missing-capability',version:VERSION});
  let consumed=false;
  try{
    consumed=await consumeCapability(triggerToken,workerToken);if(!consumed)return json(res,401,{ok:false,status:'unauthorized',version:VERSION});
    const summary=await quota();const remaining=ordinaryBrowseRemaining(summary);if(!Number.isFinite(remaining))return json(res,503,{ok:false,status:'quota-check-unavailable',version:VERSION});
    const available=Math.max(0,remaining-QUOTA_RESERVE);if(available<MAX_CALLS_PER_PRODUCT)return json(res,200,{ok:true,status:'quota-reserved',version:VERSION,quota:quotaPublic(summary),processed:0});
    const limit=Math.min(MAX_PRODUCTS_PER_RUN,Math.floor(available/MAX_CALLS_PER_PRODUCT));const rows=await claimDiscovery(workerToken,limit);if(!rows.length)return json(res,200,{ok:true,status:'nothing-due',version:VERSION,quota:quotaPublic(summary),processed:0});
    const budget={remaining:available};const results=[];
    for(const row of rows){
      const slug=clean(row&&row.slug),product=PRODUCT_MAP.get(slug);if(!product){await recordDiscoveryResult(workerToken,slug,'error','UNKNOWN_APG_PRODUCT');results.push({slug,status:'error',reason:'unknown-product'});continue;}
      let found;try{found=await discoverProduct(product,budget);}catch(error){found={ok:false,error:clean(error&&error.code)||'DISCOVERY_V2_ERROR',calls:0};}
      if(found.ok){await insertDiscoveredState(workerToken,product,found.candidate);await recordDiscoveryResult(workerToken,slug,'accepted',null);results.push({slug,status:'accepted',itemId:found.candidate.itemId,verificationLevel:found.candidate.verificationLevel,calls:found.calls,queries:found.queries});}
      else{await recordDiscoveryResult(workerToken,slug,found.candidateCount?'review':'no-match',found.error||'DISCOVERY_V2_NOT_ACCEPTED');results.push({slug,status:found.candidateCount?'review':'no-match',calls:found.calls||0,queries:found.queries||[],candidateCount:found.candidateCount||0,rejects:found.rejects||[]});}
    }
    return json(res,200,{ok:true,status:'completed',version:VERSION,processed:results.length,accepted:results.filter(row=>row.status==='accepted').length,quota:quotaPublic(summary),budgetRemaining:budget.remaining,results});
  }catch(error){return json(res,500,{ok:false,status:'worker-error',version:VERSION,code:clean(error&&error.code)||'EBAY_DISCOVERY_V2_ERROR'});}
  finally{if(consumed)await finishCapability(workerToken);}
};
