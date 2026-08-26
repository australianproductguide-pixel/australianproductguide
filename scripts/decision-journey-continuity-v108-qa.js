'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=require('../api/index');
const journey=require('../lib/decision-journey-continuity-v108-runtime');

function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au','x-forwarded-proto':'https'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},
      getHeader(k){return headers[String(k).toLowerCase()]},
      removeHeader(k){delete headers[String(k).toLowerCase()]},
      write(){return true},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')})}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}
function count(text,needle){return String(text).split(needle).length-1;}

(async()=>{
  assert.equal(app.DECISION_JOURNEY_CONTINUITY_VERSION,journey.VERSION,'outer runtime must expose journey continuity version');
  assert.match(journey.css,/min-height:44px/,'journey actions must meet practical mobile touch-target height');
  assert.match(journey.css,/@media\(max-width:760px\)/,'journey rail must have an explicit mobile layout');
  assert.match(journey.css,/@media\(max-width:380px\)/,'journey rail must adapt for older narrow phones');

  const searchQuery='quiet headphones for long flights under $500';
  const search=await render('/search/?q='+encodeURIComponent(searchQuery));
  assert.equal(search.status,200);
  assert.equal(search.headers['x-apg-decision-journey'],'v'+journey.VERSION);
  assert.equal(count(search.body,'data-apg-journey-continuity='),1,'Search must receive exactly one continuity rail');
  assert(search.body.includes('/decision-lab/?q='+encodeURIComponent(searchQuery).replace(/&/g,'&amp;')),'Search must carry the same customer query into Decision Lab');
  assert(search.body.includes('data-v26-scout-open'),'Search continuity rail must offer Scout without creating another chat client');
  assert(search.body.includes('/compare/'),'Search continuity rail must expose Compare');

  const category=await render('/categories/wireless-headphones/');
  assert.equal(category.status,200);
  assert(category.body.includes('/decision-lab/?category=wireless-headphones'),'category must carry category context into Decision Lab');
  assert(category.body.includes('/compare/wireless-headphones/'),'category must connect directly to its comparison hub');

  const product=await render('/products/bose-quietcomfort-ultra-headphones/');
  assert.equal(product.status,200);
  assert(product.body.includes('data-compare-product="bose-quietcomfort-ultra-headphones"'),'product rail must reuse the canonical compare-state control');
  assert(product.body.includes('/decision-lab/?category=wireless-headphones'),'product rail must carry category context into Decision Lab');
  assert(product.body.includes('Ask Scout about this product'),'product rail must connect to the global page-aware Scout');

  const compare=await render('/compare/custom/?products=bose-quietcomfort-ultra-headphones,sony-wh-1000xm6');
  assert.equal(compare.status,200);
  assert(compare.body.includes('/decision-lab/?category=wireless-headphones'),'same-category custom comparison must carry category context into Decision Lab');
  assert(compare.body.includes('Ask Scout about this comparison'),'comparison must connect to page-aware Scout');
  assert(compare.body.includes('/my-apg/'),'comparison must connect to the existing workspace rather than a new state store');

  const lab=await render('/decision-lab/?q='+encodeURIComponent(searchQuery)+'&category=wireless-headphones');
  assert.equal(lab.status,200);
  assert(lab.body.includes('Ask Scout to explain this'),'Decision Lab result must offer conversational explanation');
  assert(lab.body.includes('/compare/'),'Decision Lab continuity rail must expose Compare');
  assert(lab.body.includes('/my-apg/'),'Decision Lab continuity rail must expose My APG');

  for(const response of [search,category,product,compare,lab]){
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,'connected journey must retain exactly one global Scout launcher');
    assert(response.body.includes(journey.CSS_PATH),'connected journey must load one governed SSR continuity stylesheet');
  }

  const trust=await render('/methodology/');
  assert.equal(count(trust.body,'data-apg-journey-continuity='),0,'trust pages must stay focused and not receive a commerce journey rail');
  assert.equal(count(trust.body,'id="apgAssistantLauncher"'),1,'Scout must still remain globally available on trust pages');

  const source=fs.readFileSync(require.resolve('../lib/decision-journey-continuity-v108-runtime'),'utf8');
  for(const forbidden of ['localStorage','sessionStorage','history.pushState','location.assign','location.replace'])assert(!source.includes(forbidden),`journey continuity must not create another client state/router mechanism: ${forbidden}`);
  assert(!source.includes('decision.publicDecision'),'journey continuity must never become another recommendation/scoring layer');

  console.log(JSON.stringify({version:journey.VERSION,status:'PASS',checks:{searchToDecisionLab:true,categoryToDecisionLabAndCompare:true,productToScoutCompareAndDecisionLab:true,compareToScoutDecisionLabAndWorkspace:true,decisionLabToScoutCompareWorkspace:true,globalScoutSingleInstance:true,ssrNoNewStateStore:true,mobileTouchTargets:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
