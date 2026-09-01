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
function directStylesheetHrefs(html){
  const head=(String(html).match(/<head>([\s\S]*?)<\/head>/i)||[])[1]||'';
  return [...head.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
}

(async()=>{
  assert.equal(app.SCOUT_NAVIGATOR_PRESENTATION_VERSION,navigator.VERSION,'public handler must expose Scout Navigator presentation version');
  assert.equal(app.HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION,'122.7','public handler must preserve the current desktop supermenu repair for non-Home routes');
  assert.equal(navigator.VERSION,'7.1');
  assert.equal(navigator.CSS_PATH,'/assets/scout-navigator-v7-global.css');
  assert.equal(navigator.HOME_RUNTIME_STATE,'P0_BYPASS_HEADER_MARKETPLACE_SMART_PLACEMENT');
  assert.equal(pagespeed.VERSION,'113.5');
  assert.equal(pagespeed.RUNTIME_CSS_CONSOLIDATION,'P0_DISABLED_RECURSIVE_CAPTURE');

  const routes=[
    '/',
    '/search/?q=coffee+machine',
    '/categories/',
    '/categories/coffee-machines/',
    '/products/breville-barista-express-impress-bes876/',
    '/compare/coffee-machines/',
    '/decision-lab/?category=coffee-machines&budget=1500',
    '/guides/coffee-machines-buying-guide/',
    '/my-apg/',
    '/methodology/',
    '/retailers/'
  ];

  for(const route of routes){
    const response=await render(route);
    const isHome=route==='/';
    assert.equal(response.status,200,`${route} must render successfully`);
    assert.equal(response.headers['x-apg-scout-navigator-presentation'],'v7.1',`${route} must expose Scout Navigator parity header`);
    assert.equal(response.headers['x-apg-pagespeed-agentic-certification'],'v113.5',`${route} must expose current PageSpeed transport certification`);
    assert.equal(response.headers['x-apg-pagespeed-runtime-css'],'P0_DISABLED_RECURSIVE_CAPTURE',`${route} must prove recursive runtime CSS capture is disabled`);
    assert.equal(count(response.body,'name="apg-scout-navigator-presentation"'),1,`${route} must contain exactly one Navigator parity marker`);
    assert.equal(count(response.body,'name="apg-pagespeed-runtime-css"'),1,`${route} must expose exactly one P0 runtime-CSS state marker`);
    assert(response.body.includes('data-apg-scout-navigator="v7.1"'),`${route} must expose the Navigator body contract`);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route} must retain exactly one Scout launcher`);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1,`${route} must retain exactly one Scout panel`);
    assert(response.body.includes('apg-scout-character-v34'),`${route} must retain the canonical Scout character hook`);

    const hrefs=directStylesheetHrefs(response.body);
    assert(hrefs.length>0,`${route} must expose direct stylesheets`);
    assert.equal(count(response.body,'/assets/scout-navigator-v7-global.css?v=7.1'),1,`${route} must contain exactly one final Navigator stylesheet`);
    assert.equal(hrefs[hrefs.length-1],'/assets/scout-navigator-v7-global.css?v=7.1',`${route} must make Navigator v7.1 the final direct stylesheet in the CSS cascade`);
    const finalPos=response.body.lastIndexOf('/assets/scout-navigator-v7-global.css?v=7.1');
    for(const older of ['/assets/scout-concierge-v5.css','/assets/scout-global-surface-v111.css','/assets/premium-mobile-decision-commerce-v112.css','/assets/about-trust-navigation-v116.css','/assets/whole-site-experience-v109.css']){
      const olderPos=response.body.lastIndexOf(older);
      if(olderPos>=0)assert(finalPos>olderPos,`${route} must load Navigator parity after ${older}`);
    }

    if(isHome){
      assert.equal(response.headers['x-apg-scout-navigator-home-runtime'],navigator.HOME_RUNTIME_STATE,'Home must expose the explicit P0 presentation-containment state');
      assert.equal(response.headers['x-apg-header-marketplace-mobile-left-lockup'],undefined,'Home must bypass Header Marketplace v122.6 during P0 recovery');
      assert.equal(response.headers['x-apg-header-marketplace-desktop-supermenu'],undefined,'Home must bypass Header Marketplace v122.7 during P0 recovery');
      assert.equal(count(response.body,'name="apg-header-marketplace-desktop-supermenu"'),0,'Home must not be re-buffered by Header Marketplace v122.7');
      assert.equal(count(response.body,'data-apg-drawer-supermenu="v122.5"'),0,'Home must not receive the nested Header Marketplace drawer composition during P0 recovery');
      for(const asset of ['/assets/header-marketplace-v1222.css?v=122.2','/assets/header-marketplace-v1223.css?v=122.3','/assets/header-marketplace-v1224.css?v=122.4','/assets/header-marketplace-v1225.css?v=122.5','/assets/header-marketplace-v1226.css?v=122.6','/assets/header-marketplace-v1227.css?v=122.7'])assert.equal(count(response.body,asset),0,`Home must omit ${asset} while the presentation chain is contained`);
      assert.equal(count(response.body,'/assets/pagespeed-home-v113.css?'),0,'homepage must not reference the retired runtime-generated PageSpeed bundle during P0 containment');
      assert(response.body.includes('name="apg-pagespeed-runtime-css" content="P0_DISABLED_RECURSIVE_CAPTURE"'),'homepage must disclose the availability-first PageSpeed state');
    }else{
      assert.equal(response.headers['x-apg-scout-navigator-home-runtime'],undefined,`${route} must not inherit the Home-only P0 marker`);
      assert.equal(response.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6',`${route} must expose final v122.6 mobile lock-up geometry`);
      assert.equal(response.headers['x-apg-header-marketplace-desktop-supermenu'],'v122.7',`${route} must expose current v122.7 desktop supermenu repair`);
      assert.equal(count(response.body,'name="apg-header-marketplace-desktop-supermenu"'),1,`${route} must contain exactly one v122.7 desktop supermenu marker`);
      assert(response.body.includes('data-apg-drawer-supermenu="v122.5"'),`${route} must retain the final mobile supermenu hierarchy`);
      assert.equal(count(response.body,'/assets/header-marketplace-v1226.css?v=122.6'),1,`${route} must contain exactly one v122.6 left-lockup stylesheet`);
      assert.equal(count(response.body,'/assets/header-marketplace-v1227.css?v=122.7'),1,`${route} must contain exactly one v122.7 desktop supermenu stylesheet`);
      for(const older of ['/assets/header-marketplace-v1222.css','/assets/header-marketplace-v1223.css','/assets/header-marketplace-v1224.css','/assets/header-marketplace-v1225.css','/assets/header-marketplace-v1226.css','/assets/header-marketplace-v1227.css']){
        const olderPos=response.body.lastIndexOf(older);
        if(olderPos>=0)assert(finalPos>olderPos,`${route} must load Navigator parity after ${older}`);
      }
    }
  }

  const retiredBundle=await render(`${pagespeed.CSS_PATH}?v=${pagespeed.BUILD_ID}`);
  assert.equal(retiredBundle.status,503,'retired runtime-generated PageSpeed bundle must fail closed instead of recursively invoking the application');
  assert.equal(retiredBundle.headers['cache-control'],'no-store');
  assert.equal(retiredBundle.headers['x-apg-pagespeed-runtime-css'],'P0_DISABLED_RECURSIVE_CAPTURE');
  assert(retiredBundle.body.includes('runtime recursive response capture disabled'),'retired bundle endpoint must explain the safe P0 state');

  const asset=await render('/assets/scout-navigator-v7-global.css?v=7.1');
  assert.equal(asset.status,200,'Navigator parity CSS asset must be served');
  assert.equal(asset.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(asset.headers['x-apg-scout-navigator-presentation'],'v7.1');
  assert(asset.body.includes("url('/assets/scout-navigator-v7.svg')"),'final skin must use the approved Navigator character asset');
  for(const token of ['#0F172A','#2563EB','#38A4F3','#C7E3FF','prefers-reduced-motion:reduce'])assert(asset.body.includes(token),`Navigator skin must retain ${token}`);
  assert(asset.body.includes('.apg-assistant-launcher-copy strong{color:#fff!important}'),'launcher title must remain legible against the approved dark APG surface');
  assert(!asset.body.includes('position:fixed'),'final parity skin must not replace v111/v112 route geometry');
  assert(!asset.body.includes('localStorage'),'final parity skin must not create browser state');
  assert(!asset.body.includes('sessionStorage'),'final parity skin must not create session state');
  assert(asset.body.length<10000,'final parity skin must remain a small presentation-only override rather than another Scout engine');

  const runtimeSource=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','lib','scout-navigator-v7-global-runtime.js'),'utf8');
  for(const banned of ['scoreProduct(','rankDecision(','publicDecision(','commissionWeight','localStorage.setItem(','sessionStorage.setItem('])assert(!runtimeSource.includes(banned),`Navigator parity runtime must remain presentation-only: ${banned}`);
  assert(runtimeSource.includes("require('./header-marketplace-v1227-runtime')"),'Navigator must retain the current v122.7 desktop supermenu layer for non-Home routes');
  assert(runtimeSource.includes("if(homeP0)"),'Navigator must retain the explicit Home-only availability bypass');
  assert(runtimeSource.includes('return downstream(req,res);'),'Home P0 path must bypass the nested Header Marketplace/Smart Placement response composition');
  assert(runtimeSource.includes('return smartDownstream(req,res);'),'non-Home routes must retain the established presentation composition');

  console.log(JSON.stringify({version:navigator.VERSION,status:'PASS',routesChecked:routes.length,checks:{sameScoutComponentEverywhere:true,nonHomeFinalCascadePreserved:true,homeP0PresentationChainBypass:true,homeNavigatorSkinPreserved:true,runtimeRecursiveCaptureDisabled:true,desktopV1227PreservedNonHome:true,approvedNavigatorAsset:true,apgPalette:true,reducedMotion:true,decisionLogicUntouched:true,commercialScoringUntouched:true}},null,2));
  require('./header-marketplace-v1222-qa');
  require('./header-marketplace-v1223-qa');
  require('./header-marketplace-v1224-qa');
  require('./header-marketplace-v1225-qa');
  require('./header-marketplace-v1226-qa');
  require('./ebay-smart-placement-v1-qa');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
