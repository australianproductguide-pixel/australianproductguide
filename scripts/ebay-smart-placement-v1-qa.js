'use strict';
const assert=require('node:assert/strict');
const app=require('../api/index');
const smart=require('../lib/ebay-smart-placement-v1-runtime');
function render(url,method='GET'){return new Promise((resolve,reject)=>{const headers={};const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};const chunks=[];const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},getHeader(k){return headers[String(k).toLowerCase()]},removeHeader(k){delete headers[String(k).toLowerCase()]},write(body=''){chunks.push(String(body||''));return true},end(body=''){chunks.push(String(body||''));resolve({status:this.statusCode,headers,body:chunks.join('')})}};try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject)}catch(e){reject(e)}})}
(async()=>{
  assert.equal(smart.VERSION,'1.6');assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.6');
  const deals=await render('/deals/');assert.equal(deals.status,200);assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.6');assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.6"/);assert.match(deals.body,/Explore eBay Australia\. Decide with APG\./);assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  const smartSection=smart.section();
  for(const required of ['ebay-tech-700x400.webp','ebay-home-garden-700x400.webp','ebay-motors-700x400.webp','ebay-sporting-goods-700x400.webp']){const expected='/assets/ebay/official/v121/'+required;const re=new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));assert.match(smartSection,re);assert.match(deals.body,re);}
  assert.doesNotMatch(smartSection,/certified-refurbished/i);assert.doesNotMatch(smartSection,/Official eBay creative/i);assert.match(deals.body,/style="color:#fff!important;-webkit-text-fill-color:#fff!important"/);assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v16\.js" defer data-apg-ebay-smart-loader="v1\.6"/);assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v16\.css"/);
  const csp=deals.headers['content-security-policy']||'';assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);assert.match(csp,/style-src[^;]*'unsafe-inline'/i);
  const loader=await render(smart.LOADER_PATH);assert.equal(loader.status,200);assert.match(loader.body,/paint-detected/);assert.match(loader.body,/epn-smart-tools\.js/);
  const css=await render(smart.CSS_PATH);assert.equal(css.status,200);assert.match(css.body,/linear-gradient\(135deg,#0b2f59/);assert.match(css.body,/color:#fff!important/);assert.match(css.body,/grid-template-columns:repeat\(2/);
  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){const r=await render(route);assert.doesNotMatch(r.body,/data-apg-ebay-smart-placement=/);}
  console.log(`EBAY_SMART_PLACEMENT_V16_GREEN config=${smart.CONFIG_ID} route=/deals/ highResolutionRegistryAssets=true validatedCategoryCreative=4 dynamicAugmentOnly=true recommendationWeight=0`);
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1)});
