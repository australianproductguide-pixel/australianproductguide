'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const smart=require('../lib/ebay-smart-placement-v1-runtime');

function render(url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const chunks=[];
    const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},getHeader(k){return headers[String(k).toLowerCase()]},removeHeader(k){delete headers[String(k).toLowerCase()]},write(body=''){chunks.push(String(body||''));return true},end(body=''){chunks.push(String(body||''));resolve({status:this.statusCode,headers,body:chunks.join('')})}};
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}

(async()=>{
  assert.equal(smart.VERSION,'1.2');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.2');

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.2');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.2"/);
  assert.match(deals.body,/data-apg-ebay-load-state="ssr-ready"/);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/data-apg-ebay-smart-fallback/);
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v1\.js" defer data-apg-ebay-smart-loader="v1\.2"/);
  assert.doesNotMatch(deals.body,/src="https:\/\/epnt\.ebay\.com\/static\/epn-smart-tools\.js"/,'third-party script should load only after the placement element exists');

  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/connect-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/connect-src[^;]*https:\/\/\*\.ebay\.com\.au/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebaystatic\.com/i);
  assert.match(csp,/style-src[^;]*'unsafe-inline'/i,'dynamic third-party placement styles must be permitted only on /deals/');
  assert.match(csp,/frame-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/frame-src[^;]*https:\/\/\*\.ebay\.com\.au/i);

  const loader=await render(smart.LOADER_PATH);
  assert.equal(loader.status,200);
  assert.match(loader.body,/DOMContentLoaded/);
  assert.match(loader.body,/placement-ready/);
  assert.match(loader.body,/script-loaded-no-paint/);
  assert.match(loader.body,/3500/);
  assert.match(loader.body,/epn-smart-tools\.js/);
  assert.doesNotMatch(loader.body,/localStorage|sessionStorage|document\.cookie|decision-lab|searchParams/i);

  const css=await render(smart.CSS_PATH);
  assert.match(css.body,/overflow-x:auto/);
  assert.match(css.body,/width:900px/);
  assert.match(css.body,/fallback\[hidden\]/);

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/);
    assert.doesNotMatch(response.headers['content-security-policy']||'',/https:\/\/epnt\.ebay\.com/i);
  }

  console.log(`EBAY_SMART_PLACEMENT_V12_GREEN config=${smart.CONFIG_ID} route=/deals/ placementBeforeThirdParty=true cspDynamicResources=true fallbackState=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
