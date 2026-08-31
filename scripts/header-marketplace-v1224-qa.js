'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const header=require('../lib/header-marketplace-v1224-runtime');

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
function masthead(html){return (String(html).match(/<div\b[^>]*class=["'][^"']*\bmasthead\b[^"']*["'][^>]*>[\s\S]*?<\/div><nav\b/i)||[''])[0]}

(async()=>{
  assert.equal(header.VERSION,'122.4');
  assert.equal(header.CSS_PATH,'/assets/header-marketplace-v1224.css');
  const routes=['/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/decision-lab/','/compare/'];
  for(const route of routes){
    const response=await render(route);
    assert.equal(response.status,200,`${route} must render`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-order'],'v122.4',`${route} must expose v122.4 header`);
    assert.equal(response.headers['x-apg-header-marketplace-mobile-condensed'],'v122.3',`${route} must retain v122.3 mobile search-removal lineage`);
    assert.equal(count(response.body,'name="apg-header-marketplace-mobile-order"'),1,`${route} must include one v122.4 marker`);
    assert.equal(count(response.body,'/assets/header-marketplace-v1224.css?v=122.4'),route==='/'?0:1,`${route} must ${route==='/'?'bundle':'include'} v122.4 styling`);
    if(route==='/')assert(response.body.includes('/assets/pagespeed-home-v113.css?v='),'homepage must carry v122.4 through certified PageSpeed CSS');
    assert.equal(count(response.body,'data-apg-mobile-account-v122'),1,`${route} must retain one canonical account control`);
    assert.equal(count(response.body,'class="mobile-toggle"'),1,`${route} must retain one canonical mobile drawer trigger`);
    assert(response.body.includes('data-apg-mobile-masthead-order="menu-brand-account"'),`${route} must expose the mobile masthead order contract`);
    assert(response.body.includes('data-apg-search-category'),`${route} must preserve the desktop category search in SSR`);
    assert(response.body.includes('class="header-search"'),`${route} must preserve shared search markup for desktop`);

    const shell=masthead(response.body);
    assert(shell,`${route} must expose a masthead shell`);
    const menuPos=shell.indexOf('class="mobile-toggle"');
    const brandPos=shell.indexOf('class="brand"');
    const accountPos=shell.indexOf('data-apg-mobile-account-v122');
    assert(menuPos>=0&&brandPos>=0&&accountPos>=0,`${route} must expose menu, brand and account in the masthead`);
    assert(menuPos<brandPos&&brandPos<accountPos,`${route} DOM/focus order must be menu -> brand -> account`);
  }

  const asset=await render('/assets/header-marketplace-v1224.css?v=122.4');
  assert.equal(asset.status,200,'v122.4 CSS asset must be served');
  assert.equal(asset.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(asset.headers['x-apg-header-marketplace-mobile-order'],'v122.4');
  const required=[
    'grid-template-columns:44px minmax(0,1fr) 44px!important',
    'grid-template-areas:"menu brand account"!important',
    'grid-area:menu!important',
    'grid-column:1!important',
    'grid-area:brand!important',
    'grid-column:2!important',
    'grid-area:account!important',
    'grid-column:3!important',
    '.site-header .masthead>.header-search{',
    'display:none!important',
    'pointer-events:none!important'
  ];
  for(const token of required)assert(asset.body.includes(token),`v122.4 CSS must retain ${token}`);
  assert(!asset.body.includes('@media(min-width:921px)'),'v122.4 must not override the accepted desktop header/search treatment');

  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','header-marketplace-v1224-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!source.includes(banned),`v122.4 must remain presentation-only: ${banned}`);
  console.log(`HEADER_MARKETPLACE_V1224=PASS routes=${routes.length} order=menu-brand-account focusOrder=matched mobileSearch=removed desktopSearch=preserved recommendationWeight=0 homepageCss=certified-bundle`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
