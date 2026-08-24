'use strict';

const assert=require('assert');
const action7=require('../lib/action7-scout-decision-v1014');
const action4Runtime=require('../lib/action4-decision-evidence-v96');
const action4=require('../data/action4-decision-evidence-v96');
const {products}=require('../data');
const bySlug=new Map(products.map(p=>[p.slug,p]));
const rows=[];
function test(id,fn){try{fn();rows.push({test_id:id,result:'PASS'});}catch(e){rows.push({test_id:id,result:'FAIL',failure_reason:e.message});}}
function criterion(slug,key){return action4.categorySchemas[slug].criteria.find(c=>c.key===key);}
function traceFor(productSlug,category,key){const e=action4Runtime.action4ResolveEvidence(bySlug.get(productSlug),criterion(category,key));return {criteria:[{kind:'decision',requested:'highest',evidenceStatus:e.evidenceStatus,evidenceConfidence:e.confidence,explanationEligible:e.evidenceStatus==='VERIFIED',productValue:e.value,note:e.note}],conflicts:[]};}

test('A7-C01',()=>assert.strictEqual(action7.ACTION7_VERSION,'101.4'));
test('A7-C02',()=>{const s=action7.certificationSnapshot();assert.strictEqual(s.scoutVersion,'scout-concierge-v5');assert.strictEqual(s.decisionEngineVersion,'decision-engine-v4');assert.strictEqual(s.decisionLabVersion,'50.6');assert.strictEqual(s.evaluationFixtureCount,28);assert.deepStrictEqual(s.evidenceStates,['KNOWN','INFERRED','WEAK_EVIDENCE','UNAVAILABLE','CONFLICTING']);assert.strictEqual(s.cost.newRecurringPaidCostAUD,0);assert.strictEqual(s.governance.commercialRecommendationWeight,0);});
test('A7-C03',()=>{const t=traceFor('bose-quietcomfort-ultra-headphones','wireless-headphones','comfort');assert.strictEqual(action7.classifyTrace(t),'KNOWN');});
test('A7-C04',()=>{const t=traceFor('sony-wh-1000xm6','wireless-headphones','travel');assert.strictEqual(action7.classifyTrace(t),'INFERRED');});
test('A7-C05',()=>{const known=traceFor('bose-quietcomfort-ultra-headphones','wireless-headphones','comfort').criteria[0],unknown=traceFor('bose-quietcomfort-ultra-headphones','wireless-headphones','microphone-quality').criteria[0];assert.strictEqual(action7.classifyTrace({criteria:[known,unknown],conflicts:[]}),'WEAK_EVIDENCE');});
test('A7-C06',()=>{const t=traceFor('bose-quietcomfort-ultra-headphones','wireless-headphones','microphone-quality');assert.strictEqual(action7.classifyTrace(t),'UNAVAILABLE');});
test('A7-C07',()=>{const t=traceFor('sony-wh-1000xm6','wireless-headphones','comfort');assert.strictEqual(action7.classifyTrace(t),'CONFLICTING');});

const failed=rows.filter(r=>r.result==='FAIL');console.log(JSON.stringify({version:'action7-v1014-certification',tests:rows.length,passed:rows.length-failed.length,failed:failed.length,rows},null,2));if(failed.length)process.exitCode=1;