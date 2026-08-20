'use strict';
const assert=require('assert');
const fs=require('fs');
const runtime=require('../lib/search-resilience-v52-runtime');
const api=require('../api/index');

assert.equal(runtime.VERSION,'52.0');
assert.equal(runtime.PATCH,'search-p0-2026-08-20-isolated-json-r3');
assert.equal(runtime.SEARCH_VERSION,'search-ranking-v4');
assert.equal(api.VERSION,'52.0','Search v52 must be the outer P0 API contract');
assert.equal(api.PATCH,runtime.PATCH);
assert.equal(api.DECISION_VERSION,'50.5');
new Function(runtime.clientJs);

for(const contract of [
 "window.__APG_SEARCH_RESILIENCE_V52__",
 'new AbortController()',
 'DEADLINE_MS=10000',
 "Accept:'application/json'",
 "'X-APG-Search-JSON':'1'",
 'response.json()',
 "payload.version!=='search-ranking-v4'",
 'payload.commercialRecommendationWeight!==0',
 'main.replaceChildren(root)',
 'history.pushState',
 "form.matches('form[data-search-shell]')",
 'event.preventDefault()',
 'event.stopImmediatePropagation()',
 'migrateRecentSearches()',
 'moveVisibleSuggestion(event,input,1)',
 'moveVisibleSuggestion(event,input,-1)',
 '[data-apg-history-show]',
 'search_deadline_exceeded'
])assert(runtime.clientJs.includes(contract),`missing Search v52 contract: ${contract}`);
for(const forbidden of ['location.assign(','window.stop(','DOMParser(','document.importNode(','scrollIntoView(','data-save-product','data-compare-product'])assert(!runtime.clientJs.includes(forbidden),`Search v52 interactive path must not use ${forbidden}`);

const html='<!doctype html><html><head><script src="/assets/app.js?v=test" defer></script></head><body><main id="main"></main></body></html>';
const transformed=runtime.inject(html),v52=transformed.indexOf('/assets/search-resilience-v52.js?v=52.0'),app=transformed.indexOf('/assets/app.js');
assert(v52>=0&&app>=0&&v52<app,'Search v52 must register before legacy app.js');
assert(transformed.includes('/assets/search-resilience-v52.js.css?v=52.0'),'Search v52 CSS asset must be present');

function jsonFor(q){let body='',status=0,headers={};const req={method:'GET'},res={setHeader:(k,v)=>{headers[k.toLowerCase()]=v},end:v=>{body=String(v||'')},set statusCode(v){status=v},get statusCode(){return status}};runtime.sendSearchJson(req,res,new URL('/search/?q='+encodeURIComponent(q),'https://australianproductguide.au'));assert.equal(status,200);assert(/application\/json/.test(headers['content-type']));assert.equal(headers['x-apg-search-mode'],'isolated-json-v52');return JSON.parse(body)}
for(const q of ['sony xm6','quiet headphones for commuting','robot vacuum for pet hair','coffee machine for flat whites','zzzz unsupported product constellation 999999']){const out=jsonFor(q);assert.equal(out.version,'search-ranking-v4',q);assert.equal(out.commercialRecommendationWeight,0,q);assert(Array.isArray(out.products),q);assert(Array.isArray(out.categories),q);assert(Array.isArray(out.comparisons),q)}
const sony=jsonFor('sony xm6');assert(sony.products.some(p=>/sony/i.test(p.brand)&&/xm6/i.test(p.name)),'known Sony XM6 Search regression must resolve in isolated JSON');
const weird=jsonFor('zzzz unsupported product constellation 999999');assert(weird.products.length===0&&weird.zeroResult,'unsupported Search must return controlled zero-result JSON');

const legacyMobile=fs.readFileSync(require.resolve('../lib/mobile-history-ux-v16'),'utf8');assert(legacyMobile.includes("SEARCH_KEY='apgRecentSearches'"));
console.log('Search v52 P0 source QA passed: isolated JSON + no interactive document navigation + Sony regression + controlled zero result');
