'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v1226-runtime');

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
  assert.equal(header.VERSION,'122.6');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v1226.css');
  assert.equal(header.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION,'122.5');

  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6',`${route} must expose v122.6 geometry header`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-supermenu'],'v122.5',`${route} must retain v122.5 supermenu lineage`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-order'],'v122.4',`${route} must retain v122.4 semantic-order lineage`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-condensed'],'v122.3',`${route} must retain v122.3 mobile-search removal`);
    assert.equal(count(response.body,'name="apg-header-marketplace-mobile-left-lockup"'),1,`${route} must include one v122.6 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1226.css?v=122.6'),1,`${route} must include one v122.6 stylesheet`);
    assert.equal(count(response.body,'data-apg-drawer-supermenu="v122.5"'),1,`${route} must preserve the v122.5 priority-first supermenu`);
    const headerStart=response.body.indexOf('<header class="site-header"');
    const menu=response.body.indexOf('class="mobile-toggle"',headerStart);
    const brand=response.body.indexOf('class="brand"',headerStart);
    const account=response.body.indexOf('class="apg-mobile-account-v122"',headerStart);
    assert(headerStart>=0&&menu>headerStart&&brand>menu&&account>brand,`${route} DOM/focus order must remain menu -> brand -> account`);
  }

  const css=await render('/assets/header-marketplace-v1226.css?v=122.6');
  assert.equal(css.status,200,'v122.6 CSS asset must be served');
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(css.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6');
  for(const token of [
    'position:relative!important',
    'left:8px!important',
    'left:56px!important',
    'right:10px!important',
    'max-width:calc(100% - 126px)!important',
    'transform:translateY(-50%)!important',
    'justify-content:flex-start!important',
    'transform:none!important',
    'left:53px!important',
    'right:8px!important',
    'prefers-reduced-motion:reduce'
  ])assert(css.body.includes(token),`v122.6 CSS must retain ${token}`);
  assert(!css.body.includes('@media(min-width:921px)'),'v122.6 must not alter desktop header presentation');

  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v1226-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!source.includes(banned),`v122.6 must remain presentation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V1226=PASS routes=${routes.length} geometry=absolute-left-cluster brandLeft=56px mobile390BrandLeft=53px account=right-pinned supermenu=v122.5 desktop=preserved recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
