'use strict';

const assert=require('node:assert/strict');
const fs=require('fs');
const app=require('../api/index');
const layer=require('../lib/decision-hard-constraint-fallback-v1036');
const guard=require('../lib/decision-audit-constraint-guard-v118');
const {products}=require('../data');
const productBySlug=new Map(products.map(p=>[p.slug,p]));

function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=v;},
      getHeader(k){return headers[String(k).toLowerCase()];},
      removeHeader(k){delete headers[String(k).toLowerCase()];},
      write(){return true;},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject);}catch(error){reject(error);}
  });
}

(async()=>{
  assert.equal(layer.DECISION_HARD_CONSTRAINT_FALLBACK_VERSION,'103.6','remediation version drifted');
  assert.equal(guard.VERSION,'decision-audit-constraint-guard-v118','audit constraint guard version drifted');

  // Unit-level semantics: a verified conflict and an unverified hard requirement both
  // require explicit fallback when no eligible candidate exists. Unsupported-category
  // requests and ordinary no-hard-constraint states must not be mislabelled as fallback.
  const exactState={numericConstraints:[{key:'screen-size-inches',value:999,mode:'exact',hard:true}],hardConstraints:{requiredTags:[],excludedTags:[],excludedBrands:[],budgetCeiling:null}};
  assert.equal(layer.decisionHardConstraintFallbackState(exactState,0,false),true,'verified hard-constraint conflict must enter fallback');
  assert.equal(layer.decisionHardConstraintFallbackState({hardConstraints:{requiredTags:['usb-c']}},0,false),true,'unverified hard requirement must enter fallback');
  assert.equal(layer.decisionHardConstraintFallbackState({hardConstraints:{}},0,false),false,'ordinary zero-eligible state must not invent a hard-constraint fallback');
  assert.equal(layer.decisionHardConstraintFallbackState(exactState,0,true),false,'unsupported-category requests must not use maintained-category hard-constraint fallback');
  assert.equal(layer.decisionHardConstraintFallbackState(exactState,1,false),false,'a genuinely eligible product must suppress fallback');

  // Full public API through the current outer delivery chain must preserve the remediation.
  const exact75=await render('/api/decision?q=TV+must+be+exactly+75+inches&category=televisions');
  assert.equal(exact75.status,200,'exact 75-inch API status');
  assert.equal(exact75.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','remediation header missing through outer runtime');
  const exact=JSON.parse(exact75.body);
  assert.equal(exact.audit?.hardConstraintFallback,false,'valid exact 75-inch match must not enter fallback');
  assert(exact.audit?.eligibleCount>0,'valid exact 75-inch request must retain at least one eligible product');
  assert.equal(exact.results[0]?.hardConstraintStatus,'eligible','leading exact 75-inch result must remain eligible');
  assert.equal(exact.results[0]?.slug,'hisense-75u6sau-75-inch-u6s-uled-miniled-tv','known exact-size benchmark drifted');

  const impossible=await render('/api/decision?q=TV+must+be+exactly+999+inches&category=televisions');
  assert.equal(impossible.status,200,'999-inch API status');
  assert.equal(impossible.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','999-inch response must retain remediation header through the current chain');
  const decision=JSON.parse(impossible.body);
  assert.equal(decision.commercialRecommendationWeight,0,'commercial neutrality must remain zero');
  assert.equal(decision.audit?.eligibleCount,0,'999-inch request must have zero eligible products');
  assert.equal(decision.audit?.hardConstraintFallback,true,'999-inch verified conflict must explicitly enter fallback');
  const size=(decision.decisionState?.numericConstraints||[]).find(row=>row?.key==='screen-size-inches');
  assert(size,'governed screen-size constraint missing');
  assert.equal(size.mode,'exact');
  assert.equal(size.hard,true);
  assert.equal(size.value,999);
  assert(decision.results.length>0,'fallback must expose maintained alternatives rather than fabricate a match');
  assert(decision.results.every(row=>row.hardConstraintStatus==='ineligible'),'fallback alternatives must remain ineligible');
  assert(decision.results.every(row=>(row.hardFailures||[]).some(reason=>/screen size|999|inches/i.test(String(reason)))),'each fallback alternative must retain hard-conflict evidence');

  // 29–30 August 2026 live-audit regression: a normal "I need a 65-inch television"
  // request is an exact product-class requirement unless the shopper explicitly softens it.
  const audited65=JSON.parse((await render('/api/decision?q=I+need+a+65-inch+television&category=televisions')).body);
  const auditedSize=(audited65.decisionState?.numericConstraints||[]).find(row=>row?.key==='screen-size-inches');
  assert(auditedSize,'audited 65-inch requirement must be represented in Decision State');
  assert.equal(auditedSize.value,65,'audited screen-size value drifted');
  assert.equal(auditedSize.mode,'exact','explicit 65-inch request must not remain a soft target');
  assert.equal(auditedSize.hard,true,'explicit 65-inch request must be a hard requirement');
  assert(audited65.audit?.eligibleCount>0,'maintained 65-inch candidates should remain eligible');
  assert(audited65.results.every(row=>{
    const p=productBySlug.get(row.slug);if(!p||p.category!=='televisions')return false;
    const text=[p.name,p.model,...((p.specs)||[]).flat()].join(' ');
    const m=text.match(/(\d{2,3})\s*(?:-|\s)*(?:inch|inches)/i);
    return !m||Number(m[1])===65;
  }),'Decision Lab must not rank a verified non-65-inch television as satisfying the exact 65-inch request');

  // Explicit rejection of a complicated manual coffee workflow must never be reversed
  // into a positive Hands On preference.
  const coffee=JSON.parse((await render('/api/decision?q=I+want+a+coffee+machine+but+do+not+want+a+complicated+manual+coffee+workflow&category=coffee-machines')).body);
  assert((coffee.interpretation?.avoid||[]).includes('hands-on'),'manual workflow rejection must persist as an explicit exclusion');
  assert(!(coffee.interpretation?.priorities||[]).includes('hands-on'),'manual workflow rejection must not survive as a positive priority');
  assert(coffee.results.every(row=>{
    const p=productBySlug.get(row.slug);return !p||String(p.workflow||'').toLowerCase()!=='manual';
  }),'manual-workflow products must not be returned as viable recommendations after explicit rejection');

  const decisionLab=await render('/decision-lab/?q=TV+must+be+exactly+999+inches');
  assert.equal(decisionLab.status,200,'999-inch Decision Lab status');
  assert.equal(decisionLab.headers['x-apg-decision-hard-constraint-fallback'],'v103.6','Decision Lab must retain remediation header through the current chain');
  assert.match(decisionLab.body,/999/,'Decision Lab must retain the impossible requirement');
  assert.doesNotMatch(decisionLab.body,/>Best fit</,'fallback must never be presented as a best fit');

  // Source-level lineage: v103.6 remains directly beneath v104, while the public entry point
  // composes the governed v106 runtime, audit controls, presentation layers, the narrow v128
  // delivery finaliser and the Home-only v132 response-header budget. Do not mistake either
  // delivery wrapper for a new recommendation engine.
  const apiSource=fs.readFileSync(require.resolve('../api/index'),'utf8');
  const v104Source=fs.readFileSync(require.resolve('../lib/search-opportunity-depth-v104-runtime'),'utf8');
  const auditSource=fs.readFileSync(require.resolve('../lib/audit-integration-v124-runtime'),'utf8');
  assert(v104Source.includes("const downstream=require('./decision-hard-constraint-fallback-v1036')"),'v104 runtime must directly delegate to v103.6');
  assert(apiSource.includes("const runtime=require('../lib/action5-catalogue-certification-v106-runtime')"),'v106 must remain the governed recommendation runtime');
  assert(apiSource.includes("const auditIntegration=require('../lib/audit-integration-v124-runtime')"),'audited integration boundary must remain explicit');
  assert(auditSource.includes("require('./decision-audit-constraint-guard-v118')"),'audited constraint guard must install through the maintained integration layer');
  assert(apiSource.includes("const googleDiscoverabilityPerformance=require('../lib/google-discoverability-performance-v128-runtime')"),'v128 must remain a narrow explicit delivery finaliser');
  assert(apiSource.includes("const homeResponseHeaderBudget=require('../lib/home-response-header-budget-v132-runtime')"),'v132 must remain a narrow Home-only delivery control');
  assert(apiSource.includes('module.exports=homeResponseHeaderBudgetHandler'),'current public entry point must export the completed v132-wrapped chain');

  const pkg=require('../package.json');
  assert(pkg.scripts['qa:deploy'].startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js &&'),'v91 must remain first deploy gate');
  assert(pkg.scripts['qa:deploy'].includes('node scripts/decision-hard-constraint-fallback-v1036-qa.js'),'remediation must remain in deploy QA');
  assert.equal(pkg.scripts['qa:full'],'npm run qa:deploy','full source gate must delegate to the authoritative deploy gate');

  console.log('DECISION_HARD_CONSTRAINT_FALLBACK_V1036=PASS exact75=eligible exact999=fallback-ineligible audit65=exact manualCoffee=excluded lineage=v106->v104->v103.6 outer=v128+v132 commercialWeight=0');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
