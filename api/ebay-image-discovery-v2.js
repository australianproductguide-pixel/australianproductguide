'use strict';

// APG eBay image discovery worker v2.6
// Broader exact-product recall for the 482-product image-completion programme.
// Search breadth is expanded through model/name/category/alias/GTIN/ePID plans and 50-result
// NEW-condition searches. v2.6 keeps the tiny evidence-backed direct-item retrieval register and
// allows only the exact guard's product-scoped host-compatibility exception to survive the early
// accessory-language screen. The full exact-product guard still runs afterwards, followed by the
// independent second pass. Public browsing still makes no eBay Browse calls.
const {products}=require('../data');
const supabase=require('../lib/apg-supabase-public-v1');
const ebay=require('../lib/ebay-browse-api-v1');
const enrichment=require('../lib/ebay-catalogue-enrichment-v1');
const searchPlan=require('../lib/ebay-image-search-plan-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const exactGuard=require('../lib/ebay-product-image-exact-guard-v23');

const VERSION='2.6';
const QUOTA_RESERVE=500;
const MAX_PRODUCTS_PER_RUN=3;
const MAX_SEARCH_QUERIES_PER_PRODUCT=searchPlan.MAX_QUERIES;
const MAX_DETAIL_CHECKS_PER_PRODUCT=6;
const MAX_DIRECT_DETAIL_CHECKS_PER_PRODUCT=1;
const MAX_CALLS_PER_PRODUCT=MAX_SEARCH_QUERIES_PER_PRODUCT+MAX_DETAIL_CHECKS_PER_PRODUCT+MAX_DIRECT_DETAIL_CHECKS_PER_PRODUCT;
// Evidence-bound eBay AU Browse item IDs. Keep deliberately tiny: do not infer or guess IDs.
// Anker 547 item 405185320395 is the Anker Official Store AU listing independently checked
// on 4 Sep 2026 (exact marketed product, Brand New, Anker brand, AU seller, UPC 194644118723).
const VERIFIED_DIRECT_ITEM_IDS=Object.freeze({
  'anker-547-usb-c-hub-7-in-2':'v1|405185320395|0'
});
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const DISCOVERY_SLUGS=[...PRODUCT_MAP.keys()];

function clean(value){return String(value==null?'':value).trim();}
function compact(value){return enrichment.compact(value);}
function norm(value){return enrichment.norm(value);}
function json(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.end(JSON.stringify(body));
}
function readBody(req){
  return new Promise((resolve,reject)=>{
    let raw='';
    req.on('data',chunk=>{
      raw+=String(chunk||'');
      if(raw.length>20000){reject(new Error('body-too-large'));try{req.destroy();}catch{}}
    });
    req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{});}catch(error){reject(error);}});
    req.on('error',reject);
  });
}
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
    remaining:ordinaryBrowseRemaining(summary),reserve:QUOTA_RESERVE,resetAt:summary&&summary.resetAt||null,
    ordinaryResources:ordinaryBrowseRows(summary).map(row=>({resource:row.resource,limit:row.limit,remaining:row.remaining,count:row.count,reset:row.reset}))
  };
}
async function quota(){
  return ebay.summariseRateLimits(await ebay.getRateLimits({apiName:'browse',apiContext:'buy',timeoutMs:6000}),{apiName:'browse',apiContext:'buy'});
}
async function consumeCapability(triggerToken,workerToken){
  const result=await supabase.rpc('apg_consume_ebay_refresh_trigger',{p_trigger_token:triggerToken,p_worker_token:workerToken},{timeoutMs:3500});
  return result===true||(Array.isArray(result)&&result[0]===true);
}
async function finishCapability(workerToken){try{await supabase.rpc('apg_finish_ebay_refresh_worker',{p_worker_token:workerToken},{timeoutMs:3500});}catch{}}
async function claimDiscovery(workerToken,limit){
  const result=await supabase.rpc('apg_claim_ebay_image_discovery_batch',{
    p_proof:workerToken,p_slugs:DISCOVERY_SLUGS,p_limit:Math.max(0,Math.min(MAX_PRODUCTS_PER_RUN,limit))
  },{timeoutMs:7000});
  return Array.isArray(result)?result:[];
}
async function recordDiscoveryResult(workerToken,slug,status,errorCode=null){
  return supabase.rpc('apg_record_ebay_image_discovery_result',{
    p_proof:workerToken,p_slug:slug,p_status:status,p_error_code:clean(errorCode)||null
  },{timeoutMs:5000});
}
function discoveryPayload(product,candidate,verifiedAt=new Date().toISOString()){
  return {
    slug:product.slug,productName:[product.brand,product.name].filter(Boolean).join(' '),
    itemId:candidate.itemId,legacyItemId:candidate.legacyItemId,title:candidate.title,
    condition:candidate.condition,price:candidate.price,imageUrl:candidate.imageUrl,
    imageSource:candidate.imageSource||'ebay-listing',itemWebUrl:candidate.itemWebUrl,
    itemAffiliateWebUrl:candidate.itemAffiliateWebUrl||null,
    verificationLevel:candidate.verificationLevel,verificationEvidence:candidate.verificationEvidence||{},
    detailVerified:true,exactModel:true,recommendationWeight:0,verifiedAt,heroEligible:true,
    matchScore:candidate.score==null?null:candidate.score,
    matchReasons:Array.isArray(candidate.reasons)?candidate.reasons:[],
    matchFlags:Array.isArray(candidate.flags)?candidate.flags:[]
  };
}
async function insertDiscoveredState(workerToken,product,candidate){
  return supabase.rpc('apg_insert_ebay_image_state',{
    p_proof:workerToken,p_payload:discoveryPayload(product,candidate)
  },{timeoutMs:6000});
}
function summaryImage(item){
  return clean(item&&item.image&&item.image.imageUrl)||clean(item&&item.thumbnailImages&&item.thumbnailImages[0]&&item.thumbnailImages[0].imageUrl)||null;
}
function projectSummary(product,item,queryIndex,searchKind){
  const assessment=enrichment.scoreCandidate(product,item);
  const title=clean(item&&item.title),itemId=clean(item&&item.itemId);
  if(!title||!itemId)return null;
  return {
    itemId,legacyItemId:clean(item&&item.legacyItemId)||null,title,
    condition:clean(item&&item.condition)||null,
    price:item&&item.price&&typeof item.price==='object'?{value:clean(item.price.value),currency:clean(item.price.currency)}:null,
    imageUrl:summaryImage(item),imageSource:'ebay-listing',itemWebUrl:clean(item&&item.itemWebUrl)||null,
    itemAffiliateWebUrl:clean(item&&item.itemAffiliateWebUrl)||null,
    score:Number(assessment&&assessment.score)||0,status:assessment&&assessment.status||'reject',
    reasons:Array.isArray(assessment&&assessment.reasons)?assessment.reasons:[],
    flags:Array.isArray(assessment&&assessment.flags)?assessment.flags:[],
    modelCoverage:Number(assessment&&assessment.modelCoverage)||0,
    nameCoverage:Number(assessment&&assessment.nameCoverage)||0,
    queryIndex,searchKind:clean(searchKind)||'unknown'
  };
}
function directCandidate(product,itemId){
  const id=clean(itemId),parts=id.split('|');
  return {
    itemId:id,legacyItemId:parts.length>1?clean(parts[1])||null:null,
    title:[product&&product.brand,product&&product.name].filter(Boolean).join(' '),
    condition:null,price:null,imageUrl:null,imageSource:'ebay-listing',itemWebUrl:null,itemAffiliateWebUrl:null,
    score:null,status:'review',reasons:['verified-direct-item-retrieval'],flags:[],modelCoverage:0,nameCoverage:0,
    queryIndex:-1,searchKind:'verified-direct-item'
  };
}
function strongSummaryCandidate(product,candidate){
  if(!candidate||!candidate.itemId||!candidate.title)return false;
  if(enrichment.listingLooksAccessory(candidate.title,product)||enrichment.listingLooksUsed(candidate.title,candidate.condition))return false;
  if(enrichment.materialIdentityConflict(product,candidate.title).conflict)return false;
  if(!enrichment.scoreCandidate(product,{title:candidate.title,condition:candidate.condition,price:candidate.price}).brandOk)return false;
  const models=enrichment.modelTokens(product);
  if(models.length)return models.some(model=>compact(candidate.title).includes(compact(model)));
  const core=exactGuard.nameCore(product);
  return Boolean(core&&` ${norm(candidate.title)} `.includes(` ${core} `))||candidate.nameCoverage>=0.5||candidate.score>=enrichment.REVIEW_SCORE;
}
function detailVariantText(detail){
  const aspects=Array.isArray(detail&&detail.localizedAspects)?detail.localizedAspects.map(row=>`${clean(row&&row.name)} ${clean(row&&row.value)}`).join(' '):'';
  return `${clean(detail&&detail.title)} ${aspects}`.trim();
}
function structuredBrandMatches(product,brands,title){
  const expected=norm(product&&product.brand);
  if(!expected||!norm(title).includes(expected))return false;
  if(!brands.length)return true;
  return brands.some(value=>{const candidate=norm(value);return candidate===expected||candidate.includes(expected)||expected.includes(candidate);});
}
function stagedAccepted(candidate){
  return {status:'accept',accepted:{...candidate,detailVerified:true,exactModel:true,recommendationWeight:0},review:null,candidates:[candidate],recommendationWeight:0};
}
async function verifyImageCandidate(product,candidate){
  let detail;
  try{
    detail=await ebay.getItem(candidate.itemId,{referenceId:`apg:${product.slug}:image-discovery-v26`,timeoutMs:10000});
  }catch(error){return {ok:false,reason:clean(error&&error.code)||'EBAY_DETAIL_ERROR'};}
  if(!detail||typeof detail!=='object')return {ok:false,reason:'detail-missing'};
  const title=clean(detail.title)||candidate.title,condition=clean(detail.condition)||candidate.condition;
  if(!title)return {ok:false,reason:'detail-title-missing'};
  if(enrichment.listingLooksUsed(title,condition))return {ok:false,reason:'detail-used-or-refurbished'};
  const categoryPath=clean(detail&&detail.categoryPath)||null;
  const preliminary={...candidate,title,verificationEvidence:{...(candidate&&candidate.verificationEvidence||{}),categoryPath}};
  const hostCompatibilitySafe=candidate.searchKind==='verified-direct-item'&&exactGuard.hostCompatibilityWholeProductOverride(product,preliminary).ok;
  if(enrichment.listingLooksAccessory(title,product)&&!hostCompatibilitySafe)return {ok:false,reason:'detail-accessory-or-part-language'};
  if(enrichment.detailedCategoryRisk(detail))return {ok:false,reason:'detail-parts-category'};
  const conflict=enrichment.materialIdentityConflict(product,detailVariantText(detail));
  if(conflict.conflict)return {ok:false,reason:conflict.reason};
  const brands=enrichment.detailedBrandEvidence(detail);
  if(!structuredBrandMatches(product,brands,title))return {ok:false,reason:'detail-brand-mismatch'};
  const imageUrl=clean(detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl)||clean(detail&&detail.image&&detail.image.imageUrl)||candidate.imageUrl;
  const itemWebUrl=clean(detail&&detail.itemWebUrl)||candidate.itemWebUrl;
  const itemAffiliateWebUrl=clean(detail&&detail.itemAffiliateWebUrl)||candidate.itemAffiliateWebUrl||null;
  const itemId=clean(detail&&detail.itemId)||candidate.itemId;
  const legacyItemId=clean(detail&&detail.legacyItemId)||candidate.legacyItemId;
  const price=detail&&detail.price&&typeof detail.price==='object'?{value:clean(detail.price.value),currency:clean(detail.price.currency)}:candidate.price;
  if(!imageUrl||!itemWebUrl||!itemId||!legacyItemId)return {ok:false,reason:'detail-image-or-item-identity-missing'};
  if(!price||!price.value||price.currency!=='AUD')return {ok:false,reason:'detail-price-missing-or-non-aud'};
  const modelEvidence=enrichment.detailedModelEvidence(detail);
  const verified={
    ...candidate,itemId,legacyItemId,title,condition,price,imageUrl,
    imageSource:detail&&detail.product&&detail.product.image&&detail.product.image.imageUrl?'ebay-product-catalog':'ebay-listing',
    itemWebUrl,itemAffiliateWebUrl,itemEndDate:clean(detail&&detail.itemEndDate)||null,
    detailVerified:true,exactModel:true,
    verificationLevel:modelEvidence.length?'detail-model-evidence':'detail-title-model',
    verificationEvidence:{brands,model:modelEvidence,categoryPath},recommendationWeight:0
  };
  const familyChecked=familyGuard.applyToEnrichment(product,stagedAccepted(verified));
  if(!familyChecked||familyChecked.status!=='accept'||!familyChecked.accepted){
    return {ok:false,reason:familyChecked&&familyChecked.familyGuard&&familyChecked.familyGuard.reason||'family-variant-guard'};
  }
  const guard=exactGuard.evaluate(product,familyChecked,products,{now:Date.now()});
  if(!guard.eligible)return {ok:false,reason:`exact-guard:${guard.reason}`};
  return {ok:true,candidate:{...familyChecked.accepted,exactModel:true,detailVerified:true,recommendationWeight:0},guard};
}
function searchRequest(plan){
  return {
    q:plan.q,gtin:plan.gtin,epid:plan.epid,categoryIds:plan.categoryIds,
    limit:plan.limit,filter:plan.filter,aspectFilter:plan.aspectFilter,sort:plan.sort
  };
}
function publicPlan(plan){
  return {kind:plan.kind,q:plan.q||null,gtin:plan.gtin||null,epid:plan.epid||null,categoryIds:plan.categoryIds||null,limit:plan.limit,filter:plan.filter||null};
}
async function discoverProduct(product,budget){
  const plans=searchPlan.plansFor(product,{maxQueries:MAX_SEARCH_QUERIES_PER_PRODUCT});
  const seen=new Map(),searchErrors=[],rejects=[];
  let calls=0;
  const directItemId=clean(VERIFIED_DIRECT_ITEM_IDS[product&&product.slug]);
  if(directItemId&&budget.remaining>0){
    budget.remaining-=1;calls+=1;
    const verified=await verifyImageCandidate(product,directCandidate(product,directItemId));
    if(verified.ok){
      return {ok:true,candidate:verified.candidate,plans:plans.map(publicPlan),calls,candidateCount:1,searchErrors,directItemId};
    }
    rejects.push({itemId:directItemId,score:null,searchKind:'verified-direct-item',reason:verified.reason});
  }
  for(let index=0;index<plans.length;index+=1){
    if(budget.remaining<1)break;
    const plan=plans[index];
    budget.remaining-=1;calls+=1;
    let result;
    try{
      result=await ebay.searchItems(searchRequest(plan),{
        referenceId:`apg:${product.slug}:image-search-v26:${index+1}`,
        timeoutMs:10000
      });
    }catch(error){
      searchErrors.push({kind:plan.kind,code:clean(error&&error.code)||'EBAY_SEARCH_ERROR'});
      continue;
    }
    for(const item of Array.isArray(result&&result.itemSummaries)?result.itemSummaries:[]){
      const candidate=projectSummary(product,item,index,plan.kind);
      if(!candidate||!strongSummaryCandidate(product,candidate))continue;
      const prior=seen.get(candidate.itemId);
      if(!prior||candidate.score>prior.score)seen.set(candidate.itemId,candidate);
    }
  }
  const candidates=[...seen.values()]
    .sort((a,b)=>(b.score-a.score)||(b.modelCoverage-a.modelCoverage)||(b.nameCoverage-a.nameCoverage)||(a.queryIndex-b.queryIndex))
    .slice(0,MAX_DETAIL_CHECKS_PER_PRODUCT);
  for(const candidate of candidates){
    if(budget.remaining<1)break;
    budget.remaining-=1;calls+=1;
    const verified=await verifyImageCandidate(product,candidate);
    if(verified.ok){
      return {ok:true,candidate:verified.candidate,plans:plans.map(publicPlan),calls,candidateCount:candidates.length+(directItemId?1:0),searchErrors,directItemId:directItemId||null};
    }
    rejects.push({itemId:candidate.itemId,score:candidate.score,searchKind:candidate.searchKind,reason:verified.reason});
  }
  return {ok:false,plans:plans.map(publicPlan),calls,candidateCount:candidates.length+(directItemId?1:0),rejects:rejects.slice(0,7),searchErrors,directItemId:directItemId||null};
}

