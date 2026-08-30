'use strict';

// Temporary production-only evaluation surface for the APG eBay enrichment programme.
// It is non-mutating, noindex, time-limited and returns no credentials/tokens.
// Remove after the governed catalogue mapping has been generated and verified.

const {products}=require('../data');
const {enrichProduct,VERSION:BASE_VERSION}=require('../lib/ebay-catalogue-enrichment-v1');
const familyGuard=require('../lib/ebay-family-variant-guard-v131');
const ebay=require('../lib/ebay-browse-api-v1');
const VERSION=familyGuard.VERSION;

const RUN_ID='apg-ebay-enrichment-v1';
const EXPIRES_AT=Date.parse('2026-09-03T12:00:00Z');
const MAX_LIMIT=482;
const CONCURRENCY=3;
const MAX_CALLS_PER_PRODUCT=5;
const QUOTA_RESERVE=100;

function int(value,fallback){const n=Number.parseInt(String(value??''),10);return Number.isFinite(n)?n:fallback;}
function publicResult(row){
  if(!row||typeof row!=='object')return null;
  const chosen=row.accepted||row.review||null;
  return {
    slug:row.slug,
    id:row.id,
    brand:row.brand,
    name:row.name,
    category:row.category,
    query:row.query,
    priority:row.priority,
    currentProductPhotography:row.currentProductPhotography,
    status:row.status,
    errorCode:row.errorCode||null,
    errorStatus:Number.isFinite(row.errorStatus)?row.errorStatus:null,
    candidateCount:row.candidateCount,
    detailChecks:row.detailChecks||0,
    guardReason:row.familyGuard&&row.familyGuard.reason||null,
    chosen:chosen?{
      itemId:chosen.itemId,
      legacyItemId:chosen.legacyItemId,
      title:chosen.title,
      condition:chosen.condition,
      price:chosen.price,
      imageUrl:chosen.imageUrl,
      imageSource:chosen.imageSource||null,
      itemWebUrl:chosen.itemWebUrl,
      itemAffiliateWebUrl:chosen.itemAffiliateWebUrl,
      score:chosen.score,
      status:chosen.status,
      reasons:chosen.reasons,
      flags:chosen.flags,
      exactModel:chosen.exactModel,
      modelCoverage:chosen.modelCoverage,
      nameCoverage:chosen.nameCoverage,
      priceRatio:chosen.priceRatio,
      detailVerified:chosen.detailVerified===true,
      verificationLevel:chosen.verificationLevel||null,
      verificationEvidence:chosen.verificationEvidence||null,
      marketplaceId:'EBAY_AU',
      source:'eBay Buy Browse API',
      recommendationWeight:0
    }:null
  };
}

async function pooled(rows,worker){
  const output=new Array(rows.length);
  let cursor=0;
  async function run(){
    while(true){
      const index=cursor++;
      if(index>=rows.length)return;
      try{output[index]=await worker(rows[index],index);}catch(error){
        output[index]={
          slug:rows[index]&&rows[index].slug||null,
          status:'error',
          errorCode:error&&error.code?String(error.code):'ENRICHMENT_ERROR',
          errorStatus:Number.isFinite(error&&error.status)?Number(error.status):null
        };
      }
    }
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,rows.length)},run));
  return output;
}

