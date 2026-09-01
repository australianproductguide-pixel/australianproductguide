'use strict';
const assert=require('assert');
const imagery=require('../lib/governed-product-card-imagery-v1-runtime');

assert.strictEqual(imagery.VERSION,'1.2');
assert.strictEqual(imagery.eligiblePath('/'),false,'Home must never enter governed card response buffering');
assert.strictEqual(imagery.eligiblePath('/products/vitamix-ascent-a3500i/'),false,'PDP stays with dedicated hero renderer');
assert.strictEqual(imagery.eligiblePath('/categories/blenders/'),true);
assert.strictEqual(imagery.eligiblePath('/categories/blenders/finder/'),true);
assert.strictEqual(imagery.eligiblePath('/compare/blenders/'),true);
assert.strictEqual(imagery.eligiblePath('/compare/custom/'),true);
assert.strictEqual(imagery.eligiblePath('/search/'),true);
assert.strictEqual(imagery.eligiblePath('/decision-lab/'),true);

const state={slug:'vitamix-ascent-a3500i',product_name:'Vitamix Ascent A3500i',status:'verified',detail_verified:true,exact_model:true,verification_level:'detail-title-model',verification_evidence:{},item_id:'v1|407057860640|0',legacy_item_id:'407057860640',title:'Vitamix Ascent A3500i Blender',condition:'New',price_value:'1299.00',price_currency:'AUD',image_url:'https://i.ebayimg.com/images/g/test/s-l1600.jpg',image_source:'ebay-listing',item_web_url:'https://www.ebay.com.au/itm/407057860640',item_affiliate_web_url:null,match_score:100,match_reasons:[],match_flags:[],recommendation_weight:0,last_verified_at:'2026-09-01T00:00:00Z',next_refresh_at:null,consecutive_failures:0,recovery_required:false,last_error_code:null};
const html='<!doctype html><html><head></head><body><article class="product-card v7-product-card"><div class="product-card-body"><h3><a href="/products/vitamix-ascent-a3500i/">Ascent A3500i</a></h3></div></article></body></html>';
(async()=>{
  const result=await imagery.inject(html,'/categories/blenders/',{now:()=>Date.parse('2026-09-01T10:00:00Z'),fetchStates:async()=>[state]});
  assert.strictEqual(result.usedGovernedImages,true);
  assert.deepStrictEqual(result.slugs,['vitamix-ascent-a3500i']);
  assert(result.html.includes('data-apg-governed-product-slug="vitamix-ascent-a3500i"'));
  assert(result.html.includes('https://i.ebayimg.com/images/g/test/s-l1600.jpg'));
  assert(result.html.includes('/assets/governed-product-card-imagery-v1.css?v=1.2'));
  assert(!result.html.includes('recommendationWeight:1'));
  console.log('GOVERNED_PRODUCT_CARD_IMAGERY_V12_QA=PASS');
})().catch(error=>{console.error(error);process.exit(1);});
