#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('fs');
const app=require('../api/index');
const runtime=require('../lib/brand-conformity-v352');
const {runtimeChainIncludes}=require('./runtime-chain-qa');

function render(url){return new Promise((resolve,reject)=>{const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},end(body=''){resolve({status:this.statusCode,headers,body:Buffer.isBuffer(body)?body:String(body||'')});}};try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}});}

(async()=>{
  assert.equal(runtime.VERSION,'35.2');
  assert(runtimeChainIncludes('brand-conformity-v352'),'current API runtime chain must include v35.2');
  const css=fs.readFileSync(require.resolve('../public/assets/brand-conformity-v352.css'),'utf8');
  assert(css.includes('--apg352-blue:#2563EB'));
  assert(css.includes('.apg-national-v10'));
  assert(css.includes('.search-suggestions .suggest-thumb'));
  assert(css.includes('.scout-kicker'));
  assert(css.includes('.scout-action.primary'));
  assert(!/#087c76|#08786f|#0b6e6a|#116c67|#176e69|#082f40|#0a5660/i.test(css),'v35.2 override must not reintroduce the retired green/teal UI palette');

  const home=await render('/');
  assert.equal(home.status,200);
  assert.match(home.body,/data-brand-conformity-v352="true"/);
  assert.match(home.body,/data-brand-conformity-v351="true"/);
  assert.match(home.body,/brand-conformity-v352\.css\?v=35\.2/);
  assert.match(home.body,/apg-national-v10/);
  assert.match(home.body,/search-suggestions/);
  assert.match(home.body,/apgAssistantPanel/);

  const search=await render('/search/?q=sony');
  assert.equal(search.status,200);
  assert.match(search.body,/data-brand-conformity-v352="true"/);
  assert.match(search.body,/brand-conformity-v352\.css\?v=35\.2/);

  const missing=await render('/this-page-does-not-exist-brand-audit-v352/');
  assert.equal(missing.status,404);
  assert.match(missing.body,/data-brand-conformity-v352="true"/);
  assert.match(missing.body,/brand-conformity-v352\.css\?v=35\.2/);

  console.log('APG_BRAND_CONFORMITY_V352_QA=PASS');
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
