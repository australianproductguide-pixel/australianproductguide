'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const api=read('api/index.js');
const pkg=JSON.parse(read('package.json'));

function requiredPath(variable){
  const match=api.match(new RegExp('const '+variable+'=require\\(\\\'([^\\\']+)\\\'\\);'));
  return match?match[1]:null;
}
function assertOrdered(markers){
  let previous=-1;
  for(const marker of markers){
    const index=api.indexOf(marker);
    assert(index>previous,`runtime chain out of order or missing: ${marker}`);
    previous=index;
  }
}
function assertPresentationOnly(relative,bannedExtra=[]){
  const source=read(relative);
  const banned=[
    'scoreProduct(','rankDecision(','publicDecision(','affiliateRecommendationWeight:1',
    'commissionWeight','commercialRecommendationWeight:1',...bannedExtra
  ];
  for(const token of banned)assert(!source.includes(token),`${relative} must not contain ${token}`);
  return source;
}

const expectedModules={
  auditIntegration:'../lib/audit-integration-v124-runtime',
  runtime:'../lib/action5-catalogue-certification-v106-runtime',
  hardConstraintParity:'../lib/hard-constraint-result-parity-v1',
  decisionTransportParity:'../lib/decision-transport-parity-v1-runtime',
  scoutCustomerIntelligence:'../lib/scout-customer-intelligence-v6',
  scoutResponseDepth:'../lib/scout-response-depth-v61',
  premiumExperience:'../lib/premium-experience-v107-runtime',
  decisionJourneyContinuity:'../lib/decision-journey-continuity-v108-runtime',
  premiumClientStability:'../lib/premium-client-stability-v1091-runtime',
  premiumMobileDecisionCommerce:'../lib/premium-mobile-decision-commerce-v112-runtime',
  ebayEpnSurface:'../lib/ebay-epn-surface-v1-runtime',
  wholeSiteExperience:'../lib/whole-site-experience-v109-runtime',
  pagespeedAgenticCertification:'../lib/pagespeed-agentic-certification-v113-runtime',
  customerJourneyProgramme:'../lib/customer-journey-programme-v1144-runtime',
  faviconParity:'../lib/favicon-parity-v115-runtime',
  aboutTrustNavigation:'../lib/about-trust-navigation-v116-runtime',
  trustpilotFooter:'../lib/trustpilot-footer-v117-runtime',
  reviewProfiles:'../lib/review-profiles-v118-runtime',
  scoutNavigatorPresentation:'../lib/scout-navigator-v7-global-runtime',
  ebayProductImageContinuity:'../lib/ebay-product-image-continuity-v3-runtime',
  governedProductCardImagery:'../lib/governed-product-card-imagery-v1-runtime',
  searchProductImagery:'../lib/search-product-imagery-v1-runtime',
  categoryFeaturedImagery:'../lib/category-featured-product-imagery-v1-runtime',
  brandLogoStability:'../lib/brand-logo-stability-v125-runtime',
  desktopHomeHeader:'../lib/desktop-home-header-v126-runtime',
  desktopAboutTrustContrast:'../lib/desktop-about-trust-contrast-v127-runtime',
  googleDiscoverabilityPerformance:'../lib/google-discoverability-performance-v128-runtime'
};
for(const [variable,expected] of Object.entries(expectedModules)){
  assert.equal(requiredPath(variable),expected,`unexpected module for ${variable}`);
}

