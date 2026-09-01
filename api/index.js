// APG Amazon Australia Catalogue Certification v106.0 is the authoritative outermost
// retailer-certification control. It preserves Search Opportunity Depth v104 and the full
// runtime lineage while applying the owner's stricter 25 August 2026 Action 5 completion gate.
// Compatibility lineage: module.exports=require('../lib/search-opportunity-depth-v104-runtime');
// Compatibility lineage: module.exports=require('../lib/decision-hard-constraint-fallback-v1036');
// Compatibility lineage: module.exports=require('../lib/apg-proof-rail-runtime-v103');
// Compatibility lineage: module.exports=require('../lib/buying-guide-theme-alignment-v102');
// Compatibility lineage: module.exports=require('../lib/action7-closure-v1016')
// Compatibility lineage: module.exports=require('../lib/action7-closure-v1015')
// Compatibility lineage: module.exports=require('../lib/action7-scout-decision-v1014')
// Compatibility lineage: module.exports=require('../lib/action7-scout-decision-v1013')
// Compatibility lineage: module.exports=require('../lib/action7-scout-decision-v1012')
// Compatibility lineage: module.exports=require('../lib/action7-scout-decision-v1011')
// Compatibility lineage: module.exports=require('../lib/action7-scout-decision-v101')
// Compatibility lineage: module.exports=require('../lib/action5-recall-surface-v1002')
// Compatibility lineage: module.exports=require('../lib/action5-demand-ranking-v1001')
// Compatibility lineage: module.exports=require('../lib/action5-strategic-closure-v100')
// Compatibility lineage: module.exports=require('../lib/action5-retailer-integrity-v99')
// Compatibility lineage: module.exports=require('../lib/action4-final-v981')
// Compatibility lineage: module.exports=require('../lib/action4-closure-v971')
// Compatibility lineage: module.exports=require('../lib/action4-closure-v97')
// Compatibility lineage: module.exports=require('../lib/action4-decision-evidence-v96')
// Compatibility lineage: module.exports=require('../lib/legacy-account-sync-mobile-alignment-v95')
// Compatibility lineage: module.exports=require('../lib/mobile-account-footer-polish-v94')
// Compatibility lineage: module.exports=require('../lib/social-footer-polish-v93')
// Compatibility lineage: module.exports=require('../lib/category-directory-mobile-alignment-v92')
// Compatibility lineage: module.exports=require('../lib/brand-mark-canonical-parity-v91')
// Compatibility lineage: module.exports=require('../lib/action3-search-commerce-v90')
// Compatibility lineage: module.exports=require('../lib/pagespeed-performance-v88')
// Compatibility lineage: module.exports=require('../lib/action2-measurement-v87')
// Compatibility lineage: module.exports=require('../lib/category-page-polish-v86')
// Compatibility lineage: module.exports=require('../lib/search-console-depth-v85-runtime')
// Compatibility lineage: module.exports=require('../lib/search-console-opportunity-v84')
// Compatibility lineage: module.exports=require('../lib/footer-navigation-v83')
// Compatibility lineage: module.exports=require('../lib/trust-centre-authoritative-v82')
// Compatibility lineage: module.exports=require('../lib/consumer-surface-reconciliation-v81')
// Compatibility lineage: module.exports=require('../lib/analytics-funnel-v79')
// Compatibility lineage: module.exports=require('../lib/footer-country-removal-v78')
// Compatibility lineage: module.exports=require('../lib/navigation-blue-interactions-v77')
// Compatibility lineage: module.exports=require('../lib/homepage-situation-overlay-v701')
// Compatibility lineage: module.exports=require('../lib/premium-search-mobile-v761')
// Compatibility lineage: module.exports=require('../lib/premium-search-v76')
// Compatibility lineage: module.exports=require('../lib/mobile-header-wordmark-v75')
// Compatibility lineage: module.exports=require('../lib/image-seo-phase1-v74')
// Compatibility lineage: module.exports=require('../lib/brand-mark-missing-only-v73')
// Compatibility lineage: module.exports=require('../lib/earbuds-category-image-v72')
// Compatibility lineage: module.exports=require('../lib/televisions-category-image-v71')
// Compatibility lineage: module.exports=require('../lib/homepage-situation-images-v70')
// Compatibility lineage: module.exports=require('../lib/related-decisions-ui-v69')
// Compatibility lineage: module.exports=require('../lib/brand-mark-complete-v67')
// Audit constraint lineage: decision-audit-constraint-guard-v118
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');
const auditIntegration=require('../lib/audit-integration-v124-runtime');
const runtime=require('../lib/action5-catalogue-certification-v106-runtime');
const hardConstraintParity=require('../lib/hard-constraint-result-parity-v1');
const decisionTransportParity=require('../lib/decision-transport-parity-v1-runtime');
const scoutCustomerIntelligence=require('../lib/scout-customer-intelligence-v6');
const scoutResponseDepth=require('../lib/scout-response-depth-v61');
const premiumExperience=require('../lib/premium-experience-v107-runtime');
const decisionJourneyContinuity=require('../lib/decision-journey-continuity-v108-runtime');
const premiumClientStability=require('../lib/premium-client-stability-v1091-runtime');
const premiumMobileDecisionCommerce=require('../lib/premium-mobile-decision-commerce-v112-runtime');
const ebayEpnSurface=require('../lib/ebay-epn-surface-v1-runtime');
const wholeSiteExperience=require('../lib/whole-site-experience-v109-runtime');
const pagespeedAgenticCertification=require('../lib/pagespeed-agentic-certification-v113-runtime');
const customerJourneyProgramme=require('../lib/customer-journey-programme-v1144-runtime');
const faviconParity=require('../lib/favicon-parity-v115-runtime');
const aboutTrustNavigation=require('../lib/about-trust-navigation-v116-runtime');
const trustpilotFooter=require('../lib/trustpilot-footer-v117-runtime');
const scoutNavigatorPresentation=require('../lib/scout-navigator-v7-global-runtime');
const ebayProductImageContinuity=require('../lib/ebay-product-image-continuity-v3-runtime');
hardConstraintParity.install();
scoutCustomerIntelligence.install();
scoutResponseDepth.install();
auditIntegration.install();
// P0 containment 1 Sep 2026: retailer-scoped eBay product photography remains governed in the
// registry/background worker. The former global image wrappers stay detached because they used
// asynchronous res.write/res.end interception on every HTML route, including Home. Product-page
// photography is restored below only after an exact /products/{slug}/ route gate; non-product
// responses never enter the image continuity wrapper.
ebayEpnSurface.install(premiumMobileDecisionCommerce);
customerJourneyProgramme.install(wholeSiteExperience);
faviconParity.install(wholeSiteExperience);
aboutTrustNavigation.install(wholeSiteExperience);
trustpilotFooter.install(wholeSiteExperience);
const transportHandler=decisionTransportParity.wrap(runtime);
const premiumHandler=premiumExperience.wrap(transportHandler);
const journeyHandler=decisionJourneyContinuity.wrap(premiumHandler);
const stableJourneyHandler=premiumClientStability.wrap(journeyHandler);
const premiumMobileHandler=premiumMobileDecisionCommerce.wrap(stableJourneyHandler);
const handler=wholeSiteExperience.wrap(premiumMobileHandler);
handler.HARD_CONSTRAINT_RESULT_PARITY_VERSION=hardConstraintParity.VERSION;
handler.DECISION_TRANSPORT_PARITY_VERSION=decisionTransportParity.VERSION;
handler.SCOUT_CUSTOMER_INTELLIGENCE_VERSION=scoutCustomerIntelligence.VERSION;
handler.SCOUT_RESPONSE_DEPTH_VERSION=scoutResponseDepth.VERSION;
handler.PREMIUM_EXPERIENCE_VERSION=premiumExperience.VERSION;
handler.DECISION_JOURNEY_CONTINUITY_VERSION=decisionJourneyContinuity.VERSION;
handler.PREMIUM_CLIENT_STABILITY_VERSION=premiumClientStability.VERSION;
handler.PREMIUM_MOBILE_DECISION_COMMERCE_VERSION=premiumMobileDecisionCommerce.VERSION;
handler.EBAY_EPN_SURFACE_VERSION=ebayEpnSurface.VERSION;
handler.WHOLE_SITE_EXPERIENCE_VERSION=wholeSiteExperience.VERSION;
handler.PAGESPEED_AGENTIC_CERTIFICATION_VERSION=pagespeedAgenticCertification.VERSION;
handler.CUSTOMER_JOURNEY_PROGRAMME_VERSION=customerJourneyProgramme.VERSION;
handler.FAVICON_PARITY_VERSION=faviconParity.VERSION;
handler.ABOUT_TRUST_NAVIGATION_VERSION=aboutTrustNavigation.VERSION;
handler.TRUSTPILOT_FOOTER_VERSION=trustpilotFooter.VERSION;
handler.APG_PLATFORM_FACTS=wholeSiteExperience.FACTS;
const auditedHandler=auditIntegration.wrap(handler);
auditedHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);
presentationHandler.SCOUT_NAVIGATOR_PRESENTATION_VERSION=scoutNavigatorPresentation.VERSION;
presentationHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
presentationHandler.EBAY_PRODUCT_IMAGE_PRESENTATION_STATE='P0_GLOBAL_WRAPPERS_DETACHED';

