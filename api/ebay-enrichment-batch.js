'use strict';

// Temporary production-only evaluation surface for the APG eBay enrichment programme.
// It is non-mutating, noindex, time-limited and returns no credentials/tokens.
// Remove after the governed catalogue mapping has been generated and verified.

const {products}=require('../data');
const {enrichProduct,VERSION}=require('../lib/ebay-catalogue-enrichment-v1');

const RUN_ID='apg-ebay-enrichment-v1';
const EXPIRES_AT=Date.parse('2026-08-31T12:00:00Z');
const MAX_LIMIT=482;
const CONCURRENCY=8;

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
    candidateCount:row.candidateCount,
    chosen:chosen?{
      itemId:chosen.itemId,
      legacyItemId:chosen.legacyItemId,
      title:chosen.title,
      condition:chosen.condition,
      price:chosen.price,
      imageUrl:chosen.imageUrl,
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
        output[index]={slug:rows[index]&&rows[index].slug||null,status:'error',errorCode:error&&error.code?String(error.code):'ENRICHMENT_ERROR'};
      }
    }
  }
  await Promise.all(Array.from({length:Math.min(CONCURRENCY,rows.length)},run));
  return output;
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({ok:false,status:'method-not-allowed'});}
  if(process.env.VERCEL_ENV!=='production')return res.status(404).json({ok:false,status:'production-only'});
  if(Date.now()>EXPIRES_AT)return res.status(410).json({ok:false,status:'expired'});
  if(String(req.query&&req.query.run||'')!==RUN_ID)return res.status(404).json({ok:false,status:'not-found'});

  const requestedSlug=String(req.query&&req.query.slug||'').trim();
  const offset=Math.max(0,int(req.query&&req.query.offset,0));
  const limit=Math.max(1,Math.min(MAX_LIMIT,int(req.query&&req.query.limit,40)));
  const selected=requestedSlug?products.filter(product=>product.slug===requestedSlug):products.slice(offset,offset+limit);
  if(requestedSlug&&!selected.length)return res.status(404).json({ok:false,status:'unknown-product'});

  const started=Date.now();
  const raw=await pooled(selected,product=>enrichProduct(product));
  const results=raw.map(publicResult).filter(Boolean);
  const counts={accept:0,review:0,'no-match':0,error:0,'no-query':0};
  for(const row of results)counts[row.status]=(counts[row.status]||0)+1;
  const registry={};
  for(const row of results){
    if(row.status!=='accept'||!row.chosen)continue;
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
      match_reasons:row.chosen.reasons,
      match_flags:row.chosen.flags,
      marketplace_id:'EBAY_AU',
      source:'eBay Buy Browse API',
      observed_at:new Date().toISOString(),
      recommendation_weight:0
    };
  }
  const format=String(req.query&&req.query.format||'full');
  if(format==='counts')return res.status(200).json({ok:true,version:VERSION,totalProducts:products.length,processed:selected.length,counts,durationMs:Date.now()-started});
  if(format==='registry')return res.status(200).json({ok:true,version:VERSION,totalProducts:products.length,processed:selected.length,counts,registry,durationMs:Date.now()-started});
  if(format==='compact')return res.status(200).json({
    ok:true,version:VERSION,totalProducts:products.length,processed:selected.length,counts,durationMs:Date.now()-started,
    results:results.map(row=>({slug:row.slug,status:row.status,itemId:row.chosen&&row.chosen.itemId||null,title:row.chosen&&row.chosen.title||null,score:row.chosen&&row.chosen.score||null,flags:row.chosen&&row.chosen.flags||[]}))
  });
  const filtered=format==='accepted'?results.filter(row=>row.status==='accept'):
    format==='actionable'?results.filter(row=>row.status==='accept'||row.status==='review'):results;
  return res.status(200).json({
    ok:true,
    version:VERSION,
    run:RUN_ID,
    totalProducts:products.length,
    offset,
    requested:requestedSlug?1:limit,
    processed:selected.length,
    nextOffset:requestedSlug?null:(offset+selected.length<products.length?offset+selected.length:null),
    counts,
    durationMs:Date.now()-started,
    registry,
    results:filtered
  });
};
