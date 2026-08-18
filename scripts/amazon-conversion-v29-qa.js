const assert=require('node:assert/strict');
const {products}=require('../data');
const {TAG}=require('../data/retailers-v6');
const commerce=require('../lib/amazon-conversion-v29');
const {amazonClientJs}=require('../lib/amazon-associates');

const snapshot=commerce.commerceSnapshot();
assert.equal(snapshot.maintainedProducts,products.length,'commerce snapshot product count drifted from maintained catalogue');
assert.equal(snapshot.productsWithAmazonPath,products.length,'every maintained product must retain an Amazon Australia purchase path');
assert.equal(snapshot.missingAmazonPath,0,'maintained products are missing Amazon paths');
assert.equal(snapshot.amazonAssociatesTag,TAG,'commerce snapshot Associates tag mismatch');
assert.equal(snapshot.recommendationWeight,0,'retailer economics must contribute zero recommendation weight');

let exact=0,search=0;
for(const product of products){
  const record=commerce.recordBySlug.get(product.slug);
  assert.ok(record,`${product.slug}: central Amazon commerce record missing`);
  assert.equal(record.recommendation_weight,0,`${product.slug}: affiliate commerce leaked into recommendation weight`);
  const url=new URL(record.amazon_url);
  assert.equal(url.protocol,'https:',`${product.slug}: Amazon path must use HTTPS`);
  assert.equal(url.hostname,'www.amazon.com.au',`${product.slug}: non-Australian Amazon destination`);
  assert.equal(url.searchParams.get('tag'),TAG,`${product.slug}: Associates tag missing or incorrect`);
  if(record.amazon_link_type==='EXACT VERIFIED'){
    exact++;
    assert.ok(record.amazon_asin,`${product.slug}: exact link missing ASIN`);
    assert.ok(record.amazon_verified,`${product.slug}: exact link is not marked verified`);
    assert.ok(record.amazon_verified_date,`${product.slug}: exact link missing verification date`);
    assert.equal(record.amazon_model_match,'exact',`${product.slug}: exact link model-match state is not exact`);
    assert.ok(url.pathname.includes(`/dp/${record.amazon_asin}`),`${product.slug}: exact Amazon path does not contain its recorded ASIN`);
  }else{
    search++;
    assert.equal(record.amazon_link_type,'SEARCH FALLBACK',`${product.slug}: unsupported Amazon link state`);
    assert.equal(record.amazon_asin,null,`${product.slug}: search fallback must not imply an ASIN`);
    assert.equal(record.amazon_verified,false,`${product.slug}: search fallback must not masquerade as exact verification`);
    assert.equal(url.pathname,'/s',`${product.slug}: fallback is not an Amazon search route`);
    assert.ok(url.searchParams.get('k'),`${product.slug}: model-specific search fallback missing query`);
  }
}
assert.equal(snapshot.exactVerified,exact,'snapshot exact-link count mismatch');
assert.equal(snapshot.searchFallbacks,search,'snapshot fallback count mismatch');
assert.equal(exact+search,products.length,'Amazon path states do not cover the maintained catalogue');

const exactProduct=products.find(p=>commerce.recordBySlug.get(p.slug)?.amazon_link_type==='EXACT VERIFIED');
const fallbackProduct=products.find(p=>commerce.recordBySlug.get(p.slug)?.amazon_link_type==='SEARCH FALLBACK');
assert.ok(exactProduct,'exact Amazon QA fixture product missing');
assert.ok(fallbackProduct,'search-fallback QA fixture product missing');

