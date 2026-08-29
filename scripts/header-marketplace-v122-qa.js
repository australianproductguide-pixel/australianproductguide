'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v122-runtime');

function render(url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const chunks=[];
    const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},getHeader(k){return headers[String(k).toLowerCase()]},removeHeader(k){delete headers[String(k).toLowerCase()]},write(body=''){chunks.push(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''));return true},end(body=''){chunks.push(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''));resolve({status:this.statusCode,headers,body:chunks.join('')})}};
    try{const result=app(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}
function count(text,needle){return String(text).split(needle).length-1}

(async()=>{
  assert.equal(header.VERSION,'122.0');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v122.css');
  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace'],'v122.0',`${route} must expose v122 header`);
    assert.equal(count(response.body,'name="apg-header-marketplace"'),1,`${route} must include one v122 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v122.css?v=122.0'),1,`${route} must include one v122 stylesheet`);
    assert(response.body.includes('data-apg-mobile-account-v122'),`${route} must include mobile My APG control`);
    assert(response.body.includes('data-apg-search-category'),`${route} must preserve desktop category search`);
    assert(response.body.includes('data-apg-drawer-trigger'),`${route} must preserve All navigation drawer trigger`);
    const allButton=(response.body.match(/<button\b[^>]*\bdata-apg-drawer-trigger\b[^>]*>[\s\S]*?<\/button>/i)||[])[0]||'';
    assert(allButton,`${route} must render the All drawer button`);
    assert.equal(count(allButton,'aria-controls='),1,`${route} All button must have one aria-controls`);
    assert.equal(count(allButton,'aria-expanded='),1,`${route} All button must have one aria-expanded`);
    assert(allButton.includes('aria-controls="apgAllDrawer"'),`${route} All button must target canonical drawer`);
  }
  const asset=await render('/assets/header-marketplace-v122.css?v=122.0');
  assert.equal(asset.status,200,'v122 CSS asset must be served');
  assert.equal(asset.headers['content-type'],'text/css; charset=utf-8');
  for(const token of ['width:78px!important','grid-template-areas:"menu brand account" "search search search"','grid-template-columns:minmax(0,1fr) 54px!important','#mobileNav{display:none!important','font-size:0!important'])assert(asset.body.includes(token),`v122 CSS must retain ${token}`);
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v122-runtime.js'),'utf8').includes(banned),`v122 must remain presentation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V122=PASS routes=${routes.length} compactDesktopCategory=true iconOnlySearch=true mobileMarketplaceHierarchy=true ariaNormalised=true recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
