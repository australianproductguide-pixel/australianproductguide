'use strict';
const assert=require('assert');
const handler=require('../lib/action7-closure-v1016');

const target='/decision-lab/?q=headphones%20commuting%20comfort%20no%20Sony%20under%20%24500&category=wireless-headphones&budget=500';
function render(url,headers={}){
  let body='',status=200;const outHeaders={};
  const req={method:'GET',url,headers};
  const res={
    setHeader:(k,v)=>{outHeaders[String(k).toLowerCase()]=String(v)},
    getHeader:k=>outHeaders[String(k).toLowerCase()],
    removeHeader:k=>{delete outHeaders[String(k).toLowerCase()]},
    end:v=>{body=String(v||'')},
    write:v=>{body+=String(v||'')},
    set statusCode(v){status=v},get statusCode(){return status}
  };
  handler(req,res);
  return {body,status,headers:outHeaders};
}

const page=render(target);
assert.equal(page.status,200,'Decision Lab target must render HTTP 200');
assert(page.body.includes('Bose'),'Bose maintained candidate must render');
assert(!/Sony · Wireless headphones/.test(page.body),'hard Sony exclusion must survive rendered Decision Lab output');
assert(!page.body.includes('Comfort is not a documented fit signal'),'rendered Decision Lab must not contradict verified Action 4 comfort evidence');
assert(!page.body.includes('Comfort is not a documented match signal'),'legacy match-signal contradiction must not reappear');
assert(page.body.includes('Comfort is supported by documented decision evidence for this model'),'rendered result must explain verified comfort evidence');
assert(page.body.includes('data-action7-ask-scout'),'Decision Lab -> Scout handoff control must be rendered');
assert(page.body.includes('window.apgScout?.open()')&&page.body.includes("window.apgScout?.ask('Continue this Decision Lab decision: '+q)"),'handoff must open Scout and carry the resolved Decision Lab brief');
assert.equal(page.headers['x-apg-action7-scout-decision'],'v101.6','outer runtime header must remain authoritative');

const exact=/href="https:\/\/www\.amazon\.com\.au\/dp\/B0CCZ1HQ39\?tag=auproductguid-22"[\s\S]{0,500}>View on Amazon Australia/.test(page.body);
const fallback=/Search this model on Amazon Australia/.test(page.body);
const variant=/View available variant on Amazon Australia|View verified variant on Amazon Australia/.test(page.body);
assert(exact,'EXACT_VERIFIED wording/path must remain intact');
assert(fallback,'SEARCH_FALLBACK wording must remain intact');
assert(variant,'VARIANT_VERIFIED wording must remain distinct');

const cert=render('/api/intelligence/action7');
const snapshot=JSON.parse(cert.body);
assert.equal(snapshot.version,'101.6');
assert.equal(snapshot.scoutVersion,'scout-concierge-v5');
assert.equal(snapshot.decisionEngineVersion,'decision-engine-v4');
assert.equal(snapshot.closure.decisionLabRenderedEvidenceParity,true);
assert.equal(snapshot.closure.decisionLabCompleteResponseParity,true);
assert.equal(snapshot.closure.newRecurringPaidCostAUD,0);

console.log(JSON.stringify({version:'action7-decision-lab-render-v1016',status:'PASS',checks:{renderedComfortParity:true,sonyExclusion:true,scoutHandoffSource:true,retailerStateWording:true,authoritativeHeader:true,completeResponseParity:true,scoutPreserved:true,decisionEnginePreserved:true}},null,2));
