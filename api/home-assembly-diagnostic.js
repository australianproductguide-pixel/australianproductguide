'use strict';

// Temporary P0 diagnostic endpoint for the native Home serverless incident.
// Public `/` remains governed by the normal Production API fallback. This function loads the
// normal api/index.js assembly (therefore running the same installers) and invokes one already-
// built handler boundary at a time. v3.1 also recomposes the three outer Home delivery wrappers
// around the existing `final` checkpoint so Vercel can identify the exact post-assembly boundary
// that fails. It performs no discovery/network work of its own, changes no recommendation or
// commercial logic, and remains noindex/no-store.
const app=require('./index');
const desktopHomeHeader=require('../lib/desktop-home-header-v126-runtime');
const desktopAboutTrustContrast=require('../lib/desktop-about-trust-contrast-v127-runtime');
const googleDiscoverabilityPerformance=require('../lib/google-discoverability-performance-v128-runtime');

const ORIGIN='https://australianproductguide.au';
const VERSION='3.1';
const NATIVE_HOME_URL='/?__apg_home_diag=1';
const BASE_STAGE_HANDLERS=app.APG_P0_HOME_ASSEMBLY_HANDLERS||{};
const OUTER_STAGE_NAMES=Object.freeze(['desktop-home','desktop-about','delivery']);

if(typeof BASE_STAGE_HANDLERS.final!=='function'){
  throw new TypeError('P0 Home diagnostic requires the established final assembly checkpoint');
}

const desktopHomeHandler=desktopHomeHeader.wrap(BASE_STAGE_HANDLERS.final);
const desktopAboutHandler=desktopAboutTrustContrast.wrap(desktopHomeHandler);
const deliveryHandler=googleDiscoverabilityPerformance.wrap(desktopAboutHandler);
const OUTER_STAGE_HANDLERS=Object.freeze({
  'desktop-home':desktopHomeHandler,
  'desktop-about':desktopAboutHandler,
  delivery:deliveryHandler
});

function diagnosticHeaders(res,stage){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-APG-P0-Home-Assembly-Bisect','v'+VERSION);
  res.setHeader('X-APG-P0-Home-Assembly-Stage',stage);
}
function plain(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  return res.end(body);
}
function log(kind,stage,detail){
  const suffix=detail===undefined?'':` ${detail&&detail.stack?detail.stack:String(detail)}`;
  console.log(`[APG_P0_HOME_ASSEMBLY_${kind}] ${stage}${suffix}`);
}

function handler(req,res){
  let url;
  try{url=new URL(req.url||'/',ORIGIN)}catch{return plain(res,400,'Bad request')}
  if(!['GET','HEAD'].includes(String(req.method||'GET').toUpperCase()))return plain(res,405,'Method not allowed');

  const stage=String(url.searchParams.get('target')||'').trim().toLowerCase();
  const stageHandler=BASE_STAGE_HANDLERS[stage]||OUTER_STAGE_HANDLERS[stage];
  if(typeof stageHandler!=='function')return plain(res,404,'Not found');

  diagnosticHeaders(res,stage);
  const nativeEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    diagnosticHeaders(res,stage);
    log('END',stage,`status=${res.statusCode}`);
    return nativeEnd(req.method==='HEAD'?'':body,...args);
  };
  req.url=`${NATIVE_HOME_URL}&__apg_home_assembly_stage=${encodeURIComponent(stage)}`;
  log('START',stage,`url=${req.url}`);

  try{
    const result=stageHandler(req,res);
    if(result&&typeof result.then==='function'){
      return Promise.resolve(result).then(value=>{
        log('RETURN',stage,`status=${res.statusCode}`);
        return value;
      }).catch(error=>{
        log('FAILURE',stage,error);
        throw error;
      });
    }
    log('RETURN',stage,`status=${res.statusCode}`);
    return result;
  }catch(error){
    log('FAILURE',stage,error);
    throw error;
  }
}

Object.assign(handler,{VERSION,NATIVE_HOME_URL,OUTER_STAGE_NAMES,OUTER_STAGE_HANDLERS});
module.exports=handler;