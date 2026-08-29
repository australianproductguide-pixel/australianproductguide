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
  assert.equal(smart.VERSION,'1.5');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.5');

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.5');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.5"/);
  assert.match(deals.body,/data-apg-ebay-smart-critical="v1\.5"/);
  assert.match(deals.body,/Explore eBay Australia\. Decide with APG\./);
  assert.match(deals.body,/data-apg-ebay-smart-static="premium-marketplace"/);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/style="position:absolute!important;left:-10000px!important/);

  for(const required of ['ebay-tech.jpg','ebay-home-garden.jpg','ebay-motors.jpg','ebay-sporting-goods.png']){
    assert.match(deals.body,new RegExp('/assets/ebay/official/'+required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.doesNotMatch(deals.body,/ebay-certified-refurbished\.jpg/,'known-invalid creative must not render in premium gallery');
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v15\.js" defer data-apg-ebay-smart-loader="v1\.5"/);
  assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v15\.css"/);

  const ebayIndex=deals.body.indexOf('data-apg-ebay-smart-placement="v1.5"');
  const amazonIndex=deals.body.indexOf('data-amazon-creative-v41="deals"');
  assert.ok(ebayIndex>0&&amazonIndex>ebayIndex);

  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/connect-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);
  assert.match(csp,/style-src[^;]*'unsafe-inline'/i);
  assert.match(csp,/frame-src[^;]*https:\/\/epnt\.ebay\.com/i);

  const loader=await render(smart.LOADER_PATH);
  assert.equal(loader.status,200);
  assert.match(loader.body,/DOMContentLoaded/);
  assert.match(loader.body,/paint-detected/);
  assert.match(loader.body,/dynamic\.style\.cssText/);
  assert.match(loader.body,/epn-smart-tools\.js/);

  const css=await render(smart.CSS_PATH);
  assert.equal(css.status,200);
  assert.match(css.body,/linear-gradient\(135deg,#0b2f59/);
  assert.match(css.body,/color:#ffffff!important/);
  assert.match(css.body,/grid-template-columns:repeat\(2/);
  assert.match(css.body,/width:86px;height:86px/);
  assert.match(css.body,/overflow-x:auto/);

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/);
    assert.doesNotMatch(response.headers['content-security-policy']||'',/https:\/\/epnt\.ebay\.com/i);
  }

  console.log(`EBAY_SMART_PLACEMENT_V15_GREEN config=${smart.CONFIG_ID} route=/deals/ contrastLocked=true validCreativeOnly=true categoryGallery=4 dynamicAugmentOnly=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