function shell(body,slug=''){
  return `<!doctype html><html><head></head><body${slug?` data-product-slug="${slug}"`:''}><main>${body}</main></body></html>`;
}
const exactHero=commerce.enhance(shell(`<section class="product-hero"><div class="actions"><a class="button" href="#where-to-buy">Where to buy</a></div></section>`,exactProduct.slug),`/products/${exactProduct.slug}/`);
assert.ok(exactHero.includes('View on Amazon Australia'),'exact product hero missing explicit Amazon CTA');
assert.ok(exactHero.includes('data-affiliate-placement="product_hero"'),'exact product hero CTA placement marker missing');
assert.ok(exactHero.includes('data-mobile-amazon-cta'),'product page missing mobile sticky Amazon action');
assert.ok(exactHero.includes('Paid Amazon Associate link.'),'product hero point-of-action disclosure missing');
assert.ok(exactHero.includes('Compare retailer options'),'product hero lost retailer-neutral secondary route');
assert.ok(exactHero.includes('data-product-category='),'product hero missing coarse analytics category marker');

const fallbackHero=commerce.enhance(shell(`<section class="product-hero"><div class="actions"><a class="button" href="#where-to-buy">Where to buy</a></div></section>`,fallbackProduct.slug),`/products/${fallbackProduct.slug}/`);
assert.ok(fallbackHero.includes('Search this model on Amazon Australia'),'fallback product hero is not transparent about search behaviour');
assert.ok(fallbackHero.includes('no ASIN guessed'),'fallback hero does not preserve no-guess disclosure');

const card=commerce.enhance(shell(`<article class="product-card"><div class="card-actions"><a class="button secondary" href="/products/${fallbackProduct.slug}/">View product</a><button data-compare-product="${fallbackProduct.slug}">Compare</button></div></article>`),'/categories/example/');
assert.ok(card.includes('Search this model on Amazon AU'),'product card missing safe Amazon purchase path');
assert.ok(card.includes('data-affiliate-placement="product_card"'),'product-card affiliate placement marker missing');

const decision=commerce.enhance(shell(`<div class="decision-result"><div class="actions"><a class="button" href="/products/${exactProduct.slug}/">Inspect decision guide</a><button data-compare-product="${exactProduct.slug}">Compare</button></div></div>`),'/decision-lab/');
assert.ok(decision.includes('View on Amazon Australia'),'Decision Lab result missing Amazon transition');
assert.ok(decision.includes('data-affiliate-placement="decision_lab_result"'),'Decision Lab affiliate context marker missing');

const pair=commerce.enhance(shell(`<article class="winner-card"><a href="/products/${exactProduct.slug}/" class="button secondary">Open product guide</a></article>`),'/compare/example/a-vs-b/');
assert.ok(pair.includes('View on Amazon Australia'),'head-to-head result missing Amazon transition');
assert.ok(pair.includes('data-affiliate-placement="comparison_result"'),'comparison affiliate context marker missing');

assert.ok(exactHero.includes('/assets/amazon-conversion-v29.css?v=29'),'v29 commerce CSS not injected');
assert.ok(exactHero.includes('/assets/amazon-conversion-v29.js?v=29'),'v29 commerce client not injected');
assert.ok(commerce.clientJs.includes("'scout_recommendation'"),'Scout purchase enhancement missing');
assert.ok(commerce.clientJs.includes("'my_apg_saved'"),'My APG purchase enhancement missing');
assert.ok(commerce.clientJs.includes("'comparison_result'"),'dynamic comparison purchase enhancement missing');
assert.ok(commerce.css.includes('.apg-mobile-purchase'),'mobile purchase component styling missing');

for(const field of ['category','referral_context','device_bucket','placement','product_slug','page_path']){
  assert.ok(amazonClientJs.includes(field+':')||amazonClientJs.includes(field+','),`affiliate_click analytics missing ${field}`);
}
assert.ok(!amazonClientJs.includes('search_term'),'affiliate analytics must not collect search text');
assert.ok(!amazonClientJs.includes('account_id'),'affiliate analytics must not collect account identifiers');

console.log(`Amazon conversion v29 QA passed: ${products.length} maintained products, ${exact} exact verified Amazon AU destinations, ${search} transparent model-specific fallbacks.`);