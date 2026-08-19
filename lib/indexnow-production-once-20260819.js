'use strict';

const https=require('https');
const app=require('./entity-discovery-v1');
const {indexableRoutes}=require('./routes');
const {CANONICAL_ORIGIN}=require('./discoverability-v1');
const {INDEXNOW_KEY,INDEXNOW_KEY_PATH}=require('./indexnow-key-v1');

const OPS_PATH='/ops/indexnow-release-20260819-8cabfa1';
const CONFIRM='owner-approved-8cabfa1';
const RELEASE_COMMIT='8cabfa1737fd94e6218073af84471b648aca5416';

function sendJson(res,status,value){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  return res.end(JSON.stringify(value));
}

function submit(){
  const urlList=indexableRoutes.map(path=>CANONICAL_ORIGIN+path);
  const payload={host:new URL(CANONICAL_ORIGIN).hostname,key:INDEXNOW_KEY,keyLocation:CANONICAL_ORIGIN+INDEXNOW_KEY_PATH,urlList};
  const body=JSON.stringify(payload);
  return new Promise((resolve,reject)=>{
    const request=https.request('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body)}},response=>{
      let text='';
      response.on('data',chunk=>text+=chunk);
      response.on('end',()=>resolve({statusCode:response.statusCode,body:text||''}));
    });
    request.on('error',reject);
    request.write(body);
    request.end();
  });
}

module.exports=async(req,res)=>{
  let url;
  try{url=new URL(req.url,'https://australianproductguide.au');}
  catch{return app(req,res);}
  if(url.pathname!==OPS_PATH)return app(req,res);
  if(process.env.VERCEL_ENV!=='production')return sendJson(res,404,{ok:false,error:'production-release-only'});
  if(url.searchParams.get('confirm')!==CONFIRM)return sendJson(res,403,{ok:false,error:'confirmation-required'});
  try{
    const result=await submit();
    const accepted=[200,202].includes(result.statusCode);
    return sendJson(res,accepted?200:502,{ok:accepted,releaseCommit:RELEASE_COMMIT,canonicalRouteCount:indexableRoutes.length,indexNowStatus:result.statusCode,indexNowBody:result.body||null,keyLocation:CANONICAL_ORIGIN+INDEXNOW_KEY_PATH});
  }catch(error){
    return sendJson(res,502,{ok:false,error:error.message});
  }
};
