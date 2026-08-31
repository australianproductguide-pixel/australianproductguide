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
    assert.equal(count(response.body,'name="apg-header-marketplace-mobile-left-lockup"'),1,`${route} must include one v122.6 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1226.css?v=122.6'),route==='/'?0:1,`${route} must ${route==='/'?'bundle':'include'} v122.6 styling`);
    if(route==='/')assert(response.body.includes('/assets/pagespeed-home-v113.css?v='),'homepage must carry v122.6 through certified PageSpeed CSS');
    assert.equal(count(response.body,'data-apg-mobile-search-v1226'),1,`${route} must include exactly one persistent mobile header Search`);
    assert.equal(count(response.body,'data-apg-drawer-supermenu="v122.5"'),1,`${route} must preserve the v122.5 priority-first supermenu`);
    assert(response.body.includes('apg-mobile-account-label-v1226'),`${route} must include the compact mobile account label`);
    assert(response.body.includes('Sign in <b aria-hidden="true">›</b>'),`${route} must expose the signed-out account cue`);
    const headerStart=response.body.indexOf('<header class="site-header"');
    const menu=response.body.indexOf('class="mobile-toggle"',headerStart);
    const brand=response.body.indexOf('class="brand"',headerStart);
    const account=response.body.indexOf('class="apg-mobile-account-v122"',headerStart);
    const mobileSearch=response.body.indexOf('data-apg-mobile-search-v1226',headerStart);
    const primaryNav=response.body.indexOf('<nav class="primary-nav',headerStart);
    assert(headerStart>=0&&menu>headerStart&&brand>menu&&account>brand,`${route} DOM order must remain menu -> brand -> account`);
    assert(mobileSearch>account&&primaryNav>mobileSearch,`${route} mobile hierarchy must be masthead -> Search -> primary navigation`);
  }

  const css=await render('/assets/header-marketplace-v1226.css?v=122.6');
  assert.equal(css.status,200,'v122.6 CSS asset must be served');
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(css.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6');
  const required=[
    '.masthead>.mobile-toggle{grid-area:menu!important;grid-column:1!important;position:absolute!important;left:0!important',
    '.masthead>.brand{grid-area:brand!important;grid-column:2!important;position:absolute!important;left:42px!important',
    'max-width:calc(100% - 158px)!important',
    '.masthead>.apg-mobile-account-v122{grid-area:account!important;grid-column:3!important;position:absolute!important;left:auto!important;right:12px!important',
    '.apg-mobile-account-label-v1226',
    '@media(max-width:390px)',
    '.masthead>.mobile-toggle{left:0!important}',
    '.masthead>.brand{left:40px!important',
    '.masthead>.apg-mobile-account-v122{right:10px!important',
    'body[data-apg-route-family="home"] main#main .apg-home-search-v9{display:none!important}'
  ];
  for(const token of required)assert(css.body.includes(token),`v122.6 CSS must retain ${token}`);
  assert(!css.body.includes('@media(min-width:921px)'),'v122.6 must not alter desktop header presentation');

  console.log(`HEADER_MARKETPLACE_V1226=PASS routes=${routes.length} geometry=viewport-edge-left-cluster account=right-edge signIn=visible mobileSearch=preserved desktop=preserved homepageCss=certified-bundle`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
