'use strict';

const assert=require('assert');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const pilot=require('../data/ebay-verified-offers-v1');
const worker=require('../api/ebay-image-refresh');

assert.strictEqual(continuity.VERSION,'3.0');
assert.strictEqual(worker.VERSION,'1.0');
assert.strictEqual(continuity.REFRESH_TARGET_MS,4*60*60*1000,'background refresh target must be four hours');
assert(continuity.MAX_DISPLAY_AGE_MS<6*60*60*1000,'display ceiling must remain below six hours');
assert(continuity.MAX_DISPLAY_AGE_MS>=5.5*60*60*1000,'continuity buffer should exceed the former five-hour cliff');
assert.strictEqual(worker.REFRESH_QUOTA_RESERVE,500,'automatic refresh must preserve a 500-call ordinary Browse reserve');
assert.strictEqual(worker.CONCURRENCY,3,'background refresh concurrency must remain conservative');

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
    next_refresh_at:new Date(observed+continuity.REFRESH_TARGET_MS).toISOString(),
    consecutive_failures:0,
    recovery_required:false,
    last_error_code:null,
    ...overrides
  };
}

const mapping=continuity.stateToMapping(state());
assert.strictEqual(mapping.slug,slug);
assert.strictEqual(mapping.recommendationWeight,0);
assert.strictEqual(continuity.guardEligible(slug,mapping,observed+(5*60*60*1000)),true,'five-hour-old verified image must remain eligible under continuity v3');
assert.strictEqual(continuity.guardEligible(slug,mapping,observed+continuity.MAX_DISPLAY_AGE_MS-1000),true,'image must remain eligible until just before safety ceiling');
assert.strictEqual(continuity.guardEligible(slug,mapping,observed+continuity.MAX_DISPLAY_AGE_MS+1),false,'image must fail closed once the retailer-content safety ceiling is exceeded');

const canonical=`<link rel="canonical" href="https://australianproductguide.au/products/${slug}/">`;
const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Breville Barista Express Impress BES876"}</script>';
const html=`<!doctype html><html><head>${canonical}${jsonLd}</head><body><main><section class="product-hero"><div class="wrap product-hero-grid"><div class="product-visual large" role="img"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Brand identity</span></div><div class="visual-copy"><strong>Product</strong></div></div></div></section></main></body></html>`;

(async()=>{
  continuity.stateCache.clear();
  let stateReads=0;
  const now=observed+(5*60*60*1000)+(20*60*1000);
  const first=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now,
    fetchState:async()=>{stateReads+=1;return state();}
  });
  assert.strictEqual(first.usedEbayImage,true,'continuity v3 must prevent the former five-hour logo cliff');
  assert(first.html.includes('data-apg-ebay-product-hero="v3.0"'),'v3 hero marker missing');
  assert(first.html.includes(source.image),'governed exact product image missing');
  assert(first.html.includes('automated background refresh'),'automatic refresh disclosure missing');
  assert(first.html.includes(canonical),'canonical must remain unchanged');
  assert(first.html.includes(jsonLd),'Product JSON-LD must remain unchanged and must not inherit retailer image');
  assert(!/"image"\s*:\s*"https:\/\/i\.ebayimg\.com/i.test(first.html),'eBay image must remain excluded from canonical Product.image structured data');
  assert.strictEqual(stateReads,1,'public render should read governed state once');

  const second=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now+1000,
    fetchState:async()=>{stateReads+=1;throw new Error('cache should prevent state service dependency');}
  });
  assert.strictEqual(second.usedEbayImage,true,'short state-service fault must not unnecessarily remove a still-current cached image');
  assert.strictEqual(stateReads,1,'five-minute state cache should absorb repeat product-page reads');

  continuity.stateCache.clear();
  const expired=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>observed+continuity.MAX_DISPLAY_AGE_MS+1,
    fetchState:async()=>state()
  });
  assert.strictEqual(expired.usedEbayImage,false,'content beyond the safety ceiling must fail closed');
  assert.strictEqual(expired.html,html,'fail-closed state must preserve the APG brand placeholder');

  const wrongVariant=await continuity.inject(html,`/products/${slug}/`,{
    now:()=>now,
    fetchState:async()=>state({title:'Breville Barista Express Impress BES876 PRO',verification_evidence:{model:['BES876PRO']}})
  });
  assert.strictEqual(wrongVariant.usedEbayImage,false,'material sibling/variant mutations must not render');

  const summary={resources:[
    {resource:'buy.browse',limit:5000,remaining:4200,count:800,reset:'2026-09-01T07:00:00Z'},
    {resource:'buy.browse.item.bulk',limit:5000,remaining:5000,count:0,reset:'2026-09-01T07:00:00Z'}
  ]};
  assert.strictEqual(worker.ordinaryBrowseRemaining(summary),4200,'worker must budget against ordinary Browse, not the untouched bulk pool');
  const payload=worker.refreshPayload({...continuity.toGuardRow(mapping).accepted,verificationLevel:mapping.verificationLevel,verificationEvidence:mapping.verificationEvidence});
  assert.strictEqual(payload.recommendationWeight,0,'refresh payload must preserve zero commercial recommendation weight');
  assert.strictEqual(payload.detailVerified,true);
  assert.strictEqual(payload.exactModel,true);

  console.log(`EBAY_IMAGE_CONTINUITY_V3=PASS public-ebay-network=0 refresh-target=4h display-ceiling=${Math.round(continuity.MAX_DISPLAY_AGE_MS/60000)}m cache=5m worker-reserve=${worker.REFRESH_QUOTA_RESERVE} recommendationWeight=0`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
