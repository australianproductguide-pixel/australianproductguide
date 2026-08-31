'use strict';

// APG eBay Smart Placement route-safety adapter v1.0, 1 Sep 2026.
//
// The v1.6 presentation layer legitimately transforms only Deals plus the two disclosure pages,
// but its legacy wrapper intercepted res.write/res.end on every APG route. That global response
// ownership is unnecessary and unsafe during the current homepage serverless incident.
//
// This adapter preserves the existing v1.6 presentation, assets, CSP changes and recommendation
// neutrality exactly where they are required, while all unrelated routes bypass the Smart
// Placement wrapper completely. In particular, Home/Search/category/product/Compare/Decision Lab
// retain the downstream response object's native write/end semantics.

const base=require('./ebay-smart-placement-v1-runtime');

const ROUTE_SCOPE_VERSION='1.0';
const TARGET_PATHS=new Set(['/deals/','/affiliate-disclosure/','/privacy/']);
const ASSET_PATHS=new Set([base.CSS_PATH,base.LOADER_PATH]);

function requestPath(req){
  try{return new URL(req?.url||'/','https://australianproductguide.au').pathname}catch{return '/'}
}
function requiresSmartPlacementInterception(path){return TARGET_PATHS.has(path)||ASSET_PATHS.has(path)}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('eBay Smart Placement route-safety adapter requires downstream handler');
  const intercepted=base.wrap(downstream);
  function handler(req,res){
    const path=requestPath(req);
    if(!requiresSmartPlacementInterception(path))return downstream(req,res);
    return intercepted(req,res);
  }
  Object.assign(handler,downstream,{
    EBAY_SMART_PLACEMENT_VERSION:base.VERSION,
    EBAY_SMART_PLACEMENT_ROUTE_SCOPE_VERSION:ROUTE_SCOPE_VERSION,
    transformEbaySmartPlacement:base.transform
  });
  return handler;
}

module.exports={...base,ROUTE_SCOPE_VERSION,TARGET_PATHS,ASSET_PATHS,requestPath,requiresSmartPlacementInterception,wrap};
