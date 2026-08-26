'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const api=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

const compatibility=[...api.matchAll(/Compatibility lineage: module\.exports=require\('([^']+)'\)/g)].map(m=>m[1]);
const sideEffects=[...api.matchAll(/^require\('([^']+)'\);$/gm)].map(m=>m[1]);
const outerRuntime=(api.match(/const runtime=require\('([^']+)'\);/)||[])[1]||null;
const postLineageGuard=(api.match(/const hardConstraintParity=require\('([^']+)'\);/)||[])[1]||null;
const transportGuard=(api.match(/const decisionTransportParity=require\('([^']+)'\);/)||[])[1]||null;
const scoutPatch=(api.match(/const scoutCustomerIntelligence=require\('([^']+)'\);/)||[])[1]||null;
const scoutResponsePatch=(api.match(/const scoutResponseDepth=require\('([^']+)'\);/)||[])[1]||null;
const premiumWrapper=(api.match(/const premiumExperience=require\('([^']+)'\);/)||[])[1]||null;
const journeyWrapper=(api.match(/const decisionJourneyContinuity=require\('([^']+)'\);/)||[])[1]||null;
const premiumClientStabilityWrapper=(api.match(/const premiumClientStability=require\('([^']+)'\);/)||[])[1]||null;
const wholeSiteWrapper=(api.match(/const wholeSiteExperience=require\('([^']+)'\);/)||[])[1]||null;

assert.equal(outerRuntime,'../lib/action5-catalogue-certification-v106-runtime','v106 must remain the canonical underlying Production runtime until an explicitly certified successor replaces it');
assert.equal(postLineageGuard,'../lib/hard-constraint-result-parity-v1','hard-constraint proof parity must be installed explicitly after the full re-ranking lineage');
assert.equal(transportGuard,'../lib/decision-transport-parity-v1-runtime','public decision JSON must resolve the shared engine through an explicit request-time transport guard');
assert.equal(scoutPatch,'../lib/scout-customer-intelligence-v6','Scout customer intelligence must remain an explicit post-lineage patch over the existing shared engine');
assert.equal(scoutResponsePatch,'../lib/scout-response-depth-v61','Scout response depth must remain a narrow conversational layer after Scout v6, not a second recommender');
assert.equal(premiumWrapper,'../lib/premium-experience-v107-runtime','premium UI must remain an explicit progressive-enhancement wrapper over the current SSR runtime');
assert.equal(journeyWrapper,'../lib/decision-journey-continuity-v108-runtime','decision journey continuity must remain a narrow SSR handoff layer without a new state store');
assert.equal(premiumClientStabilityWrapper,'../lib/premium-client-stability-v1091-runtime','v109.1 must remain a narrow client-stability guard, not another product or decision runtime');
assert.equal(wholeSiteWrapper,'../lib/whole-site-experience-v109-runtime','whole-site experience must remain a presentation/communication wrapper rather than a second product or decision runtime');
assert(api.includes('hardConstraintParity.install();'),'post-lineage hard-constraint parity must be explicitly installed');
assert(api.includes('scoutCustomerIntelligence.install();'),'Scout v6 must be explicitly installed after the authoritative runtime lineage');
assert(api.includes('scoutResponseDepth.install();'),'Scout response depth must install only after Scout v6');
assert(api.indexOf('scoutCustomerIntelligence.install();')<api.indexOf('scoutResponseDepth.install();'),'Scout response depth must compose over the already-installed v6 intelligence layer');
assert(api.includes('const transportHandler=decisionTransportParity.wrap(runtime);'),'decision transport wrapper must delegate to v106 rather than replace its business logic');
assert(api.includes('const premiumHandler=premiumExperience.wrap(transportHandler);'),'premium experience must wrap the governed transport without replacing SSR/runtime logic');
assert(api.includes('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);'),'journey continuity must wrap the premium SSR response without replacing product/decision logic');
assert(api.includes('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);'),'v109.1 stability must guard only the premium client asset path without replacing the decision or product runtime');
assert(api.includes('const handler=wholeSiteExperience.wrap(stableJourneyHandler);'),'whole-site experience must remain the final outer HTML communication layer after the narrow v109.1 stability guard');
assert(api.indexOf('const premiumHandler=premiumExperience.wrap(transportHandler);')<api.indexOf('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);'),'v108 journey continuity must compose over v107 premium SSR');
assert(api.indexOf('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);')<api.indexOf('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);'),'v109.1 client stability must compose outside v108 without altering its HTML decisions');
assert(api.indexOf('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);')<api.indexOf('const handler=wholeSiteExperience.wrap(stableJourneyHandler);'),'v109 whole-site presentation must remain outermost');
assert(api.includes('module.exports=handler;'),'governed composed handler must be the public export');
assert(compatibility.length>=40,`expected the documented compatibility chain to remain visible for controlled consolidation; found ${compatibility.length}`);
assert(compatibility.includes('../lib/search-opportunity-depth-v104-runtime'));
assert(compatibility.includes('../lib/decision-hard-constraint-fallback-v1036'));
assert(compatibility.includes('../lib/action7-closure-v1016'));
assert(compatibility.includes('../lib/action4-final-v981'));
assert(compatibility.includes('../lib/brand-mark-canonical-parity-v91'));
assert(compatibility.includes('../lib/analytics-funnel-v79'));

const expectedSideEffects=['../lib/scout-concierge-v5-runtime','../lib/consumer-intelligence-v47-runtime','../lib/catalogue-decision-v48-runtime','../lib/brand-system-v46','../lib/consumer-intelligence-v47'];
assert.deepEqual(sideEffects,expectedSideEffects,'hidden/order-sensitive pre-runtime side-effect installers must remain explicitly inventoried until deliberately composed or removed with parity proof');

const responseSource=fs.readFileSync(path.join(root,'lib','scout-response-depth-v61.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight'])assert(!responseSource.includes(banned),`Scout response depth must not become a recommendation/commercial scoring layer: ${banned}`);
assert(responseSource.includes('commercialRecommendationWeight:0'),'Scout response depth must keep commercial recommendation weight explicitly zero');

const wholeSiteSource=fs.readFileSync(path.join(root,'lib','whole-site-experience-v109-runtime.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!wholeSiteSource.includes(banned),`whole-site experience must remain presentation/communication only: ${banned}`);
assert(wholeSiteSource.includes("const {categories,products}=require('../data');"),'canonical platform facts must be derived from the shared catalogue rather than copied marketing constants');

const premiumStability=require(path.join(root,'lib','premium-client-stability-v1091-runtime.js'));
assert.equal(premiumStability.VERSION,'109.1');
assert(premiumStability.clientJs.includes("function setAria(el,name,value){const next=String(value);if(el.getAttribute(name)!==next)el.setAttribute(name,next)}"),'Premium v107 must own idempotent Scout ARIA writes directly');
assert(premiumStability.clientJs.includes("attributeFilter:['hidden']"),'Premium observer must react to Scout hidden state without observing the ARIA attribute it synchronises');
assert(!/attributeFilter:\[[^\]]*aria-expanded/.test(premiumStability.clientJs),'served premium client must not observe aria-expanded and write it from the same observer callback');
assert(!premiumStability.clientJs.includes(premiumStability.UNSAFE),'served premium client must not retain the superseded non-idempotent Scout ARIA sync');
const premiumStabilitySource=fs.readFileSync(path.join(root,'lib','premium-client-stability-v1091-runtime.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!premiumStabilitySource.includes(banned),`premium client stability must remain an asset-only compatibility guard: ${banned}`);

const deploy=String(pkg.scripts&&pkg.scripts['qa:deploy']||'');
assert(deploy.startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js'),'Brand Parity v91 must remain the first deploy gate');
assert(deploy.includes('platform-state-v1-qa.js'));
assert(deploy.includes('hard-constraint-verification-v1-qa.js'));
assert(deploy.includes('canonical-decision-state-v2-qa.js'));
assert(deploy.includes('category-completion-gate-v1-qa.js'));
assert(deploy.includes('recommendation-trace-v1-qa.js'));
assert(deploy.includes('evidence-aware-confidence-v1-qa.js'));
assert(deploy.includes('decision-transport-parity-v1-qa.js'),'decision transport parity must be a deploy gate');
assert(deploy.includes('scout-customer-intelligence-v6-qa.js'),'Scout v6/customer-response depth must be a deploy gate');
assert(deploy.includes('premium-experience-v107-qa.js'),'premium mobile/global Scout experience must be a deploy gate');
assert(deploy.includes('whole-site-experience-v109-qa.js'),'whole-site professionalisation and communication parity must be a deploy gate');
assert(deploy.includes('decision-journey-continuity-v108-qa.js'),'connected Search/Scout/Decision Lab/Compare journey continuity must be a deploy gate');
assert(deploy.includes('runtime-lineage-v1-qa.js'),'runtime lineage, including the v109.1 client stability guard, must itself remain a deploy gate');

const deps=Object.keys(pkg.dependencies||{});
for(const framework of ['next','react','vue','@angular/core','svelte'])assert(!deps.includes(framework),`complexity guardrail: ${framework} must not be introduced without an approved architecture case`);

console.log(JSON.stringify({
  ok:true,
  underlyingRuntime:outerRuntime,
  postLineageGuard,
  transportGuard,
  scoutPatch,
  scoutResponsePatch,
  premiumWrapper,
  journeyWrapper,
  premiumClientStabilityWrapper,
  wholeSiteWrapper,
  compatibilityLayerCount:compatibility.length,
  preRuntimeSideEffectInstallerCount:sideEffects.length,
  preRuntimeSideEffectInstallers:sideEffects,
  brandParityFirstGate:true,
  wholeSitePresentationOnly:true,
  premiumClientAriaSyncIdempotent:true,
  premiumClientObserverFeedbackLoopAbsent:true,
  prohibitedFrameworksAbsent:true,
  policy:'Inventory before consolidation. v106 remains the underlying governed runtime; narrowly scoped request-time intelligence and SSR/progressive-enhancement experience wrappers may compose around it only with explicit regression gates. v109 remains outer presentation/communication. Premium v107 owns the safe Scout ARIA implementation directly; v109.1 fail-closed verifies and serves that safe asset without scoring, routing or storing customer state. No compatibility layer is deleted without route/API/browser/SEO parity proof.'
},null,2));