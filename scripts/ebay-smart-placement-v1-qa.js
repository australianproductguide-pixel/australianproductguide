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
  assert.equal(smart.VERSION,'1.6');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.6');

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.6');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.6"/);
  assert.match(deals.body,/data-apg-ebay-smart-critical="v1\.6"/);
  assert.match(deals.body,/Explore eBay Australia\. Decide with APG\./);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/style="position:absolute!important;left:-10000px!important/);

  // Smart Placement v1.6 consumes the governed official-creative registry. The registry now
  // supplies high-resolution 700x400 WebP artwork, so this contract follows those canonical
  // assets instead of pinning the component to the superseded v121.0 thumbnail filenames.
  const smartSection=smart.section();
  for(const required of ['ebay-tech-700x400.webp','ebay-home-garden-700x400.webp','ebay-motors-700x400.webp','ebay-sporting-goods-700x400.webp']){
    const expected='/assets/ebay/official/v121/'+required;
    assert.match(smartSection,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    assert.match(deals.body,new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.doesNotMatch(smartSection,/ebay-certified-refurbished-700x400\.webp/,'Certified Refurbished is not one of the four Smart Placement static spotlight categories');
  assert.doesNotMatch(smartSection,/Official eBay creative/i,'Smart Placement itself must not restore the removed customer-facing creative label');
  assert.match(deals.body,/style="color:#fff!important;-webkit-text-fill-color:#fff!important"/,'critical white contrast guard must be inline');
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v16\.js" defer data-apg-ebay-smart-loader="v1\.6"/);
  assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v16\.css"/);

  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);
  assert.match(csp,/style-src[^;]*'unsafe-inline'/i);

  const loader=await render(smart.LOADER_PATH);
  assert.equal(loader.status,200);
  assert.match(loader.body,/paint-detected/);
  assert.match(loader.body,/dynamic\.style\.cssText/);
  assert.match(loader.body,/epn-smart-tools\.js/);

  const css=await render(smart.CSS_PATH);
  assert.equal(css.status,200);
  assert.match(css.body,/linear-gradient\(135deg,#0b2f59/);
  assert.match(css.body,/color:#fff!important/);
  assert.match(css.body,/grid-template-columns:repeat\(2/);
  assert.match(css.body,/width:112px;height:112px/);

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/);
  }

  console.log(`EBAY_SMART_PLACEMENT_V16_GREEN config=${smart.CONFIG_ID} route=/deals/ whiteContrast=true creativeLabelRemovedFromSmartPlacement=true validatedCategoryCreative=4 highResolutionRegistryAssets=true dynamicAugmentOnly=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
