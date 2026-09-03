'use strict';

// APG eBay product-image route boundary v1.0.
// Restores governed eBay exact-product photography only on canonical product-page requests.
// Non-product routes are passed straight to the existing handler without response interception,
// which preserves the 1 Sep 2026 Home crash containment. Retailer imagery remains presentation
// only and contributes zero recommendation points.

const continuity=require('./ebay-product-image-continuity-v3-runtime');

const VERSION='1.0';
const PRODUCT_ROUTE=/^\/products\/[a-z0-9][a-z0-9-]{1,160}\/$/;

function pathnameForRequest(req){
  try{return new URL(req&&req.url||'/','https://australianproductguide.au').pathname;}catch{return '/';}
}
function isProductPath(pathname){return PRODUCT_ROUTE.test(String(pathname||''));}

function wrap(downstream,{continuityWrap=continuity.wrap}={}){
  if(typeof downstream!=='function')throw new TypeError('eBay product-image route boundary requires downstream handler');
  if(typeof continuityWrap!=='function')throw new TypeError('eBay product-image route boundary requires continuity wrapper');
  const productHandler=continuityWrap(downstream);
  function handler(req,res){
    const pathname=pathnameForRequest(req);
    if(isProductPath(pathname))return productHandler(req,res);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    EBAY_PRODUCT_IMAGE_ROUTE_VERSION:VERSION,
    EBAY_PRODUCT_IMAGE_CONTINUITY_VERSION:continuity.VERSION,
    EBAY_PRODUCT_IMAGE_PRESENTATION_STATE:'ROUTE_SCOPED_PRODUCT_ONLY_V1'
  });
  return handler;
}

module.exports={VERSION,PRODUCT_ROUTE,pathnameForRequest,isProductPath,wrap};
