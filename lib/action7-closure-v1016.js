'use strict';

// v101.6 is a narrow transport-safe closure over v101.5. Decision Lab's legacy SSR
// path may emit HTML through res.write before res.end; buffer only that route so the
// evidence-parity reconciliation is applied to the complete response rather than a
// final fragment. No recommendation, account, retailer or analytics architecture changes.
const downstream=require('./action7-closure-v1015');
const VERSION='101.6';
const ORIGIN='https://australianproductguide.au';

function certificationSnapshot(){
  const base=downstream.certificationSnapshot?downstream.certificationSnapshot():{};
  return {...base,version:VERSION,closure:{...(base.closure||{}),decisionLabCompleteResponseParity:true,renderedOutputRegression:'action7-decision-lab-render-v1015',newRecurringPaidCostAUD:0}};
}
function handler(req,res){
  let url;try{url=new URL(req.url||'/',ORIGIN)}catch{url=new URL('/',ORIGIN)}
  const path=url.pathname;
  const originalSetHeader=res.setHeader?res.setHeader.bind(res):()=>{};
  const originalEnd=res.end?res.end.bind(res):()=>{};
  const originalWrite=res.write?res.write.bind(res):null;
  res.setHeader=function(name,value){
    if(String(name).toLowerCase()==='x-apg-action7-scout-decision')return originalSetHeader(name,'v'+VERSION);
    return originalSetHeader(name,value);
  };
  originalSetHeader('X-APG-Action7-Scout-Decision','v'+VERSION);
  if(path==='/api/intelligence/action7'||path==='/api/intelligence/action7/'){
    res.statusCode=200;originalSetHeader('Content-Type','application/json; charset=utf-8');originalSetHeader('Cache-Control','no-store');return originalEnd(JSON.stringify(certificationSnapshot()));
  }
  if(path!=='/decision-lab/')return downstream(req,res);
  let buffered='';
  if(originalWrite)res.write=function(chunk){buffered+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk||'');return true;};
  res.end=function(body){
    buffered+=Buffer.isBuffer(body)?body.toString('utf8'):String(body||'');
    let next=buffered;
    const contentType=String((res.getHeader&&res.getHeader('content-type'))||'');
    const looksJson=/application\/json/i.test(contentType)||/^\s*\{/.test(next);
    if(looksJson){try{next=JSON.stringify(downstream.reconcileDecisionPayload(JSON.parse(next),url.href))}catch{}}
    else next=downstream.reconcileDecisionHtml(next,url.href);
    if(res.removeHeader)res.removeHeader('content-length');
    return originalEnd(next);
  };
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,action7ClosureVersion:VERSION,certificationSnapshot});
module.exports=handler;
