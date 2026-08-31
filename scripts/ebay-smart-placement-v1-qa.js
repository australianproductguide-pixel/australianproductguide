'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const smart=require('../lib/ebay-smart-placement-route-scope-v17-runtime');

function render(url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const chunks=[];
    const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},getHeader(k){return headers[String(k).toLowerCase()]},removeHeader(k){delete headers[String(k).toLowerCase()]},write(body=''){chunks.push(String(body||''));return true},end(body=''){chunks.push(String(body||''));resolve({status:this.statusCode,headers,body:chunks.join('')})}};
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}

function extractSpotlight(html){
  const marker='data-apg-ebay-smart-placement="v1.6"';
  const markerIndex=html.indexOf(marker);
  assert.ok(markerIndex>0,'v1.6 spotlight marker must exist');
  const start=html.lastIndexOf('<section',markerIndex);
  const end=html.indexOf('</section>',markerIndex);
  assert.ok(start>=0&&end>start,'v1.6 spotlight section must be extractable');
  return html.slice(start,end+'</section>'.length);
}

function responseSemanticsProbe(url){
  let nativeWriteCalls=0,nativeEndCalls=0,body='';
  const headers={};
  const req={url,method:'GET',headers:{host:'australianproductguide.au'}};
  const res={
    statusCode:200,
    setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},
    getHeader(k){return headers[String(k).toLowerCase()]},
    removeHeader(k){delete headers[String(k).toLowerCase()]},
    write(chunk=''){nativeWriteCalls+=1;body+=String(chunk||'');return true},
    end(chunk=''){nativeEndCalls+=1;body+=String(chunk||'');return body}
  };
  const downstream=(_req,_res)=>{_res.setHeader('Content-Type','text/plain; charset=utf-8');_res.write('alpha');return _res.end('omega')};
  const handler=smart.wrap(downstream);
  handler(req,res);
  return {nativeWriteCalls,nativeEndCalls,body,headers};
}

(async()=>{
  assert.equal(smart.VERSION,'1.6');
  assert.equal(smart.ROUTE_SCOPE_VERSION,'1.0');
  assert.deepEqual([...smart.TARGET_PATHS].sort(),['/affiliate-disclosure/','/deals/','/privacy/']);
  assert.equal(smart.CONFIG_ID,'001370a99f586b44ba848056');
  assert.equal(app.EBAY_SMART_PLACEMENT_VERSION,'1.6');
  assert.equal(app.EBAY_SMART_PLACEMENT_ROUTE_SCOPE_VERSION,'1.0');

  // P0 transport contract: Home and every unrelated route must preserve the downstream response
  // object's native write/end behaviour. The legacy Smart Placement buffering wrapper must never
  // own those responses merely because the module is installed globally under Navigator.
  for(const route of ['/','/search/?q=coffee','/categories/coffee-machines/','/products/sony-wh-1000xm6/','/compare/','/decision-lab/']){
    const probe=responseSemanticsProbe(route);
    assert.equal(probe.nativeWriteCalls,1,`${route} must pass native res.write through Smart Placement unchanged`);
    assert.equal(probe.nativeEndCalls,1,`${route} must pass native res.end through Smart Placement unchanged`);
    assert.equal(probe.body,'alphaomega');
    assert.equal(probe.headers['x-apg-ebay-smart-placement'],undefined,`${route} must not claim Smart Placement response ownership`);
    assert.equal(smart.requiresSmartPlacementInterception(new URL(route,'https://australianproductguide.au').pathname),false);
  }
  for(const route of ['/deals/','/affiliate-disclosure/','/privacy/'])assert.equal(smart.requiresSmartPlacementInterception(route),true,`${route} must retain Smart Placement presentation ownership`);

  const deals=await render('/deals/');
  assert.equal(deals.status,200);
  assert.equal(deals.headers['x-apg-ebay-smart-placement'],'v1.6');
  assert.match(deals.body,/data-apg-ebay-smart-placement="v1\.6"/);
  assert.match(deals.body,/data-apg-ebay-smart-critical="v1\.6"/);
  assert.match(deals.body,/src="\/assets\/ebay-smart-placement-v16\.js" defer data-apg-ebay-smart-loader="v1\.6"/);
  assert.match(deals.body,/href="\/assets\/ebay-smart-placement-v16\.css"/);

  const spotlight=extractSpotlight(deals.body);
  assert.match(spotlight,/Explore eBay Australia\. Decide with APG\./);
  assert.match(spotlight,/data-config-id="001370a99f586b44ba848056"/);
  assert.match(spotlight,/style="position:absolute!important;left:-10000px!important/);

  for(const required of ['ebay-tech.jpg','ebay-home-garden.jpg','ebay-motors.jpg','ebay-sporting-goods.png']){
    assert.match(spotlight,new RegExp('/assets/ebay/official/'+required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
  assert.doesNotMatch(spotlight,/ebay-certified-refurbished\.jpg/,'known-invalid creative must not render inside v1.6 spotlight');
  assert.doesNotMatch(spotlight,/Official eBay creative/i,'removed customer-facing label must not return inside v1.6 spotlight');
  assert.match(spotlight,/style="color:#fff!important;-webkit-text-fill-color:#fff!important"/,'critical white contrast guard must be inline');

  const csp=deals.headers['content-security-policy']||'';
  assert.match(csp,/script-src[^;]*https:\/\/epnt\.ebay\.com/i);
  assert.match(csp,/img-src[^;]*https:\/\/\*\.ebayimg\.com/i);
  assert.match(csp,/style-src[^;]*'unsafe-inline'/i);

  const disclosure=await render('/affiliate-disclosure/');
  assert.equal(disclosure.status,200);
  assert.match(disclosure.body,/data-apg-ebay-smart-disclosure="true"/);
  const privacy=await render('/privacy/');
  assert.equal(privacy.status,200);
  assert.match(privacy.body,/data-apg-ebay-smart-privacy="true"/);

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
    assert.equal(response.headers['x-apg-ebay-smart-placement'],undefined,`${route} must bypass Smart Placement transport ownership`);
  }

  console.log(`EBAY_SMART_PLACEMENT_V16_GREEN config=${smart.CONFIG_ID} route=/deals/ routeScope=${smart.ROUTE_SCOPE_VERSION} nonTargetNativeResponse=true whiteContrast=true creativeLabelRemoved=true validatedCategoryCreative=4 dynamicAugmentOnly=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