// Route-scoped eBay image restoration v1. The continuity wrapper is constructed once, but is only
// invoked for canonical product-page paths. Home, Search, Compare, categories, guides, APIs and
// every other route call presentationHandler directly, so their response streams are never
// intercepted by retailer-image logic.
const ebayProductPresentationHandler=ebayProductImageContinuity.wrap(presentationHandler);
function routeScopedPresentationHandler(req,res){
  let pathname='/';
  try{pathname=new URL(req&&req.url||'/','https://australianproductguide.au').pathname;}catch{}
  if(/^\/products\/[a-z0-9][a-z0-9-]{1,160}\/$/.test(pathname))return ebayProductPresentationHandler(req,res);
  return presentationHandler(req,res);
}
Object.assign(routeScopedPresentationHandler,presentationHandler,{
  EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION:ebayProductImageContinuity.VERSION,
  EBAY_PRODUCT_IMAGE_PRESENTATION_STATE:'ROUTE_SCOPED_PRODUCT_PAGES_V1'
});

// PageSpeed/agentic certification is intentionally the final response wrapper so it sees
// every late-injected presentation stylesheet and can consolidate the complete homepage
// render-blocking set without changing recommendation, retailer, account or decision logic.
const finalHandler=pagespeedAgenticCertification.wrap(routeScopedPresentationHandler);
finalHandler.SCOUT_NAVIGATOR_PRESENTATION_VERSION=scoutNavigatorPresentation.VERSION;
finalHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
finalHandler.EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION=ebayProductImageContinuity.VERSION;
finalHandler.EBAY_PRODUCT_IMAGE_PRESENTATION_STATE='ROUTE_SCOPED_PRODUCT_PAGES_V1';

// P0 diagnostic metadata only (1 Sep 2026). The public export remains finalHandler unchanged.
// A separate no-store/noindex diagnostic function uses these already-assembled boundaries to
// identify the first outer layer at which native Home fails in Vercel Production. Because this
// registry is created after all normal installers run, the `runtime` checkpoint also tests whether
// installer side-effects alone can destabilise the otherwise healthy Action 5 Home renderer.
const p0HomeAssemblyHandlers=Object.freeze({
  runtime,
  transport:transportHandler,
  premium:premiumHandler,
  journey:journeyHandler,
  stable:stableJourneyHandler,
  mobile:premiumMobileHandler,
  whole:handler,
  audit:auditedHandler,
  presentation:routeScopedPresentationHandler,
  final:finalHandler
});
finalHandler.APG_P0_HOME_ASSEMBLY_HANDLERS=p0HomeAssemblyHandlers;
finalHandler.APG_P0_HOME_ASSEMBLY_STAGE_NAMES=Object.freeze(Object.keys(p0HomeAssemblyHandlers));
module.exports=finalHandler;