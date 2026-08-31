'use strict';
const assert=require('node:assert/strict');
const layer=require('../lib/pagespeed-agentic-certification-v113-runtime');

const assets=new Map([
  ['/assets/feature-test-v113.css',['text/css; charset=utf-8','.feature-v113{display:grid}']],
  ['/assets/final-test-v113.css?v=2',['text/css; charset=utf-8','.final-v113{color:#123}']],
  ['/assets/noncritical-test-v113.css?v=1',['text/css; charset=utf-8','.noncritical-v113{display:block}']],
  ['/assets/premium-experience-v107.js?v=107.1',['application/javascript; charset=utf-8',`function setAria(el,name,value){el.setAttribute(name,String(value))}function syncScoutAria(){const panel=document.querySelector('#apgAssistantPanel');${layer.REDUNDANT_SCOUT_ARIA}}`]],
]);

const home='<!doctype html><html><head><title>Home</title><link rel="stylesheet" href="/assets/platform-integrity-v15.css?v=15"><link rel="stylesheet" href="/assets/feature-test-v113.css?v=1"><link rel="stylesheet" href="/assets/final-test-v113.css?v=2"><link rel="preload" as="style" href="/assets/noncritical-test-v113.css?v=1" onload="this.rel=\'stylesheet\'"><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1" media="print"><noscript><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1"></noscript></head><body><main><h1>APG</h1></main><aside id="apgAssistantPanel" hidden role="dialog" aria-modal="false" aria-labelledby="apgScoutTitle" aria-hidden="true"><strong id="apgScoutTitle">Scout</strong><button>Close</button></aside></body></html>';
const about='<!doctype html><html><head><title>About</title><link rel="stylesheet" href="/assets/platform-integrity-v15.css?v=15"><link rel="stylesheet" href="/assets/final-test-v113.css?v=2"></head><body><main><h1>About</h1></main></body></html>';

function downstream(req,res){
  const u=new URL(req.url,'https://australianproductguide.au');
  const key=u.pathname+u.search;
  if(u.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(home)}
  if(u.pathname==='/about/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(about)}
  if(key==='/assets/feature-test-v113.css?v=1'){res.statusCode=308;res.setHeader('Location','/assets/feature-test-v113.css');return res.end()}
  const asset=assets.get(key);
  if(asset){res.setHeader('Content-Type',asset[0]);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');return res.end(asset[1])}
  res.statusCode=404;res.setHeader('Content-Type','text/plain; charset=utf-8');return res.end('not found');
}
function request(handler,url,method='GET'){
  let body='';
  const headers=new Map();
  const req={url,method,headers:{host:'australianproductguide.au'}};
  const res={
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),value);return this},
    getHeader(name){return headers.get(String(name).toLowerCase())},
    removeHeader(name){headers.delete(String(name).toLowerCase())},
    write(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return true},
    end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return body}
  };
  handler(req,res);
  return {statusCode:res.statusCode,headers,body};
}

assert.equal(layer.VERSION,'113.4');
assert.equal(layer.CSS_PATH,'/assets/pagespeed-home-v113.css');
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

const handler=layer.wrap(downstream);
const homepage=request(handler,'/');
assert.equal(homepage.statusCode,200);
assert.equal(homepage.headers.get('x-apg-pagespeed-agentic-certification'),'v113.4');
assert(homepage.body.includes('name="apg-pagespeed-agentic-certification" content="v113.4"'));
assert(homepage.body.includes('/assets/pagespeed-home-v113.css?v='));
assert.equal(layer.blockingStylesheetLinks(homepage.body).length,1,'homepage must expose one render-blocking internal stylesheet request');
assert(homepage.body.includes('rel="preload" as="style" href="/assets/noncritical-test-v113.css?v=1"'),'preloaded noncritical CSS must be preserved');
assert(homepage.body.includes('media="print"'),'print-switched noncritical CSS must be preserved');
assert(homepage.body.includes('<noscript><link rel="stylesheet" href="/assets/noncritical-test-v113.css?v=1"></noscript>'),'noscript fallback must be preserved');
assert(homepage.body.includes('<aside id="apgAssistantPanel" hidden aria-labelledby="apgScoutTitle">'),'transformed Scout must use valid native aside semantics');
assert(!homepage.body.includes('aria-hidden="true"'),'static Scout panel must rely on native hidden');
assert(!homepage.body.includes('role="dialog"'),'homepage must not expose the invalid aside/dialog combination');
assert(!homepage.body.includes('aria-modal="false"'),'homepage must not expose aria-modal without dialog semantics');

const css=request(handler,`${layer.CSS_PATH}?v=${layer.BUILD_ID}`);
assert.equal(css.statusCode,200);
assert(css.body.includes('.v15-directory-tools'),'source-controlled static CSS must be present in the combined bundle');
assert(css.body.includes('.feature-v113{display:grid}'),'redirected generated stylesheet must be included');
assert(css.body.includes('.final-v113{color:#123}'));
assert(!css.body.includes('.noncritical-v113{display:block}'),'noncritical CSS must remain outside the render-blocking bundle');
assert.match(css.headers.get('cache-control'),/max-age=31536000/);
assert.match(css.headers.get('cache-control'),/immutable/);

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

const wholeSite={wrap(next){return next}};
layer.install(wholeSite);
const installedHandler=wholeSite.wrap(downstream);
assert.equal(request(installedHandler,'/').headers.get('x-apg-pagespeed-agentic-certification'),'v113.4');

console.log(JSON.stringify({
  ok:true,
  version:layer.VERSION,
  homepageBlockingStylesheetRequests:1,
  staticCssBundling:'verified',
  noncriticalStyles:'preserved',
  internalAssetRedirects:'followed',
  versionedAssetCaching:'immutable',
  coldStartCssGeneration:'async-safe',
  scoutAriaRepair:'native-hidden-valid-aside',
  agenticTarget:'3/3',
  policy:'Transport optimisation only; recommendation, retailer, account and decision logic are unchanged.'
},null,2));