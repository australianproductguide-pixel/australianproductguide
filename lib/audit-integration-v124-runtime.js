'use strict';
// APG 29–30 Aug 2026 audit integration boundary.
const decisionGuard=require('./decision-audit-constraint-guard-v118');
const scoutActiveContext=require('./scout-active-context-v120');
const searchMobile=require('./audit-search-mobile-v119-runtime');
const uiSafety=require('./audit-ui-safety-v121-runtime');
const shoppingClarity=require('./audit-shopping-clarity-v122-runtime');
const qualityTrust=require('./audit-quality-trust-v123-runtime');
const VERSION='124.1';
// Keep the proven decision and Scout correctness guards installed. The HTML composition is
// temporarily narrowed to the mobile/Search layer after a Production-only serverless failure
// in the combined presentation wrapper; v121-v123 remain source-staged for isolated re-entry.
decisionGuard.install();
function install(){scoutActiveContext.install();return module.exports;}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('APG audit integration v124 requires downstream handler');
  const finalHandler=searchMobile.wrap(downstream);
  Object.assign(finalHandler,downstream,{AUDIT_INTEGRATION_VERSION:VERSION,DECISION_AUDIT_CONSTRAINT_GUARD_VERSION:decisionGuard.VERSION,AUDIT_SEARCH_MOBILE_VERSION:searchMobile.VERSION,SCOUT_ACTIVE_CONTEXT_VERSION:scoutActiveContext.VERSION,AUDIT_UI_SAFETY_VERSION:'STAGED',AUDIT_SHOPPING_CLARITY_VERSION:'STAGED',AUDIT_QUALITY_TRUST_VERSION:'STAGED'});
  return finalHandler;
}
module.exports={VERSION,install,wrap,decisionGuard,scoutActiveContext,searchMobile,uiSafety,shoppingClarity,qualityTrust};