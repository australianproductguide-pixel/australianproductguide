'use strict';

// APG Search Console Depth v85 runtime.
// Preserves search equity while an evidence-backed Australian model correction
// moves the Philips 5000 steamer from the legacy STH5030/80 slug to STH5030/20.
// No mass page creation, scoring changes, affiliate preference or index inflation.
const downstream=require('./search-console-opportunity-v84');
const {OLD_SLUG,NEW_SLUG}=require('../data/search-console-depth-v85');

const VERSION='85.0';
const ORIGIN='https://australianproductguide.au';
const OLD_PRODUCT=`/products/${OLD_SLUG}/`;
const NEW_PRODUCT=`/products/${NEW_SLUG}/`;
const OLD_PAIR=`/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-${OLD_SLUG}/`;
const NEW_PAIR=`/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-${NEW_SLUG}/`;
const REDIRECTS=new Map([[OLD_PRODUCT,NEW_PRODUCT],[OLD_PAIR,NEW_PAIR]]);

function redirectTarget(url){
  try{
    const parsed=new URL(url,ORIGIN);
    const target=REDIRECTS.get(parsed.pathname);
    return target?target+parsed.search:null;
  }catch{return null;}
}
function handler(req,res){
  res.setHeader('X-APG-Search-Console-Depth','v'+VERSION);
  const target=redirectTarget(req.url);
  if(target&&(req.method==='GET'||req.method==='HEAD')){
    res.statusCode=301;
    res.setHeader('Location',target);
    res.setHeader('Cache-Control','public, max-age=3600');
    return res.end();
  }
  return downstream(req,res);
}

Object.assign(handler,downstream,{SEARCH_CONSOLE_DEPTH_VERSION:VERSION,SEARCH_CONSOLE_DEPTH_REDIRECTS:REDIRECTS,searchConsoleDepthRedirectTarget:redirectTarget});
module.exports=handler;
