'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const api=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

const compatibility=[...api.matchAll(/Compatibility lineage: module\.exports=require\('([^']+)'\)/g)].map(m=>m[1]);
const sideEffects=[...api.matchAll(/^require\('([^']+)'\);$/gm)].map(m=>m[1]);
const exported=(api.match(/module\.exports=require\('([^']+)'\);\s*$/m)||[])[1]||null;

assert.equal(exported,'../lib/action5-catalogue-certification-v106-runtime','v106 must remain the canonical outer Production runtime until an explicitly certified successor replaces it');
assert(compatibility.length>=40,`expected the documented compatibility chain to remain visible for controlled consolidation; found ${compatibility.length}`);
assert(compatibility.includes('../lib/search-opportunity-depth-v104-runtime'));
assert(compatibility.includes('../lib/decision-hard-constraint-fallback-v1036'));
assert(compatibility.includes('../lib/action7-closure-v1016'));
assert(compatibility.includes('../lib/action4-final-v981'));
assert(compatibility.includes('../lib/brand-mark-canonical-parity-v91'));
assert(compatibility.includes('../lib/analytics-funnel-v79'));

const expectedSideEffects=['../lib/scout-concierge-v5-runtime','../lib/consumer-intelligence-v47-runtime','../lib/catalogue-decision-v48-runtime','../lib/brand-system-v46','../lib/consumer-intelligence-v47'];
assert.deepEqual(sideEffects,expectedSideEffects,'hidden/order-sensitive side-effect installers must remain explicitly inventoried until deliberately composed or removed with parity proof');

const deploy=String(pkg.scripts&&pkg.scripts['qa:deploy']||'');
assert(deploy.startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js'),'Brand Parity v91 must remain the first deploy gate');
assert(deploy.includes('platform-state-v1-qa.js'));
assert(deploy.includes('hard-constraint-verification-v1-qa.js'));
assert(deploy.includes('canonical-decision-state-v2-qa.js'));
assert(deploy.includes('category-completion-gate-v1-qa.js'));
assert(deploy.includes('recommendation-trace-v1-qa.js'));
assert(deploy.includes('evidence-aware-confidence-v1-qa.js'));

const deps=Object.keys(pkg.dependencies||{});
for(const framework of ['next','react','vue','@angular/core','svelte'])assert(!deps.includes(framework),`complexity guardrail: ${framework} must not be introduced without an approved architecture case`);

console.log(JSON.stringify({
  ok:true,
  outerRuntime:exported,
  compatibilityLayerCount:compatibility.length,
  sideEffectInstallerCount:sideEffects.length,
  sideEffectInstallers:sideEffects,
  brandParityFirstGate:true,
  prohibitedFrameworksAbsent:true,
  policy:'Inventory before consolidation. No wrapper or side-effect dependency is deleted without route/API/browser/SEO parity proof.'
},null,2));
