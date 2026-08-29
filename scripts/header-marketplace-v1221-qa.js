'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v1221-runtime');

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
  assert.equal(header.VERSION,'122.1');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v1221.css');
  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace-cleanup'],'v122.1',`${route} must expose v122.1 cleanup header`);
    assert.equal(count(response.body,'name="apg-header-marketplace-cleanup"'),1,`${route} must include one v122.1 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1221.css?v=122.1'),1,`${route} must include one v122.1 stylesheet`);
    assert.equal(count(response.body,'data-apg-mobile-account-v122'),1,`${route} must retain exactly one mobile account affordance`);
    assert(response.body.includes('data-apg-search-category'),`${route} must preserve desktop category search`);
    assert(response.body.includes('class="mobile-toggle"'),`${route} must preserve the single canonical mobile drawer trigger in HTML`);
  }

  const asset=await render('/assets/header-marketplace-v1221.css?v=122.1');
  assert.equal(asset.status,200,'v122.1 CSS asset must be served');
  assert.equal(asset.headers['content-type'],'text/css; charset=utf-8');
  const required=[
    '.site-header .masthead>.mobile-toggle,',
    'display:none!important',
    'text-indent:-9999px!important',
    'color:transparent!important',
    'width:72px!important',
    'grid-template-areas:"menu brand account" "search search search"',
    '.site-header .masthead>.header-actions,',
    '.site-header .masthead>.apg-mobile-member-top-v20,',
    'grid-template-columns:minmax(0,1fr) 54px!important',
    '.site-header .masthead>.header-search .global-search>svg{display:none!important}',
    '#mobileNav{display:none!important}'
  ];
  for(const token of required)assert(asset.body.includes(token),`v122.1 CSS must retain ${token}`);
  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v1221-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!source.includes(banned),`v122.1 must remain presentation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V1221=PASS routes=${routes.length} desktopMenuLeak=blocked iconOnlySearch=forced mobileBrand=single mobileAuth=single mobileSearch=fullWidth recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
