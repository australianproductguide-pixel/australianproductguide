'use strict';

const assert=require('assert');
const layer=require('../lib/cross-surface-product-imagery-v331-runtime');
const continuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const stateClient=require('../lib/apg-supabase-public-v1');
const pilot=require('../data/ebay-verified-offers-v1');

assert.strictEqual(layer.VERSION,'33.1');
assert.strictEqual(stateClient.VERSION,'1.1');
assert.strictEqual(layer.API_PATH,'/api/product-presentation-images-v33');
assert.strictEqual(layer.MAX_PAGE_SLUGS,80);
assert.strictEqual(layer.MAX_API_SLUGS,30);
assert.strictEqual(layer.MAX_API_QUERIES,12);
assert(layer.JS.includes('MutationObserver'),'dynamic product surfaces must be observed');
assert(layer.JS.includes('/products/'),'client resolver must bind imagery to canonical product routes');
assert(layer.JS.includes('commercialRecommendationWeight'),'client contract must preserve zero commercial recommendation weight');
assert(layer.CSS.includes('apg-product-suggestion-thumb-v33'),'autocomplete thumbnail styling missing');
new Function(layer.JS);

const slug='breville-barista-express-impress-bes876';
const product=continuity.productForSlug(slug);
const source=pilot.forSlug(slug);
assert(product&&source,'BES876 governed pilot evidence must exist for cross-surface regression QA');
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
    match_reasons:['cross-surface-qa'],
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

(async()=>{
  continuity.stateCache.clear();
  let reads=0;
  const now=observed+60*60*1000;
  const mappings=await layer.currentMappings([slug,slug],{
    now:()=>now,
    fetchStates:async slugs=>{reads+=1;assert.deepStrictEqual(slugs,[slug]);return [state()];}
  });
  assert.strictEqual(reads,1,'cross-surface resolver must batch governed state reads');
  assert.strictEqual(mappings.size,1);
  assert.strictEqual(mappings.get(slug).imageUrl,source.image);
  assert.strictEqual(mappings.get(slug).recommendationWeight,0);

  const twoProduct=`<article class="comparison-card"><div class="product-visual"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Sunbeam</span></div><div class="visual-copy">Sunbeam Barista Max EM5300S</div></div><a href="/products/sunbeam-barista-max-em5300s/">Open product guide</a></article><article class="comparison-card"><div class="product-visual"><div class="apg-product-brand-placeholder" aria-hidden="true"><span>Breville</span></div><div class="visual-copy">Breville Barista Express Impress BES876</div></div><a href="/products/${slug}/">Open product guide</a></article>`;
  const replaced=layer.replaceBrandPlaceholders(twoProduct,mappings);
  assert(replaced.includes('apg-product-brand-placeholder')&&replaced.includes('Sunbeam</span>'),'unmapped product must retain its own brand fallback');
  assert(replaced.includes(`data-product-slug="${slug}"`),'eligible product placeholder must become shared photo');
  assert(replaced.includes(source.image),'eligible product must reuse the governed exact image');
  assert.strictEqual((replaced.match(/data-apg-product-presentation-image=/g)||[]).length,1,'only the mapped exact product may receive a photo');
  const sunbeamArticle=replaced.match(/<article class="comparison-card">[\s\S]*?<\/article>/i)?.[0]||'';
  assert(!sunbeamArticle.includes('i.ebayimg.com'),'Breville image must never spill into neighbouring Sunbeam card');

  const searchArticle=`<article class="feature-card"><p>Maintained match · Breville</p><h3><a href="/products/${slug}/">Barista Express Impress BES876</a></h3><p>Guided espresso workflow.</p></article>`;
  const enriched=layer.enrichProductArticles(searchArticle,mappings);
  assert(enriched.includes('is-compact'),'search/product article without a placeholder must gain compact product imagery');
  assert(enriched.includes(source.image));

  const jsonLd='<script type="application/ld+json">{"@type":"Product","name":"Breville Barista Express Impress BES876"}</script>';
  const html=`<!doctype html><html><head>${jsonLd}</head><body>${twoProduct}${searchArticle}</body></html>`;
  const decorated=layer.decorateHtml(html,mappings);
  assert(decorated.includes('/assets/cross-surface-product-imagery-v33.css?v=33.1'));
  assert(decorated.includes('/assets/cross-surface-product-imagery-v33.js?v=33.1'));
  assert(decorated.includes('name="apg-cross-surface-product-imagery" content="v33.1"'));
  assert(decorated.includes(jsonLd),'cross-surface presentation imagery must not mutate Product JSON-LD');
  assert(!/"image"\s*:\s*"https:\/\/i\.ebayimg\.com/i.test(decorated),'retailer presentation imagery must remain outside canonical Product.image structured data');

  continuity.stateCache.clear();
  const rejected=await layer.currentMappings([slug],{
    now:()=>now,
    fetchStates:async()=>[state({status:'retired',exact_model:false,recovery_required:true,last_error_code:'QA_RETIRED'})]
  });
  assert.strictEqual(rejected.size,0,'retired/wrong-model state must fail closed across every product surface');
  assert.strictEqual(continuity.stateCache.has(slug),false);

  continuity.stateCache.clear();
  const stale=await layer.currentMappings([slug],{
    now:()=>observed+continuity.MAX_DISPLAY_AGE_MS+1,
    fetchStates:async()=>[state()]
  });
  assert.strictEqual(stale.size,0,'retailer image beyond the continuity ceiling must not be reintroduced on secondary surfaces');

  continuity.stateCache.clear();
  const apiUrl=new URL(`https://australianproductguide.au${layer.API_PATH}?slug=${slug}&q=${encodeURIComponent('Breville Barista Express Impress BES876')}`);
  const payload=await layer.apiPayload(apiUrl,{now:()=>now,fetchStates:async()=>[state()]});
  assert.strictEqual(payload.version,'33.1');
  assert.strictEqual(payload.commercialRecommendationWeight,0);
  assert.strictEqual(payload.images.length,1);
  assert.strictEqual(payload.images[0].slug,slug);
  assert.strictEqual(payload.images[0].recommendationWeight,0);
  assert.strictEqual(payload.queryImages['Breville Barista Express Impress BES876'],slug,'exact model recent-search preview must resolve to the same governed product image');

  const searchPayload={products:[{slug,name:product.name}],closestProducts:[],bodyHtml:searchArticle,directCompare:null};
  const searchDecorated=layer.decorateSearchPayload(searchPayload,mappings);
  assert.strictEqual(searchDecorated.products[0].presentationImage.url,source.image);
  assert.strictEqual(searchDecorated.products[0].presentationImage.recommendationWeight,0);
  assert.strictEqual(searchDecorated.crossSurfaceProductImagery.version,'33.1');
  assert(searchDecorated.bodyHtml.includes(source.image),'isolated Search JSON HTML must carry the same shared product image');

  console.log('CROSS_SURFACE_PRODUCT_IMAGERY_V331=PASS canonical-surface-binding-before-image-eligibility shared=cards+search+autocomplete fail-closed=true recommendationWeight=0');
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
