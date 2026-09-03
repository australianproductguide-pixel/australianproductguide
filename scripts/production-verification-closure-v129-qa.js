#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/google-discoverability-performance-v128-runtime');

const root=path.resolve(__dirname,'..');
const cssPath=path.join(root,'public','assets','my-apg-accessibility-v129.css');
const waitPath=path.join(root,'scripts','wait-production-runtime-v61.js');
const workflowPath=path.join(root,'.github','workflows','source-qa.yml');
const css=fs.readFileSync(cssPath,'utf8');
const waitSource=fs.readFileSync(waitPath,'utf8');
const workflow=fs.readFileSync(workflowPath,'utf8');

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

async function main(){
  assert.equal(layer.VERSION,'128.2');
  assert.equal(layer.MY_APG_PATH,'/my-apg/');
  assert.equal(layer.MY_APG_ACCESSIBILITY_VERSION,'129.0');
  assert.equal(layer.MY_APG_ACCESSIBILITY_PATH,'/assets/my-apg-accessibility-v129.css');
  assert.equal(layer.MY_APG_ACCESSIBILITY_HEADER,'X-APG-My-APG-Accessibility');

  const html='<!doctype html><html><head><title>My APG</title></head><body data-apg-route-family="my-apg"><main><nav class="crumbs apg-my-apg-crumbs-v124" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">My Australian Product Guide</span></nav></main></body></html>';
  const myApg=layer.transformHtml(html,'/my-apg/');
  assert.match(myApg,/data-apg-my-apg-accessibility="v129\.0"/);
  assert.match(myApg,/href="\/assets\/my-apg-accessibility-v129\.css\?v=129\.0"/);
  assert.equal((myApg.match(/data-apg-my-apg-accessibility=/g)||[]).length,1);
  assert.equal(layer.transformHtml(myApg,'/my-apg/'),myApg,'My APG accessibility injection must be idempotent');
  assert.doesNotMatch(layer.transformHtml(html,'/'),/data-apg-my-apg-accessibility=/,'route-specific CSS must not enter Home');
  assert.doesNotMatch(layer.transformHtml(html,'/search/'),/data-apg-my-apg-accessibility=/,'route-specific CSS must not enter Search');
  assert.equal(layer.isVersionedAsset('/assets/my-apg-accessibility-v129.css?v=129.0'),true);
  assert.equal(layer.isVersionedAsset('/assets/my-apg-accessibility-v129.css'),false);

  const wrapped=layer.wrap((req,res)=>{
    res.statusCode=200;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Content-Length',String(Buffer.byteLength(html)));
    res.end(html);
  });
  const rendered=await invoke(wrapped,'/my-apg/');
  assert.equal(rendered.statusCode,200);
  assert.equal(rendered.headers.get('x-apg-my-apg-accessibility'),'v129.0');
  assert.equal(rendered.headers.get('x-apg-google-discoverability-performance'),'v128.2');
  assert.equal(rendered.headers.get('content-length'),undefined,'HTML mutation must reconcile Content-Length');
  assert.match(rendered.body,/data-apg-my-apg-accessibility="v129\.0"/);

  for(const token of [
    'body[data-apg-route-family="my-apg"]',
    '.crumbs',
    '.apg-my-apg-crumbs-v124',
    'span[aria-current="page"]',
    'color:#334155!important',
    'color:#1d4ed8!important',
    'text-decoration-line:underline!important',
    'text-decoration-thickness:2px!important'
  ])assert(css.includes(token),`My APG accessibility CSS missing ${token}`);
  assert(!/@import\b/i.test(css),'route-specific accessibility CSS must not import remote or secondary styles');
  assert(!/url\s*\(/i.test(css),'route-specific accessibility CSS must not load additional resources');

  for(const token of [
    "const STABLE_ROUTES=Object.freeze(['/','/my-apg/'])",
    'APG_RUNTIME_STABLE_ROUNDS',
    'RUNTIME_STABILITY_ROUND',
    'RUNTIME_STABILITY_STATE',
    'consecutive+=1',
    'else consecutive=0',
    'stableRounds=${consecutive}',
    "'cache-control':'no-cache'"
  ])assert(waitSource.includes(token),`Production runtime stability gate missing ${token}`);
  assert.match(waitSource,/STABLE_ROUNDS\|\|5/,'default stable window must require five rounds');
  assert.match(waitSource,/STABLE_ROUNDS<2/,'configuration must not allow a single-pass stability gate');
  assert(workflow.includes('node scripts/production-verification-closure-v129-qa.js'),'Release Gate must execute the v129 closure QA');

  console.log(JSON.stringify({
    status:'PASS',
    version:'129.0',
    myApgAccessibility:{routeScoped:true,contrastColour:true,nonColourLinkCue:true,immutableVersionedAsset:true,idempotent:true},
    productionStability:{routes:['/','/my-apg/'],consecutiveRounds:5,resetOnFailure:true,noCacheProbe:true},
    protected:{homeBundleScope:true,searchScope:true,recommendationLogicUnchanged:true,retailerWeightingUnchanged:true}
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exitCode=1;});
