'use strict';

// Private noindex Home assembly diagnostic. It loads the normal api/index.js assembly and invokes
// one already-built handler boundary at a time. It performs no discovery or outbound network work,
// changes no recommendation or commercial logic, and is retained while the Home availability
// incident remains under post-release observation.
const app=require('./index');

const ORIGIN='https://australianproductguide.au';
const VERSION='3.1';
const NATIVE_HOME_URL='/?__apg_home_diag=1';

function safeSetHeader(res,name,value){
  if(!res||res.headersSent===true||typeof res.setHeader!=='function')return false;
  try{res.setHeader(name,value);return true;}catch{return false;}
}
function diagnosticHeaders(res,stage){
  safeSetHeader(res,'Cache-Control','no-store, max-age=0');
  safeSetHeader(res,'X-Robots-Tag','noindex, nofollow, noarchive');
  safeSetHeader(res,'X-APG-P0-Home-Assembly-Bisect','v'+VERSION);
  safeSetHeader(res,'X-APG-P0-Home-Assembly-Stage',stage);
}
function plain(res,status,body){
  res.statusCode=status;
  safeSetHeader(res,'Content-Type','text/plain; charset=utf-8');
  safeSetHeader(res,'Cache-Control','no-store, max-age=0');
  safeSetHeader(res,'X-Robots-Tag','noindex, nofollow, noarchive');
  return res.end(body);
}
function log(kind,stage,detail){
  const suffix=detail===undefined?'':` ${detail&&detail.stack?detail.stack:String(detail)}`;
  console.log(`[APG_P0_HOME_ASSEMBLY_${kind}] ${stage}${suffix}`);
}
function resolveStage(stages,raw){
  const requested=String(raw||'').trim().toLowerCase();
  if(!requested)return null;
  for(const [name,stageHandler] of Object.entries(stages||{})){
    if(name.toLowerCase()===requested&&typeof stageHandler==='function')return Object.freeze({name,handler:stageHandler});
  }
  return null;
}

function handler(req,res){
  let url;
  try{url=new URL(req.url||'/',ORIGIN)}catch{return plain(res,400,'Bad request')}
  if(!['GET','HEAD'].includes(String(req.method||'GET').toUpperCase()))return plain(res,405,'Method not allowed');

  const stages=app.APG_P0_HOME_ASSEMBLY_HANDLERS||{};
  const resolved=resolveStage(stages,url.searchParams.get('target'));
  if(!resolved)return plain(res,404,'Not found');
  const stage=resolved.name;
  const stageHandler=resolved.handler;

  // Set diagnostic headers before the selected stage can stream or commit a large Home response.
  diagnosticHeaders(res,stage);
  const nativeEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    if(res.headersSent!==true)diagnosticHeaders(res,stage);
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

Object.assign(handler,{VERSION,NATIVE_HOME_URL,safeSetHeader,resolveStage});
module.exports=handler;
