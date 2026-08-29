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
  assert.equal(smart.VERSION,'1.3');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.3');
  assert.equal(smart.TECH.image,'/assets/ebay/official/ebay-tech.jpg');
  assert.match(smart.TECH.destination,/ebay\.com\.au/);
  assert.match(smart.TECH.destination,/campid=5339198634/);

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.3');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.3"/);
  assert.match(deals.body,/data-apg-ebay-load-state="ssr-ready"/);
  assert.match(deals.body,/data-apg-ebay-smart-static="official-tech"/);
  assert.match(deals.body,/Explore electronics on eBay Australia/);
  assert.match(deals.body,/\/assets\/ebay\/official\/ebay-tech\.jpg/);
  assert.match(deals.body,/Browse electronics on eBay Australia/);
  assert.match(deals.body,/campid=5339198634/);
  assert.match(deals.body,/Paid retailer content\./);
  assert.match(deals.body,/Marketplace discovery, not an APG recommendation/);
  assert.match(deals.body,/data-apg-ebay-smart-dynamic="true"/);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v1\.js" defer data-apg-ebay-smart-loader="v1\.3"/);
  assert.doesNotMatch(deals.body,/src="https:\/\/epnt\.ebay\.com\/static\/epn-smart-tools\.js"/,'third-party script should remain progressive client enhancement');

  const spotlightIndex=deals.body.indexOf('data-apg-ebay-smart-placement="v1.3"');
  const amazonCreativeIndex=deals.body.indexOf('class="section apg-amz-v41 apg-amz-v41-deals"');
  assert(spotlightIndex>-1&&amazonCreativeIndex>-1&&spotlightIndex<amazonCreativeIndex,'premium eBay marketplace spotlight must appear high on Deals before the Amazon visual shortcut surface');

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
  assert.match(loader.body,/MutationObserver/);
  assert.match(loader.body,/placement-ready/);
  assert.match(loader.body,/paint-detected/);
  assert.match(loader.body,/static-fallback/);
  assert.match(loader.body,/epn-smart-tools\.js/);
  assert.doesNotMatch(loader.body,/localStorage|sessionStorage|document\.cookie|decision-lab|searchParams/i);

  const css=await render(smart.CSS_PATH);
  assert.match(css.body,/apg-ebay-smart-placement__shell/);
  assert.match(css.body,/linear-gradient/);
  assert.match(css.body,/border-radius:26px/);
  assert.match(css.body,/data-apg-ebay-load-state="paint-detected"/);
  assert.match(css.body,/overflow-x:auto/);
  assert.match(css.body,/width:900px/);
  assert.match(css.body,/@media\(max-width:900px\)/);
  assert.match(css.body,/@media\(max-width:540px\)/);

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/);
    assert.doesNotMatch(response.headers['content-security-policy']||'',/https:\/\/epnt\.ebay\.com/i);
  }

  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','ebay-smart-placement-v1-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','recommendationWeight=','commissionWeight'])assert(!source.includes(banned),`Smart Placement must remain outside decision scoring: ${banned}`);

  console.log(`EBAY_SMART_PLACEMENT_V13_GREEN config=${smart.CONFIG_ID} route=/deals/ staticFailSafe=true officialTechCreative=true dynamicProgressive=true highPlacement=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
