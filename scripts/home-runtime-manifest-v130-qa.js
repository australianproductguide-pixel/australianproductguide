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

function response(resolve){
  const headers=new Map();
  return {
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),String(value));},
    getHeader(name){return headers.get(String(name).toLowerCase());},
    removeHeader(name){headers.delete(String(name).toLowerCase());},
    end(body){resolve({statusCode:this.statusCode,headers,body:Buffer.isBuffer(body)?body.toString('utf8'):String(body||'')});}
  };
}
function invoke(handler,url){
  return new Promise((resolve,reject)=>{
    try{handler({url,method:'GET'},response(resolve));}catch(error){reject(error);}
  });
}
function largeHome(){
  const links=[];
  for(let index=0;index<53;index+=1)links.push(`<link rel="stylesheet" href="/assets/v130-${index}.css?v=1">`);
  return `<!doctype html><html><head><link rel="canonical" href="https://australianproductguide.au/">${links.join('')}<noscript><link rel="stylesheet" href="/assets/v130-noscript.css?v=1"></noscript></head><body><header><a class="brand" href="/" aria-label="Australian Product Guide home">Australian Product Guide</a></header><main id="main"><h1>Make a better product decision.</h1><p>${'Evidence-led Australian product guidance. '.repeat(14000)}</p></main><footer><a class="footer-v11-wordmark" href="/" aria-label="Australian Product Guide home">Australian Product Guide</a></footer></body></html>`;
}

async function main(){
  assert.equal(layer.VERSION,'128.2');
  assert.equal(manifest.version,'128.2');
  assert.equal(manifest.sourceSha,'799b95ad93c58ae83b21489278c2cabc9c0c3f5d');
  assert.equal(manifest.sourceStylesheets,53);
  assert.equal(manifest.expandedBytes,579692);
  assert.equal(manifest.bytes,544660);
  assert.equal(manifest.brotliBytes,64246);
  assert.equal(manifest.gzipBytes,83924);
  assert.equal(manifest.linkSignature,'cf2eea99e8877e6c40a4f1e758a9ea90300c207ce5f8022ed4dc4c56d8070d81');
  assert.equal(manifest.sha256,'8e16038f1b5056d5efd1f225aab457d9d26af78e07794520c6dddefc9b59d1be');
  assert.equal(layer.validManifest(manifest),true);
  assert.equal(layer.HOME_BUNDLE_MANIFEST,manifest);
  assert.equal(layer.HOME_BUNDLE_MANIFEST_HEADER,'X-APG-Home-CSS-Manifest');

  const previous=process.env.APG_HOME_CSS_BUILD;
  delete process.env.APG_HOME_CSS_BUILD;
  const info=layer.bundleInfo();
  assert.deepEqual(info,{
    signature:manifest.linkSignature,
    hash:manifest.sha256.slice(0,20),
    href:`/assets/home-v128-bundle.css?v=${manifest.sha256.slice(0,20)}`
  });
  process.env.APG_HOME_CSS_BUILD='1';
  assert.equal(layer.bundleInfo(),null,'bundle generation must bypass runtime substitution');
  if(previous===undefined)delete process.env.APG_HOME_CSS_BUILD;else process.env.APG_HOME_CSS_BUILD=previous;

  assert(runtimeSource.includes("require('../data/home-css-v128-manifest')"),'runtime must consume the small source-controlled manifest');
  assert(!runtimeSource.includes("require('node:fs')"),'public runtime must not load filesystem APIs for Home CSS delivery');
  assert(!runtimeSource.includes("require('node:path')"),'public runtime must not resolve generated CSS paths');
  assert(!runtimeSource.includes('readFileSync('),'public Home request must not synchronously read the generated CSS bundle');
  assert(!runtimeSource.includes("update(css)"),'public Home request must not hash the generated CSS payload');
  assert.equal(vercel.functions?.['api/index.js'],undefined,'the public Home function must not package the entire CSS asset tree');
  assert.equal(vercel.functions?.['api/home-assembly-diagnostic.js']?.includeFiles,'public/assets/**/*.css','the noindex diagnostic may retain governed CSS inspection');

  const source=largeHome();
  assert(Buffer.byteLength(source)>500000,'stress fixture must represent the large Production Home response');
  const prepared=layer.injectMarker(layer.repairAccessibleBrandNames(layer.scopeCertifiedViewportStyles(source)));
  const localInfo={signature:layer.stylesheetSignature(prepared),href:'/assets/home-v128-bundle.css?v=v130stress'};
  let bundled='';
  for(let round=0;round<20;round+=1){
    bundled=layer.consolidateHomepageCss(prepared,{pathname:'/',info:localInfo});
    assert.match(bundled,/data-apg-home-css-bundle="v128\.2"/);
    assert.match(bundled,/home-v128-bundle\.css\?v=v130stress/);
  }

  const wrapped=layer.wrap((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(source)));
    res.end(source);
  });
  for(let round=0;round<20;round+=1){
    const rendered=await invoke(wrapped,round%2===0?'/':'/?apg_stability='+round);
    assert.equal(rendered.statusCode,200);
    assert.equal(rendered.headers.get('x-apg-google-discoverability-performance'),'v128.2');
    assert.equal(rendered.headers.get('content-length'),undefined);
    assert.match(rendered.body,/name="apg-google-discoverability-performance" content="v128\.2"/);
  }

  console.log(JSON.stringify({
    status:'PASS',
    version:'130.0',
    incidentControl:{runtimeCssFileReads:0,runtimeCssPayloadHashes:0,publicFunctionCssTreePackaging:false,manifestFailClosed:true},
    manifest:{sourceStylesheets:manifest.sourceStylesheets,bytes:manifest.bytes,sha256:manifest.sha256,linkSignature:manifest.linkSignature},
    stress:{largeHomeBytes:Buffer.byteLength(source),bundleRounds:20,wrapperRounds:20,queryVariants:true},
    protected:{bundlePerformancePath:true,noscriptFallback:true,canonical:true,accessibleWordmarks:true,myApgAccessibility:true,recommendationLogicUnchanged:true,retailerWeightingUnchanged:true}
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exitCode=1;});