async function browseQuota(){
  const payload=await ebay.getRateLimits({apiName:'browse',apiContext:'buy',timeoutMs:6000});
  return ebay.summariseRateLimits(payload,{apiName:'browse',apiContext:'buy'});
}
function quotaPublic(quota){
  return {
    found:Boolean(quota&&quota.found),
    exhausted:quota&&quota.exhausted===true,
    lowestRemaining:Number.isFinite(quota&&quota.lowestRemaining)?Number(quota.lowestRemaining):null,
    resetAt:quota&&quota.resetAt||null,
    reserve:QUOTA_RESERVE,
    maxCallsPerProduct:MAX_CALLS_PER_PRODUCT,
    resources:Array.isArray(quota&&quota.resources)?quota.resources:[]
  };
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  if(Date.now()>EXPIRES_AT)return res.status(410).json({ok:false,status:'expired'});
  if(String(req.query&&req.query.run||'')!==RUN_ID)return res.status(404).json({ok:false,status:'not-found'});

  let quota;
  try{quota=await browseQuota();}
  catch(error){
    return res.status(502).json({
      ok:false,status:'quota-check-failed',version:VERSION,totalProducts:products.length,
      errorCode:error&&error.code?String(error.code):'EBAY_QUOTA_CHECK_FAILED',
      errorStatus:Number.isFinite(error&&error.status)?Number(error.status):null
    });
  }
  const quotaInfo=quotaPublic(quota);
  const format=String(req.query&&req.query.format||'full');
  if(format==='quota')return res.status(200).json({ok:true,version:VERSION,totalProducts:products.length,quota:quotaInfo});
  if(!quota.found)return res.status(503).json({ok:false,status:'quota-data-unavailable',version:VERSION,totalProducts:products.length,quota:quotaInfo});
  if(quota.exhausted===true)return res.status(429).json({ok:false,status:'browse-quota-exhausted',version:VERSION,totalProducts:products.length,quota:quotaInfo});

  const requestedSlug=String(req.query&&req.query.slug||'').trim();
  const offset=Math.max(0,int(req.query&&req.query.offset,0));
  const limit=Math.max(1,Math.min(MAX_LIMIT,int(req.query&&req.query.limit,40)));
  const requested=requestedSlug?products.filter(product=>product.slug===requestedSlug):products.slice(offset,offset+limit);
  if(requestedSlug&&!requested.length)return res.status(404).json({ok:false,status:'unknown-product'});

  const safeCapacity=Number.isFinite(quota.lowestRemaining)
    ?Math.max(0,Math.floor((quota.lowestRemaining-QUOTA_RESERVE)/MAX_CALLS_PER_PRODUCT))
    :0;
  if(safeCapacity<1)return res.status(429).json({ok:false,status:'browse-quota-reserved',version:VERSION,totalProducts:products.length,quota:quotaInfo});
  const selected=requested.slice(0,Math.min(requested.length,safeCapacity));

  const started=Date.now();
  const raw=await pooled(selected,async product=>familyGuard.applyToEnrichment(product,await enrichProduct(product)));
  const results=raw.map(publicResult).filter(Boolean);
  const counts={accept:0,review:0,'no-match':0,error:0,'no-query':0};
  for(const row of results)counts[row.status]=(counts[row.status]||0)+1;
  const registry={};
  for(const row of results){
    if(row.status!=='accept'||!row.chosen||row.chosen.detailVerified!==true)continue;
    registry[row.slug]={
      product_id:row.id,
      slug:row.slug,
      brand:row.brand,
      product_name:row.name,
      category:row.category,
      ebay_item_id:row.chosen.itemId,
      ebay_legacy_item_id:row.chosen.legacyItemId,
      listing_title:row.chosen.title,
      listing_condition:row.chosen.condition,
      match_score:row.chosen.score,
      exact_model:true,
      price_ratio:row.chosen.priceRatio,
      detail_verified:true,
      verification_level:row.chosen.verificationLevel,
      verification_evidence:row.chosen.verificationEvidence,
      image_source:row.chosen.imageSource,
      match_reasons:row.chosen.reasons,
      match_flags:row.chosen.flags,
      marketplace_id:'EBAY_AU',
      source:'eBay Buy Browse API',
      observed_at:new Date().toISOString(),
      recommendation_weight:0
    };
  }
  const meta={
    ok:true,version:VERSION,baseMatcherVersion:BASE_VERSION,totalProducts:products.length,processed:selected.length,
    requested:requested.length,quotaLimited:selected.length<requested.length,quota:quotaInfo,counts,durationMs:Date.now()-started
  };
  if(format==='counts')return res.status(200).json(meta);
  if(format==='registry')return res.status(200).json({...meta,registry});
  if(format==='compact')return res.status(200).json({
    ...meta,
    results:results.map(row=>({
      slug:row.slug,status:row.status,errorCode:row.errorCode||null,errorStatus:row.errorStatus??null,
      itemId:row.chosen&&row.chosen.itemId||null,title:row.chosen&&row.chosen.title||null,
      score:row.chosen&&row.chosen.score||null,flags:row.chosen&&row.chosen.flags||[],guardReason:row.guardReason||null,
      detailVerified:row.chosen&&row.chosen.detailVerified===true,verificationLevel:row.chosen&&row.chosen.verificationLevel||null,
      imageSource:row.chosen&&row.chosen.imageSource||null
    }))
  });
  const filtered=format==='accepted'?results.filter(row=>row.status==='accept'&&row.chosen&&row.chosen.detailVerified===true):
    format==='actionable'?results.filter(row=>row.status==='accept'||row.status==='review'):results;
  return res.status(200).json({
    ...meta,
    run:RUN_ID,
    offset,
    nextOffset:requestedSlug?null:(offset+selected.length<products.length?offset+selected.length:null),
    registry,
    results:filtered
  });
};
