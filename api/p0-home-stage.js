'use strict';

// Temporary P0 diagnostic endpoint for the 1 Sep 2026 native Home serverless incident.
// Public `/` remains protected by the Vercel edge redirect. This function is deliberately
// reachable only through one exact hidden route and invokes already-assembled handler stages
// exported as diagnostic metadata by api/index.js. It never changes recommendation, retailer,
// affiliate, image evidence or eBay Browse behaviour and must be removed with P0 containment.
const app=require('./index');

const ORIGIN='https://australianproductguide.au';
const PATH='/__apg-p0-home-stage-20260901';
const VERSION='1.0';
const NATIVE_HOME_URL='/?__apg_home_diag=1';

function diagnosticHeaders(res,stage){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  res.setHeader('X-APG-P0-Home-Stage-Diagnostic','v'+VERSION);
  res.setHeader('X-APG-P0-Home-Stage',stage);
}
function plain(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
  return res.end(body);
}
function log(prefix,stage,detail){
  const suffix=detail===undefined?'':` ${detail&&detail.stack?detail.stack:String(detail)}`;
  console.log(`[APG_P0_HOME_STAGE_${prefix}] ${stage}${suffix}`);
}

function handler(req,res){
  let u;
  try{u=new URL(req.url||'/',ORIGIN)}catch{return plain(res,400,'Bad request')}
  if(u.pathname!==PATH||!['GET','HEAD'].includes(String(req.method||'GET').toUpperCase()))return plain(res,404,'Not found');

  const stage=String(u.searchParams.get('stage')||'').trim().toLowerCase();
  const stages=app.APG_P0_HOME_STAGE_HANDLERS||{};
  const stageHandler=stages[stage];
  if(typeof stageHandler!=='function')return plain(res,404,'Not found');

  diagnosticHeaders(res,stage);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    diagnosticHeaders(res,stage);
    log('END',stage,`status=${res.statusCode}`);
    return end(req.method==='HEAD'?'':body,...args);
  };
  req.url=`${NATIVE_HOME_URL}&__apg_home_stage=${encodeURIComponent(stage)}`;
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

Object.assign(handler,{VERSION,PATH,NATIVE_HOME_URL});
module.exports=handler;