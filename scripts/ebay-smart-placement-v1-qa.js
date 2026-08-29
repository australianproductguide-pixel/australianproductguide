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
  assert.equal(smart.VERSION,'1.4');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.4');

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.4');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.4"/);
  assert.match(deals.body,/data-apg-ebay-smart-critical="v1\.4"/,'critical CSS must be in SSR component');
  assert.match(deals.body,/Explore eBay Australia\. Decide with APG\./);
  assert.match(deals.body,/data-apg-ebay-smart-static="premium-marketplace"/);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/style="position:absolute!important;left:-10000px!important/,'dynamic widget must be fail-safe off-canvas inline');
  assert.match(deals.body,/\/assets\/ebay\/official\/ebay-tech\.jpg/);
  assert.match(deals.body,/\/assets\/ebay\/official\/ebay-certified-refurbished\.jpg/);
  assert.match(deals.body,/\/assets\/ebay\/official\/ebay-home-garden\.jpg/);
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v14\.js" defer data-apg-ebay-smart-loader="v1\.4"/);
  assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v14\.css"/);
  assert.doesNotMatch(deals.body,/src="https:\/\/epnt\.ebay\.com\/static\/epn-smart-tools\.js"/,'third-party script should load only after SSR placement exists');

  const ebayIndex=deals.body.indexOf('data-apg-ebay-smart-placement="v1.4"');
  const amazonIndex=deals.body.indexOf('data-amazon-creative-v41="deals"');
  assert.ok(ebayIndex>0&&amazonIndex>ebayIndex,'eBay spotlight should appear above Amazon creative grid');

  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/connect-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/connect-src[^;]*https:\/\/\*\.ebay\.com\.au/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebaystatic\.com/i);
  assert.match(csp,/style-src[^;]*'unsafe-inline'/i);
  assert.match(csp,/frame-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/frame-src[^;]*https:\/\/\*\.ebay\.com\.au/i);

  const loader=await render(smart.LOADER_PATH);
  assert.equal(loader.status,200);
  assert.match(loader.body,/DOMContentLoaded/);
  assert.match(loader.body,/paint-detected/);
  assert.match(loader.body,/dynamic\.style\.cssText/,'dynamic widget must only enter layout after paint');
  assert.match(loader.body,/epn-smart-tools\.js/);
  assert.doesNotMatch(loader.body,/localStorage|sessionStorage|document\.cookie|decision-lab|searchParams/i);

  const css=await render(smart.CSS_PATH);
  assert.equal(css.status,200);
  assert.match(css.body,/linear-gradient\(135deg,#07152f/);
  assert.match(css.body,/grid-template-columns:repeat\(3/);
  assert.match(css.body,/width:94px;height:94px/);
  assert.match(css.body,/overflow-x:auto/);
  assert.match(css.body,/width:900px/);

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/);
    assert.doesNotMatch(response.headers['content-security-policy']||'',/https:\/\/epnt\.ebay\.com/i);
  }

  console.log(`EBAY_SMART_PLACEMENT_V14_GREEN config=${smart.CONFIG_ID} route=/deals/ criticalCss=true inlineOffCanvas=true premiumMarketplace=true dynamicAugmentOnly=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
