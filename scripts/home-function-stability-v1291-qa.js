'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/google-discoverability-performance-v128-runtime');

const runtimeSource=fs.readFileSync(path.join(__dirname,'..','lib','google-discoverability-performance-v128-runtime.js'),'utf8');

function responseHarness(){
  const headers=new Map();
  let resolveResult;
  const completed=new Promise(resolve=>{resolveResult=resolve;});
  const response={
    statusCode:200,
    headersSent:false,
    setHeader(name,value){
      if(this.headersSent)throw new Error(`setHeader after commit: ${name}`);
      headers.set(String(name).toLowerCase(),String(value));
    },
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){
      if(this.headersSent)throw new Error(`removeHeader after commit: ${name}`);
      headers.delete(String(name).toLowerCase());
    },
    end(body){
      resolveResult({
        statusCode:this.statusCode,
        headers:new Map(headers),
        body:Buffer.isBuffer(body)?body.toString('utf8'):String(body||''),
        headersSent:this.headersSent
      });
      return this;
    }
  };
  return {response,completed,headers};
}

async function invoke(handler,url='/'){
  const harness=responseHarness();
  const result=handler({url,method:'GET'},harness.response);
  if(result&&typeof result.then==='function')await result;
  return harness.completed;
}

async function main(){
  assert.equal(layer.VERSION,'128.2');
  assert.equal(layer.DELIVERY_STABILITY_VERSION,'129.1');
  assert.equal(layer.DELIVERY_STABILITY_HEADER,'X-APG-Delivery-Stability');
  assert.equal(layer.DELIVERY_FALLBACK_HEADER,'X-APG-Delivery-Fallback');
  assert.equal(layer.HOME_BUNDLE_EXPECTED_SIGNATURE,'cf2eea99e8877e6c40a4f1e758a9ea90300c207ce5f8022ed4dc4c56d8070d81');
  assert.equal(layer.HOME_BUNDLE_EXPECTED_HASH,'8e16038f1b5056d5efd1');
  assert.deepEqual(layer.bundleInfo(),layer.HOME_BUNDLE_INFO,'public bundle metadata must be immutable and source-bound');

  assert(!runtimeSource.includes("require('node:fs')"),'public delivery wrapper must not import the filesystem');
  assert(!runtimeSource.includes("require('fs')"),'public delivery wrapper must not import the filesystem');
  assert(!runtimeSource.includes('readFileSync'),'public requests must not read the 500+ KiB Home bundle');
  assert(runtimeSource.includes("res.headersSent!==true"),'delivery mutation must be guarded by header-commit state');
  assert(runtimeSource.includes('APG_DELIVERY_STABILITY_FALLBACK'),'presentation-only transformation failures must be observable');

  let calls=0;
  const normal=layer.wrap((req,res)=>{
    calls+=1;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length','90');
    res.end('<!doctype html><html><head><title>APG</title></head><body><main id="main"><h1>APG</h1></main></body></html>');
  });
  const normalResult=await invoke(normal,'/methodology/');
  assert.equal(calls,1);
  assert.equal(normalResult.statusCode,200);
  assert.equal(normalResult.headers.get('x-apg-google-discoverability-performance'),'v128.2');
  assert.equal(normalResult.headers.get('x-apg-delivery-stability'),'v129.1');
  assert.equal(normalResult.headers.get('content-length'),undefined,'mutated HTML must discard stale Content-Length');
  assert(normalResult.body.includes('name="apg-google-discoverability-performance" content="v128.2"'));

  const committedHtml='<!doctype html><html><head><title>Committed APG</title></head><body><main id="main"><h1>Committed APG</h1></main></body></html>';
  const committed=layer.wrap((req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(committedHtml)));
    res.headersSent=true;
    res.end(committedHtml);
  });
  const committedResult=await invoke(committed,'/');
  assert.equal(committedResult.statusCode,200);
  assert.equal(committedResult.body,committedHtml,'committed responses must pass through unchanged');
  assert.equal(committedResult.headers.get('content-length'),String(Buffer.byteLength(committedHtml)),'committed Content-Length must remain untouched');
  assert.equal(committedResult.headers.get('x-apg-google-discoverability-performance'),'v128.2','observability header must be set before downstream commit');
  assert.equal(committedResult.headers.get('x-apg-delivery-stability'),'v129.1','stability header must be set before downstream commit');
  assert.equal(committedResult.headers.get('x-apg-home-css-bundle'),undefined,'post-commit mutation must not add derived headers');

  let postCommitSetterCalls=0;
  const committedResponse={headersSent:true,setHeader(){postCommitSetterCalls+=1;throw new Error('must not be called');}};
  assert.equal(layer.safeSetHeader(committedResponse,'X-Test','value'),false);
  assert.equal(postCommitSetterCalls,0,'safeSetHeader must not call setHeader after commit');

  const redirect=layer.wrap((req,res)=>{throw new Error('redirect must not invoke downstream');});
  const redirectResult=await invoke(redirect,layer.LEGACY_PRODUCT+'?source=unsafe');
  assert.equal(redirectResult.statusCode,308);
  assert.equal(redirectResult.headers.get('location'),layer.CANONICAL_PRODUCT);
  assert.equal(redirectResult.headers.get('x-apg-delivery-stability'),'v129.1');
  assert.equal(redirectResult.body,'Permanent redirect');

  console.log(JSON.stringify({
    status:'PASS',
    version:layer.DELIVERY_STABILITY_VERSION,
    controls:{
      runtimeFilesystemReads:0,
      sourceBoundBundleMetadata:true,
      headersSetBeforeDownstream:true,
      postCommitMutationBlocked:true,
      committedBodyPassThrough:true,
      presentationFallbackObservable:true,
      canonicalRedirectsPreserved:true
    }
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
