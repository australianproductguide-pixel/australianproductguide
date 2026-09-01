'use strict';

// APG P0 Native Home Bisect v2
// Diagnostic-only harness used while public `/` is protected by the temporary Vercel
// Home -> Search edge redirect. It invokes selected cumulative runtime checkpoints as
// independent serverless requests so the first failing layer can be isolated without
// exposing customers to the broken native Home renderer.
//
// This module does not alter recommendation logic, retailer ranking, affiliate scoring,
// product-image evidence, eBay credentials or eBay Browse usage. It performs no public
// eBay/network discovery. Every diagnostic response is no-store and noindex.

const VERSION='2.0';
const ORIGIN='https://australianproductguide.au';
const HOME_URL='/?__apg_home_diag=1';
const TARGETS=Object.freeze([
  'action5',
  'search104',
  'decision1036',
  'proof103',
  'buying102',
  'action1016',
  'related69',
  'branddeep70',
  'brandvisual69',
  'brandofficial69',
  'brand68',
  'brand67',
  'brand66'
]);

function requestUrl(req){
  try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}
}
function normaliseTarget(value){
  const target=String(value||'').trim().toLowerCase();
  return TARGETS.includes(target)?target:null;
}
function loadTarget(target){
  switch(target){
    case 'action5': return require('./action5-catalogue-certification-v106-runtime');
    case 'search104': return require('./search-opportunity-depth-v104-runtime');
    case 'decision1036': return require('./decision-hard-constraint-fallback-v1036');
    case 'proof103': return require('./apg-proof-rail-runtime-v103');
    case 'buying102': return require('./buying-guide-theme-alignment-v102');
    case 'action1016': return require('./action7-closure-v1016');
    case 'related69': return require('./related-decisions-ui-v69');
    case 'branddeep70': return require('./brand-mark-deep-official-v70');
    case 'brandvisual69': return require('./brand-mark-visual-completion-v69');
    case 'brandofficial69': return require('./brand-mark-official-completion-v69');
    case 'brand68': return require('./brand-mark-completion-v68');
    case 'brand67': return require('./brand-mark-complete-v67');
    case 'brand66': return require('./brand-mark-device-parity-v66');
    default: return null;
  }
}
function applyDiagnosticHeaders(res,target){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-APG-P0-Home-Bisect','v'+VERSION);
  if(target)res.setHeader('X-APG-P0-Home-Bisect-Target',target);
}
function reject(res,status,message){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  applyDiagnosticHeaders(res,null);
  return res.end(JSON.stringify({ok:false,version:VERSION,error:message}));
}
function invokeCheckpoint(req,res,target,checkpoint){
  if(typeof checkpoint!=='function')return reject(res,500,'diagnostic checkpoint unavailable');
  const originalUrl=req.url;
  const originalEnd=res.end.bind(res);
  let ended=false;
  req.url=HOME_URL;
  applyDiagnosticHeaders(res,target);
  res.end=(body,...args)=>{
    ended=true;
    const bytes=body===undefined||body===null?0:Buffer.byteLength(Buffer.isBuffer(body)?body:String(body));
    console.info(`[APG_P0_HOME_BISECT_END] target=${target} status=${res.statusCode} bytes=${bytes}`);
    return originalEnd(body,...args);
  };
  console.info(`[APG_P0_HOME_BISECT_START] target=${target} original=${originalUrl} native=${HOME_URL}`);
  try{
    const result=checkpoint(req,res);
    if(result&&typeof result.then==='function'){
      return Promise.resolve(result).then(value=>{
        console.info(`[APG_P0_HOME_BISECT_RETURN] target=${target} promise=resolved ended=${ended}`);
        return value;
      }).catch(error=>{
        console.error(`[APG_P0_HOME_BISECT_FAILURE] target=${target} phase=returned-promise`,error&&error.stack||error);
        throw error;
      });
    }
    console.info(`[APG_P0_HOME_BISECT_RETURN] target=${target} promise=none ended=${ended}`);
    return result;
  }catch(error){
    console.error(`[APG_P0_HOME_BISECT_FAILURE] target=${target} phase=sync`,error&&error.stack||error);
    throw error;
  }
}
function handler(req,res){
  const method=String(req&&req.method||'GET').toUpperCase();
  if(method!=='GET'&&method!=='HEAD'){
    res.setHeader('Allow','GET, HEAD');
    return reject(res,405,'method not allowed');
  }
  const url=requestUrl(req);
  const target=normaliseTarget(url.searchParams.get('target'));
  if(!target)return reject(res,400,'unknown or missing target');
  const checkpoint=loadTarget(target);
  return invokeCheckpoint(req,res,target,checkpoint);
}

module.exports={
  VERSION,ORIGIN,HOME_URL,TARGETS,requestUrl,normaliseTarget,loadTarget,
  applyDiagnosticHeaders,reject,invokeCheckpoint,handler
};