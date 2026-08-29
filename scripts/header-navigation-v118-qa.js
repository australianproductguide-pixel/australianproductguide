'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../api/index');
const header=require('../lib/header-navigation-v118-runtime');

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
function count(text,needle){return String(text).split(needle).length-1}

(async()=>{
  assert.equal(header.VERSION,'118.0');
  assert.equal(app.HEADER_NAVIGATION_VERSION,'118.0','public handler must expose header navigation version');

  const routes=['/','/search/?q=coffee+machine','/categories/','/categories/coffee-machines/','/products/sony-wh-1000xm6/','/compare/','/decision-lab/','/guides/','/my-apg/','/methodology/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render successfully`);
    assert.equal(response.headers['x-apg-header-navigation'],'v118.0',`${route} must expose v118 header marker`);
    assert.equal(count(response.body,'name="apg-header-navigation"'),1,`${route} must load one header navigation marker`);
    assert.equal(count(response.body,'/assets/header-navigation-v118.css?v=118.0'),1,`${route} must load one header stylesheet`);
    assert.equal(count(response.body,'/assets/header-navigation-v118.js?v=118.0'),1,`${route} must load one header script`);
    assert.equal(count(response.body,'id="apgAllDrawer"'),1,`${route} must render one All drawer`);
    assert.match(response.body,/data-apg-drawer-trigger/);
    assert.match(response.body,/>\s*<span>All<\/span>\s*<\/button>/);
    assert.equal(count(response.body,'data-apg-search-category'),1,`${route} must render one desktop category search selector`);
    assert.match(response.body,/<option value="">All<\/option>/);
    assert.match(response.body,/<option value="coffee-machines">Coffee machines<\/option>/);
    assert.match(response.body,/class="apg-drawer-account"/);
    assert.match(response.body,/href="\/my-apg\/"/);
    assert.match(response.body,/data-apg-legacy-mega/);
    assert.doesNotMatch(response.body,/data-discovery-trigger/,'legacy product mega trigger must not remain interactive');
    assert.match(response.body,/data-apg-about-trust/,'About & trust navigation must remain available');
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route} must retain exactly one Scout launcher`);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1,`${route} must retain exactly one Scout panel`);
  }

  const css=await render(header.CSS_PATH);
  assert.equal(css.status,200);
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.match(css.body,/grid-template-columns:minmax\(188px,240px\) minmax\(320px,1fr\) auto/,'desktop masthead must align brand, search and account controls');
  assert.match(css.body,/\.apg-all-drawer\{position:fixed/,'drawer must be an anchored left-side overlay');
  assert.match(css.body,/@media\(max-width:920px\)/,'mobile breakpoint must preserve existing mobile navigation');
  assert.match(css.body,/prefers-reduced-motion:reduce/,'reduced motion must be respected');

  const js=await render(header.JS_PATH);
  assert.equal(js.status,200);
  assert.equal(js.headers['content-type'],'application/javascript; charset=utf-8');
  assert.match(js.body,/Escape/,'drawer must support Escape');
  assert.match(js.body,/data-apg-search-category|apg-search-category/,'search category control must be enhanced');
  assert.doesNotMatch(js.body,/localStorage|sessionStorage|document\.cookie/,'header enhancement must not create persistent browser state');

  const source=fs.readFileSync(path.join(__dirname,'..','lib','header-navigation-v118-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','commissionWeight','recommendationWeight='])assert(!source.includes(banned),`header navigation must remain outside decision scoring: ${banned}`);

  console.log(JSON.stringify({version:header.VERSION,status:'PASS',routesChecked:routes.length,checks:{amazonInspiredStructure:true,apgBrandPreserved:true,leftDrawer:true,categorySearch:true,accountAlignment:true,legacyMegaDisabled:true,aboutTrustPreserved:true,scoutPreserved:true,decisionLogicUntouched:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});