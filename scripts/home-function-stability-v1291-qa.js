#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/google-discoverability-performance-v128-runtime');
const manifest=require('../data/home-css-v128-manifest');

const root=path.resolve(__dirname,'..');
const runtimeSource=fs.readFileSync(path.join(root,'lib','google-discoverability-performance-v128-runtime.js'),'utf8');
const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));

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

function largeHome(){
  const links=[];
  for(let index=0;index<53;index+=1)links.push(`<link rel="stylesheet" href="/assets/v130-${index}.css?v=1">`);
  return `<!doctype html><html><head><link rel="canonical" href="https://australianproductguide.au/">${links.join('')}<noscript><link rel="stylesheet" href="/assets/v130-noscript.css?v=1"></noscript></head><body><header><a class="brand" href="/" aria-label="Australian Product Guide home">Australian Product Guide</a></header><main id="main"><h1>Make a better product decision.</h1><p>${'Evidence-led Australian product guidance. '.repeat(14000)}</p></main><footer><a class="footer-v11-wordmark" href="/" aria-label="Australian Product Guide home">Australian Product Guide</a></footer></body></html>`;
}

async function main(){
  assert.equal(layer.VERSION,'128.2');
  assert.equal(layer.DELIVERY_STABILITY_VERSION,'130.1');
  assert.equal(layer.DELIVERY_STABILITY_HEADER,'X-APG-Delivery-Stability');
  assert.equal(layer.DELIVERY_FALLBACK_HEADER,'X-APG-Delivery-Fallback');
  assert.equal(layer.HOME_BUNDLE_MANIFEST_HEADER,'X-APG-Home-CSS-Manifest');

  assert.equal(manifest.version,'128.2');
  assert.equal(manifest.sourceSha,'799b95ad93c58ae83b21489278c2cabc9c0c3f5d');
  assert.equal(manifest.sourceStylesheets,53);
  assert.equal(manifest.expandedBytes,579692);
  assert.equal(manifest.bytes,544660);
  assert.equal(manifest.brotliBytes,64246);
  assert.equal(manifest.gzipBytes,83924);
  assert.equal(manifest.linkSignature,'cf2eea99e8877e6c40a4f1e758a9ea90300c207ce5f8022ed4dc4c56d8070d81');
  assert.equal(manifest.sha256,'8e16038f1b5056d5efd1f225aab457d9d26af78e07794520c6dddefc9b59d1be');
  assert.equal(layer.HOME_BUNDLE_MANIFEST,manifest);
  assert.equal(layer.validManifest(manifest),true);
  assert.equal(layer.validManifest({...manifest,bytes:1}),false,'undersized manifest must fail closed');
  assert.equal(layer.validManifest({...manifest,linkSignature:'not-a-hash'}),false,'invalid signature must fail closed');

  const previous=process.env.APG_HOME_CSS_BUILD;
  delete process.env.APG_HOME_CSS_BUILD;
  assert.deepEqual(layer.bundleInfo(),{
    signature:manifest.linkSignature,
    hash:manifest.sha256.slice(0,20),
    href:`/assets/home-v128-bundle.css?v=${manifest.sha256.slice(0,20)}`
  });
  process.env.APG_HOME_CSS_BUILD='1';
  assert.equal(layer.bundleInfo(),null,'bundle generation must bypass runtime substitution');
  if(previous===undefined)delete process.env.APG_HOME_CSS_BUILD;else process.env.APG_HOME_CSS_BUILD=previous;

  assert(runtimeSource.includes("require('../data/home-css-v128-manifest')"),'runtime must consume the small source-controlled manifest');
  assert(!runtimeSource.includes("require('node:fs')"),'public delivery wrapper must not import the filesystem');
  assert(!runtimeSource.includes("require('fs')"),'public delivery wrapper must not import the filesystem');
  assert(!runtimeSource.includes("require('node:path')"),'public delivery wrapper must not resolve the generated CSS path');
  assert(!runtimeSource.includes('readFileSync'),'public requests must not read the 500+ KiB Home bundle');
  assert(runtimeSource.includes("res.headersSent!==true"),'delivery mutation must be guarded by header-commit state');
  assert(runtimeSource.includes('APG_DELIVERY_STABILITY_FALLBACK'),'presentation-only transformation failures must be observable');
  assert.equal(vercel.functions?.['api/index.js'],undefined,'public Home function must not package the complete CSS asset tree');
  assert.equal(vercel.functions?.['api/home-assembly-diagnostic.js']?.includeFiles,'public/assets/**/*.css','private noindex diagnostic may retain governed CSS inspection');

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
  assert.equal(normalResult.headers.get('x-apg-delivery-stability'),'v130.1');
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
  assert.equal(committedResult.headers.get('x-apg-delivery-stability'),'v130.1','stability header must be set before downstream commit');
  assert.equal(committedResult.headers.get('x-apg-home-css-bundle'),undefined,'post-commit mutation must not add derived headers');

  let postCommitSetterCalls=0;
  const committedResponse={headersSent:true,setHeader(){postCommitSetterCalls+=1;throw new Error('must not be called');}};
  assert.equal(layer.safeSetHeader(committedResponse,'X-Test','value'),false);
  assert.equal(postCommitSetterCalls,0,'safeSetHeader must not call setHeader after commit');

  const fallbackHtml='<!doctype html><html><head><title>Fallback</title></head><body><main id="main"><h1>Fallback</h1></main></body></html>';
  const fallback=layer.wrap((req,res)=>{
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.getHeader=()=>{throw new Error('simulated presentation boundary fault');};
    res.end(fallbackHtml);
  });
  const originalError=console.error;
  console.error=()=>{};
  let fallbackResult;
  try{fallbackResult=await invoke(fallback,'/');}finally{console.error=originalError;}
  assert.equal(fallbackResult.statusCode,200);
  assert.equal(fallbackResult.body,fallbackHtml,'presentation failure must return the unchanged downstream body');
  assert.equal(fallbackResult.headers.get('x-apg-delivery-fallback'),'v130.1','presentation fallback must be observable');

  const source=largeHome();
  assert(Buffer.byteLength(source)>500000,'stress fixture must represent the large Production Home response');
  const prepared=layer.injectMarker(layer.repairAccessibleBrandNames(layer.scopeCertifiedViewportStyles(source)));
  const localInfo={signature:layer.stylesheetSignature(prepared),href:'/assets/home-v128-bundle.css?v=v130stress'};
  for(let round=0;round<20;round+=1){
    const bundled=layer.consolidateHomepageCss(prepared,{pathname:'/',info:localInfo});
    assert.match(bundled,/data-apg-home-css-bundle="v128\.2"/);
    assert.match(bundled,/home-v128-bundle\.css\?v=v130stress/);
  }

  const stress=layer.wrap((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(source)));
    res.end(source);
  });
  for(let round=0;round<20;round+=1){
    const rendered=await invoke(stress,round%2===0?'/':'/?apg_stability='+round);
    assert.equal(rendered.statusCode,200);
    assert.equal(rendered.headers.get('x-apg-google-discoverability-performance'),'v128.2');
    assert.equal(rendered.headers.get('x-apg-delivery-stability'),'v130.1');
    assert.equal(rendered.headers.get('content-length'),undefined);
    assert.match(rendered.body,/name="apg-google-discoverability-performance" content="v128\.2"/);
  }

  const redirect=layer.wrap((req,res)=>{throw new Error('redirect must not invoke downstream');});
  const redirectResult=await invoke(redirect,layer.LEGACY_PRODUCT+'?source=unsafe');
  assert.equal(redirectResult.statusCode,308);
  assert.equal(redirectResult.headers.get('location'),layer.CANONICAL_PRODUCT);
  assert.equal(redirectResult.headers.get('x-apg-delivery-stability'),'v130.1');
  assert.equal(redirectResult.body,'Permanent redirect');

  console.log(JSON.stringify({
    status:'PASS',
    version:layer.DELIVERY_STABILITY_VERSION,
    incidentControl:{
      runtimeCssFileReads:0,
      runtimeCssPayloadHashes:0,
      publicFunctionCssTreePackaging:false,
      sourceBoundManifest:true,
      manifestFailClosed:true
    },
    stress:{largeHomeBytes:Buffer.byteLength(source),bundleRounds:20,wrapperRounds:20,queryVariants:true},
    controls:{
      headersSetBeforeDownstream:true,
      postCommitMutationBlocked:true,
      committedBodyPassThrough:true,
      presentationFallbackObservable:true,
      canonicalRedirectsPreserved:true
    }
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
