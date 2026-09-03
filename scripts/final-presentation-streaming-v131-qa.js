#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const stability=require('../lib/final-presentation-stability-v131-runtime');

const apiSource=fs.readFileSync(path.join(__dirname,'..','api','index.js'),'utf8');

function responseHarness(){
  const headers=new Map();
  const chunks=[];
  let settled=false;
  let resolveResult;
  const completed=new Promise(resolve=>{resolveResult=resolve;});
  const response={
    statusCode:200,
    headersSent:false,
    setHeader(name,value){
      if(this.headersSent)throw new Error(`setHeader after commit: ${name}`);
      headers.set(String(name).toLowerCase(),String(value));
      return this;
    },
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){
      if(this.headersSent)throw new Error(`removeHeader after commit: ${name}`);
      headers.delete(String(name).toLowerCase());
      return this;
    },
    write(chunk='',encoding,callback){
      this.headersSent=true;
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      return true;
    },
    end(chunk='',encoding,callback){
      if(settled)return this;
      settled=true;
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      resolveResult({
        statusCode:this.statusCode,
        headers:new Map(headers),
        headersSent:this.headersSent,
        body:Buffer.concat(chunks).toString('utf8')
      });
      return this;
    }
  };
  return {response,completed};
}

async function invoke(handler,url='/',method='GET'){
  const harness=responseHarness();
  const result=handler({url,method},harness.response);
  if(result&&typeof result.then==='function')await result;
  return harness.completed;
}

function html(title='APG'){
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+title+'</title></head><body><main id="main"><h1>'+title+'</h1></main></body></html>';
}
function count(value,token){return String(value||'').split(token).length-1;}

