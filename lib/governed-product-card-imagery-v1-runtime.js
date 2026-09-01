'use strict';

// APG governed product-card imagery v1.6.
// Exact-model registry resolver retained for the read-only image API and tests.
// IMPORTANT SAFETY BOUNDARY: this module never intercepts/buffers HTML responses.
// Product listing imagery is progressively enhanced client-side from the bounded image endpoint.
// The only response mutation is a synchronous CSP img-src allowance on explicit eligible routes,
// so a slow/unavailable image registry can never hold page HTML open or cause a page failure.
const {products}=require('../data');
const continuity=require('./ebay-product-image-continuity-v3-runtime');
const supabase=require('./apg-supabase-public-v1');

const VERSION='1.6';
const STYLE_HREF='/assets/governed-product-card-imagery-v1.css';
const ORIGIN='https://australianproductguide.au';
const EBAY_IMAGE_ORIGIN='https://i.ebayimg.com';
const PRODUCT_MAP=new Map(products.filter(Boolean).map(product=>[product.slug,product]));
const CARD_CLASSES=new Set(['product-card','feature-card','apg112-product-card','comparison-card','compare-card','result-card','search-result-card','decision-result-card','winner-card']);
function clean(value){return String(value==null?'':value).trim();}
function eligiblePath(pathname){const path=clean(pathname);return /^\/categories\/[a-z0-9][a-z0-9-]{1,160}\/(?:finder\/)?$/.test(path)||/^\/compare\/(?:.*)?$/.test(path)||path==='/search/'||path==='/search'||path==='/decision-lab/'||path==='/decision-lab';}
function mappingFromState(slug,state,now){const row=continuity.stateToMapping(state);return continuity.guardEligible(slug,row,now)?row:null;}
async function governedMappings(slugs,options={}){
  const values=[...new Set((Array.isArray(slugs)?slugs:[]).map(clean).filter(slug=>PRODUCT_MAP.has(slug)))].slice(0,100);
  const now=typeof options.now==='function'?Number(options.now()):Date.now();
  if(!values.length)return new Map();
  if(typeof options.fetchStates==='function'){
    const rows=await options.fetchStates(values);const resolved=new Map();for(const state of rows||[]){const slug=clean(state&&state.slug);const row=mappingFromState(slug,state,now);if(row)resolved.set(slug,row);}return resolved;
  }
  const resolved=new Map();
  try{const rows=await supabase.imageStates(values,{timeoutMs:1800});for(const state of rows||[]){const slug=clean(state&&state.slug);const row=mappingFromState(slug,state,now);if(row)resolved.set(slug,row);}}catch{}
  return resolved;
}
function withEbayImageCsp(value){
  const csp=clean(value);if(!csp||csp.includes(EBAY_IMAGE_ORIGIN))return csp;
  if(!/(^|;)\s*img-src\s+/i.test(csp))return csp;
  return csp.replace(/((?:^|;)\s*img-src\s+)([^;]*)/i,(all,prefix,sources)=>`${prefix}${sources.trim()} ${EBAY_IMAGE_ORIGIN}`);
}
// Pass-through by design. We only intercept setHeader synchronously so that when the existing
// security layer writes CSP, verified eBay image hosts are permitted on eligible result routes.
// No response body, stream or async registry request is touched here.
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('governed product-card imagery wrapper requires downstream handler');
  function handler(req,res){
    let pathname='/';try{pathname=new URL(req&&req.url||'/',ORIGIN).pathname;}catch{}
    if(!eligiblePath(pathname)||!res||typeof res.setHeader!=='function')return downstream(req,res);
    const originalSetHeader=res.setHeader.bind(res);
    res.setHeader=function(name,value){
      if(String(name||'').toLowerCase()==='content-security-policy'&&!Array.isArray(value))value=withEbayImageCsp(value);
      return originalSetHeader(name,value);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{GOVERNED_PRODUCT_CARD_IMAGERY_VERSION:VERSION,GOVERNED_PRODUCT_CARD_IMAGERY_STYLE:STYLE_HREF,eligibleGovernedProductCardImagePath:eligiblePath});
  return handler;
}
module.exports={VERSION,STYLE_HREF,ORIGIN,EBAY_IMAGE_ORIGIN,PRODUCT_MAP,CARD_CLASSES,eligiblePath,mappingFromState,governedMappings,withEbayImageCsp,wrap};