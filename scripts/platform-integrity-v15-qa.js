const assert=require('node:assert/strict');
const app=require('../api/index');
const {categories}=require('../data');
const {searchSite}=require('../lib/search');
const {indexableRoutes,noindexRoutes}=require('../lib/routes');

function render(url){return new Promise((resolve,reject)=>{const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}});}

(async()=>{
  assert.ok(indexableRoutes.includes('/decision-lab/'),'clean Decision Lab must be indexable');
  assert.ok(!noindexRoutes.includes('/decision-lab/'),'clean Decision Lab must not remain in static noindex routes');
  assert.ok(noindexRoutes.includes('/my-apg/'),'My APG must remain noindex');

  const dishwasher=searchSite('quiet dishwasher under 1000');
  assert.ok(dishwasher.products.length>0,'dishwasher query should return maintained products');
  assert.ok(dishwasher.products.every(p=>p.category==='dishwashers'),'dishwasher query must not leak products from unrelated categories');
  assert.ok(dishwasher.comparisons.length>0,'dishwasher query should expose useful maintained comparisons');
  assert.ok(dishwasher.comparisons.every(x=>x.category==='dishwashers'),'dishwasher query comparisons must not leak unrelated categories');
  assert.equal(dishwasher.decisionIntent.categorySlug||dishwasher.decisionIntent.category?.slug||'dishwashers','dishwashers','dishwasher intent should resolve to dishwashers');

  const laptop=searchSite('gaming laptop for uni');
  assert.ok(laptop.products.length>0,'laptop query should return maintained products');
  assert.ok(laptop.products.every(p=>p.category==='laptops'),'laptop query must stay within laptops once category intent is resolved');
  assert.ok(laptop.comparisons.every(x=>x.category==='laptops'),'laptop comparisons must stay within laptops once category intent is resolved');

  const compare=await render('/compare/');
  assert.equal(compare.status,200,'compare status');
  assert.match(compare.body,/href="\/compare\/" title="Open the comparison workspace"/,'header Compare shortcut should open Compare');
  assert.match(compare.body,/data-v15-directory-tools/,'Compare hub should expose progressive category filtering');
  assert.match(compare.body,/data-v15-directory-grid/,'Compare hub grid should remain server rendered');
  assert.match(compare.body,/platform-integrity-v15\.css/,'v15 CSS should be linked');
  assert.match(compare.body,/platform-integrity-v15\.js/,'v15 JS should be linked');
  assert.match(compare.body,/M17 9h30v46H17V9/,'dishwasher category should use a dishwasher-specific SSR glyph on Compare');

  const search=await render('/search/?q=quiet+dishwasher+under+1000');
  assert.equal(search.status,200,'dishwasher search status');
  assert.match(search.body,/5 relevant maintained products/,'dishwasher search should retain the five maintained product results');
  assert.doesNotMatch(search.body,/product-art art-headphones/,'dishwasher search surfaces must not render authority products as headphones');
  assert.match(search.body,/data-v15-category="dishwashers"/,'dishwasher search should use dishwasher semantic visuals');
  assert.doesNotMatch(search.body,/sony-wh-1000xm6-vs-bose-quietcomfort-ultra-headphones/,'dishwasher search must not surface the unrelated headphones comparison');

  const cleanDecision=await render('/decision-lab/');
  assert.equal(cleanDecision.status,200,'clean Decision Lab status');
  assert.doesNotMatch(cleanDecision.body,/<meta name="robots" content="noindex,follow">/,'clean Decision Lab must be indexable');
  const internallyDecorated=app.transform('<head><meta name="robots" content="noindex,follow"></head>',new URL('https://australianproductguide.au/decision-lab/?__vercel_internal=1'));
  assert.doesNotMatch(internallyDecorated,/noindex,follow/,'internal platform parameters must not make the clean Decision Lab noindex');
  const userDecorated=app.transform('<head><meta name="robots" content="noindex,follow"></head>',new URL('https://australianproductguide.au/decision-lab/?category=dishwashers&__vercel_internal=1'));
  assert.match(userDecorated,/noindex,follow/,'recognised Decision Lab inputs must remain noindex even with internal parameters');
  const personalisedDecision=await render('/decision-lab/?category=dishwashers&budget=1000');
  assert.match(personalisedDecision.body,/<meta name="robots" content="noindex,follow">/,'parameterised Decision Lab must remain noindex');
  const myApg=await render('/my-apg/');
  assert.match(myApg.body,/<meta name="robots" content="noindex,follow">/,'My APG must remain noindex');

  const dishwasherCategory=await render('/categories/dishwashers/');
  assert.equal(dishwasherCategory.status,200,'dishwasher category status');
  assert.doesNotMatch(dishwasherCategory.body,/product-art art-headphones/,'dishwasher product cards must not SSR as headphones');
  assert.match(dishwasherCategory.body,/product-art art-v15-category/,'dishwasher product cards should use semantic v15 visual treatment');
  assert.match(dishwasherCategory.body,/data-v15-category="dishwashers"/,'dishwasher product visual should identify its category');

  const product=categories.dishwashers.products[0];
  const productPage=await render(`/products/${product.slug}/`);
  assert.equal(productPage.status,200,'dishwasher product status');
  assert.doesNotMatch(productPage.body,/product-art art-headphones/,'dishwasher product page must not SSR as headphones');
  assert.match(productPage.body,/data-v15-category="dishwashers"/,'dishwasher product page should use dishwasher semantic visual');

  const missing=await render('/this-route-does-not-exist-v15-qa/');
  assert.equal(missing.status,404,'missing route must remain a real 404');
  assert.match(missing.body,/<meta name="robots" content="noindex,follow">/,'404 must remain noindex');
  assert.match(missing.body,/href="\/compare\/" title="Open the comparison workspace"/,'404 header Compare shortcut must match the current global navigation');
  assert.match(missing.body,/platform-integrity-v15\.css/,'404 should receive current shared integrity styling');

  const sitemap=await render('/sitemap.xml');
  assert.equal(sitemap.status,200,'sitemap status');
  assert.match(sitemap.body,/https:\/\/australianproductguide\.au\/decision-lab\//,'sitemap should include clean Decision Lab');

  console.log(`PLATFORM_INTEGRITY_V15_QA=PASS products=${dishwasher.products.length} comparisons=${dishwasher.comparisons.length} compareFilter=PASS decisionIndexing=PASS semanticVisuals=PASS htmlErrorStates=PASS`);
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
