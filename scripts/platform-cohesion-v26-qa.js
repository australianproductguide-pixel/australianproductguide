const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cohesion=require('../lib/platform-cohesion-v26');
const commerce=require('../lib/priority-commerce-depth-v42');
const research=require('../lib/research-view-v43');
const search=require('../lib/search');
const {products,categories}=require('../data');
const {runtimeChainIncludes}=require('./runtime-chain-qa');

const failures=[];
function check(name,fn){
  try{fn();process.stdout.write(`PASS ${name}\n`);}catch(err){failures.push(`${name}: ${err.message}`);process.stderr.write(`FAIL ${name}: ${err.message}\n`);}
}

check('catalogue baseline remains 482 products / 90 categories with broad brand coverage',()=>{
  assert.equal(products.length,482);
  assert.equal(Object.keys(categories).length,90);
  const rawBrandStrings=new Set(products.map(p=>p.brand).filter(Boolean)).size;
  assert.ok(rawBrandStrings>=178,`expected at least 178 maintained raw brand labels, found ${rawBrandStrings}`);
});

check('cohesion transform injects early Scout boundary, state, CSS, JS and entry points once',()=>{
  const html='<!doctype html><html><head><script src="/assets/app.js" defer></script><title>APG</title></head><body><nav class="primary-nav"><div class="nav-inner"><a class="apg-power-link" href="/decision-lab/" data-decision-nav>Decision Lab</a></div></nav><nav id="mobileNav"><a class="mobile-power" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a></nav><main></main></body></html>';
  const once=cohesion.cohesionTransform(html,'https://australianproductguide.au/compare/');
  const twice=cohesion.cohesionTransform(once,'https://australianproductguide.au/compare/');
  assert.match(once,/data-v26-scout-early="true"/);
  assert.match(once,/data-cohesion-v26="true"/);
  assert.match(once,/data-v26-page="compare"/);
  assert.match(once,/platform-cohesion-v26\.css\?v=26/);
  assert.match(once,/platform-cohesion-v26\.js\?v=26\.5/);
  assert.match(once,/data-v26-scout-open/);
  assert.ok(once.indexOf('data-v26-scout-early="true"')<once.indexOf('/assets/app.js'),'Scout event guard must register before existing deferred app scripts');
  assert.ok(once.indexOf('data-v26-scout-early="true"')<once.indexOf('</head>'),'Scout event guard must execute while the document head is being parsed');
  assert.equal((twice.match(/data-v26-scout-early="true"/g)||[]).length,1);
  assert.equal((twice.match(/platform-cohesion-v26\.css/g)||[]).length,1);
  assert.equal((twice.match(/platform-cohesion-v26\.js/g)||[]).length,1);
  assert.equal(twice,once,'cohesion transform must remain idempotent after early-bootstrap injection');
});

check('early Scout bootstrap owns activation before deferred runtime and queues safely',()=>{
  const guard=cohesion.SCOUT_EARLY_GUARD;
  assert.ok(guard.includes('window.__APG_SCOUT_EARLY_GUARD_V26__'),'early bootstrap must be idempotent');
  assert.ok(guard.includes("window.addEventListener('click'"),'early bootstrap must own Scout clicks at window capture');
  assert.ok(guard.includes('e.preventDefault();e.stopImmediatePropagation()'),'Scout click must never reach a legacy handler or native form/search path');
  assert.ok(guard.includes("window.__apgScoutPendingV26=trigger"),'early bootstrap must queue the activation until the full bridge is ready');
  assert.ok(guard.includes("'[data-v26-scout-open]'"),'early bootstrap must be tightly scoped to Scout entry points');
});

