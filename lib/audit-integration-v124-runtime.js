'use strict';
// APG 29-30 Aug 2026 audit integration boundary.
// P0 stabilisation 30 Aug: correctness guards remain installed, but the audit layer no longer
// intercepts res.end in Production. Mobile Search is now rendered by the proven marketplace
// header lineage (v122.6) rather than by an additional outer response-transform wrapper.
const decisionGuard=require('./decision-audit-constraint-guard-v118');
const scoutActiveContext=require('./scout-active-context-v120');
const searchMobile=require('./audit-search-mobile-v119-runtime');
const uiSafety=require('./audit-ui-safety-v121-runtime');
const shoppingClarity=require('./audit-shopping-clarity-v122-runtime');
const qualityTrust=require('./audit-quality-trust-v123-runtime');
const VERSION='124.2';
decisionGuard.install();
function install(){scoutActiveContext.install();return module.exports;}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('APG audit integration v124 requires downstream handler');
  // Intentionally return the established handler unchanged. This preserves the exact runtime
  // that was stable before the audit response-transform boundary while keeping guarded logic
  // and version markers available to release QA. No response method is monkey-patched here.
  Object.assign(downstream,{
    AUDIT_INTEGRATION_VERSION:VERSION,
    DECISION_AUDIT_CONSTRAINT_GUARD_VERSION:decisionGuard.VERSION,
    AUDIT_SEARCH_MOBILE_VERSION:searchMobile.VERSION,
    SCOUT_ACTIVE_CONTEXT_VERSION:scoutActiveContext.VERSION,
    AUDIT_UI_SAFETY_VERSION:'STAGED',
    AUDIT_SHOPPING_CLARITY_VERSION:'STAGED',
    AUDIT_QUALITY_TRUST_VERSION:'STAGED',
    AUDIT_RESPONSE_TRANSFORM:'DISABLED_P0'
  });
  return downstream;
}
module.exports={VERSION,install,wrap,decisionGuard,scoutActiveContext,searchMobile,uiSafety,shoppingClarity,qualityTrust};