module.exports=async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{ok:false,status:'method-not-allowed',version:VERSION,searchPlanVersion:searchPlan.VERSION});
  let body;
  try{body=await readBody(req);}catch{return json(res,400,{ok:false,status:'invalid-json',version:VERSION});}
  const triggerToken=clean(body&&body.triggerToken),workerToken=clean(body&&body.workerToken);
  if(!triggerToken||!workerToken)return json(res,401,{ok:false,status:'missing-capability',version:VERSION});
  let consumed=false;
  try{
    consumed=await consumeCapability(triggerToken,workerToken);
    if(!consumed)return json(res,401,{ok:false,status:'unauthorized',version:VERSION});
    const summary=await quota(),remaining=ordinaryBrowseRemaining(summary);
    if(!Number.isFinite(remaining))return json(res,503,{ok:false,status:'quota-check-unavailable',version:VERSION});
    const available=Math.max(0,remaining-QUOTA_RESERVE);
    if(available<MAX_CALLS_PER_PRODUCT){
      return json(res,200,{ok:true,status:'quota-reserved',version:VERSION,searchPlanVersion:searchPlan.VERSION,quota:quotaPublic(summary),processed:0});
    }
    const limit=Math.min(MAX_PRODUCTS_PER_RUN,Math.floor(available/MAX_CALLS_PER_PRODUCT));
    const rows=await claimDiscovery(workerToken,limit);
    if(!rows.length){
      return json(res,200,{ok:true,status:'nothing-due',version:VERSION,searchPlanVersion:searchPlan.VERSION,quota:quotaPublic(summary),processed:0});
    }
    const budget={remaining:available},results=[];
    for(const row of rows){
      const slug=clean(row&&row.slug),product=PRODUCT_MAP.get(slug);
      if(!product){
        await recordDiscoveryResult(workerToken,slug,'error','UNKNOWN_APG_PRODUCT');
        results.push({slug,status:'error'});
        continue;
      }
      let found;
      try{found=await discoverProduct(product,budget);}catch(error){found={ok:false,error:clean(error&&error.code)||'DISCOVERY_V26_ERROR',calls:0,plans:[]};}
      if(found.ok){
        await insertDiscoveredState(workerToken,product,found.candidate);
        await recordDiscoveryResult(workerToken,slug,'accepted');
        results.push({slug,status:'accepted',itemId:found.candidate.itemId,verificationLevel:found.candidate.verificationLevel,retrieval:found.directItemId&&found.candidate.itemId===found.directItemId?'verified-direct-item':'search',calls:found.calls,plans:found.plans,searchErrors:found.searchErrors});
      }else{
        const status=found.candidateCount?'review':'no-match';
        await recordDiscoveryResult(workerToken,slug,status,found.error||'DISCOVERY_V26_NOT_ACCEPTED');
        results.push({slug,status,calls:found.calls||0,plans:found.plans||[],candidateCount:found.candidateCount||0,rejects:found.rejects||[],searchErrors:found.searchErrors||[]});
      }
    }
    return json(res,200,{
      ok:true,status:'completed',version:VERSION,searchPlanVersion:searchPlan.VERSION,guardVersion:exactGuard.VERSION,
      processed:results.length,accepted:results.filter(row=>row.status==='accepted').length,
      quota:quotaPublic(summary),budgetRemaining:budget.remaining,results
    });
  }catch(error){
    return json(res,500,{ok:false,status:'worker-error',version:VERSION,searchPlanVersion:searchPlan.VERSION,code:clean(error&&error.code)||'EBAY_DISCOVERY_V26_ERROR'});
  }finally{if(consumed)await finishCapability(workerToken);}
};

module.exports.VERSION=VERSION;
module.exports.SEARCH_PLAN_VERSION=searchPlan.VERSION;
module.exports.QUOTA_RESERVE=QUOTA_RESERVE;
module.exports.MAX_PRODUCTS_PER_RUN=MAX_PRODUCTS_PER_RUN;
module.exports.MAX_SEARCH_QUERIES_PER_PRODUCT=MAX_SEARCH_QUERIES_PER_PRODUCT;
module.exports.MAX_DETAIL_CHECKS_PER_PRODUCT=MAX_DETAIL_CHECKS_PER_PRODUCT;
module.exports.MAX_DIRECT_DETAIL_CHECKS_PER_PRODUCT=MAX_DIRECT_DETAIL_CHECKS_PER_PRODUCT;
module.exports.MAX_CALLS_PER_PRODUCT=MAX_CALLS_PER_PRODUCT;
module.exports.VERIFIED_DIRECT_ITEM_IDS=VERIFIED_DIRECT_ITEM_IDS;