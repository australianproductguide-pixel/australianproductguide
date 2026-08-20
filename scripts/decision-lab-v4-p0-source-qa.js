'use strict';
const assert=require('assert');
const runtime=require('../lib/decision-lab-resilience-v505-runtime');
const transport=require('../lib/decision-lab-resilience-v50-runtime');
const api=require('../api/index');
const engine=require('../lib/decision-engine-v4');

assert.equal(runtime.VERSION,'50.5');
assert.equal(runtime.PATCH,'decision-lab-p0-2026-08-20-ultralight-r5');
assert.equal(runtime.ENGINE,'decision-engine-v4');
assert.equal(transport.VERSION,'50.4','v50.4 must remain the isolated Decision JSON transport');
assert.equal(api.VERSION,'52.0','Search v52 must remain the outer P0 contract');
assert.equal(api.DECISION_VERSION,'50.5');
assert.equal(api.DECISION_PATCH,runtime.PATCH);
new Function(runtime.clientJs);

for(const contract of [
 "window.__APG_DECISION_LAB_RESILIENCE_V505__",
 "window.__APG_DECISION_LAB_RESILIENCE_V50__='decision-lab-p0-2026-08-20-ultralight-r5'",
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
 'main.append(root)',
 'data-v505-save',
 'data-v505-compare',
 'history.pushState',
 'apgDecisionV505State'
])assert(runtime.clientJs.includes(contract),`missing Decision Lab v50.5 contract: ${contract}`);
for(const forbidden of ['location.assign(','window.stop(','DOMParser(','document.importNode(','scrollIntoView(','innerHTML=','data-save-product','data-compare-product'])assert(!runtime.clientJs.includes(forbidden),`Decision Lab v50.5 must not use ${forbidden}`);

const sample='<!doctype html><html><head><script src="/assets/decision-lab-resilience-v50.js?v=50.4" defer></script><script src="/assets/app.js" defer></script></head><body></body></html>';
const injected=runtime.inject(sample),v505=injected.indexOf('/assets/decision-lab-resilience-v505.js?v=50.5'),v504=injected.indexOf('/assets/decision-lab-resilience-v50.js?v=50.4'),app=injected.indexOf('/assets/app.js');
assert(v505>=0&&v504>=0&&v505<v504&&v504<app,'v50.5 must suppress v50.4 client by executing before it');
assert(injected.includes('/assets/decision-lab-resilience-v505.css?v=50.5'));

function jsonFor(url){let body='',status=0,headers={};const req={method:'GET'},res={setHeader:(k,v)=>{headers[k.toLowerCase()]=v},end:v=>{body=String(v||'')},set statusCode(v){status=v},get statusCode(){return status}};transport.sendDecisionJson(req,res,new URL(url,'https://australianproductguide.au'));assert.equal(status,200);assert(/application\/json/.test(headers['content-type']));return JSON.parse(body)}
for(const url of [
 '/decision-lab/?q=I%20want%20a%20TV%20under%20%242000&category=televisions&budget=2000',
 '/decision-lab/?category=air-fryers&budget=300',
 '/decision-lab/?brand=bose',
 '/decision-lab/?q=Headphones%20for%20commuting.&category=coffee-machines&brand=bose&budget=500',
 '/decision-lab/?q=I%20need%20a%20quiet%20garden%20shredder%20for%20branches'
]){const out=jsonFor(url);assert.equal(out.version,'decision-engine-v4');assert.equal(out.commercialRecommendationWeight,0);assert(Array.isArray(out.results))}
assert.equal(jsonFor('/decision-lab/?q=I%20need%20a%20quiet%20garden%20shredder%20for%20branches').results.length,0);

const cases=[
 ['headphones','I need headphones for commuting.',{}],['tv','I want a TV under $2,000.',{category:'televisions',budget:'2000'}],['robot','Robot vacuum under $1,000 for pets.',{category:'robot-vacuums',budget:'1000'}],['coffee','Easy coffee machine for flat whites.',{category:'coffee-machines',budget:'1300',brand:'breville'}],['filter only','',{category:'air-fryers',budget:'300'}],['brand only','',{brand:'bose'}],['contradictory','Headphones for commuting.',{category:'coffee-machines',brand:'bose',budget:'500'}],['impossible','75-inch TV for sport.',{category:'televisions',budget:'1'}],['projector','Premium projector for a bright room.',{category:'projectors',budget:'100000'}],['negative','Headphones for travel but not premium.',{category:'wireless-headphones',budget:'500'}],['unicode','Quiet headphones for flights ✈️.',{category:'wireless-headphones',budget:'700'}],['special','headphones & ANC $$$ under 500 😀',{budget:'500'}],['laptop','Laptop for uni, long battery and video calls.',{category:'laptops',budget:'1800'}]
];
for(const [name,q,opts] of cases){const out=engine.publicDecision(q,opts);assert.equal(out.version,'decision-engine-v4',name);assert.equal(out.commercialRecommendationWeight,0,name);assert(Array.isArray(out.results)&&out.results.length>0,`${name}: controlled outcome missing`)}
console.log(`Decision Lab v50.5 source QA passed: v50.4 JSON transport + DOM-only renderer + ${cases.length} supported combinations`);
