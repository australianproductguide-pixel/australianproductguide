'use strict';

const assert=require('assert');
const registry=require('../data/amazon-destinations-v39');
const seasonal=require('../data/amazon-seasonal-events-v39');
const shopping=require('../lib/amazon-shopping-discovery-v39');
const shell=require('../lib/amazon-shopping-shell-v39');
const finalShopping=require('../lib/amazon-shopping-final-v39');
const scout=require('../lib/scout-amazon-v5');
const routes=require('../lib/routes');
const associates=require('../lib/amazon-associates');

registry.assertRegistry();
assert.strictEqual(registry.TAG,'auproductguid-22');
assert.strictEqual(registry.VERIFIED_AT,'2026-08-19');
assert(routes.indexableRoutes.includes('/deals/'),'Deals hub must be indexable');
assert.strictEqual(seasonal.events.length,0,'No unverified seasonal Amazon sale should ship as current');

for(const item of registry.activeDestinations()){
  const u=new URL(item.affiliate_url);
  assert.strictEqual(u.hostname,'www.amazon.com.au',`${item.key}: wrong marketplace`);
  assert.strictEqual(u.searchParams.get('tag'),registry.TAG,`${item.key}: missing APG tag`);
  assert.strictEqual(u.searchParams.getAll('tag').length,1,`${item.key}: duplicate tag`);
  assert.strictEqual(item.recommendation_weight,0,`${item.key}: commercial weighting must be zero`);
  assert(item.verified_at,`${item.key}: missing verified_at`);
}

const req={headers:{host:'australianproductguide.au'}};
const deals=shopping.dealsPage(req);
assert(deals.includes('Deals &amp; shopping discovery'),'Deals page heading missing');
assert(deals.includes('As an Amazon Associate I earn from qualifying purchases.'),'Deals disclosure missing');
assert(deals.includes('data-affiliate-destination="todayDeals"'),'Today Deals tracking metadata missing');
assert(deals.includes('data-affiliate-destination="bestSellers"'),'Best Sellers tracking metadata missing');
assert(!deals.includes('Save 10%'),'Deals page must not invent a fixed saving');
assert(!deals.includes('Biggest sale'),'Deals page must not use unsupported sale hype');

const home=shopping.enhance('<html><body><main><p>Home</p></main></body></html>','/',new URL('https://australianproductguide.au/'));
assert(home.includes('/deals/#today-deals'),'Homepage shopping discovery missing');
const category=shopping.enhance('<html><body><main><p>Category</p></main></body></html>','/categories/coffee-machines/',new URL('https://australianproductguide.au/categories/coffee-machines/'));
assert(category.includes('data-affiliate-placement="category_amazon_discovery"'),'Category Amazon discovery missing');
assert(category.includes('tag=auproductguid-22'),'Category link lost Associates tag');
const search=shopping.enhance('<html><body><main><p>Search</p></main></body></html>','/search/',new URL('https://australianproductguide.au/search/?q=amazon+deals'));
assert(search.includes('data-affiliate-destination="todayDeals"'),'Search shopping-intent route missing');

const shellInput='<nav class="primary-nav apg-nav-v8" aria-label="Primary"><div class="wrap nav-inner"><a href="/retailers/">Retailers</a><a class="nav-trust" href="/methodology/">How we compare</a></div></nav><div class="apg-mega-footer"><nav aria-label="More product research"><a href="/compare/">Compare products</a></nav></div><nav id="mobileNav"><div><details class="mobile-section"><summary>Popular products</summary></details></div></nav><footer class="apg-footer-v11"><div class="footer-v11-group"><h3>Connect</h3><a href="/search/">Search APG</a></div></footer>';
const shellOut=shell.enhance(shellInput);
assert(shellOut.includes('class="apg-deals-link"'),'Desktop Deals nav missing');
assert(shellOut.includes('data-shopping-mega'),'Mega-menu shopping discovery missing');
assert(shellOut.includes('data-mobile-shopping'),'Mobile Deals section missing');
assert(shellOut.includes('data-footer-shopping'),'Footer shopping discovery missing');

const finalBase='<html><body>'+shellInput+'<main><p>Final runtime content</p></main></body></html>';
const finalHome=finalShopping.finalShoppingHtml(finalBase,{url:'/'});
assert(finalHome.includes('apg-shopping-home'),'Final response layer must preserve homepage shopping discovery');
assert.strictEqual((finalHome.match(/apg-shopping-home/g)||[]).length,1,'Homepage shopping discovery must be idempotent');
const finalCategory=finalShopping.finalShoppingHtml(finalBase,{url:'/categories/coffee-machines/'});
assert(finalCategory.includes('apg-category-shopping'),'Final response layer must preserve category shopping discovery');
assert(finalCategory.includes('k=coffee+machines'),'Final category route must remain product-specific');
assert(finalCategory.includes('tag=auproductguid-22'),'Final category route lost Associates tag');

const rankedSearchBase='<html><body>'+shellInput+'<main id="main"><section class="search-groups"><p data-ordinary-product-ranking>Ordinary Amazon-branded product ranking</p></section></main></body></html>';
const finalSearch=finalShopping.finalShoppingHtml(rankedSearchBase,{url:'/search/?q=amazon+deals'});
assert(finalSearch.includes('data-shopping-search-intent="true"'),'Shopping-intent search must use the dedicated discovery main');
assert(finalSearch.includes('apg-search-shopping'),'Final response layer must preserve search shopping intent');
assert(finalSearch.includes('data-affiliate-destination="todayDeals"'),'Final search route lost governed destination');
assert(!finalSearch.includes('data-ordinary-product-ranking'),'Promotional search intent must not be treated as ordinary product ranking');
assert(finalSearch.includes('Recommendation independence'),'Shopping-intent search must explain recommendation separation');
const finalRegularSearch=finalShopping.finalShoppingHtml(rankedSearchBase,{url:'/search/?q=robot+vacuum'});
assert(finalRegularSearch.includes('data-ordinary-product-ranking'),'Ordinary product search must remain unchanged');
assert(!finalRegularSearch.includes('data-shopping-search-intent="true"'),'Ordinary product search must not become a shopping-discovery page');

assert.strictEqual(scout.discoveryRecord('Are there any Amazon deals?').key,'todayDeals');
assert.strictEqual(scout.discoveryRecord('Show me Amazon Best Sellers').key,'bestSellers');
assert.strictEqual(scout.discoveryRecord('Where is Subscribe & Save?').key,'subscribeSave');
assert.strictEqual(scout.discoveryRecord('Amazon products under $25').key,'under25');
assert.strictEqual(scout.discoveryRecord('ordinary product advice'),null);
assert(associates.amazonClientJs.includes('amazon_shopping_click'),'Shopping click analytics event missing');
assert(associates.amazonClientJs.includes('destination_key'),'Shopping analytics destination dimension missing');

console.log(`amazon-shopping-discovery-v39 QA passed: ${registry.activeDestinations().length} active governed destinations, ${Object.keys(registry.categoryTerms).length} category routes, zero live seasonal events, final runtime persistence and shopping-intent search separation verified.`);