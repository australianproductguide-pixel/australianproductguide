#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const app=require('../api/index');
const runtime=require('../lib/brand-conformity-v351');
const {runtimeChainIncludes}=require('./runtime-chain-qa');

function render(url){return new Promise((resolve,reject)=>{const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},end(body=''){resolve({status:this.statusCode,headers,body:Buffer.isBuffer(body)?body:String(body||'')});}};try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}});}

(async()=>{
  assert.equal(runtime.VERSION,'35.1');
  assert(runtimeChainIncludes('brand-conformity-v351'),'current API runtime chain must include v35.1');
  assert(runtime.css.includes('--apg351-blue:#2563EB'));
  assert(runtime.css.includes('.apg-account-head'));
  const ico=runtime.makeIco();
  assert(Buffer.isBuffer(ico)&&ico.length>100,'favicon.ico must be non-empty');
  assert.equal(ico.subarray(0,6).toString('hex'),'000001000100','ICO header');
  assert.equal(ico.subarray(22,30).toString('hex'),'89504e470d0a1a0a','ICO must embed PNG');

  const home=await render('/');
  assert.equal(home.status,200);
  assert.match(home.body,/data-brand-conformity-v351="true"/);
  assert.match(home.body,/data-brand-conformity-v35="true"/);
  assert.match(home.body,/brand-conformity-v351\.css\?v=35\.1/);
  assert.match(home.body,/favicon\.svg\?v=35\.1/);
  assert.match(home.body,/favicon\.ico\?v=35\.1/);
  assert.match(home.body,/apg-social-card\.png\?v=35\.1/);

  const search=await render('/search/?q=robot+vacuum+for+pet+hair');
  assert.equal(search.status,200);
  assert.match(search.body,/data-brand-conformity-v351="true"/);
  assert.match(search.body,/apg-rv-v43/);

  const account=await render('/my-apg/');
  assert.equal(account.status,200);
  assert.match(account.body,/data-brand-conformity-v351="true"/);
  assert.match(account.body,/My Australian Product Guide/);

  const missing=await render('/this-page-does-not-exist-brand-audit-v351/');
  assert.equal(missing.status,404,'404 status must remain 404');
  assert.match(missing.body,/data-brand-conformity-v351="true"/,'404 must receive final v35.1 marker');
  assert.match(missing.body,/data-brand-conformity-v35="true"/,'404 must receive v35 chain');
  assert.match(missing.body,/data-brand-fidelity-v32="true"/,'404 must receive current identity transform');
  assert.match(missing.body,/apg-brand-v32-lockup/,'404 must use current APG logo');
  assert.doesNotMatch(missing.body,/v7-logo-lockup/,'404 must not retain historical v7 logo');
  assert.match(missing.body,/favicon\.svg\?v=35\.1/);
  assert.match(missing.body,/apg-social-card\.png\?v=35\.1/);
  assert.match(missing.body,/brand-conformity-v351\.css\?v=35\.1/);
  assert.doesNotMatch(missing.body,/assets\/social\.svg/);
  assert.doesNotMatch(missing.body,/fill="#eef8f5"|fill="#f4b45f"/i,'404 must not retain historical logo palette');

  console.log('APG_BRAND_CONFORMITY_V351_QA=PASS');
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
