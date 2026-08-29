'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v1225-runtime');

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
function between(text,start,end){const a=String(text).indexOf(start);if(a<0)return '';const b=String(text).indexOf(end,a+start.length);return b<0?String(text).slice(a):String(text).slice(a,b)}

(async()=>{
  assert.equal(header.VERSION,'122.5');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v1225.css');
  assert.equal(header.JS_PATH,'/assets/header-marketplace-v1225.js');

  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-supermenu'],'v122.5',`${route} must expose v122.5 header`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-order'],'v122.4',`${route} must retain v122.4 semantic-order lineage`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-condensed'],'v122.3',`${route} must retain v122.3 search-removal lineage`);
    assert.equal(count(response.body,'name="apg-header-marketplace-mobile-supermenu"'),1,`${route} must include one v122.5 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1225.css?v=122.5'),1,`${route} must include one v122.5 stylesheet`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1225.js?v=122.5'),1,`${route} must include one v122.5 script`);
    assert.equal(count(response.body,'data-apg-drawer-supermenu="v122.5"'),1,`${route} must expose one canonical supermenu drawer`);
    assert.equal(count(response.body,'id="apgAllDrawer"'),1,`${route} must retain one drawer id`);

    const drawer=between(response.body,'<aside id="apgAllDrawer"','</aside>');
    assert(drawer,`${route} must expose supermenu drawer`);
    for(const section of ['decide','trust','explore','popular','departments'])assert(drawer.includes(`data-apg-supermenu-section="${section}"`),`${route} drawer must expose ${section}`);
    const decide=drawer.indexOf('data-apg-supermenu-section="decide"');
    const trust=drawer.indexOf('data-apg-supermenu-section="trust"');
    const explore=drawer.indexOf('data-apg-supermenu-section="explore"');
    const popular=drawer.indexOf('data-apg-supermenu-section="popular"');
    const departments=drawer.indexOf('data-apg-supermenu-section="departments"');
    assert(decide<trust&&trust<explore&&explore<popular&&popular<departments,`${route} drawer priority must be decide -> trust -> explore -> popular -> departments`);
    for(const label of ['Decision Lab','Ask Scout','Compare products','Buying guides','About us','How we compare','Sources &amp; provenance','Editorial standards','Corrections','Contact us','Brands','Retailers','Deals &amp; shopping'])assert(drawer.includes(label),`${route} drawer must expose ${label}`);
    assert(drawer.includes('Browse by department'),`${route} must use department disclosure`);
    assert(drawer.includes('<details class="apg-drawer-department-v1225">'),`${route} must collapse department lists by default`);
    assert(drawer.includes('See all 90 categories'),`${route} must provide one deliberate full-directory escape hatch`);
    assert(!drawer.includes('<h3>All categories</h3>'),`${route} must not render the former giant all-categories section`);
    assert(!drawer.includes('Popular now'),`${route} must not lead with the former long Popular now catalogue block`);
  }

  const css=await render('/assets/header-marketplace-v1225.css?v=122.5');
  assert.equal(css.status,200,'v122.5 CSS asset must be served');
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(css.headers['x-apg-header-marketplace-mobile-supermenu'],'v122.5');
  for(const token of [
    'grid-template-columns:44px auto minmax(0,1fr) 44px!important',
    'grid-template-areas:"menu brand . account"!important',
    'column-gap:3px!important',
    'grid-column:2!important',
    'grid-column:4!important',
    '.apg-drawer-section-v1225',
    '.apg-drawer-department-v1225',
    '.apg-drawer-all-categories-v1225',
    'prefers-reduced-motion:reduce'
  ])assert(css.body.includes(token),`v122.5 CSS must retain ${token}`);
  assert(!css.body.includes('@media(min-width:921px)'),'v122.5 must not change desktop header presentation');

  const js=await render('/assets/header-marketplace-v1225.js?v=122.5');
  assert.equal(js.status,200,'v122.5 JS asset must be served');
  assert.equal(js.headers['content-type'],'application/javascript; charset=utf-8');
  assert(js.body.includes('data-apg-supermenu-scout'),'v122.5 JS must preserve Scout handoff');
  assert(!js.body.includes('localStorage'),'v122.5 JS must not create browser persistence');
  assert(!js.body.includes('sessionStorage'),'v122.5 JS must not create session persistence');

  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v1225-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!source.includes(banned),`v122.5 must remain presentation/navigation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V1225=PASS routes=${routes.length} brand=menu-adjacent drawer=priority-first departments=collapsed allCategories=single-link desktop=preserved recommendationWeight=0`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
