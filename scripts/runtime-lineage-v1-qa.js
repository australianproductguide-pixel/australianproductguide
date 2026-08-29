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
const premiumMobileDecisionCommerceWrapper=(api.match(/const premiumMobileDecisionCommerce=require\('([^']+)'\);/)||[])[1]||null;
const wholeSiteWrapper=(api.match(/const wholeSiteExperience=require\('([^']+)'\);/)||[])[1]||null;
const scoutNavigatorWrapper=(api.match(/const scoutNavigatorPresentation=require\('([^']+)'\);/)||[])[1]||null;
const auditIntegrationWrapper=(api.match(/const auditIntegration=require\('([^']+)'\);/)||[])[1]||null;

assert.equal(outerRuntime,'../lib/action5-catalogue-certification-v106-runtime','v106 must remain the canonical underlying Production runtime until an explicitly certified successor replaces it');
assert.equal(postLineageGuard,'../lib/hard-constraint-result-parity-v1','hard-constraint proof parity must be installed explicitly after the full re-ranking lineage');
assert.equal(transportGuard,'../lib/decision-transport-parity-v1-runtime','public decision JSON must resolve the shared engine through an explicit request-time transport guard');
assert.equal(scoutPatch,'../lib/scout-customer-intelligence-v6','Scout customer intelligence must remain an explicit post-lineage patch over the existing shared engine');
assert.equal(scoutResponsePatch,'../lib/scout-response-depth-v61','Scout response depth must remain a narrow conversational layer after Scout v6, not a second recommender');
assert.equal(premiumWrapper,'../lib/premium-experience-v107-runtime','premium UI must remain an explicit progressive-enhancement wrapper over the current SSR runtime');
assert.equal(journeyWrapper,'../lib/decision-journey-continuity-v108-runtime','decision journey continuity must remain a narrow SSR handoff layer without a new state store');
assert.equal(premiumClientStabilityWrapper,'../lib/premium-client-stability-v1091-runtime','v109.1 must remain a narrow client-stability guard, not another product or decision runtime');
assert.equal(premiumMobileDecisionCommerceWrapper,'../lib/premium-mobile-decision-commerce-v112-runtime','v112 must remain the approved narrow mobile decision-commerce presentation/evidence layer');
assert.equal(wholeSiteWrapper,'../lib/whole-site-experience-v109-runtime','whole-site experience must remain the final semantic presentation/communication wrapper rather than a second product or decision runtime');
assert.equal(scoutNavigatorWrapper,'../lib/scout-navigator-v7-global-runtime','Scout Navigator parity must remain a narrow final visual-cascade wrapper');
assert.equal(auditIntegrationWrapper,'../lib/audit-integration-v124-runtime','audit v124 must be one explicit governed integration boundary');
assert(api.includes('hardConstraintParity.install();'),'post-lineage hard-constraint parity must be explicitly installed');
assert(api.includes('scoutCustomerIntelligence.install();'),'Scout v6 must be explicitly installed after the authoritative runtime lineage');
assert(api.includes('scoutResponseDepth.install();'),'Scout response depth must install only after Scout v6');
assert(api.includes('auditIntegration.install();'),'audit integration must explicitly install its shared decision/context patches');
assert(api.indexOf('scoutCustomerIntelligence.install();')<api.indexOf('scoutResponseDepth.install();'),'Scout response depth must compose over the already-installed v6 intelligence layer');
assert(api.indexOf('scoutResponseDepth.install();')<api.indexOf('auditIntegration.install();'),'audit integration context guard must install after current Scout intelligence/depth layers');
assert(api.includes('const transportHandler=decisionTransportParity.wrap(runtime);'),'decision transport wrapper must delegate to v106 rather than replace its business logic');
assert(api.includes('const premiumHandler=premiumExperience.wrap(transportHandler);'),'premium experience must wrap the governed transport without replacing SSR/runtime logic');
assert(api.includes('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);'),'journey continuity must wrap the premium SSR response without replacing product/decision logic');
assert(api.includes('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);'),'v109.1 stability must guard only the premium client asset path without replacing the decision or product runtime');
assert(api.includes('const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler);'),'v112 must compose outside v109.1 and inside the established Whole-Site v109 boundary');
assert(api.includes('const handler=wholeSiteExperience.wrap(premiumMobileHandler);'),'whole-site experience must remain the final semantic HTML communication layer after v112');
assert(api.includes('const auditedHandler=auditIntegration.wrap(handler);'),'audit v124 must wrap the completed semantic handler before the final visual skin');
assert(api.includes('const finalHandler=scoutNavigatorPresentation.wrap(auditedHandler);'),'Navigator parity must wrap the audited semantic handler so its CSS remains final across route-specific delivery paths');
assert(api.indexOf('const premiumHandler=premiumExperience.wrap(transportHandler);')<api.indexOf('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);'),'v108 journey continuity must compose over v107 premium SSR');
assert(api.indexOf('const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);')<api.indexOf('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);'),'v109.1 client stability must compose outside v108 without altering its HTML decisions');
assert(api.indexOf('const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);')<api.indexOf('const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler);'),'v112 must compose outside the narrow v109.1 stability layer');
assert(api.indexOf('const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler);')<api.indexOf('const handler=wholeSiteExperience.wrap(premiumMobileHandler);'),'v109 whole-site presentation must remain the final semantic wrapper around v112');
assert(api.indexOf('const handler=wholeSiteExperience.wrap(premiumMobileHandler);')<api.indexOf('const auditedHandler=auditIntegration.wrap(handler);'),'audit integration may only compose after the semantic whole-site response is complete');
assert(api.indexOf('const auditedHandler=auditIntegration.wrap(handler);')<api.indexOf('const finalHandler=scoutNavigatorPresentation.wrap(auditedHandler);'),'Navigator parity must remain the final direct visual wrapper after audit transport/presentation guards');
assert(api.includes('module.exports=finalHandler;'),'governed composed handler plus narrow Navigator parity wrapper must be the public export');
assert(compatibility.length>=3,`expected documented compatibility anchors to remain visible; found ${compatibility.length}`);
assert(compatibility.includes('../lib/search-opportunity-depth-v104-runtime'));
assert(compatibility.includes('../lib/decision-hard-constraint-fallback-v1036'));
assert(compatibility.includes('../lib/apg-proof-rail-runtime-v103'));

const expectedSideEffects=['../lib/scout-concierge-v5-runtime','../lib/consumer-intelligence-v47-runtime','../lib/catalogue-decision-v48-runtime','../lib/brand-system-v46','../lib/consumer-intelligence-v47'];
assert.deepEqual(sideEffects,expectedSideEffects,'hidden/order-sensitive pre-runtime side-effect installers must remain explicitly inventoried until deliberately composed or removed with parity proof');

const responseSource=fs.readFileSync(path.join(root,'lib','scout-response-depth-v61.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight'])assert(!responseSource.includes(banned),`Scout response depth must not become a recommendation/commercial scoring layer: ${banned}`);
assert(responseSource.includes('commercialRecommendationWeight:0'),'Scout response depth must keep commercial recommendation weight explicitly zero');

const wholeSiteSource=fs.readFileSync(path.join(root,'lib','whole-site-experience-v109-runtime.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!wholeSiteSource.includes(banned),`whole-site experience must remain presentation/communication only: ${banned}`);
assert(wholeSiteSource.includes("const {categories,products}=require('../data');"),'canonical platform facts must be derived from the shared catalogue rather than copied marketing constants');

const v112Source=fs.readFileSync(path.join(root,'lib','premium-mobile-decision-commerce-v112-runtime.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!v112Source.includes(banned),`v112 must remain presentation/evidence only and must not score, rank or persist shopper state server-side: ${banned}`);
assert(v112Source.includes('Retailers contribute 0 recommendation points'),'v112 retailer presentation must preserve the zero-commercial-weight statement');
assert(v112Source.includes('Model-search fallback'),'v112 must preserve the transparent retailer fallback state');
assert(v112Source.includes('Verified variant'),'v112 must preserve verified-variant semantics');
assert(v112Source.includes('Exact verified destination'),'v112 must preserve exact verified destination semantics');

const navigatorSource=fs.readFileSync(path.join(root,'lib','scout-navigator-v7-global-runtime.js'),'utf8');
for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!navigatorSource.includes(banned),`Scout Navigator parity must remain presentation-only and must not score, rank or persist shopper state: ${banned}`);
assert(navigatorSource.includes("const CSS_PATH='/assets/scout-navigator-v7-global.css';"),'Navigator parity must be delivered through one explicit same-origin CSS asset');

const auditSource=fs.readFileSync(path.join(root,'lib','audit-integration-v124-runtime.js'),'utf8');
assert(auditSource.includes("require('./decision-audit-constraint-guard-v118')"),'audit integration must include the decision constraint guard');
assert(auditSource.includes("require('./scout-active-context-v120')"),'audit integration must include authoritative Scout context');
for(const banned of ['affiliateRecommendationWeight:1','commissionWeight'])assert(!auditSource.includes(banned),`audit integration must preserve commercial neutrality: ${banned}`);

const sourceGate=fs.readFileSync(path.join(root,'.github','workflows','source-qa.yml'),'utf8');
assert(sourceGate.includes('node scripts/premium-mobile-decision-commerce-v112-qa.js'),'v112 source certification must remain part of the PR release gate');

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
assert(deploy.includes('runtime-lineage-v1-qa.js'),'runtime lineage, including v112 placement and the v109.1 client stability guard, must itself remain a deploy gate');
assert(deploy.includes('scout-navigator-v7-global-qa.js'),'all-route Scout Navigator visual parity must be a deploy gate');

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
  premiumMobileDecisionCommerceWrapper,
  wholeSiteWrapper,
  auditIntegrationWrapper,
  scoutNavigatorWrapper,
  compatibilityLayerCount:compatibility.length,
  preRuntimeSideEffectInstallerCount:sideEffects.length,
  preRuntimeSideEffectInstallers:sideEffects,
  brandParityFirstGate:true,
  v112PresentationEvidenceOnly:true,
  wholeSitePresentationOnly:true,
  wholeSiteStillFinalSemanticLayer:true,
  auditIntegrationSingleBoundary:true,
  scoutNavigatorFinalVisualCascadeOnly:true,
  premiumClientAriaSyncIdempotent:true,
  premiumClientObserverFeedbackLoopAbsent:true,
  prohibitedFrameworksAbsent:true,
  policy:'Inventory before consolidation. v106 remains the underlying governed runtime; narrowly scoped request-time intelligence and SSR/progressive-enhancement experience wrappers may compose around it only with explicit regression gates. v112 is an evidence/merchandising layer inside the v109 semantic whole-site presentation boundary. Audit v124 may wrap that completed semantic response only as one governed remediation boundary. Scout Navigator v7.1 wraps the audited response as the final visual CSS-cascade parity control and cannot score, rank, route or store customer state.'
},null,2));