check('Research View activates on SSR search and stays affiliate-neutral',()=>{
  const fixture='<!doctype html><html><head></head><body><section class="search-hero"><p class="kicker">Product comparison search</p><h1>What are you trying to buy?</h1><p>Search by product, model, brand, use case or budget. Australian Product Guide translates the query into the current maintained catalogue.</p></section><div class="search-groups"></div></body></html>';
  const url='https://australianproductguide.au/search/?q='+encodeURIComponent('robot vacuum for pet hair');
  const html=research.searchTransform(fixture,url);
  const payload=research.researchPayload('robot vacuum for pet hair');
  assert.match(html,/APG Research View/);
  assert.match(html,/id="all-results-v43"/);
  assert.equal(payload.commercialRecommendationWeight,0);
  assert.ok(Array.isArray(payload.results));
});

check('search v4 preserves governed decision-aware ranking',()=>{
  const result=search.searchSite('robot vacuum for pet hair');
  assert.equal(result.version,'search-ranking-v4');
  assert.ok(result.queryUnderstanding);
  assert.ok(Array.isArray(result.products));
});

check('exact retailer transform only uses verified exact-model offer records',()=>{
  const p=products.find(x=>Array.isArray(x.offers)&&x.offers.some(o=>o&&o.exactModel===true&&o.url&&o.retailer));
  assert.ok(p,'expected at least one verified exact-model retailer offer');
  const fixture='<!doctype html><html><head></head><body><div><span class="independence-badge">Retailer status does not affect ranking</span></div></body></html>';
  const out=commerce.commerceTransform(fixture,`https://australianproductguide.au/products/${p.slug}/`);
  assert.match(out,/Verified retailer intelligence/);
  assert.match(out,/non-affiliate/);
  assert.doesNotMatch(out,/A\$0(?:\D|$)/);
});

check('integrated retailer enhancement is idempotent when renderer already supplied v42 offers',()=>{
  const p=products.find(x=>Array.isArray(x.offers)&&x.offers.some(o=>o&&o.exactModel===true&&o.url&&o.retailer));
  assert.ok(p,'expected verified exact retailer product');
  const base='<!doctype html><html><head></head><body><div><span class="independence-badge">Retailer status does not affect ranking</span></div></body></html>';
  const once=commerce.commerceTransform(base,`https://australianproductguide.au/products/${p.slug}/`);
  assert.equal((once.match(/apg-exact-offers-v42/g)||[]).length,1);
  const reconciled=cohesion.applyIntegratedTransforms(once,`https://australianproductguide.au/products/${p.slug}/`);
  assert.equal((reconciled.match(/apg-exact-offers-v42/g)||[]).length,1,'v26 must not duplicate an existing exact-retailer block');
});

check('mobile comparison enhancement is progressive and labelled',()=>{
  const client=fs.readFileSync(path.join(__dirname,'../public/assets/platform-cohesion-v26.js'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../public/assets/platform-cohesion-v26.css'),'utf8');
  assert.match(client,/dataset\.label/);
  assert.match(client,/table\.compare/);
  assert.match(client,/v26CompareEnhanced/);
  assert.match(client,/v26MobileReady/);
  assert.match(css,/max-width:720px/);
  assert.match(css,/data-v26-compare-enhanced="true"/);
  assert.match(css,/data-v26-mobile-ready="true"/);
  assert.match(css,/content:attr\(data-label\)/);
});

check('release entry point preserves platform cohesion v26 through the active wrapper chain',()=>{
  assert.ok(runtimeChainIncludes('platform-cohesion-v26'),'release entry point must preserve platform cohesion v26 through the active recursive runtime wrapper chain');
});

check('cohesion does not manufacture reviews, ratings or offers',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../lib/platform-cohesion-v26.js'),'utf8');
  assert.doesNotMatch(src,/aggregateRating|reviewRating|ratingValue/);
  assert.doesNotMatch(src,/"@type"\s*:\s*"Offer"/);
});

if(failures.length){
  process.stderr.write(`\n${failures.length} Platform Cohesion v26 QA failure(s):\n- ${failures.join('\n- ')}\n`);
  process.exit(1);
}
process.stdout.write('\nPlatform Cohesion v26 QA passed.\n');
