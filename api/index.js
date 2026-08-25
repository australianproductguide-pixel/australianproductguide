// APG Amazon Australia Catalogue Certification v106.0 is the authoritative outermost
// retailer-certification control. It preserves Search Opportunity Depth v104 and the full
// runtime lineage while applying the owner's stricter 25 August 2026 Action 5 completion gate.
// Compatibility lineage: module.exports=require('../lib/search-opportunity-depth-v104-runtime');
// APG Search Opportunity Depth v104.0 remains authoritative underneath for search-depth logic.
// It deepens six deliberately selected high-intent category, guide and comparison journeys
// while leaving the canonical Trust Centre source under its existing regression controls.
// Compatibility lineage: module.exports=require('../lib/decision-hard-constraint-fallback-v1036');
// APG Decision hard-constraint fallback remediation v103.6 remains authoritative underneath.
// It preserves the full v103.5 presentation/runtime chain and restores explicit fallback
// whenever a maintained-category hard constraint leaves zero eligible products.
// Compatibility lineage: module.exports=require('../lib/apg-proof-rail-runtime-v103');
// APG Proof Rail v103.0 remains authoritative underneath for the homepage presentation layer.
// It replaces only the legacy homepage proof banner with the SSR-first ApgProofRail,
// preserving every downstream intelligence, commerce, account, SEO and analytics contract.
// Compatibility lineage: module.exports=require('../lib/buying-guide-theme-alignment-v102');
// APG Buying Guide Theme Alignment v102.0 remains authoritative underneath for buying guides.
// It preserves Action 7 v101.6 and all protected intelligence/runtime contracts while
// reconciling the shared buying-guide decision-step accents with APG's current blue theme.
// Compatibility lineage: module.exports=require('../lib/action7-closure-v1016')
// APG Action 7 Scout + Decision Lab Intelligence v101.6 remains authoritative underneath.
// It preserves Scout v5 and Decision Engine v4, retains v101.4 state/evidence/retailer integration,
// and closes Decision Lab rendered evidence parity across both res.write and res.end output.
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
require('../lib/scout-concierge-v5-runtime');
require('../lib/consumer-intelligence-v47-runtime');
require('../lib/catalogue-decision-v48-runtime');
require('../lib/brand-system-v46');
require('../lib/consumer-intelligence-v47');

// Post-lineage parity guards install only after the authoritative v106 runtime has loaded
// every current re-ranking layer. They do not replace v106 or create another HTTP runtime.
const runtime=require('../lib/action5-catalogue-certification-v106-runtime');
const hardConstraintParity=require('../lib/hard-constraint-result-parity-v1');
hardConstraintParity.install();
runtime.HARD_CONSTRAINT_RESULT_PARITY_VERSION=hardConstraintParity.VERSION;
module.exports=runtime;