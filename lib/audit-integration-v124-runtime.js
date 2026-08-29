'use strict';

// APG 29–30 Aug 2026 audit integration boundary.
// One deliberate composition point for the isolated audit remediations v118-v123.
// It preserves the established runtime, recommendation engine, shopper state and retailer neutrality.
const decisionGuard=require('./decision-audit-constraint-guard-v118');
const scoutActiveContext=require('./scout-active-context-v120');
const searchMobile=require('./audit-search-mobile-v119-runtime');
const uiSafety=require('./audit-ui-safety-v121-runtime');
const shoppingClarity=require('./audit-shopping-clarity-v122-runtime');
const qualityTrust=require('./audit-quality-trust-v123-runtime');

const VERSION='124.0';

// Decision Engine consumers are loaded after api/index requires this module, so install the
// narrow constraint guard immediately. This avoids a second engine and preserves existing scoring.
decisionGuard.install();

function install(){
  // Scout context must be patched after the current Scout intelligence/depth installers have loaded.
  scoutActiveContext.install();
  return module.exports;
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('APG audit integration v124 requires downstream handler');
  // Inner-to-outer: mobile/search navigation -> fixed-control safety -> shopping clarity -> trust hygiene.
  // All are presentation/transport guards; recommendation and affiliate weighting are untouched.
  const searchHandler=searchMobile.wrap(downstream);
  const safeHandler=uiSafety.wrap(searchHandler);
  const clarityHandler=shoppingClarity.wrap(safeHandler);
  const finalHandler=qualityTrust.wrap(clarityHandler);
  Object.assign(finalHandler,downstream,{
    AUDIT_INTEGRATION_VERSION:VERSION,
    DECISION_AUDIT_CONSTRAINT_GUARD_VERSION:decisionGuard.VERSION,
    AUDIT_SEARCH_MOBILE_VERSION:searchMobile.VERSION,
    SCOUT_ACTIVE_CONTEXT_VERSION:scoutActiveContext.VERSION,
    AUDIT_UI_SAFETY_VERSION:uiSafety.VERSION,
    AUDIT_SHOPPING_CLARITY_VERSION:shoppingClarity.VERSION,
    AUDIT_QUALITY_TRUST_VERSION:qualityTrust.VERSION
  });
  return finalHandler;
}

module.exports={VERSION,install,wrap,decisionGuard,scoutActiveContext,searchMobile,uiSafety,shoppingClarity,qualityTrust};
