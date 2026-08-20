'use strict';
const assert=require('assert');
const runtime=require('../lib/decision-lab-resilience-v506-runtime');
const transport=require('../lib/decision-lab-resilience-v50-runtime');
const search=require('../lib/search-reliability-v52-runtime');
const api=require('../api/index');
const engine=require('../lib/decision-engine-v4');

assert.equal(runtime.VERSION,'50.6');
assert.equal(runtime.PATCH,'decision-lab-p0-2026-08-20-flow-r6');
assert.equal(runtime.ENGINE,'decision-engine-v4');
assert.equal(transport.VERSION,'50.4','v50.4 must remain the isolated Decision JSON transport');
assert.equal(search.VERSION,'52.0','certified Search v52 must remain intact');
assert.equal(api.VERSION,'52.0','Search v52 must remain the outer P0 API contract');
assert.equal(api.DECISION_VERSION,'50.6');
assert.equal(api.DECISION_PATCH,runtime.PATCH);
new Function(runtime.clientJs);

for(const contract of [
  "window.__APG_DECISION_LAB_RESILIENCE_V506__",
  "window.__APG_DECISION_LAB_RESILIENCE_V50__='decision-lab-p0-2026-08-20-flow-r6'",
  'event.preventDefault()',
  'event.stopImmediatePropagation()',
  'new AbortController()',
  'DEADLINE_MS=10000',
  "Accept:'application/json'",
  "'X-APG-Decision-JSON':'1'",
  'response.json()',
  "payload.version!=='decision-engine-v4'",
  'payload.commercialRecommendationWeight!==0',
  'document.createElement',
  "shell.insertAdjacentElement('afterend',host)",
  'data-v506-results-host',
  'data-v506-product-link',
  'data-v506-save',
  'data-v506-compare',
  'data-v506-reset',
  "event.target.closest('[data-v506-product-link]')",
  "history.pushState({apgDecisionV506:true}",
  'apgDecisionV506State',
  'decision_lab_timeout',
  'decision_lab_error',
  'decision_lab_success',
  'decision_lab_no_results',
  "examples.hidden=true",
  'hideLegacyOutcome(form)',
  'fetchOutcome(u,{form,push:false})'
])assert(runtime.clientJs.includes(contract),`missing Decision Lab v50.6 contract: ${contract}`);

for(const forbidden of [
  'location.assign(',
  'location.href=',
  'location.reload(',
  'window.stop(',
  'DOMParser(',
  'document.importNode(',
  'scrollIntoView(',
  'innerHTML=',
  'data-save-product',
  'data-compare-product'
])assert(!runtime.clientJs.includes(forbidden),`Decision Lab v50.6 must not use ${forbidden}`);
assert(!runtime.clientJs.includes("d.get('q')"),'technical telemetry must not copy the raw shopping brief');

// Product result navigation must have one owner: v50.6 stops later site-wide click
// handlers at capture phase but leaves the native anchor default untouched.
const productClickStart=runtime.clientJs.indexOf("event.target.closest('[data-v506-product-link]')");
assert(productClickStart>=0,'product-result capture isolation missing');
const productClickSlice=runtime.clientJs.slice(productClickStart,productClickStart+220);
assert(productClickSlice.includes('event.stopImmediatePropagation()'),'product result must stop later click handlers');
assert(!productClickSlice.includes('preventDefault'),'product result navigation must remain a single native anchor navigation');

const sample='<!doctype html><html><head><script src="/assets/decision-lab-resilience-v50.js?v=50.4" defer></script><script src="/assets/app.js" defer></script></head><body></body></html>';
const injected=runtime.inject(sample),v506=injected.indexOf('/assets/decision-lab-resilience-v506.js?v=50.6'),v504=injected.indexOf('/assets/decision-lab-resilience-v50.js?v=50.4'),app=injected.indexOf('/assets/app.js');
assert(v506>=0&&v504>=0&&v506<v504&&v504<app,'v50.6 must execute before v50.4 and app.js');
assert(injected.includes('/assets/decision-lab-resilience-v506.css?v=50.6'));

function jsonFor(url){let body='',status=0,headers={};const req={method:'GET'},res={setHeader:(k,v)=>{headers[k.toLowerCase()]=v},end:v=>{body=String(v||'')},set statusCode(v){status=v},get statusCode(){return status}};transport.sendDecisionJson(req,res,new URL(url,'https://australianproductguide.au'));assert.equal(status,200);assert(/application\/json/.test(headers['content-type']));return JSON.parse(body)}
for(const url of [
 '/decision-lab/?q=I%20want%20a%20TV%20under%20%242000&category=televisions&budget=2000',
 '/decision-lab/?category=air-fryers&budget=300',
 '/decision-lab/?brand=bose',
 '/decision-lab/?q=Headphones%20for%20commuting.&category=coffee-machines&brand=bose&budget=500',
 '/decision-lab/?q=I%20need%20a%20quiet%20garden%20shredder%20for%20branches'
]){const out=jsonFor(url);assert.equal(out.version,'decision-engine-v4');assert.equal(out.commercialRecommendationWeight,0);assert(Array.isArray(out.results))}
assert.equal(jsonFor('/decision-lab/?q=I%20need%20a%20quiet%20garden%20shredder%20for%20branches').results.length,0,'unsupported intent must not guess unrelated products');

const cases=[
 ['headphones','I need headphones for commuting.',{}],
 ['tv','I want a TV under $2,000.',{category:'televisions',budget:'2000'}],
 ['robot','Robot vacuum under $1,000 for pets.',{category:'robot-vacuums',budget:'1000'}],
 ['coffee','Easy coffee machine for flat whites.',{category:'coffee-machines',budget:'1300',brand:'breville'}],
 ['filter only','',{category:'air-fryers',budget:'300'}],
 ['brand only','',{brand:'bose'}],
 ['contradictory','Headphones for commuting.',{category:'coffee-machines',brand:'bose',budget:'500'}],
 ['impossible','75-inch TV for sport.',{category:'televisions',budget:'1'}],
 ['projector','Premium projector for a bright room.',{category:'projectors',budget:'100000'}],
 ['negative','Headphones for travel but not premium.',{category:'wireless-headphones',budget:'500'}],
 ['unicode','Quiet headphones for flights ✈️.',{category:'wireless-headphones',budget:'700'}],
 ['special','headphones & ANC $$$ under 500 😀',{budget:'500'}],
 ['laptop','Laptop for uni, long battery and video calls.',{category:'laptops',budget:'1800'}]
];
for(const [name,q,opts] of cases){const out=engine.publicDecision(q,opts);assert.equal(out.version,'decision-engine-v4',name);assert.equal(out.commercialRecommendationWeight,0,name);assert(Array.isArray(out.results)&&out.results.length>0,`${name}: controlled outcome missing`);for(const r of out.results)assert(r.url&&r.url.startsWith('/products/'),`${name}: canonical product route missing`)}

console.log(`Decision Lab v50.6 source QA passed above Search v52: adjacent results + isolated product navigation + v50.4 JSON transport + ${cases.length} supported combinations`);
