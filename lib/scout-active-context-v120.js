'use strict';

// APG Scout Active Context v120.
// Fixes the 29–30 Aug 2026 live-audit stale-context failure without creating a second
// shopper-state store. The current canonical URL/page is authoritative; supplied context
// may enrich that page only when it is compatible with the page identity.
const scout=require('./scout-concierge-v5');
const core=scout.core;
const VERSION='scout-active-context-v120';
let installed=false;
let previousValidate=null;

function install(){
  if(installed)return module.exports;
  previousValidate=core.validatePageContext;
  if(typeof previousValidate!=='function')throw new Error('Scout v120 requires validatePageContext');
  core.validatePageContext=function authoritativePageContext(raw={}){
    const supplied=raw&&typeof raw==='object'?raw:{};
    // First resolve the current URL alone. This establishes page identity before any
    // client-supplied carry-over fields are considered.
    const route=previousValidate({path:supplied.path||'/'});
    const compatible={path:supplied.path||'/'};
    if(route.pageType==='product'){
      // Product identity comes from the URL; a stale supplied product may not replace it.
      compatible.productSlug=route.productSlug;
      compatible.categorySlug=route.categorySlug;
    }else if(['category','finder','guide'].includes(route.pageType)){
      compatible.categorySlug=route.categorySlug;
      compatible.currentFilters=supplied.currentFilters;
    }else if(route.pageType==='comparison'){
      // Compare may legitimately carry an explicit current shortlist in addition to URL state.
      compatible.comparisonProductSlugs=supplied.comparisonProductSlugs;
      compatible.categorySlug=supplied.categorySlug;
    }else if(route.pageType==='search'){
      compatible.currentSearchQuery=supplied.currentSearchQuery;
      compatible.currentFilters=supplied.currentFilters;
    }else if(route.pageType==='decision-lab'){
      // Decision Lab's structured decisionState is transported separately. Never import a
      // previous page's product identity into pageContext.
      compatible.categorySlug=supplied.categorySlug;
      compatible.currentFilters=supplied.currentFilters;
    }
    const resolved=previousValidate(compatible);
    // Fail closed if a supplied slug survived onto an incompatible route through a future
    // legacy validator change.
    if(resolved.pageType!=='product')resolved.productSlug=null;
    if(resolved.pageType!=='comparison')resolved.comparisonProductSlugs=[];
    return resolved;
  };
  core.SCOUT_ACTIVE_CONTEXT_VERSION=VERSION;
  installed=true;
  return module.exports;
}

module.exports={VERSION,install,get installed(){return installed},get previousValidate(){return previousValidate}};
