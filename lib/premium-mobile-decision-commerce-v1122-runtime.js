'use strict';

// APG Premium Mobile Decision-Commerce v112.2.
// Presentation-only freshness reconciliation over v112.1. The established v112 renderer
// remains authoritative; this layer applies the dated retailer-verification overlay to
// the rendered product retailer panel so visible check dates match current APG evidence.
// It does not change retailer rank, recommendation scoring, price claims or stock claims.
const base=require('./premium-mobile-decision-commerce-v112-runtime');
const retailerVerifications=require('../data/retailer-verifications-v109');

const VERSION='112.2';
const ORIGIN='https://australianproductguide.au';
const PRODUCT_ROUTE=/^\/products\/([^/]+)\/$/;

const arr=value=>Array.isArray(value)?value.filter(Boolean):[];
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function refreshedProduct(product){
  if(!product)return product;
  return {
    ...product,
    retailers:arr(product.retailers).map(row=>retailerVerifications.resolve(product.slug,row)),
    offers:arr(product.offers).map(row=>retailerVerifications.resolve(product.slug,row))
  };
}
function refreshedRetailerPanel(product){return base.retailerPanelV2(refreshedProduct(product));}
function refreshProductRetailerPanel(html,slug){
  const product=base.PRODUCT_BY_SLUG&&base.PRODUCT_BY_SLUG.get(slug);
  if(!product)return String(html||'');
  const nextPanel=refreshedRetailerPanel(product);
  return String(html||'').replace(/<section class="retailer-panel apg112-offer-panel" data-apg112-offer-layer="true">[\s\S]*?<\/section>/i,nextPanel);
}
function wrap(downstream){
  const inner=base.wrap(downstream);
  function handler(req,res){
    const u=requestUrl(req),productMatch=u.pathname.match(PRODUCT_ROUTE);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(productMatch&&req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=refreshProductRetailerPanel(source,productMatch[1]);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Premium-Mobile-Commerce','v'+VERSION);
      return end(body,...args);
    };
    return inner(req,res);
  }
  Object.assign(handler,inner,{PREMIUM_MOBILE_DECISION_COMMERCE_VERSION:VERSION});
  return handler;
}

module.exports={...base,VERSION,refreshedProduct,refreshedRetailerPanel,refreshProductRetailerPanel,wrap};
