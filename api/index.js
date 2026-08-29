// APG deployable runtime composition. The v106 lineage remains authoritative underneath.
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');

// Audit integration is required before the authoritative runtime so its narrow Decision
// Engine guard is installed before downstream consumers capture Decision Engine functions.
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

hardConstraintParity.install();
scoutCustomerIntelligence.install();
scoutResponseDepth.install();
// Current-page Scout identity becomes authoritative only after the existing Scout layers load.
auditIntegration.install();
ebayEpnSurface.install(premiumMobileDecisionCommerce);
customerJourneyProgramme.install(wholeSiteExperience);
pagespeedAgenticCertification.install(wholeSiteExperience);
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

// Navigator remains the established final presentation skin. The audit integration then adds
// only the six audited transport/presentation/constraint guards at one explicit outer boundary.
const navigatorHandler=scoutNavigatorPresentation.wrap(handler);
navigatorHandler.SCOUT_NAVIGATOR_PRESENTATION_VERSION=scoutNavigatorPresentation.VERSION;
const finalHandler=auditIntegration.wrap(navigatorHandler);
finalHandler.AUDIT_INTEGRATION_VERSION=auditIntegration.VERSION;
module.exports=finalHandler;
