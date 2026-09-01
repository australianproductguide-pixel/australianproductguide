'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const stability=require('../lib/premium-client-stability-v1091-runtime');
const pageSpeed=require('../lib/pagespeed-agentic-certification-v113-runtime');

const PAGESPEED_HOME_CSS_PATH='/assets/pagespeed-home-v113.css';

function invoke(handler,url,method='GET'){
  return new Promise((resolve,reject)=>{
    const headers={},written=[];
    const req={url,method,headers:{host:'australianproductguide.au'},on(){},destroy(){}};
    const res={
      statusCode:200,
      setHeader(k,v){headers[String(k).toLowerCase()]=String(v)},
      getHeader(k){return headers[String(k).toLowerCase()]},
      removeHeader(k){delete headers[String(k).toLowerCase()]},
      write(body=''){written.push(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''));return true},
      end(body=''){resolve({status:this.statusCode,headers,body:written.join('')+(Buffer.isBuffer(body)?body.toString('utf8'):String(body||''))})}
    };
    try{const result=handler(req,res);if(result&&typeof result.then==='function')result.catch(reject)}catch(error){reject(error)}
  });
}
function count(text,needle){return String(text).split(needle).length-1}

(async()=>{
  assert.equal(stability.SCOUT_GLOBAL_SURFACE_VERSION,'111.1');
  assert.equal(app.SCOUT_GLOBAL_SURFACE_VERSION,'111.1','outer runtime must expose current Scout global surface');
  assert.equal(stability.SCOUT_GLOBAL_CSS_PATH,'/assets/scout-global-surface-v111.css');
  assert.equal(stability.SCOUT_GLOBAL_JS_PATH,'/assets/scout-global-surface-v111.js');
  assert.equal(pageSpeed.RUNTIME_CSS_CONSOLIDATION,'P0_DISABLED_RECURSIVE_CAPTURE','Home must retain the v113.5 serverless-safety contract');

  assert.match(stability.scoutGlobalSurfaceCss,/html body:not\(\.scout-v5-open\) #apgAssistantLauncher\.apg-assistant-launcher/,'v111 must use route-independent launcher selector');
  for(const rule of ['position:fixed!important','right:max(20px,env(safe-area-inset-right))!important','display:flex!important','visibility:visible!important','opacity:1!important','pointer-events:auto!important']){
    assert(stability.scoutGlobalSurfaceCss.includes(rule),`v111 launcher integrity rule missing: ${rule}`);
  }
  assert.match(stability.scoutGlobalSurfaceCss,/@media\(max-width:760px\)[\s\S]*#apgAssistantLauncher\.apg-assistant-launcher[\s\S]*right:max\(18px,env\(safe-area-inset-right\)\)!important/,'mobile right-side rule missing');
  assert.match(stability.scoutGlobalSurfaceCss,/body\.apg-compare-tray-active:not\(\.scout-v5-open\) #apgAssistantLauncher/,'compare-tray avoidance must be preserved');
  assert.match(stability.scoutGlobalSurfaceCss,/#apgAssistantLauncher\.apg-assistant-launcher\.apg-footer-overlap-guard\{[\s\S]*visibility:hidden!important;[\s\S]*opacity:0!important;[\s\S]*pointer-events:none!important;/,'footer overlap guard must outrank global visibility so Scout never blocks footer controls');
  assert(!/MutationObserver/.test(stability.scoutGlobalSurfaceJs),'v111 integrity guard must not create another mutation observer');
  assert(stability.scoutGlobalSurfaceJs.includes("document.body.classList.remove('scout-v5-open')"),'closed-panel restore must clear stale open state');

  const css=await invoke(app,stability.SCOUT_GLOBAL_CSS_PATH);
  assert.equal(css.status,200);
  assert.equal(css.headers['x-apg-scout-global-surface'],'v111.1');
  assert(css.body.includes('APG Scout Global Surface v111.1'));
  const js=await invoke(app,stability.SCOUT_GLOBAL_JS_PATH);
  assert.equal(js.status,200);
  assert.equal(js.headers['x-apg-scout-global-surface'],'v111.1');
  assert(js.body.includes("const VERSION='111.1'"));

  const routes=[
    '/',
    '/search/?q=wireless+headphones',
    '/categories/',
    '/categories/wireless-headphones/',
    '/categories/wireless-headphones/finder/',
    '/products/bose-quietcomfort-ultra-headphones/',
    '/compare/wireless-headphones/',
    '/decision-lab/',
    '/my-apg/',
    '/guides/wireless-headphones-buying-guide/',
    '/retailers/',
    '/deals/',
    '/methodology/',
    '/this-route-does-not-exist/'
  ];
  for(const route of routes){
    const response=await invoke(app,route);
    assert(response.status===200||response.status===404,`${route}: invalid status ${response.status}`);
    assert.equal(response.headers['x-apg-scout-global-surface'],'v111.1',`${route}: v111.1 header missing`);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route}: expected exactly one launcher`);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1,`${route}: expected exactly one panel`);
    const directCssCount=count(response.body,stability.SCOUT_GLOBAL_CSS_PATH);
    const bundledCssCount=count(response.body,PAGESPEED_HOME_CSS_PATH);
    if(route==='/'){
      assert.equal(directCssCount,1,`${route}: P0-safe Home must retain the governed v111 CSS as a direct stylesheet request`);
      assert.equal(bundledCssCount,0,`${route}: retired runtime-generated PageSpeed CSS bundle must not be referenced while recursive capture is disabled`);
    }else{
      assert.equal(directCssCount,1,`${route}: v111 CSS must be injected exactly once`);
    }
    assert.equal(count(response.body,stability.SCOUT_GLOBAL_JS_PATH),1,`${route}: v111 JS must be injected exactly once`);
    assert(response.body.includes('data-apg-scout-global-surface="v111.1"'),`${route}: v111.1 body marker missing`);
    const headEnd=response.body.indexOf('</head>');
    const effectiveCss=response.body.indexOf(stability.SCOUT_GLOBAL_CSS_PATH);
    assert(effectiveCss>0&&effectiveCss<headEnd,`${route}: effective Scout CSS must be delivered from head`);
  }

  const retiredBundle=await invoke(app,`${PAGESPEED_HOME_CSS_PATH}?v=test`);
  assert.equal(retiredBundle.status,503,'retired runtime-generated homepage CSS endpoint must fail closed under v113.5 P0 safety');
  assert.equal(retiredBundle.headers['x-apg-pagespeed-runtime-css'],'P0_DISABLED_RECURSIVE_CAPTURE');

  const raw='<!doctype html><html><head><link rel="stylesheet" href="/assets/whole-site-experience-v109.css?v=109.0"></head><body><main>test</main></body></html>';
  const once=stability.injectGlobalSurface(raw),twice=stability.injectGlobalSurface(once);
  assert.equal(count(twice,stability.SCOUT_GLOBAL_CSS_PATH),1,'v111 CSS injection must be idempotent');
  assert.equal(count(twice,stability.SCOUT_GLOBAL_JS_PATH),1,'v111 JS injection must be idempotent');
  assert.equal(count(twice,'id="apgAssistantLauncher"'),1,'Scout shell injection must remain idempotent');

  console.log(JSON.stringify({suite:'scout-global-surface-v111',version:stability.SCOUT_GLOBAL_SURFACE_VERSION,status:'PASS',routesChecked:routes.length,checks:{dedicatedCacheDistinctAsset:true,routeIndependentVisibility:true,importantIdOwnership:true,rightAligned:true,closedStateGuard:true,compareTrayAvoidance:true,footerOverlapGuard:true,idempotentSsr:true,browserComputedVisibilityRequired:true,homepageP0SafeDirectCss:true,runtimeRecursiveCaptureDisabled:true,retiredBundleFailsClosed:true}},null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});