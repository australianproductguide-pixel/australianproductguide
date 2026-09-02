'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const navigator=require('../lib/scout-navigator-v7-global-runtime');
const pagespeed=require('../lib/pagespeed-agentic-certification-v113-runtime');

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
function directStylesheetHrefs(html){const head=(String(html).match(/<head>([\s\S]*?)<\/head>/i)||[])[1]||'';return [...head.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1])}

(async()=>{
  assert.equal(app.SCOUT_NAVIGATOR_PRESENTATION_VERSION,navigator.VERSION);
  assert.equal(app.HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION,'122.7');
  assert.equal(navigator.VERSION,'7.1');
  assert.equal(navigator.CSS_PATH,'/assets/scout-navigator-v7-global.css');
  assert.equal(navigator.HOME_RUNTIME_STATE,'RESTORED_MARKETPLACE_HEADER_SINGLE_PASS_V2');
  assert.equal(pagespeed.VERSION,'113.5');
  assert.equal(pagespeed.RUNTIME_CSS_CONSOLIDATION,'P0_DISABLED_RECURSIVE_CAPTURE');

  const routes=['/','/search/?q=coffee+machine','/categories/','/categories/coffee-machines/','/products/breville-barista-express-impress-bes876/','/compare/coffee-machines/','/decision-lab/?category=coffee-machines&budget=1500','/guides/coffee-machines-buying-guide/','/my-apg/','/methodology/','/retailers/'];
  for(const route of routes){
    const response=await render(route);const isHome=route==='/';
    assert.equal(response.status,200,`${route} must render successfully`);
    assert.equal(response.headers['x-apg-scout-navigator-presentation'],'v7.1');
    assert.equal(response.headers['x-apg-pagespeed-agentic-certification'],'v113.5');
    assert.equal(response.headers['x-apg-pagespeed-runtime-css'],'P0_DISABLED_RECURSIVE_CAPTURE');
    assert.equal(count(response.body,'name="apg-scout-navigator-presentation"'),1);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1);
    assert(response.body.includes('apg-scout-character-v34'));
    const hrefs=directStylesheetHrefs(response.body);assert(hrefs.length>0);
    assert.equal(count(response.body,'/assets/scout-navigator-v7-global.css?v=7.1'),1);
    assert.equal(hrefs[hrefs.length-1],'/assets/scout-navigator-v7-global.css?v=7.1');
    assert.equal(response.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6',`${route} must expose current mobile marketplace navigation`);
    assert.equal(response.headers['x-apg-header-marketplace-desktop-supermenu'],'v122.7',`${route} must expose current desktop marketplace navigation`);
    assert.equal(count(response.body,'name="apg-header-marketplace-desktop-supermenu"'),1);
    assert(response.body.includes('data-apg-drawer-supermenu="v122.5"'));
    assert.equal(count(response.body,'/assets/header-marketplace-v1226.css?v=122.6'),1);
    assert.equal(count(response.body,'/assets/header-marketplace-v1227.css?v=122.7'),1);
    if(isHome)assert.equal(response.headers['x-apg-scout-navigator-home-runtime'],navigator.HOME_RUNTIME_STATE,'Home must disclose restored marketplace header single-pass runtime');
    else assert.equal(response.headers['x-apg-scout-navigator-home-runtime'],undefined);
  }

  const retiredBundle=await render(`${pagespeed.CSS_PATH}?v=${pagespeed.BUILD_ID}`);
  assert.equal(retiredBundle.status,503);
  assert.equal(retiredBundle.headers['x-apg-pagespeed-runtime-css'],'P0_DISABLED_RECURSIVE_CAPTURE');
  const asset=await render('/assets/scout-navigator-v7-global.css?v=7.1');
  assert.equal(asset.status,200);assert(asset.body.includes("url('/assets/scout-navigator-v7.svg')"));
  for(const token of ['#0F172A','#2563EB','#38A4F3','#C7E3FF','prefers-reduced-motion:reduce'])assert(asset.body.includes(token));

  const runtimeSource=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','scout-navigator-v7-global-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!runtimeSource.includes(banned));
  assert(runtimeSource.includes("require('./header-marketplace-v1227-runtime')"));
  assert(runtimeSource.includes('let next=isHome?injectHomeMarketplace(source):source;'),'Home must use the synchronous single-pass marketplace transform');
  assert(runtimeSource.includes('return downstream(req,res);'),'Home must bypass nested marketplace/Smart Placement response wrappers after the single-pass transform is installed');
  assert(runtimeSource.includes('return smartDownstream(req,res);'),'non-Home routes must retain Smart Placement composition');

  console.log(JSON.stringify({version:navigator.VERSION,status:'PASS',routesChecked:routes.length,checks:{marketplaceHeaderAllRoutes:true,homeMarketplaceSinglePass:true,homeNestedWrapperBypass:true,navigatorFinalCascade:true,runtimeRecursiveCaptureDisabled:true,decisionLogicUntouched:true,commercialScoringUntouched:true}},null,2));
  require('./header-marketplace-v1222-qa');require('./header-marketplace-v1223-qa');require('./header-marketplace-v1224-qa');require('./header-marketplace-v1225-qa');require('./header-marketplace-v1226-qa');require('./ebay-smart-placement-v1-qa');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});