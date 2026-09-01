'use strict';

// APG governed product-card imagery v1.5.
// Exact-model registry resolver retained for the read-only image API and tests.
// IMPORTANT SAFETY BOUNDARY: this module no longer intercepts/buffers HTML responses.
// Product listing imagery is progressively enhanced client-side from the bounded image endpoint,
// so a slow image registry can never hold Home, category, search, compare or Decision Lab HTML open.
const {products}=require('../data');
const continuity=require('./ebay-product-image-continuity-v3-runtime');
const supabase=require('./apg-supabase-public-v1');

const VERSION='1.5';
const STYLE_HREF='/assets/governed-product-card-imagery-v1.css';
const ORIGIN='https://australianproductguide.au';
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
// No-op by design. HTML response interception here previously made presentation dependent on
// network image-state reads. Keeping this wrapper synchronous/pass-through makes image failure
// fail visually (placeholder) rather than operationally (500/timeout).
function wrap(downstream){if(typeof downstream!=='function')throw new TypeError('governed product-card imagery wrapper requires downstream handler');function handler(req,res){return downstream(req,res);}Object.assign(handler,downstream,{GOVERNED_PRODUCT_CARD_IMAGERY_VERSION:VERSION,GOVERNED_PRODUCT_CARD_IMAGERY_STYLE:STYLE_HREF,eligibleGovernedProductCardImagePath:eligiblePath});return handler;}
module.exports={VERSION,STYLE_HREF,PRODUCT_MAP,CARD_CLASSES,eligiblePath,mappingFromState,governedMappings,wrap};