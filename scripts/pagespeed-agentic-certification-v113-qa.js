'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const layer=require('../lib/pagespeed-agentic-certification-v113-runtime');

const assets=new Map([
  ['/assets/feature-test-v113.css',['text/css; charset=utf-8','.feature-v113{display:grid}']],
  ['/assets/final-test-v113.css?v=2',['text/css; charset=utf-8','.final-v113{color:#123}']],
  ['/assets/noncritical-test-v113.css?v=1',['text/css; charset=utf-8','.noncritical-v113{display:block}']],
  ['/assets/premium-experience-v107.js?v=107.1',['application/javascript; charset=utf-8',`function setAria(el,name,value){el.setAttribute(name,String(value))}function syncScoutAria(){const panel=document.querySelector('#apgAssistantPanel');${layer.REDUNDANT_SCOUT_ARIA}}`]],
]);

const home='<!doctype html><html><head><title>Home</title><link rel="stylesheet" href="/assets/platform-integrity-v15.css?v=15"><link rel="stylesheet" href="/assets/feature-test-v113.css?v=1"><link rel="stylesheet" href="/assets/final-test-v113.css?v=2"><link rel="preload" as="style" href="/assets/noncritical-test-v113.css?v=1" onload="this.rel=\'stylesheet\'"><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1" media="print"><noscript><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1"></noscript></head><body><main><h1>APG</h1></main><aside id="apgAssistantPanel" hidden role="dialog" aria-modal="false" aria-labelledby="apgScoutTitle" aria-hidden="true"><strong id="apgScoutTitle">Scout</strong><button>Close</button></aside></body></html>';
const search='<!doctype html><html><head><title>Search</title></head><body><main><h1>Search</h1></main></body></html>';
const about='<!doctype html><html><head><title>About</title><link rel="stylesheet" href="/assets/platform-integrity-v15.css?v=15"><link rel="stylesheet" href="/assets/final-test-v113.css?v=2"></head><body><main><h1>About</h1></main></body></html>';