const sideEffects=[...api.matchAll(/^require\('([^']+)'\);$/gm)].map(match=>match[1]);
assert.deepEqual(sideEffects,[
  '../lib/scout-concierge-v5-runtime',
  '../lib/consumer-intelligence-v47-runtime',
  '../lib/catalogue-decision-v48-runtime',
  '../lib/brand-system-v46',
  '../lib/consumer-intelligence-v47'
]);

assertOrdered([
  'hardConstraintParity.install();',
  'scoutCustomerIntelligence.install();',
  'scoutResponseDepth.install();',
  'auditIntegration.install();',
  'ebayEpnSurface.install(premiumMobileDecisionCommerce);',
  'customerJourneyProgramme.install(wholeSiteExperience);',
  'faviconParity.install(wholeSiteExperience);',
  'aboutTrustNavigation.install(wholeSiteExperience);',
  'trustpilotFooter.install(wholeSiteExperience);'
]);

// Validate the current direct runtime chain rather than the superseded compatibility-comment
// model. The sequence is deliberately explicit so new wrappers cannot silently jump across the
// governed recommendation, audit, visual, safety or final-delivery boundaries.
assertOrdered([
  'const transportHandler=decisionTransportParity.wrap(runtime)',
  'const premiumHandler=premiumExperience.wrap(transportHandler)',
  'const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler)',
  'const stableJourneyHandler=premiumClientStability.wrap(journeyHandler)',
  'const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler)',
  'const handler=wholeSiteExperience.wrap(premiumMobileHandler)',
  'const auditedHandler=auditIntegration.wrap(handler)',
  'const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler)',
  'const searchImageHandler=searchProductImagery.wrap(routeScopedPresentationHandler)',
  'const categoryImageHandler=categoryFeaturedImagery.wrap(searchImageHandler)',
  'const pagespeedHandler=pagespeedAgenticCertification.wrap(categoryImageHandler)',
  'const reviewProfileHandler=reviewProfiles.wrap(pagespeedHandler)',
  'const finalHandler=brandLogoStability.wrap(reviewProfileHandler)',
  'const desktopHomeHeaderHandler=desktopHomeHeader.wrap(finalHandler)',
  'const desktopAboutTrustContrastHandler=desktopAboutTrustContrast.wrap(desktopHomeHeaderHandler)',
  'const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(desktopAboutTrustContrastHandler)',
  'module.exports=googleDiscoverabilityPerformanceHandler'
]);

for(const marker of [
  'APG_P0_HOME_ASSEMBLY_HANDLERS=p0HomeAssemblyHandlers',
  'APG_P0_HOME_ASSEMBLY_STAGE_NAMES=finalHandler.APG_P0_HOME_ASSEMBLY_STAGE_NAMES',
  'GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION=googleDiscoverabilityPerformance.VERSION'
])assert(api.includes(marker),`missing propagated runtime contract ${marker}`);

const responseSource=assertPresentationOnly('lib/scout-response-depth-v61.js');
assert(responseSource.includes('commercialRecommendationWeight:0'));
const wholeSiteSource=assertPresentationOnly('lib/whole-site-experience-v109-runtime.js',['localStorage.setItem(','sessionStorage.setItem(']);
assert(wholeSiteSource.includes("const {categories,products}=require('../data');"));
const v112Source=assertPresentationOnly('lib/premium-mobile-decision-commerce-v112-runtime.js',['localStorage.setItem(','sessionStorage.setItem(']);
for(const required of ['Retailers contribute 0 recommendation points','Model-search fallback','Verified variant','Exact verified destination'])assert(v112Source.includes(required));
const navigatorSource=assertPresentationOnly('lib/scout-navigator-v7-global-runtime.js',['localStorage.setItem(','sessionStorage.setItem(']);
assert(navigatorSource.includes("const CSS_PATH='/assets/scout-navigator-v7-global.css';"));
const pagespeedSource=assertPresentationOnly('lib/pagespeed-agentic-certification-v113-runtime.js',['localStorage.setItem(','sessionStorage.setItem(']);
assert(pagespeedSource.includes("const CSS_PATH='/assets/pagespeed-home-v113.css';"));
assert(pagespeedSource.includes("const RUNTIME_CSS_CONSOLIDATION='P0_DISABLED_RECURSIVE_CAPTURE';"),'recursive live-handler CSS capture must remain disabled');
const auditSource=read('lib/audit-integration-v124-runtime.js');
assert(auditSource.includes("require('./decision-audit-constraint-guard-v118')"));
assert(auditSource.includes("require('./scout-active-context-v120')"));
for(const token of ['affiliateRecommendationWeight:1','commissionWeight'])assert(!auditSource.includes(token));

for(const relative of [
  'lib/review-profiles-v118-runtime.js',
  'lib/brand-logo-stability-v125-runtime.js',
  'lib/desktop-home-header-v126-runtime.js',
  'lib/desktop-about-trust-contrast-v127-runtime.js'
])assertPresentationOnly(relative);

const googleSource=assertPresentationOnly('lib/google-discoverability-performance-v128-runtime.js',['localStorage.setItem(','sessionStorage.setItem(']);
for(const required of [
  "const VERSION='128.2'",
  "const LEGACY_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-80/'",
  "const CANONICAL_PRODUCT='/products/philips-5000-series-handheld-steamer-sth5030-20/'",
  "const LEGACY_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-80/'",
  "const CANONICAL_COMPARISON='/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-20/'",
  "res.setHeader('Cache-Control','public, max-age=31536000, immutable')",
  "return res.end(req&&req.method==='HEAD'?'':'Permanent redirect')"
])assert(googleSource.includes(required),`v128 final delivery contract missing ${required}`);
for(const prohibited of ['url.search','target+','Permanent redirect to'])assert(!googleSource.includes(prohibited),`v128 redirects must not reflect request data via ${prohibited}`);

const premiumStability=require(path.join(root,'lib','premium-client-stability-v1091-runtime.js'));
assert.equal(premiumStability.VERSION,'109.1');
assert(premiumStability.clientJs.includes("function setAria(el,name,value){const next=String(value);if(el.getAttribute(name)!==next)el.setAttribute(name,next)}"));
assert(premiumStability.clientJs.includes("attributeFilter:['hidden']"));
assert(!/attributeFilter:\[[^\]]*aria-expanded/.test(premiumStability.clientJs));
assert(!premiumStability.clientJs.includes(premiumStability.UNSAFE));

const sourceGate=read('.github/workflows/source-qa.yml');
assert(sourceGate.includes('npm run qa:full'),'source workflow must call the full source gate');
assert(sourceGate.includes('node scripts/premium-mobile-decision-commerce-v112-qa.js'));
const deploy=String(pkg.scripts&&pkg.scripts['qa:deploy']||'');
assert(deploy.startsWith('node scripts/brand-mark-canonical-parity-v91-qa.js'));
for(const required of [
  'platform-state-v1-qa.js','hard-constraint-verification-v1-qa.js','canonical-decision-state-v2-qa.js',
  'category-completion-gate-v1-qa.js','recommendation-trace-v1-qa.js','evidence-aware-confidence-v1-qa.js',
  'decision-transport-parity-v1-qa.js','scout-customer-intelligence-v6-qa.js','premium-experience-v107-qa.js',
  'whole-site-experience-v109-qa.js','decision-journey-continuity-v108-qa.js','runtime-lineage-v1-qa.js',
  'scout-navigator-v7-global-qa.js','google-discoverability-performance-v128-qa.js'
])assert(deploy.includes(required),`deploy gate missing ${required}`);
assert.equal(pkg.scripts['qa:full'],'npm run qa:deploy','full source gate must delegate to the authoritative deploy gate');

const deps=Object.keys(pkg.dependencies||{});
for(const framework of ['next','react','vue','@angular/core','svelte'])assert(!deps.includes(framework));

console.log(JSON.stringify({
  ok:true,
  underlyingRuntime:expectedModules.runtime,
  directWrapperCount:17,
  preRuntimeSideEffectInstallerCount:sideEffects.length,
  brandParityFirstGate:true,
  recommendationAndRetailerControlsPreserved:true,
  auditIntegrationSingleBoundary:true,
  routeScopedImageryExplicit:true,
  recursiveRuntimeCssCaptureDisabled:true,
  googleV128FinalDeliveryOnly:true,
  fullSourceGateRestored:true,
  prohibitedFrameworksAbsent:true,
  policy:'v106 remains the governed recommendation runtime; audit and decision state remain explicit; visual and route-scoped imagery layers remain presentation-only; PageSpeed v113 safety remains fail-closed; v128.2 is the final narrow canonicalisation/cache/viewport-delivery layer.'
},null,2));
