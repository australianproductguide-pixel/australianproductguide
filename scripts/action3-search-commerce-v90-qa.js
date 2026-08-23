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
assert.equal(high('Sony WH1000XM6'),true,'normalised Sony model should recover to high confidence');
assert.equal(high('TP-Link Archer BE550'),true,'known fallback model should be high confidence');
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

const exactSearch=layer.enrichPayload(payloadFor('TP-Link Tapo C410'));
assert.equal(exactSearch.products[0].retailerAction.status,'EXACT_VERIFIED');
assert.match(exactSearch.bodyHtml,/data-affiliate-destination="direct_asin"/);

const fallbackSearch=layer.enrichPayload(payloadFor('TP-Link Archer BE550'));
assert.equal(fallbackSearch.products.length,1);
assert.equal(fallbackSearch.products[0].retailerAction.status,'SEARCH_FALLBACK');
assert.match(fallbackSearch.bodyHtml,/Search this model on Amazon Australia/);
assert.match(fallbackSearch.bodyHtml,/data-affiliate-destination="search_fallback"/);

const sonyLegacy=`<body data-product-slug="sony-wh-1000xm6" data-amazon-link-type="exact"><div class="actions"><span class="apg-primary-purchase"><a class="button apg-amazon-cta" href="https://www.amazon.com.au/dp/B0F4DKKPN1?tag=auproductguid-22" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="direct" data-affiliate-placement="product_hero" data-affiliate-context="product_page_primary" data-affiliate-category="wireless-headphones" data-product-slug="sony-wh-1000xm6">View on Amazon Australia</a><small><strong>Paid Amazon Associate link.</strong> Exact Amazon product destination verified.</small></span></div><p>Exact Amazon Australia individual product listing verified.</p><section><h2>Move from research to the exact product</h2><a class="retailer-row" href="https://www.amazon.com.au/dp/B0F4DKKPN1?tag=auproductguid-22" rel="sponsored nofollow noopener" target="_blank" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="direct" data-affiliate-placement="retailer_panel"><span><small>Paid link · Amazon Associate · Exact individual product page verified</small></span><span>View on Amazon Australia</span></a></section><aside><strong>Ready to check the exact product?</strong><small>Verified destination · paid Amazon Associate link</small><a href="https://www.amazon.com.au/dp/B0F4DKKPN1?tag=auproductguid-22" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="direct" data-affiliate-placement="product_mobile_sticky">View on Amazon AU</a></aside></body>`;
const sonyReconciled=layer.reconcileAmazonAffiliateMarkup(sonyLegacy);
assert.match(sonyReconciled,/data-amazon-link-type="variant"/);
assert.equal((sonyReconciled.match(/data-affiliate-destination="verified_variant"/g)||[]).length,3);
assert.equal((sonyReconciled.match(/data-product-slug="sony-wh-1000xm6"/g)||[]).length,4);
assert.match(sonyReconciled,/View available variant on Amazon Australia/);
assert.match(sonyReconciled,/View available variant on Amazon AU/);
assert.match(sonyReconciled,/Verified Amazon variant destination/);
assert.match(sonyReconciled,/Verified Amazon Australia variant listing/);
assert.match(sonyReconciled,/Verified variant listing/);
assert.match(sonyReconciled,/Ready to check the available variant/);
assert.match(sonyReconciled,/Move from research to a verified retailer option/);
assert.ok(!sonyReconciled.includes('Exact Amazon product destination verified.'));
assert.ok(!sonyReconciled.includes('Exact Amazon Australia individual product listing verified.'));
assert.ok(!sonyReconciled.includes('Exact individual product page verified'));

const tapoLegacy=`<body data-product-slug="tp-link-tapo-c410" data-amazon-link-type="exact"><a href="https://example.invalid" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="search" data-affiliate-placement="product_hero" data-product-slug="tp-link-tapo-c410">View on Amazon Australia</a></body>`;
const tapoReconciled=layer.reconcileAmazonAffiliateMarkup(tapoLegacy);
assert.match(tapoReconciled,/data-affiliate-destination="direct_asin"/);
assert.match(tapoReconciled,/data-affiliate-kind="direct"/);
assert.match(tapoReconciled,/https:\/\/www\.amazon\.com\.au\/dp\/B0D3814FFN\?tag=auproductguid-22/);
assert.match(tapoReconciled,/View on Amazon Australia/);

const keychronLegacy=`<body data-product-slug="keychron-k2-pro"><a href="https://example.invalid" data-affiliate-link data-affiliate-retailer="Amazon Australia" data-affiliate-kind="direct" data-affiliate-placement="product_hero" data-product-slug="keychron-k2-pro">View on Amazon Australia</a></body>`;
const keychronReconciled=layer.reconcileAmazonAffiliateMarkup(keychronLegacy);
assert.match(keychronReconciled,/data-affiliate-destination="search_fallback"/);
assert.match(keychronReconciled,/data-affiliate-kind="search"/);
assert.match(keychronReconciled,/Search this model on Amazon Australia/);
assert.match(keychronReconciled,/tag=auproductguid-22/);

console.log('ACTION3_SEARCH_COMMERCE_V901_OK');
