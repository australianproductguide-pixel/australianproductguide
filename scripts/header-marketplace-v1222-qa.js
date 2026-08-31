'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v1222-runtime');

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
  assert.equal(header.VERSION,'122.2');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v1222.css');
  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-ownership'],'v122.2',`${route} must expose v122.2 mobile ownership header`);
    assert.equal(count(response.body,'name="apg-header-marketplace-mobile-ownership"'),1,`${route} must include one v122.2 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1222.css?v=122.2'),route==='/'?0:1,`${route} must ${route==='/'?'bundle':'include'} v122.2 styling`);
    if(route==='/')assert(response.body.includes('/assets/pagespeed-home-v113.css?v='),'homepage must carry v122.2 through certified PageSpeed CSS');
    assert.equal(count(response.body,'data-apg-mobile-account-v122'),1,`${route} must retain exactly one canonical mobile account affordance`);
    assert(response.body.includes('data-apg-search-category'),`${route} must preserve desktop category search`);
    assert(response.body.includes('class="mobile-toggle"'),`${route} must preserve the canonical mobile drawer trigger`);
  }

  const asset=await render('/assets/header-marketplace-v1222.css?v=122.2');
  assert.equal(asset.status,200,'v122.2 CSS asset must be served');
  assert.equal(asset.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(asset.headers['x-apg-header-marketplace-mobile-ownership'],'v122.2');
  const required=[
    'grid-template-columns:44px minmax(0,1fr) 44px!important',
    'grid-template-rows:48px 52px!important',
    'grid-template-areas:"menu brand account" "search search search"!important',
    '.site-header .masthead>.apg-mobile-account-v122>span{display:none!important',
    'grid-area:search!important;grid-column:1/-1!important;grid-row:2!important',
    'width:100%!important;max-width:none!important;min-width:0!important;height:44px!important',
    'border-radius:0 9px 9px 0!important',
    'linear-gradient(180deg,var(--apg1222-gold-top),var(--apg1222-gold-bottom))!important',
    'grid-template-columns:minmax(0,1fr) 56px!important'
  ];
  for(const token of required)assert(asset.body.includes(token),`v122.2 CSS must retain ${token}`);
  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v1222-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!source.includes(banned),`v122.2 must remain presentation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V1222=PASS routes=${routes.length} mobileAccountText=zero mobileBrand=full mobileSearch=row2 desktopSearch=premium recommendationWeight=0 homepageCss=certified-bundle`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
