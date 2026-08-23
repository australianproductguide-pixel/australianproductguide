'use strict';
const assert=require('assert');
const layer=require('../lib/action3-search-commerce-v90');
const search=require('../lib/search');
const {products}=require('../data');

const bySlug=new Map(products.map(p=>[p.slug,p]));
function payloadFor(q){
  const r=search.searchSite(q);
  return {queryUnderstanding:r.queryUnderstanding||{},products:(r.products||[]).slice(0,12).map(p=>({slug:p.slug,name:p.name,brand:p.brand,category:p.category,url:`/products/${p.slug}/`})),bodyHtml:(r.products||[]).length===1?`<div class="actions"><a class="button secondary" href="/products/${r.products[0].slug}/">Open product guide</a></div>`:''};
}
function high(q){return layer.exactIntent(payloadFor(q));}

const sony=layer.retailerState(bySlug.get('sony-wh-1000xm6'));
assert.equal(sony.status,'VARIANT_VERIFIED');
assert.equal(sony.destination,'verified_variant');
assert.equal(sony.kind,'direct');
assert.equal(sony.asin,'B0F4DKKPN1');
assert.ok(sony.url.startsWith('https://www.amazon.com.au/dp/B0F4DKKPN1'));
assert.ok(sony.url.includes('tag=auproductguid-22'));
assert.match(sony.label,/available variant/i);

const tapo=layer.retailerState(bySlug.get('tp-link-tapo-c410'));
assert.equal(tapo.status,'EXACT_VERIFIED');
assert.equal(tapo.destination,'direct_asin');
assert.match(tapo.label,/View on Amazon Australia/);
assert.ok(tapo.url.includes('tag=auproductguid-22'));

const keychron=layer.retailerState(bySlug.get('keychron-k2-pro'));
assert.equal(keychron.status,'SEARCH_FALLBACK');
assert.equal(keychron.destination,'search_fallback');
assert.equal(keychron.kind,'search');
assert.match(keychron.label,/Search this model on Amazon Australia/);
assert.ok(keychron.url.startsWith('https://www.amazon.com.au/s?'));
assert.ok(keychron.url.includes('tag=auproductguid-22'));

assert.equal(high('Sony WH-1000XM6'),true,'exact Sony model should be high confidence');
assert.equal(high('headphones'),false,'category query must stay decision-support');
assert.equal(high('headphones under $300'),false,'budget query must stay decision-support');
assert.equal(high('robot vacuum for pet hair'),false,'use-case query must stay decision-support');
assert.equal(high('TV for a bright room'),false,'environment query must stay decision-support');
assert.equal(high('Samsung vs LG'),false,'ambiguous comparison must stay decision-support');
assert.equal(high('laptop for uni under $1,500'),false,'natural-language need must stay decision-support');
assert.equal(high('Samsung'),false,'broad brand query must stay decision-support');

const sonyPayload=layer.enrichPayload(payloadFor('Sony WH-1000XM6'));
assert.equal(sonyPayload.action3.intentClass,'EXACT_PRODUCT');
assert.equal(sonyPayload.action3.commercialRecommendationWeight,0);
assert.equal(sonyPayload.products[0].retailerAction.status,'VARIANT_VERIFIED');
assert.match(sonyPayload.bodyHtml,/Open APG guide/);
assert.match(sonyPayload.bodyHtml,/data-compare-product="sony-wh-1000xm6"/);
assert.match(sonyPayload.bodyHtml,/View available variant on Amazon Australia/);
assert.match(sonyPayload.bodyHtml,/data-affiliate-placement="search_result"/);
assert.match(sonyPayload.bodyHtml,/data-affiliate-context="search_exact_product"/);
assert.match(sonyPayload.bodyHtml,/data-affiliate-destination="verified_variant"/);
assert.match(sonyPayload.bodyHtml,/rel="sponsored nofollow noopener"/);
assert.match(sonyPayload.bodyHtml,/aria-label=/);

const broad=layer.enrichPayload(payloadFor('headphones'));
assert.equal(broad.action3.intentClass,'DECISION_SUPPORT');
assert.ok(broad.products.every(p=>p.retailerAction===null));
assert.ok(!String(broad.bodyHtml||'').includes('data-affiliate-placement="search_result"'));

const fakeExact={queryUnderstanding:{modelMatchCount:1,modelAmbiguous:false},products:[{slug:'tp-link-tapo-c410',name:'Tapo C410',brand:'TP-Link',category:'home-security-cameras',url:'/products/tp-link-tapo-c410/'}],bodyHtml:'<div class="actions"><a class="button secondary" href="/products/tp-link-tapo-c410/">Open product guide</a></div>'};
const exactEnriched=layer.enrichPayload(fakeExact);
assert.equal(exactEnriched.products[0].retailerAction.status,'EXACT_VERIFIED');
assert.match(exactEnriched.bodyHtml,/data-affiliate-destination="direct_asin"/);

const fakeFallback={queryUnderstanding:{modelMatchCount:1,modelAmbiguous:false},products:[{slug:'keychron-k2-pro',name:'Keychron K2 Pro',brand:'Keychron',category:'mechanical-keyboards',url:'/products/keychron-k2-pro/'}],bodyHtml:'<div class="actions"><a class="button secondary" href="/products/keychron-k2-pro/">Open product guide</a></div>'};
const fallbackEnriched=layer.enrichPayload(fakeFallback);
assert.equal(fallbackEnriched.products[0].retailerAction.status,'SEARCH_FALLBACK');
assert.match(fallbackEnriched.bodyHtml,/Search this model on Amazon Australia/);
assert.match(fallbackEnriched.bodyHtml,/data-affiliate-destination="search_fallback"/);

console.log('ACTION3_SEARCH_COMMERCE_V90_OK');
