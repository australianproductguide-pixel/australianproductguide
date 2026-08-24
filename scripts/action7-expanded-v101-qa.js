'use strict';

const assert=require('assert');
const action7=require('../lib/action7-scout-decision-v1014');
const core=require('../lib/scout-concierge-v5-core');
const engine=require('../lib/catalogue-decision-v48-runtime').engine;
const action4Runtime=require('../lib/action4-decision-evidence-v96');
const action4=require('../data/action4-decision-evidence-v96');
const fixtures=require('../data/action7-scout-evaluation-v101');
const {products}=require('../data');
const bySlug=new Map(products.map(p=>[p.slug,p]));
const rows=[];
function ask(text,state=null,references=[],account={authenticated:false}){return action7.action7BuildResponse({text,decisionState:state,references,pageContext:{path:'/'},account});}
function test(id,category,fn){try{fn();rows.push({test_id:id,category,result:'PASS'});}catch(e){rows.push({test_id:id,category,result:'FAIL',failure_reason:e.message});}}
const requiredFields=['test_id','category','initial_request','follow_up_1','follow_up_2','expected_hard_constraints','expected_soft_preferences','expected_exclusions','expected_behaviour','expected_actions','evidence_requirement'];

test('A7-X01','fixture-schema',()=>{assert(fixtures.scenarios.length>=28);for(const s of fixtures.scenarios)for(const key of requiredFields)assert(Object.prototype.hasOwnProperty.call(s,key),`${s.test_id} missing ${key}`);});
test('A7-X02','fixture-coverage',()=>{const c=new Set(fixtures.scenarios.map(s=>s.category));for(const key of ['budget','brand-exclusion','brand-preference','use-case','physical-constraint','compatibility','comfort-priority','ambiguous-product','exact-product','comparison','follow-up','changed-mind','poor-evidence','conflicting-evidence','apg-question','methodology-question','affiliate-question','social-question','account-logged-out','account-logged-in','save-action','retailer-fallback','retailer-exact','retailer-variant','adversarial','cross-surface-parity'])assert(c.has(key),`missing fixture ${key}`);});
test('A7-X03','physical-hard-constraint',()=>{const r=action7.reconcileState(null,'I need a TV that must be exactly 65 inches.',{});assert.strictEqual(r.category,'televisions');const n=r.numericConstraints||[];assert(n.some(x=>x.key==='screen-size-inches'&&x.value===65&&x.hard));});
test('A7-X04','compatibility-hard-constraint',()=>{const r=ask('I need a monitor that must have USB-C.');assert(r.decisionState);assert((r.decisionState.hardConstraints.requiredTags||[]).includes('usb-c'));});
test('A7-X05','ambiguous-product',()=>{const r=ask('Samsung.');assert(!((r.products||[]).length===1&&r.intent==='product_question'),'ambiguous brand must not silently resolve to one random product');});
test('A7-X06','exact-product',()=>{const r=ask('Tell me about the Sony WH-1000XM6.');assert((r.products||[]).some(p=>p.slug==='sony-wh-1000xm6'));});
test('A7-X07','conflicting-evidence',()=>{const p=bySlug.get('sony-wh-1000xm6'),criterion=action4.categorySchemas['wireless-headphones'].criteria.find(c=>c.key==='comfort');const e=action4Runtime.action4ResolveEvidence(p,criterion);assert.strictEqual(e.confidence,'medium');assert(/differ|conflict/i.test(String(e.note||'')));});
test('A7-X08','poor-evidence',()=>{const p=bySlug.get('sony-wh-1000xm6'),criterion=action4.categorySchemas['wireless-headphones'].criteria.find(c=>c.key==='microphone-quality');const e=action4Runtime.action4ResolveEvidence(p,criterion);assert(e.evidenceStatus!=='VERIFIED'||e.confidence==='unknown');});
test('A7-X09','account-logged-out',()=>{const r=ask('Show me my saved products.');assert(/sign in|signed in|account/i.test(r.message));assert((r.actions||[]).some(a=>/sign in|my apg/i.test(a.label)));});
test('A7-X10','cross-surface-parity',()=>{let r=ask('I need headphones for commuting.');r=ask('Comfort.',r.decisionState,r.references);r=ask('Nothing Sony.',r.decisionState,r.references);r=ask('Under $500.',r.decisionState,r.references);const dl=(r.actions||[]).find(a=>/decision lab/i.test(a.label));assert(dl);const u=new URL(dl.url,'https://australianproductguide.au'),q=u.searchParams.get('q');assert(q);const d=engine.publicDecision(q,{category:'wireless-headphones'});const scout=(r.references||[]).slice(0,3),lab=(d.results||[]).filter(x=>x.hardConstraintStatus!=='ineligible').slice(0,3).map(x=>x.slug);assert(scout.length&&lab.length);assert.strictEqual(scout[0],lab[0]);assert(!lab.some(slug=>/sony/i.test(bySlug.get(slug)?.brand||'')));});
test('A7-X11','retailer-zero-weight',()=>{const r=engine.publicDecision('headphones commuting comfort',{category:'wireless-headphones'});assert.strictEqual(r.commercialRecommendationWeight,0);});
test('A7-X12','state-pruning',()=>{const huge={category:'wireless-headphones',shortlist:Array(40).fill('sony-wh-1000xm6'),rejectedProducts:Array(40).fill('bose-quietcomfort-ultra-headphones'),evidenceGaps:Array(40).fill('gap')};const r=action7.reconcileState(huge,'Under $500.',{});assert((r.shortlist||[]).length<=5);assert((r.rejectedProducts||[]).length<=12);assert((r.evidenceGaps||[]).length<=12);});

const failed=rows.filter(r=>r.result==='FAIL');
console.log(JSON.stringify({version:'action7-expanded-eval-v1',tests:rows.length,passed:rows.length-failed.length,failed:failed.length,rows},null,2));
if(failed.length)process.exitCode=1;