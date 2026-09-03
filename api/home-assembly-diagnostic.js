'use strict';

// Private noindex Home assembly diagnostic. It loads the normal api/index.js assembly and invokes
// one already-built handler boundary at a time. It performs no discovery or outbound network work,
// changes no recommendation or commercial logic, and is retained while the Home availability
// incident remains under post-release observation.
const app=require('./index');
const headerBudget=require('../lib/home-response-header-budget-v132-runtime');

const ORIGIN='https://australianproductguide.au';
const VERSION='3.2';
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
function refreshBudgetMeasurement(res){
  if(!res||res.headersSent===true)return null;
  const bytes=headerBudget.estimatedHeaderBytes(res);
  safeSetHeader(res,headerBudget.BYTES_HEADER,String(bytes));
  if(bytes>headerBudget.MAX_ESTIMATED_HEADER_BYTES)safeSetHeader(res,headerBudget.OVER_BUDGET_HEADER,'true');
  else headerBudget.safeRemoveHeader(res,headerBudget.OVER_BUDGET_HEADER);
  return headerBudget.estimatedHeaderBytes(res);
}
function compactDiagnosticHeaders(res,stage){
  // The exact public homeBudget stage already owns its own pre-commit compaction. Every earlier
  // diagnostic checkpoint receives the same transport-only budget here so Vercel can return the
  // selected stage without historical X-APG observability exceeding the platform response limit.
  // Standard HTTP, CSP, HSTS, cache, content, privacy and noindex headers are never removed.
  let result;
  if(stage==='homeBudget'){
    diagnosticHeaders(res,stage);
    result=Object.freeze({applied:false,reason:'public-home-budget-stage',removed:Number(headerBudget.headerValue(res,headerBudget.REMOVED_HEADER)||0)});
  }else{
    result=headerBudget.compactHomeHeaders(res);
    diagnosticHeaders(res,stage);
  }
  const bytes=refreshBudgetMeasurement(res);
  const summary=Object.freeze({
    applied:Boolean(result&&result.applied),
    reason:result&&result.reason||'diagnostic-header-budget',
    removed:Number(result&&result.removed||0),
    bytes,
    overBudget:Number(bytes)>headerBudget.MAX_ESTIMATED_HEADER_BYTES
  });
  log('BUDGET',stage,JSON.stringify(summary));
  return summary;
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
function installDiagnosticTransport(req,res,stage){
  diagnosticHeaders(res,stage);
  let budgetApplied=false;
  function beforeCommit(){
    if(budgetApplied)return;
    budgetApplied=true;
    compactDiagnosticHeaders(res,stage);
  }

  const nativeEnd=typeof res.end==='function'?res.end.bind(res):null;
  const nativeWrite=typeof res.write==='function'?res.write.bind(res):null;
  const nativeFlushHeaders=typeof res.flushHeaders==='function'?res.flushHeaders.bind(res):null;

  if(nativeWrite){
    res.write=(chunk,...args)=>{
      beforeCommit();
      return nativeWrite(req.method==='HEAD'?'':chunk,...args);
    };
  }
  if(nativeFlushHeaders){
    res.flushHeaders=(...args)=>{
      beforeCommit();
      return nativeFlushHeaders(...args);
    };
  }
  if(nativeEnd){
    res.end=(body,...args)=>{
      beforeCommit();
      log('END',stage,`status=${res.statusCode}`);
      return nativeEnd(req.method==='HEAD'?'':body,...args);
    };
  }
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

  // Install the diagnostic transport before the selected stage can stream or commit a large Home
  // response. The selected stage remains exact; only obsolete public diagnostic headers are
  // compacted at the final response boundary.
  installDiagnosticTransport(req,res,stage);
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

Object.assign(handler,{VERSION,NATIVE_HOME_URL,safeSetHeader,resolveStage,refreshBudgetMeasurement,compactDiagnosticHeaders,installDiagnosticTransport});
module.exports=handler;
