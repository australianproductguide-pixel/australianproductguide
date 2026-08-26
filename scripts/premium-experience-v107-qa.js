'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const premium=require('../lib/premium-experience-v107-runtime');

function render(url){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},
      getHeader(k){return headers[String(k).toLowerCase()]},
      removeHeader(k){delete headers[String(k).toLowerCase()]},
      write(){return true},
      end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')})}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}
function count(text,needle){return (String(text).match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length}

(async()=>{
  assert.equal(app.PREMIUM_EXPERIENCE_VERSION,premium.VERSION,'outer runtime must expose premium experience version');
  assert.match(premium.css,/\.apg-assistant-launcher\{position:fixed;left:20px;right:auto/,'Scout desktop launcher must be bottom-left, not homepage/right constrained');
  assert.match(premium.css,/--apg-premium-gutter:18px/,'standard mobile gutter must be widened to 18px');
  assert.match(premium.css,/--apg-premium-gutter:16px/,'smallest mobile gutter must remain at least 16px');
  assert.match(premium.css,/font-size:16px!important;min-height:44px/,'mobile form controls must avoid microscopic text and iPhone focus zoom');
  assert.match(premium.css,/data-apg-compare-label/,'mobile comparison values must expose product labels');
  assert.match(premium.css,/env\(safe-area-inset-bottom\)/,'sticky controls must respect mobile safe areas');
  assert.match(premium.css,/prefers-reduced-motion:reduce/,'premium layer must respect reduced motion');
  assert.match(premium.clientJs,/table\.compare/,'comparison labelling must progressively enhance existing SSR tables');
  assert.match(premium.clientJs,/Useful next questions/,'Scout must add contextual next-question prompts');
  assert.match(premium.clientJs,/apg-compare-tray-active/,'Scout launcher must move clear of an active compare tray');

  const routes=[
    '/',
    '/search/?q=wireless+headphones',
    '/categories/wireless-headphones/',
    '/products/bose-quietcomfort-ultra-headphones/',
    '/compare/wireless-headphones/',
    '/decision-lab/',
    '/methodology/',
    '/this-route-does-not-exist/'
  ];
  for(const route of routes){
    const response=await render(route);
    assert(response.status===200||response.status===404,`${route} must render a valid document response`);
    assert.equal(response.headers['x-apg-premium-experience'],'v'+premium.VERSION,`${route} must pass through premium experience wrapper`);
    assert(response.body.includes('data-apg-premium-v107="true"'),`${route} must enable premium body contract`);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route} must contain exactly one global Scout launcher`);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1,`${route} must contain exactly one global Scout panel`);
    assert(response.body.includes('/assets/assistant.js'),`${route} must load Scout client behaviour`);
    assert(response.body.includes(premium.CSS_PATH),`${route} must load premium responsive CSS`);
    assert(response.body.includes(premium.JS_PATH),`${route} must load premium progressive enhancement JS`);
  }

  const sample='<!doctype html><html><head></head><body><main>Sample</main></body></html>';
  const once=premium.inject(sample),twice=premium.inject(once);
  assert.equal(count(once,'id="apgAssistantLauncher"'),1,'plain SSR page must receive Scout shell');
  assert.equal(count(twice,'id="apgAssistantLauncher"'),1,'Scout shell injection must be idempotent');
  assert.equal(count(twice,premium.CSS_PATH),1,'premium stylesheet injection must be idempotent');
  assert.equal(count(twice,premium.JS_PATH),1,'premium client injection must be idempotent');

  console.log(JSON.stringify({version:premium.VERSION,status:'PASS',routesChecked:routes.length,checks:{scoutEveryPage:true,bottomLeft:true,mobileGutters:true,inputReadability:true,touchTargets:true,safeAreas:true,compareMobileLabels:true,contextPrompts:true,reducedMotion:true,ssrProgressiveEnhancement:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
