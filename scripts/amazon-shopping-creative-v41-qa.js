'use strict';

const assert=require('assert');
const {categories}=require('../data');
const registry=require('../data/amazon-destinations-v39');
const creative=require('../lib/amazon-shopping-creative-v41');
const finalV39=require('../lib/amazon-shopping-final-v39');
const finalV41=require('../lib/amazon-shopping-creative-final-v41');

const TAG='auproductguid-22';
const REQUIRED='As an Amazon Associate I earn from qualifying purchases.';

function links(html){
  return [...String(html).matchAll(/<a\b[^>]*\bhref="(https:\/\/www\.amazon\.com\.au\/[^\"]+)"[^>]*>/gi)].map(m=>({tag:m[0],href:m[1]}));
}
function assertAffiliateLinks(html,label,min=1){
  const found=links(html);
  assert(found.length>=min,`${label}: expected at least ${min} Amazon links, found ${found.length}`);
  for(const link of found){
    const u=new URL(link.href.replace(/&amp;/g,'&'));
    assert.strictEqual(u.hostname,'www.amazon.com.au',`${label}: wrong marketplace`);
    assert.strictEqual(u.searchParams.get('tag'),TAG,`${label}: missing APG tag`);
    assert.strictEqual(u.searchParams.getAll('tag').length,1,`${label}: duplicate APG tag`);
    assert(/rel="[^"]*sponsored[^"]*nofollow/i.test(link.tag),`${label}: missing sponsored/nofollow`);
    assert(/data-affiliate-link/i.test(link.tag),`${label}: missing affiliate analytics marker`);
    assert(/data-amazon-creative-source="APG_ORIGINAL"/i.test(link.tag),`${label}: creative source not declared APG_ORIGINAL`);
  }
}

assert.strictEqual(creative.VERSION,'v41');
assert.strictEqual(creative.CREATIVE_SOURCE,'APG_ORIGINAL');
assert.strictEqual(creative.TAG,TAG);

const home=creative.homeCreative();
assert(home.includes('data-amazon-creative-v41="home"'),'home creative marker missing');
assertAffiliateLinks(home,'home',4);
assert(/Today(?:'|&#39;)s Deals/.test(home),'home Today’s Deals creative missing');
assert(home.includes('Best Sellers'),'home Best Sellers creative missing');
assert(home.includes('Under $25'),'home Under $25 creative missing');
assert(home.includes('Subscribe &amp; Save')||home.includes('Subscribe & Save'),'home Subscribe & Save creative missing');

const deals=creative.dealsCreative();
assert(deals.includes('data-amazon-creative-v41="deals"'),'deals creative marker missing');
assertAffiliateLinks(deals,'deals',4);
assert(deals.includes('New Releases'),'deals New Releases creative missing');
assert(!/\b(?:save|discount)\s+\d+%/i.test(deals),'deals creative must not invent percentage savings');
assert(!/\b(?:was|now)\s+\$\d+/i.test(deals),'deals creative must not invent volatile Amazon prices');

let categoryCount=0;
for(const slug of Object.keys(categories)){
  const section=creative.categoryCreative(slug);
  assert(section,`${slug}: category creative missing`);
  assert(section.includes(`data-amazon-creative-category="${slug}"`),`${slug}: category marker missing`);
  assertAffiliateLinks(section,`category:${slug}`,1);
  const route=creative.categoryRoute(slug);
  assert(route,`${slug}: category Amazon route missing`);
  const u=new URL(route.affiliate_url);
  assert.strictEqual(u.hostname,'www.amazon.com.au',`${slug}: category route wrong host`);
  assert.strictEqual(u.searchParams.get('tag'),TAG,`${slug}: category route lost tag`);
  assert(u.searchParams.get('k'),`${slug}: category route must be category-specific search`);
  categoryCount++;
}
assert(categoryCount>=80,`expected broad catalogue category coverage, found ${categoryCount}`);

for(const q of ['amazon deals','Amazon Best Sellers','Amazon products under $25','subscribe and save','new releases on amazon']){
  const section=creative.searchCreative(q);
  assert(section,`search creative missing for ${q}`);
  assertAffiliateLinks(section,`search:${q}`,1);
}
assert.strictEqual(creative.searchCreative('best robot vacuum for pet hair'),'','ordinary recommendation query must not receive Amazon promo creative');

// Original APG creative only: no scraped/embedded Amazon Program Content or Amazon-hosted imagery.
const source=home+deals+creative.categoryCreative('coffee-machines');
assert(!/<img\b/i.test(source),'v41 must not embed product/banner images');
assert(!/media-amazon|images-(?:na|eu|fe)\.ssl-images-amazon/i.test(source),'v41 must not hotlink Amazon imagery');
assert(!/amazon[_ -]?(?:logo|smile)/i.test(source),'v41 must not manufacture Amazon logo/smile creative');
assert(source.includes('Paid Amazon Australia link'),'paid-link labelling missing');

// Recommendation independence remains structural: v41 consumes no scoring engine and its generated routes are links only.
const moduleText=require('fs').readFileSync(require.resolve('../lib/amazon-shopping-creative-v41'),'utf8');
assert(!/decision-engine|recommendation_weight\s*[=:]\s*[1-9]|affiliate.*score|commission.*score/i.test(moduleText),'v41 must not influence recommendation scoring');
assert(/recommendations remain independent|separate from APG recommendations|separate from APG product suitability/i.test(moduleText),'v41 must explain recommendation separation');

// Final wrapper must persist v39 shopping discovery and add v41 with its own CSS only where used.
const shell='<html><head><title>APG</title></head><body><nav class="primary-nav apg-nav-v8"><div class="wrap nav-inner"></div></nav><main><p>Base</p></main><footer></footer></body></html>';
const v39Home=finalV39.finalShoppingHtml(shell,{url:'/'});
const v41Home=finalV41.finalCreativeHtml(v39Home,{url:'/'});
assert(v41Home.includes('apg-shopping-home'),'v41 must preserve v39 homepage shopping discovery');
assert(v41Home.includes('data-amazon-creative-v41="home"'),'v41 homepage creative missing at final response');
assert(v41Home.includes(finalV41.CSS_PATH),'v41 stylesheet missing on creative page');
assert.strictEqual((v41Home.match(/data-amazon-creative-v41="home"/g)||[]).length,1,'v41 homepage creative must be idempotent');

const v39Deals=finalV39.finalShoppingHtml(shell.replace('<main><p>Base</p></main>','<main>'+require('../lib/amazon-shopping-discovery-v39').dealsPage({headers:{host:'australianproductguide.au'}}).match(/<main[\s\S]*<\/main>/)?.[0]?.replace(/^<main[^>]*>|<\/main>$/g,'')+'</main>'),{url:'/deals/'});
const v41Deals=finalV41.finalCreativeHtml(v39Deals,{url:'/deals/'});
assert(v41Deals.includes('data-amazon-creative-v41="deals"'),'v41 Deals creative missing at final response');
assertAffiliateLinks(v41Deals,'final-deals',4);

const regular=finalV41.finalCreativeHtml(shell,{url:'/methodology/'});
assert(!regular.includes('data-amazon-creative-v41='),'non-shopping page must not gain a creative');
assert(!regular.includes(finalV41.CSS_PATH),'non-shopping page must not load v41 CSS');

// The exact Associates statement remains governed by APG's existing Associates layer/deals disclosure.
const associates=require('../lib/amazon-associates');
assert.strictEqual(associates.REQUIRED_STATEMENT,REQUIRED);
assert(require('../lib/amazon-shopping-discovery-v39').dealsPage({headers:{host:'australianproductguide.au'}}).includes(REQUIRED),'Deals hub must retain exact Amazon Associate disclosure');

registry.assertRegistry();
console.log(`AMAZON_SHOPPING_CREATIVE_V41_QA=PASS categories=${categoryCount} home_links=${links(home).length} deals_links=${links(deals).length}`);
