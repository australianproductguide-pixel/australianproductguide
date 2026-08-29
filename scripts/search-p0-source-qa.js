'use strict';
const assert=require('assert');
const runtime=require('../lib/search-reliability-v52-runtime');
const decision=require('../lib/decision-lab-resilience-v50-runtime');
const audit=require('../lib/audit-search-mobile-v119-runtime');
const search=require('../lib/search');
const api=require('../api/index');

assert.equal(runtime.VERSION,'52.0');
assert.equal(runtime.PATCH,'search-p0-2026-08-20-isolated-json-r3');
assert.equal(runtime.SEARCH_VERSION,'search-ranking-v4');
assert.equal(api.VERSION,'52.0','Search v52 must remain the authoritative Search runtime beneath audit presentation controls');
assert.equal(api.PATCH,runtime.PATCH,'outer API must preserve Search v52 marker');
assert.equal(api.AUDIT_SEARCH_MOBILE_VERSION,'119.0','audit Search/mobile wrapper must be active');
assert.equal(decision.VERSION,'50.4','Decision Lab v50.4 must remain directly beneath Search v52');
assert.equal(decision.ENGINE,'decision-engine-v4');
new Function(runtime.clientJs);
new Function(audit.JS);

for(const contract of [
  "window.__APG_SEARCH_RELIABILITY_V52__",
  'new AbortController()',
  'DEADLINE_MS=10000',
  "Accept:'application/json'",
  "'X-APG-Search-JSON':'1'",
  'response.json()',
  "payload.version!=='search-ranking-v4'",
  'payload.commercialRecommendationWeight!==0',
  'main.innerHTML=payload.bodyHtml',
  "history.pushState({apgSearchV52:true}",
  "form.matches('form[data-search-shell]')",
  'event?.preventDefault()',
  'event?.stopImmediatePropagation()',
  'migrateRecentSearches()',
  'moveRecent(event,input,1)',
  'moveRecent(event,input,-1)',
  '[data-apg-history-show]',
  "window.addEventListener('popstate'",
  "window.addEventListener('pagehide'"
]) assert(runtime.clientJs.includes(contract),`missing Search v52 client contract: ${contract}`);

for(const forbidden of ['location.assign(','location.href=','scrollIntoView(','DOMParser(','document.importNode('])assert(!runtime.clientJs.includes(forbidden),`Search v52 interactive path must not use ${forbidden}`);
assert(runtime.searchBody(runtime.searchPayload(new URL('https://australianproductguide.au/search/?q=sony+xm6'))).includes('WH-1000XM6'),'Sony XM6 lightweight result must render a maintained product');

// 29–30 Aug audit regressions: autocomplete product navigation, mobile Search and zero relevance.
assert(audit.MOBILE_FORM.includes('data-apg-mobile-search-v119')&&audit.MOBILE_FORM.includes('action="/search/"')&&audit.MOBILE_FORM.includes('name="q"'),'SSR mobile Search form contract missing');
assert(audit.CSS.includes('@media(max-width:920px)'),'mobile Search visibility breakpoint missing');
assert(audit.JS.includes('productSuggestionAnchor'),'autocomplete canonical product guard missing');
assert(audit.JS.includes("/^\\/products\\/[^/]+\\/$/"),'autocomplete guard must only capture canonical product routes');
assert(audit.JS.includes('event.stopImmediatePropagation()'),'legacy autocomplete handlers are not isolated');
assert(audit.JS.includes('Do not preventDefault'),'native product anchor navigation must remain authoritative');
assert(audit.JS.includes("event.key!=='Enter'"),'keyboard product activation regression missing');
for(const forbidden of ['location.assign(','location.href='])assert(!audit.JS.includes(forbidden),`audit autocomplete must not use imperative navigation: ${forbidden}`);
const nonsense=search.searchSite('flibbertigibbet quantum banana toaster unicorn');
assert.equal(nonsense.products.length,0,'nonsense Search must not manufacture product relevance');
assert.equal(nonsense.zeroResult?.reason,'unrecognised-query','nonsense Search must fail closed with governed zero-result reason');
assert.equal(nonsense.directCompare,null,'nonsense Search must not manufacture comparison relevance');
const known=search.searchSite('Sony WH-1000XM6');
assert(known.products.some(p=>p.slug),'valid maintained model must still resolve after relevance threshold');

const sample='<html><head><script src="/assets/app.js?v=test" defer></script></head><body><header class="site-header"></header><main id="main"><section class="heavy-old-search">legacy</section></main></body></html>';
const injected=runtime.inject(sample);
assert(injected.includes('/assets/search-reliability-v52.js?v=52.0'),'Search v52 client asset missing');
assert(injected.indexOf('/assets/search-reliability-v52.js')<injected.indexOf('/assets/app.js'),'Search v52 must register before legacy app.js');
assert.equal((injected.match(/search-reliability-v52\.js/g)||[]).length,1,'Search v52 asset must be injected once');
const auditInjected=audit.inject(injected);
assert(auditInjected.includes('data-apg-mobile-search-v119'),'mobile Search must be present in SSR HTML');
assert(auditInjected.includes('/assets/audit-search-mobile-v119.js?v=119.0'),'audit navigation asset missing');
assert(auditInjected.includes('/assets/audit-search-mobile-v119.css?v=119.0'),'audit mobile Search stylesheet missing');

function jsonFor(raw){let body='',status=0,headers={};const req={method:'GET'},res={setHeader:(k,v)=>{headers[String(k).toLowerCase()]=v},end:v=>{body=String(v||'')},set statusCode(v){status=v},get statusCode(){return status}};runtime.sendSearchJson(req,res,new URL(raw,'https://australianproductguide.au'));assert.equal(status,200);assert(/application\/json/.test(headers['content-type']));assert.equal(headers['x-apg-search-mode'],'isolated-json-v52');return JSON.parse(body)}
for(const raw of [
 '/search/?q=sony+xm6',
 '/search/?q=quiet+headphones+for+commuting',
 '/search/?q=robot+vacuum+for+pet+hair',
 '/search/?q=coffee+machine+for+flat+whites',
 '/search/?q=zzzz+unsupported+product+constellation+999999'
]){const out=jsonFor(raw);assert.equal(out.version,'search-ranking-v4');assert.equal(out.commercialRecommendationWeight,0);assert.equal(typeof out.bodyHtml,'string');assert(out.bodyHtml.includes('data-search-shell'));assert(!out.bodyHtml.includes('[object Object]'))}
const sony=jsonFor('/search/?q=sony+xm6');assert(sony.products.some(p=>p.slug==='sony-wh-1000xm6'),'Sony XM6 JSON must resolve maintained Sony WH-1000XM6');
const zero=jsonFor('/search/?q=zzzz+unsupported+product+constellation+999999');assert.equal(zero.products.length,0,'unsupported query must not invent product results');

const simplified=runtime.simplifySearchHtml(sample,new URL('https://australianproductguide.au/search/?q=sony+xm6'));
assert(!simplified.includes('heavy-old-search'),'direct Search result HTML must remove the transformed legacy result main');
assert(simplified.includes('WH-1000XM6'),'direct Search result HTML must retain a useful lightweight maintained result');
assert(simplified.includes('Affiliate availability and commission contribute zero recommendation points.'),'lightweight Search must preserve recommendation neutrality disclosure');
assert.equal(runtime.simplifySearchHtml(sample,new URL('https://australianproductguide.au/search/')),sample,'blank Search page should retain the established discovery shell');

console.log('Search P0 v52 + audit v119 contracts passed: native product autocomplete + mobile Search + honest zero relevance + isolated JSON');
