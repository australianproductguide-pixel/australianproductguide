// APG Amazon Australia Catalogue Certification v106.0 is the authoritative outermost
// retailer-certification control. It preserves Search Opportunity Depth v104 and the full
// runtime lineage while applying the owner's stricter 25 August 2026 Action 5 completion gate.
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
const reviewProfiles=require('../lib/review-profiles-v118-runtime');
const scoutNavigatorPresentation=require('../lib/scout-navigator-v7-global-runtime');
const ebayProductImageContinuity=require('../lib/ebay-product-image-continuity-v3-runtime');
const governedProductCardImagery=require('../lib/governed-product-card-imagery-v1-runtime');
const searchProductImagery=require('../lib/search-product-imagery-v1-runtime');
const categoryFeaturedImagery=require('../lib/category-featured-product-imagery-v1-runtime');
const brandLogoStability=require('../lib/brand-logo-stability-v125-runtime');
const finalPresentationStability=require('../lib/final-presentation-stability-v131-runtime');
const homeNationalCardsRepair=require('../lib/home-national-cards-repair-v131-runtime');
const googleDiscoverabilityPerformance=require('../lib/google-discoverability-performance-v128-runtime');
const homeResponseHeaderBudget=require('../lib/home-response-header-budget-v132-runtime');
hardConstraintParity.install();
scoutCustomerIntelligence.install();
scoutResponseDepth.install();
auditIntegration.install();
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
handler.REVIEW_PROFILES_VERSION=reviewProfiles.VERSION;
handler.APG_PLATFORM_FACTS=wholeSiteExperience.FACTS;
const auditedHandler=auditIntegration.wrap(handler);
auditedHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
const presentationHandler=scoutNavigatorPresentation.wrap(auditedHandler);
presentationHandler.SCOUT_NAVIGATOR_PRESENTATION_VERSION=scoutNavigatorPresentation.VERSION;
presentationHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
presentationHandler.EBAY_PRODUCT_IMAGE_PRESENTATION_STATE='P0_GLOBAL_WRAPPERS_DETACHED';

// Route-scoped governed imagery. Product heroes and result cards share the same exact-model
// registry. Home remains outside both presentation wrappers. Result-surface imagery is a
// non-blocking progressive enhancement; the governed wrapper only permits the verified image
// origin in CSP and never buffers HTML or waits on image-state reads.
const ebayProductPresentationHandler=ebayProductImageContinuity.wrap(presentationHandler);
const governedProductCardPresentationHandler=governedProductCardImagery.wrap(presentationHandler);
function routeScopedPresentationHandler(req,res){
  let pathname='/';
  try{pathname=new URL(req&&req.url||'/','https://australianproductguide.au').pathname;}catch{}
  if(/^\/products\/[a-z0-9][a-z0-9-]{1,160}\/$/.test(pathname))return ebayProductPresentationHandler(req,res);
  if(governedProductCardImagery.eligiblePath(pathname))return governedProductCardPresentationHandler(req,res);
  return presentationHandler(req,res);
}
Object.assign(routeScopedPresentationHandler,presentationHandler,{
  EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION:ebayProductImageContinuity.VERSION,
  GOVERNED_PRODUCT_CARD_IMAGERY_VERSION:governedProductCardImagery.VERSION,
  EBAY_PRODUCT_IMAGE_PRESENTATION_STATE:'NON_BLOCKING_UNIVERSAL_PRODUCT_IMAGERY_V16'
});
const searchImageHandler=searchProductImagery.wrap(routeScopedPresentationHandler);
const categoryImageHandler=categoryFeaturedImagery.wrap(searchImageHandler);
const pagespeedHandler=pagespeedAgenticCertification.wrap(categoryImageHandler);
const reviewProfileHandler=reviewProfiles.wrap(pagespeedHandler);
const finalHandler=brandLogoStability.wrap(reviewProfileHandler);
finalHandler.SCOUT_NAVIGATOR_PRESENTATION_VERSION=scoutNavigatorPresentation.VERSION;
finalHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
finalHandler.EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION=ebayProductImageContinuity.VERSION;
finalHandler.GOVERNED_PRODUCT_CARD_IMAGERY_VERSION=governedProductCardImagery.VERSION;
finalHandler.SEARCH_PRODUCT_IMAGERY_VERSION=searchProductImagery.VERSION;
finalHandler.CATEGORY_FEATURED_IMAGERY_VERSION=categoryFeaturedImagery.VERSION;
finalHandler.REVIEW_PROFILES_VERSION=reviewProfiles.VERSION;
finalHandler.BRAND_LOGO_STABILITY_VERSION=brandLogoStability.VERSION;
finalHandler.EBAY_PRODUCT_IMAGE_PRESENTATION_STATE='NON_BLOCKING_UNIVERSAL_PRODUCT_IMAGERY_V16';

