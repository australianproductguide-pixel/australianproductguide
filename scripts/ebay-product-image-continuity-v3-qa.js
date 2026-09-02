'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const pilot=require('../data/ebay-verified-offers-v1');
const worker=require('../api/ebay-image-refresh');
const stateClient=require('../lib/apg-supabase-public-v1');

assert.strictEqual(continuity.VERSION,'3.3');
assert.strictEqual(worker.VERSION,'1.3');
assert.strictEqual(stateClient.VERSION,'1.2');
assert.strictEqual(stateClient.STATE_FUNCTION,'/functions/v1/apg-ebay-image-state','material image-state operations must use the protected Edge Function');
assert(!stateClient.rpc.toString().includes('/rest/v1/rpc'),'material image-state writes must not call anonymous PostgREST RPC directly');
assert.strictEqual(continuity.REFRESH_TARGET_MS,null,'presentation continuity must not impose a refresh-age expiry');
assert.strictEqual(continuity.MAX_DISPLAY_AGE_MS,Infinity,'verified exact-model imagery must remain displayable until revoked, replaced or rejected by an identity/safety guard');
assert.strictEqual(continuity.STATE_CACHE_TTL_MS,30*1000,'governed image-state cache must propagate revocations within about 30 seconds');
assert.strictEqual(worker.REFRESH_QUOTA_RESERVE,500,'automatic refresh must preserve a 500-call ordinary Browse reserve');
assert.strictEqual(worker.CONCURRENCY,3,'background refresh concurrency must remain conservative');
assert.strictEqual(worker.MAX_RECOVERY_CALLS,5,'listing recovery must reserve at most five ordinary calls');
assert.strictEqual(worker.MAX_DISCOVERY_PRODUCTS_PER_RUN,2,'new-image discovery must stay tightly bounded per scheduled run');
assert.strictEqual(worker.MAX_DISCOVERY_CALLS_PER_PRODUCT,5,'each discovery product must reserve the matcher maximum before network work');
assert(worker.DISCOVERY_SLUGS.length>=480,'automatic discovery must cover the maintained catalogue, not only the pilot');
const continuitySource=fs.readFileSync(path.join(__dirname,'..','lib','ebay-product-image-continuity-v3-runtime.js'),'utf8');
assert(!/require\(['"]\.\/ebay-browse-api-v1['"]\)/.test(continuitySource),'public continuity runtime must not import the eBay network client');

const slug='breville-barista-express-impress-bes876';
const product=continuity.productForSlug(slug);
const source=pilot.forSlug(slug);
assert(product&&source,'pilot product and source row must exist');
const observed=Date.parse(source.observedAt);

function state(overrides={}){
  return {
    slug,
    product_name:source.productName,
    status:'verified',
    detail_verified:true,
    exact_model:true,
    verification_level:'detail-title-model',
    verification_evidence:{},
    item_id:source.itemId,
    legacy_item_id:source.legacyItemId,
    title:source.title,
    condition:source.condition,
    price_value:source.price,
    price_currency:'AUD',
    image_url:source.image,
    image_source:'ebay-listing',
    item_web_url:source.itemWebUrl,
    item_affiliate_web_url:source.url,
    match_score:null,
    match_reasons:['qa-pilot'],
    match_flags:[],
    recommendation_weight:0,
    last_verified_at:source.observedAt,
    next_refresh_at:null,
    consecutive_failures:0,
    recovery_required:false,
    last_error_code:null,
    ...overrides
  };
}

const mapping=continuity.stateToMapping(state());
assert.strictEqual(mapping.slug,slug);
assert.strictEqual(mapping.recommendationWeight,0);
assert.strictEqual(continuity.guardEligible(slug,mapping,observed+(5*60*60*1000)),true,'verified exact-model image must remain eligible after five hours');
assert.strictEqual(continuity.guardEligible(slug,mapping,observed+(180*24*60*60*1000)),true,'age alone must not revoke an otherwise verified exact-model image');

const canonical=`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`;
const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Breville Barista Express Impress BES876"}</script>';
const html=`<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section></main></body></html>`;

(async()=>{
  continuity.stateCache.clear();
  let stateReads=0;
  const now=observed+(180*24*60*60*1000);
  const first=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now,
    fetchState:async()=>{stateReads+=1;return state();}
  });
  assert.strictEqual(first.usedEbayImage,true,'persistent governed imagery must survive age alone while exact-model verification remains valid');
  assert(first.html.includes('data-apg-ebay-product-hero="v3.3"'),'v3.3 hero marker missing');
  assert(first.html.includes(source.image),'governed exact product image missing');
  assert(first.html.includes('exact model verified by APG'),'exact-model provenance disclosure missing');
  assert(first.html.includes(canonical),'canonical must remain unchanged');
  assert(first.html.includes(jsonLd),'Product JSON-LD must remain unchanged and must not inherit retailer image');
  assert(!/"image"\s*:\s*"https:\/\/i\.ebayimg\.com/i.test(first.html),'eBay image must remain excluded from canonical Product.image structured data');
  assert.strictEqual(stateReads,1,'public render should read governed state once');

  const second=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now+1000,
    fetchState:async()=>{stateReads+=1;throw new Error('cache should prevent state service dependency');}
  });
  assert.strictEqual(second.usedEbayImage,true,'short state-service fault must not unnecessarily remove a still-governed cached image');
  assert.strictEqual(stateReads,1,'30-second state cache should absorb immediate repeat product-page reads');

  const revoked=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now+continuity.STATE_CACHE_TTL_MS+1,
    fetchState:async()=>{stateReads+=1;return state({status:'retired',exact_model:false,recovery_required:true,last_error_code:'QA_REVOKED'});}
  });
  assert.strictEqual(revoked.usedEbayImage,false,'retired governed mapping must disappear after the short cache TTL');
  assert.strictEqual(revoked.html,html,'retired mapping must restore the APG fallback rather than an old retailer image');
  assert.strictEqual(stateReads,2,'runtime must re-read governed state after 30-second cache expiry');
  assert.strictEqual(continuity.stateCache.has(slug),false,'authoritative retirement must evict any warm cached mapping');

  continuity.stateCache.clear();
  const veryOld=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>observed+(365*24*60*60*1000),
    fetchState:async()=>state()
  });
  assert.strictEqual(veryOld.usedEbayImage,true,'verified age alone must not cause an image cliff under continuity v3.3');

  continuity.stateCache.clear();
  const wrongVariant=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now,
    fetchState:async()=>state({title:'Breville Barista Express Impress BES876 PRO',verification_evidence:{model:['BES876PRO']}})
  });
  assert.strictEqual(wrongVariant.usedEbayImage,false,'material sibling/variant mutations must not render or fall through to the bootstrap pilot');

  const summary={resources:[
    {resource:'buy.browse',limit:5000,remaining:4200,count:800,reset:'2026-09-01T07:00:00Z'},
    {resource:'buy.browse.item.bulk',limit:5000,remaining:5000,count:0,reset:'2026-09-01T07:00:00Z'}
  ]};
  assert.strictEqual(worker.ordinaryBrowseRemaining(summary),4200,'worker must budget against ordinary Browse, not the untouched bulk pool');
  const accepted={
    ...continuity.toGuardRow(mapping).accepted,
    verificationLevel:mapping.verificationLevel,
    verificationEvidence:mapping.verificationEvidence,
    score:106,reasons:['brand-match','exact-model'],flags:[]
  };
  const payload=worker.refreshPayload(accepted);
  assert.strictEqual(payload.recommendationWeight,0,'refresh payload must preserve zero commercial recommendation weight');
  assert.strictEqual(payload.detailVerified,true);
  assert.strictEqual(payload.exactModel,true);
  const discovered=worker.discoveryPayload(product,accepted,true,'2026-08-31T07:05:00.000Z');
  assert.strictEqual(discovered.slug,slug,'discovery payload must bind to the maintained APG slug');
  assert(discovered.productName.includes('Breville'),'discovery payload must retain maintained product identity');
  assert.strictEqual(discovered.heroEligible,true,'only hero-guard-passing discovery may be persisted');
  assert.strictEqual(discovered.recommendationWeight,0,'newly discovered retailer imagery must contribute zero recommendation points');
  assert.strictEqual(discovered.verifiedAt,'2026-08-31T07:05:00.000Z','discovery freshness must be anchored to a real verification timestamp');
  const counts=worker.countStatuses([{status:'accepted'},{status:'no-match'},{status:'accepted'}],{accepted:0,'no-match':0,error:0});
  assert.deepStrictEqual(counts,{accepted:2,'no-match':1,error:0},'discovery reporting must retain honest outcome counts');

  console.log(`EBAY_IMAGE_CONTINUITY_V33=PASS public-ebay-network=0 persistent-until-revoked=PASS governed-state-precedence=fail-closed cache=${Math.round(continuity.STATE_CACHE_TTL_MS/1000)}s worker-reserve=${worker.REFRESH_QUOTA_RESERVE} discovery-max=${worker.MAX_DISCOVERY_PRODUCTS_PER_RUN}x${worker.MAX_DISCOVERY_CALLS_PER_PRODUCT} recommendationWeight=0`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
