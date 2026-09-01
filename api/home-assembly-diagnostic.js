'use strict';

// Temporary P0 diagnostic endpoint for the 1 Sep 2026 native Home serverless incident.
// Public `/` remains protected by the Vercel edge redirect. This function loads the normal
// api/index.js assembly (therefore running the same installers) and invokes one already-built
// handler boundary at a time. It performs no discovery/network work of its own, changes no
// recommendation/commercial logic, and must be removed with the P0 containment.
const app=require('./index');

const ORIGIN='https://australianproductguide.au';
const VERSION='3.0';
const NATIVE_HOME_URL='/?__apg_home_diag=1';

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
  const stages=app.APG_P0_HOME_ASSEMBLY_HANDLERS||{};
  const stageHandler=stages[stage];
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

Object.assign(handler,{VERSION,NATIVE_HOME_URL});
module.exports=handler;