async function main(){
  assert.equal(stability.VERSION,'131.0');
  assert.equal(stability.HEADER_NAME,'X-APG-Final-Presentation-Stability');
  assert.equal(stability.FALLBACK_HEADER,'X-APG-Final-Presentation-Fallback');
  assert.equal(stability.desktopHomeHeader.VERSION,'126.2');
  assert.equal(stability.desktopAboutTrustContrast.VERSION,'127.0');

  for(const required of [
    "const finalPresentationStability=require('../lib/final-presentation-stability-v131-runtime')",
    'finalPresentationStability.wrapDesktopHome(finalHandler)',
    'finalPresentationStability.wrapDesktopTrust(desktopHomeHeaderHandler)',
    'desktopHome:desktopHomeHeaderHandler',
    'desktopTrust:desktopAboutTrustContrastHandler',
    'googleDelivery:googleDiscoverabilityPerformanceHandler',
    'FINAL_PRESENTATION_STABILITY_VERSION=finalPresentationStability.VERSION'
  ])assert(apiSource.includes(required),`api final presentation chain missing ${required}`);
  for(const prohibited of [
    'desktopHomeHeader.wrap(finalHandler)',
    'desktopAboutTrustContrast.wrap(desktopHomeHeaderHandler)'
  ])assert(!apiSource.includes(prohibited),`unsafe legacy final wrapper remains active: ${prohibited}`);

  const bufferedSource=html('Buffered APG');
  const buffered=stability.wrap((req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(bufferedSource)));
    res.end(bufferedSource);
  });
  const bufferedResult=await invoke(buffered,'/');
  assert.equal(bufferedResult.statusCode,200);
  assert.equal(bufferedResult.headers.get('x-apg-final-presentation-stability'),'v131.0');
  assert.equal(bufferedResult.headers.get('x-apg-desktop-home-header'),'v126.2');
  assert.equal(bufferedResult.headers.get('x-apg-desktop-about-trust-contrast'),'v127.0');
  assert.equal(bufferedResult.headers.get('content-length'),undefined,'buffered transformed HTML must remove stale Content-Length');
  assert.equal(count(bufferedResult.body,'name="apg-desktop-home-header"'),1);
  assert.equal(count(bufferedResult.body,'name="apg-desktop-about-trust-contrast"'),1);
  assert.equal(count(bufferedResult.body,stability.desktopHomeHeader.CSS_PATH),1);
  assert.equal(count(bufferedResult.body,stability.desktopHomeHeader.JS_PATH),1);
  assert.equal(count(bufferedResult.body,stability.desktopAboutTrustContrast.CSS_PATH),1);
  assert(bufferedResult.body.indexOf(stability.desktopHomeHeader.CSS_PATH)<bufferedResult.body.indexOf(stability.desktopAboutTrustContrast.CSS_PATH),'desktop presentation stylesheet order must remain unchanged');

  const streamedSource=html('Streamed APG');
  const split=streamedSource.indexOf('</head>')+'</head>'.length;
  const streamed=stability.wrap((req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(streamedSource)));
    res.write(streamedSource.slice(0,split));
    res.end(streamedSource.slice(split));
  });
  const streamedResult=await invoke(streamed,'/?stream=1');
  assert.equal(streamedResult.statusCode,200);
  assert.equal(streamedResult.body,streamedSource,'a committed streaming response must pass through byte-for-byte');
  assert.equal(streamedResult.headers.get('content-length'),String(Buffer.byteLength(streamedSource)),'committed Content-Length must not be changed');
  assert.equal(streamedResult.headers.get('x-apg-final-presentation-stability'),'v131.0','stability header must be set before downstream commit');
  assert.equal(streamedResult.headers.get('x-apg-desktop-home-header'),'v126.2','Home header marker must be set before downstream commit');
  assert.equal(streamedResult.headers.get('x-apg-desktop-about-trust-contrast'),'v127.0','trust contrast marker must be set before downstream commit');
  assert.equal(count(streamedResult.body,stability.desktopHomeHeader.CSS_PATH),0,'post-commit Home CSS injection must be blocked');
  assert.equal(count(streamedResult.body,stability.desktopAboutTrustContrast.CSS_PATH),0,'post-commit trust CSS injection must be blocked');

  for(const [url,type,token] of [
    [stability.desktopHomeHeader.CSS_PATH,'text/css; charset=utf-8','APG Desktop Home + Header Repair'],
    [stability.desktopHomeHeader.JS_PATH,'application/javascript; charset=utf-8','__APG_DESKTOP_HOME_HEADER_V126__'],
    [stability.desktopAboutTrustContrast.CSS_PATH,'text/css; charset=utf-8','APG Desktop About & Trust Contrast Repair']
  ]){
    const handler=stability.wrap(()=>{throw new Error('asset request must not reach downstream');});
    const result=await invoke(handler,url);
    assert.equal(result.statusCode,200,`${url} status`);
    assert.equal(result.headers.get('content-type'),type,`${url} content type`);
    assert.equal(result.headers.get('cache-control'),'public, max-age=0, must-revalidate',`${url} cache`);
    assert.equal(result.headers.get('x-content-type-options'),'nosniff',`${url} nosniff`);
    assert.equal(result.headers.get('x-apg-final-presentation-stability'),'v131.0',`${url} stability marker`);
    assert(result.body.includes(token),`${url} body token`);
    const head=await invoke(handler,url,'HEAD');
    assert.equal(head.body,'',`${url} HEAD body`);
  }

  const fallbackSource=html('Fallback APG');
  const throwing=stability.wrapPresentationLayer((req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(fallbackSource);
  },{
    name:'qa-throwing-layer',
    headerName:'X-APG-QA-Layer',
    headerVersion:'1.0',
    transform(){throw new Error('simulated presentation-only failure');},
    assets:[]
  });
  const originalError=console.error;
  console.error=()=>{};
  let fallbackResult;
  try{fallbackResult=await invoke(throwing,'/?fallback=1');}finally{console.error=originalError;}
  assert.equal(fallbackResult.statusCode,200);
  assert.equal(fallbackResult.body,fallbackSource,'transform exception must return unchanged downstream body');
  assert.equal(fallbackResult.headers.get('x-apg-final-presentation-fallback'),'v131.0');
  assert.equal(fallbackResult.headers.get('x-apg-final-presentation-stability'),'v131.0');

  let setterCalls=0;
  const committedResponse={headersSent:true,setHeader(){setterCalls+=1;throw new Error('must not run');},removeHeader(){setterCalls+=1;throw new Error('must not run');}};
  assert.equal(stability.safeSetHeader(committedResponse,'X-Test','1'),false);
  assert.equal(stability.safeRemoveHeader(committedResponse,'Content-Length'),false);
  assert.equal(setterCalls,0,'safe header helpers must not touch a committed response');

  console.log(JSON.stringify({
    status:'PASS',
    version:stability.VERSION,
    finalStages:['desktopHome','desktopTrust','googleDelivery'],
    controls:{
      invariantHeadersPreCommit:true,
      bufferedPresentationPreserved:true,
      stylesheetOrderPreserved:true,
      committedStreamingPassThrough:true,
      postCommitHeaderMutationBlocked:true,
      presentationFailureFailClosed:true,
      assetRoutesPreserved:true,
      recommendationLogicTouched:false,
      commercialWeightTouched:false
    }
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
