'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const smart=require('../lib/ebay-smart-placement-v1-runtime');

function render(url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const chunks=[];
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},
      getHeader(k){return headers[String(k).toLowerCase()]},
      removeHeader(k){delete headers[String(k).toLowerCase()]},
      write(body=''){chunks.push(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''));return true},
      end(body=''){chunks.push(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''));resolve({status:this.statusCode,headers,body:chunks.join('')})}
    };
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}

(async()=>{
  assert.equal(smart.VERSION,'1.0');
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056','Owner-supplied Smart Placement configuration must remain exact');
  assert.equal(smart.SMART_TOOLS_SRC,'https://epnt.ebay.com/static/epn-smart-tools.js');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.0','public handler must expose Smart Placement pilot version');

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.0');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.0"/);
  assert.match(deals.body,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(deals.body,/More electronics options on eBay Australia/);
  assert.match(deals.body,/separate from APG recommendations/i);
  assert.match(deals.body,/Paid marketplace content\./);
  assert.match(deals.body,/participation and commission do not influence APG product suitability, ranking or recommendations/i);
  assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v1\.css"/);
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v1\.js" defer/);
  assert.doesNotMatch(deals.body,/src="https:\/\/epnt\.ebay\.com\/static\/epn-smart-tools\.js"/,'Third-party Smart Tools script must be loaded by the same-origin gated loader rather than SSR HTML');
  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i,'Deals CSP must permit the approved eBay Smart Tools origin');
  assert.match(csp,/connect-src[^;]*https:\/\/epnt\.ebay\.com/i,'Deals CSP must scope eBay network permission to the pilot route');
  assert.match(csp,/img-src[^;]*https:\/\/i\.ebayimg\.com/i,'Deals CSP must permit eBay listing imagery used by the widget');

  for(const route of ['/','/categories/','/products/sony-wh-1000xm6/','/decision-lab/']){
    const response=await render(route);
    assert.doesNotMatch(response.body,/data-apg-ebay-smart-placement=/,`${route} must not render Smart Placement`);
    assert.doesNotMatch(response.body,/001370a99f586b44ba848056/,`${route} must not expose Smart Placement config`);
    assert.doesNotMatch(response.headers['content-security-policy']||'',/https:\/\/epnt\.ebay\.com/i,`${route} must not widen CSP for Smart Placement`);
  }

  const css=await render(smart.CSS_PATH);
  assert.equal(css.status,200);
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.match(css.body,/@media\(max-width:959px\)\{\.apg-ebay-smart-placement\{display:none\}\}/,'900x220 pilot must stay off mobile widths');
  assert.match(css.body,/width:900px/);

  const loader=await render(smart.LOADER_PATH);
  assert.equal(loader.status,200);
  assert.equal(loader.headers['content-type'],'application/javascript; charset=utf-8');
  assert.match(loader.body,/min-width: 960px/,'Smart Tools must only load for the desktop pilot');
  assert.match(loader.body,/https:\/\/epnt\.ebay\.com\/static\/epn-smart-tools\.js/);
  assert.doesNotMatch(loader.body,/localStorage|sessionStorage|document\.cookie|decision-lab|searchParams/i,'APG loader must not send browser state, decision state or search parameters to eBay');

  const privacy=await render('/privacy/');
  assert.match(privacy.body,/data-apg-ebay-smart-privacy="true"/);
  assert.match(privacy.body,/technical browser, device and interaction information/i);
  assert.match(privacy.body,/does not pass a signed-in account identifier, search query, Decision Lab answers or other APG decision-state fields/i);

  const affiliate=await render('/affiliate-disclosure/');
  assert.match(affiliate.body,/data-apg-ebay-smart-disclosure="true"/);
  assert.match(affiliate.body,/zero points to APG product suitability or retailer ranking/i);

  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','ebay-smart-placement-v1-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','recommendationWeight=','commissionWeight'])assert(!source.includes(banned),`Smart Placement must remain outside decision scoring: ${banned}`);

  console.log(`EBAY_SMART_PLACEMENT_V1_GREEN config=${smart.CONFIG_ID} route=/deals/ desktopOnly=true recommendationWeight=0 csp=route-scoped disclosures=PASS`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