// The two final desktop layers retain their existing visual assets and order, but share a
// pre-commit, streaming-safe response contract. The Home-only national-card repair is deliberately
// inside Google CSS consolidation so both build-time and runtime signatures include the same
// stylesheet, preserving the one-bundle delivery contract while restoring the broken card grid.
// The final Home-only header budget then removes superseded diagnostic X-APG headers immediately
// before commit, without touching standard HTTP, security, SEO, privacy, content or cache headers.
const desktopHomeHeaderHandler=finalPresentationStability.wrapDesktopHome(finalHandler);
const desktopAboutTrustContrastHandler=finalPresentationStability.wrapDesktopTrust(desktopHomeHeaderHandler);
const homeNationalCardsRepairHandler=homeNationalCardsRepair.wrap(desktopAboutTrustContrastHandler);
const googleDiscoverabilityPerformanceHandler=googleDiscoverabilityPerformance.wrap(homeNationalCardsRepairHandler);
const homeResponseHeaderBudgetHandler=homeResponseHeaderBudget.wrap(googleDiscoverabilityPerformanceHandler);
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
  searchImages:searchImageHandler,
  categoryImages:categoryImageHandler,
  pagespeed:pagespeedHandler,
  reviewProfiles:reviewProfileHandler,
  final:finalHandler,
  desktopHome:desktopHomeHeaderHandler,
  desktopTrust:desktopAboutTrustContrastHandler,
  homeNationalCards:homeNationalCardsRepairHandler,
  googleDelivery:googleDiscoverabilityPerformanceHandler,
  homeBudget:homeResponseHeaderBudgetHandler
});
for(const stageHandler of [finalHandler,desktopHomeHeaderHandler,desktopAboutTrustContrastHandler,homeNationalCardsRepairHandler,googleDiscoverabilityPerformanceHandler,homeResponseHeaderBudgetHandler]){
  stageHandler.APG_P0_HOME_ASSEMBLY_HANDLERS=p0HomeAssemblyHandlers;
  stageHandler.APG_P0_HOME_ASSEMBLY_STAGE_NAMES=Object.freeze(Object.keys(p0HomeAssemblyHandlers));
}
desktopHomeHeaderHandler.FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION;
desktopAboutTrustContrastHandler.FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION;
homeNationalCardsRepairHandler.FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION;
homeNationalCardsRepairHandler.HOME_NATIONAL_CARDS_REPAIR_VERSION=homeNationalCardsRepair.VERSION;
googleDiscoverabilityPerformanceHandler.FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION;
googleDiscoverabilityPerformanceHandler.HOME_NATIONAL_CARDS_REPAIR_VERSION=homeNationalCardsRepair.VERSION;
googleDiscoverabilityPerformanceHandler.GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION=googleDiscoverabilityPerformance.VERSION;
homeResponseHeaderBudgetHandler.FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION;
homeResponseHeaderBudgetHandler.HOME_NATIONAL_CARDS_REPAIR_VERSION=homeNationalCardsRepair.VERSION;
homeResponseHeaderBudgetHandler.GOOGLE_DISCOVERABILITY_PERFORMANCE_VERSION=googleDiscoverabilityPerformance.VERSION;
homeResponseHeaderBudgetHandler.HOME_RESPONSE_HEADER_BUDGET_VERSION=homeResponseHeaderBudget.VERSION;
module.exports=homeResponseHeaderBudgetHandler;
