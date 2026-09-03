'use strict';

// APG Home response-header budget v132.0.
//
// The public Home historically accumulated many diagnostic X-APG-* headers as release layers were
// added. Those headers are useful in source QA but are not required by browsers, crawlers, product
// decisions or security controls. This outermost delivery wrapper removes only superseded X-APG
// diagnostics from `/` immediately before the response commits, while preserving current release,
// bundle, platform-fact and accessibility markers. Standard HTTP, CSP, HSTS, privacy, cache and
// content headers are never touched. Non-Home routes remain byte-for-byte and header-for-header
// unchanged.
const VERSION='132.0';
const HEADER_NAME='X-APG-Home-Header-Budget';
const REMOVED_HEADER='X-APG-Home-Headers-Removed';
const BYTES_HEADER='X-APG-Home-Header-Bytes';
const OVER_BUDGET_HEADER='X-APG-Home-Header-Over-Budget';
const ORIGIN='https://australianproductguide.au';
const MAX_ESTIMATED_HEADER_BYTES=8192;

const PRESERVED_HOME_HEADERS=new Set([
  'x-apg-home-header-budget',
  'x-apg-home-headers-removed',
  'x-apg-home-header-bytes',
  'x-apg-home-header-over-budget',
  'x-apg-google-discoverability-performance',
  'x-apg-delivery-stability',
  'x-apg-delivery-fallback',
  'x-apg-final-presentation-stability',
  'x-apg-final-presentation-fallback',
  'x-apg-desktop-home-header',
  'x-apg-desktop-about-trust-contrast',
  'x-apg-home-css-bundle',
  'x-apg-home-css-manifest',
  'x-apg-platform-facts',
  'x-apg-pagespeed-build',
  'x-apg-pagespeed-agentic-certification',
  'x-apg-seo',
  'x-apg-favicon-parity',
  'x-apg-review-profiles'
]);

function requestPath(req){
  try{return new URL(req&&req.url||'/',ORIGIN).pathname;}
  catch{return '/';}
}
function headerNames(res){
  try{
    if(res&&typeof res.getHeaderNames==='function')return res.getHeaderNames().map(value=>String(value).toLowerCase());
    if(res&&typeof res.getHeaders==='function')return Object.keys(res.getHeaders()||{}).map(value=>String(value).toLowerCase());
  }catch{}
  return [];
}
function headerValue(res,name){
  try{return res&&typeof res.getHeader==='function'?res.getHeader(name):undefined;}
  catch{return undefined;}
}
function valueText(value){
  if(Array.isArray(value))return value.map(item=>String(item)).join(', ');
  if(value===undefined||value===null)return '';
  return String(value);
}
function estimatedHeaderBytes(res,names=headerNames(res)){
  let bytes=2;
  for(const name of names){
    const value=valueText(headerValue(res,name));
    bytes+=Buffer.byteLength(String(name),'utf8')+2+Buffer.byteLength(value,'utf8')+2;
  }
  return bytes;
}
function safeSetHeader(res,name,value){
  if(!res||res.headersSent===true||typeof res.setHeader!=='function')return false;
  try{res.setHeader(name,value);return true;}catch{return false;}
}
function safeRemoveHeader(res,name){
  if(!res||res.headersSent===true||typeof res.removeHeader!=='function')return false;
  try{res.removeHeader(name);return true;}catch{return false;}
}
function compactHomeHeaders(res){
  if(!res||res.headersSent===true)return Object.freeze({applied:false,reason:'headers-committed',removed:0,bytes:null,overBudget:false});
  const before=headerNames(res);
  if(!before.length)return Object.freeze({applied:false,reason:'header-enumeration-unavailable',removed:0,bytes:null,overBudget:false});

  let removed=0;
  for(const name of before){
    if(name.startsWith('x-apg-')&&!PRESERVED_HOME_HEADERS.has(name)&&safeRemoveHeader(res,name))removed+=1;
  }
  safeSetHeader(res,HEADER_NAME,'v'+VERSION);
  safeSetHeader(res,REMOVED_HEADER,String(removed));
  const bytes=estimatedHeaderBytes(res);
  const overBudget=bytes>MAX_ESTIMATED_HEADER_BYTES;
  safeSetHeader(res,BYTES_HEADER,String(bytes));
  if(overBudget)safeSetHeader(res,OVER_BUDGET_HEADER,'true');
  else safeRemoveHeader(res,OVER_BUDGET_HEADER);
  const finalBytes=estimatedHeaderBytes(res);
  return Object.freeze({applied:true,reason:'home-x-apg-compacted',removed,bytes:finalBytes,overBudget:finalBytes>MAX_ESTIMATED_HEADER_BYTES});
}
function budgetLog(result,pathname){
  if(!result||!result.applied)return;
  try{console.log('APG_HOME_HEADER_BUDGET',JSON.stringify({version:VERSION,pathname,...result}));}
  catch{console.log('APG_HOME_HEADER_BUDGET');}
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Home response-header budget requires a downstream handler');
  function handler(req,res){
    const pathname=requestPath(req);
    if(pathname!=='/')return downstream(req,res);

    // The budget marker is set early so it survives a streaming response. Compaction itself runs
    // immediately before the first write, explicit header flush or final end, after all inner APG
    // layers have supplied their diagnostic headers but before Node/Vercel commits the response.
    safeSetHeader(res,HEADER_NAME,'v'+VERSION);
    let compacted=false;
    function beforeCommit(){
      if(compacted)return;
      compacted=true;
      const result=compactHomeHeaders(res);
      budgetLog(result,pathname);
    }

    const end=typeof res.end==='function'?res.end.bind(res):null;
    const write=typeof res.write==='function'?res.write.bind(res):null;
    const flushHeaders=typeof res.flushHeaders==='function'?res.flushHeaders.bind(res):null;

    if(write){
      res.write=(chunk,...args)=>{
        beforeCommit();
        return write(chunk,...args);
      };
    }
    if(flushHeaders){
      res.flushHeaders=(...args)=>{
        beforeCommit();
        return flushHeaders(...args);
      };
    }
    if(end){
      res.end=(body,...args)=>{
        beforeCommit();
        return end(body,...args);
      };
    }
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    HOME_RESPONSE_HEADER_BUDGET_VERSION:VERSION,
    HOME_RESPONSE_HEADER_BUDGET_MAX_BYTES:MAX_ESTIMATED_HEADER_BYTES
  });
  return handler;
}

module.exports={
  VERSION,HEADER_NAME,REMOVED_HEADER,BYTES_HEADER,OVER_BUDGET_HEADER,ORIGIN,
  MAX_ESTIMATED_HEADER_BYTES,PRESERVED_HOME_HEADERS,requestPath,headerNames,headerValue,valueText,
  estimatedHeaderBytes,safeSetHeader,safeRemoveHeader,compactHomeHeaders,budgetLog,wrap
};
