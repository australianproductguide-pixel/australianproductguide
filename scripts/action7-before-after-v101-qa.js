'use strict';

// Paired benchmark: capture the unchanged Scout v5 build function first, then load the
// Action 7 outer layer and run the same scenarios against both paths in one process.
const core=require('../lib/scout-concierge-v5-core');
const beforeBuild=core.buildResponse;
const action7=require('../lib/action7-scout-decision-v1014');
const afterBuild=action7.action7BuildResponse;

function invoke(build,text,state=null,references=[]){return build({text,decisionState:state,references,pageContext:{path:'/'},account:{authenticated:false}});}
function run(build,scenario){try{return {result:scenario.test(build)?'PASS':'FAIL',failure_reason:null};}catch(e){return {result:'FAIL',failure_reason:e.message};}}
const scenarios=[
  {id:'PAIR-01',category:'priority-follow-up',test(build){let r=invoke(build,'I need headphones for commuting.');r=invoke(build,'Comfort.',r.decisionState,r.references);return !!(r.decisionState&&r.decisionState.softPreferences&&r.decisionState.softPreferences.some(p=>p.tag==='comfort'));}},
  {id:'PAIR-02',category:'brand-exclusion',test(build){let r=invoke(build,'I need headphones for commuting.');r=invoke(build,'Nothing Sony.',r.decisionState,r.references);return !!(r.decisionState&&r.decisionState.hardConstraints&&r.decisionState.hardConstraints.excludedBrands.some(b=>/sony/i.test(b)));}},
  {id:'PAIR-03',category:'budget-ceiling',test(build){let r=invoke(build,'I need a laptop for uni.');r=invoke(build,'Under $1,500.',r.decisionState,r.references);return !!(r.decisionState&&r.decisionState.hardConstraints&&r.decisionState.hardConstraints.budgetCeiling===1500);}},
  {id:'PAIR-04',category:'changed-mind',test(build){let r=invoke(build,'I need headphones under $500, no Sony.');r=invoke(build,'Sony is okay after all.',r.decisionState,r.references);return !!(r.decisionState&&r.decisionState.hardConstraints&&!r.decisionState.hardConstraints.excludedBrands.some(b=>/sony/i.test(b)));}},
  {id:'PAIR-05',category:'hard-brand',test(build){let r=invoke(build,'I need a laptop.');r=invoke(build,'Samsung only.',r.decisionState,r.references);return !!(r.decisionState&&r.decisionState.hardConstraints&&Array.isArray(r.decisionState.hardConstraints.requiredBrands)&&r.decisionState.hardConstraints.requiredBrands.some(b=>/samsung/i.test(b)));}},
  {id:'PAIR-06',category:'schema-aware-question',test(build){const r=invoke(build,'I need headphones for commuting.');return !(r.products||[]).length&&/comfort|ANC|battery|travel/i.test(String(r.message||''));}},
  {id:'PAIR-07',category:'trace-explanation',test(build){let r=invoke(build,'I need headphones for long flights, comfort matters most.');r=invoke(build,'Why this one?',r.decisionState,r.references);return /same Decision Engine trace/i.test(String(r.message||''));}},
  {id:'PAIR-08',category:'decision-lab-handoff',test(build){let r=invoke(build,'I need headphones for commuting.');r=invoke(build,'Comfort.',r.decisionState,r.references);const a=(r.actions||[]).find(x=>/decision lab/i.test(String(x.label||'')));return !!(a&&/[?&](?:q|category)=/.test(String(a.url||'')));}}
];
const rows=scenarios.map(s=>{const before=run(beforeBuild,s),after=run(afterBuild,s);return {test_id:s.id,category:s.category,before:before.result,after:after.result,before_failure_reason:before.failure_reason,after_failure_reason:after.failure_reason};});
const beforePassed=rows.filter(r=>r.before==='PASS').length,afterPassed=rows.filter(r=>r.after==='PASS').length;
console.log(JSON.stringify({version:'action7-paired-before-after-v1',sameScenarios:true,tests:rows.length,before:{passed:beforePassed,failed:rows.length-beforePassed},after:{passed:afterPassed,failed:rows.length-afterPassed},rows},null,2));
if(afterPassed!==rows.length)process.exitCode=1;