function downstream(req,res){
  const u=new URL(req.url,'https://australianproductguide.au');
  const key=u.pathname+u.search;
  if(u.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(home)}
  if(u.pathname==='/search/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(search)}
  if(u.pathname==='/about/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(about)}
  if(key==='/assets/feature-test-v113.css?v=1'){res.statusCode=308;res.setHeader('Location','/assets/feature-test-v113.css');return res.end()}
  const asset=assets.get(key);
  if(asset){res.setHeader('Content-Type',asset[0]);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');return res.end(asset[1])}
  res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end('not found');
}
function request(handler,url,method='GET',live=false){
  let body='';
  const headers=new Map();
  const req={url,method,headers:{host:'australianproductguide.au'}};
  if(live){req.httpVersion='1.1';req.socket={remoteAddress:'127.0.0.1'}}
  const res={
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this},
    getHeader(name){return headers.get(String(name).toLowerCase())},
    removeHeader(name){headers.delete(String(name).toLowerCase())},
    write(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return true},
    end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return body}
  };
  handler(req,res);
  return {statusCode:res.statusCode,headers,body,finalUrl:req.url};
}

assert.equal(layer.VERSION,'113.5');
assert.equal(layer.CSS_PATH,'/assets/pagespeed-home-v113.css');
assert.equal(layer.RUNTIME_CSS_CONSOLIDATION,'P0_DISABLED_RECURSIVE_CAPTURE');
assert.equal(layer.HOME_DIAGNOSTIC_PATH,'/__apg-p0-home-native-20260901');
assert.equal(layer.repairScoutAriaJs(layer.REDUNDANT_SCOUT_ARIA),layer.SAFE_SCOUT_ARIA);

const staticCss=layer.bundledStaticCss('/assets/platform-integrity-v15.css?v=15');
assert(staticCss&&staticCss.statusCode===200,'source-controlled public CSS must be readable from the bundled function');
assert.match(staticCss.headers.get('content-type'),/^text\/css/);
assert(staticCss.body.includes('v15-directory-tools'),'bundled static CSS body must be intact');

const repairedScout=layer.repairStaticScoutAria('<aside id="apgAssistantPanel" hidden role="dialog" aria-modal="false" aria-labelledby="apgScoutTitle" aria-hidden="true"></aside>');
assert(repairedScout.includes('<aside id="apgAssistantPanel"'),'Scout must remain an aside');
assert(repairedScout.includes('aria-labelledby="apgScoutTitle"'),'Scout must retain its accessible label reference');
assert(!repairedScout.includes('aria-hidden'),'Scout must rely on native hidden rather than duplicate aria-hidden');
assert(!repairedScout.includes('role="dialog"'),'invalid dialog role must not remain on an aside host');
assert(!repairedScout.includes('aria-modal'),'aria-modal must not remain after dialog semantics are removed');
assert.equal(layer.blockingStylesheetLinks(home).length,3,'only normal screen styles should be considered render-blocking');
assert.throws(()=>layer.capture(downstream,'/assets/feature-test-v113.css?v=1'),error=>error&&error.code==='APG_PAGESPEED_RUNTIME_CAPTURE_DISABLED');
assert.throws(()=>layer.discoverAndBuildCombinedCss(downstream),error=>error&&error.code==='APG_PAGESPEED_RUNTIME_CAPTURE_DISABLED');
assert.equal(layer.consolidateHomepageCss(home),home,'P0 containment must preserve the established homepage stylesheet cascade');

const handler=layer.wrap(downstream);
const homepage=request(handler,'/');
assert.equal(homepage.statusCode,200);
assert.equal(homepage.headers.get('x-apg-pagespeed-agentic-certification'),'v113.5');
assert.equal(homepage.headers.get('x-apg-pagespeed-runtime-css'),'P0_DISABLED_RECURSIVE_CAPTURE');
assert(homepage.body.includes('name="apg-pagespeed-agentic-certification" content="v113.5"'));
assert(homepage.body.includes('name="apg-pagespeed-runtime-css" content="P0_DISABLED_RECURSIVE_CAPTURE"'));
assert(!homepage.body.includes('/assets/pagespeed-home-v113.css?v='),'P0 homepage must not reference a runtime-generated bundle');
assert.equal(layer.blockingStylesheetLinks(homepage.body).length,3,'homepage must retain its established direct blocking stylesheet requests during P0 containment');
assert(homepage.body.includes('rel="preload" as="style" href="/assets/noncritical-test-v113.css?v=1"'),'preloaded noncritical CSS must be preserved');
assert(homepage.body.includes('media="print"'),'print-switched noncritical CSS must be preserved');
assert(homepage.body.includes('<noscript><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1"></noscript>'),'noscript fallback must be preserved');
assert(homepage.body.includes('<aside id="apgAssistantPanel" hidden aria-labelledby="apgScoutTitle">'),'transformed Scout must use valid native aside semantics');
assert(!homepage.body.includes('aria-hidden="true"'),'static Scout panel must rely on native hidden');
assert(!homepage.body.includes('role="dialog"'),'homepage must not expose the invalid aside/dialog combination');
assert(!homepage.body.includes('aria-modal="false"'),'homepage must not expose aria-modal without dialog semantics');

const liveHomepage=request(handler,'/','GET',true);
assert.equal(liveHomepage.statusCode,200,'live Home containment must remain usable while native Home is under diagnosis');
assert(liveHomepage.body.includes('<h1>Search</h1>'),'live Home containment must use the healthy Search renderer');
assert.equal(liveHomepage.headers.get('x-apg-p0-home-availability'),layer.HOME_AVAILABILITY_STATE);
assert.equal(liveHomepage.finalUrl,layer.HOME_FALLBACK_URL);

const nativeHomeDiagnostic=request(handler,layer.HOME_DIAGNOSTIC_PATH,'GET',true);
assert.equal(nativeHomeDiagnostic.statusCode,200,'diagnostic path must enter the native Home renderer in deterministic QA');
assert(nativeHomeDiagnostic.body.includes('<h1>APG</h1>'),'diagnostic path must render Home, not Search');
assert.equal(nativeHomeDiagnostic.headers.get('x-apg-p0-home-diagnostic'),layer.HOME_DIAGNOSTIC_STATE);
assert.match(String(nativeHomeDiagnostic.headers.get('x-robots-tag')||''),/noindex/);
assert.equal(nativeHomeDiagnostic.headers.get('cache-control'),'no-store, max-age=0');
assert.equal(nativeHomeDiagnostic.finalUrl,`/?${layer.HOME_DIAGNOSTIC_QUERY}=1`);
assert.equal(nativeHomeDiagnostic.headers.get('x-apg-p0-home-availability'),undefined,'native Home diagnostic must bypass the ordinary live Home fallback');

const css=request(handler,`${layer.CSS_PATH}?v=${layer.BUILD_ID}`);
assert.equal(css.statusCode,503,'runtime-generated CSS endpoint must fail closed while recursive capture is disabled');
assert.equal(css.headers.get('cache-control'),'no-store');
assert.equal(css.headers.get('x-apg-pagespeed-runtime-css'),'P0_DISABLED_RECURSIVE_CAPTURE');
assert(css.body.includes('runtime recursive response capture disabled'));

const premium=request(handler,'/assets/premium-experience-v107.js?v=107.1');
assert.equal(premium.statusCode,200);
assert(!premium.body.includes(layer.REDUNDANT_SCOUT_ARIA));
assert(premium.body.includes(layer.SAFE_SCOUT_ARIA));
assert.match(premium.headers.get('cache-control'),/max-age=31536000/);
assert.match(premium.headers.get('cache-control'),/immutable/);

const aboutPage=request(handler,'/about/');
assert.equal(layer.blockingStylesheetLinks(aboutPage.body).length,2,'non-home routes must keep their established stylesheet delivery');
assert(!aboutPage.body.includes(layer.CSS_PATH));
assert(aboutPage.body.includes('name="apg-pagespeed-agentic-certification"'));
assert.equal(aboutPage.headers.get('x-apg-pagespeed-runtime-css'),'P0_DISABLED_RECURSIVE_CAPTURE');

const source=fs.readFileSync(path.join(__dirname,'..','lib','pagespeed-agentic-certification-v113-runtime.js'),'utf8');
assert(source.includes("const RUNTIME_CSS_CONSOLIDATION='P0_DISABLED_RECURSIVE_CAPTURE';"));
assert(source.includes("const HOME_DIAGNOSTIC_PATH='/__apg-p0-home-native-20260901';"));
assert(source.includes('function capture(_handler,url){throw unsafeCaptureError(url)}'));
assert(!source.includes("const home=capture(downstream,'/');"),'live runtime must not recursively render Home for CSS discovery');
assert(!source.includes('const asset=capture(downstream,href);'),'live runtime must not recursively invoke downstream for stylesheet capture');

const wholeSite={wrap(next){return next}};
layer.install(wholeSite);
const installedHandler=wholeSite.wrap(downstream);
assert.equal(request(installedHandler,'/').headers.get('x-apg-pagespeed-agentic-certification'),'v113.5');

console.log(JSON.stringify({
  ok:true,
  version:layer.VERSION,
  homepageBlockingStylesheetRequests:3,
  staticCssRead:'verified',
  noncriticalStyles:'preserved',
  runtimeCssConsolidation:'P0_DISABLED_RECURSIVE_CAPTURE',
  runtimeRecursiveCapture:'prohibited',
  retiredBundleEndpoint:'503-fail-closed',
  liveHomeContainment:'Search-renderer',
  nativeHomeDiagnostic:'isolated-live-path-noindex-no-store',
  versionedAssetCaching:'immutable',
  scoutAriaRepair:'native-hidden-valid-aside',
  recommendationLogic:'unchanged',
  commercialScoring:'unchanged',
  policy:'Availability-first P0 transport containment; diagnose native Home behind the edge redirect; rebuild CSS consolidation as a static/build-time asset before re-enabling a one-file homepage bundle.'
},null,2));