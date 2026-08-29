'use strict';

const assert=require('node:assert/strict');
const app=require('../api/index');
const navigator=require('../lib/scout-navigator-v7-global-runtime');

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
  assert.equal(navigator.VERSION,'7.1');
  assert.equal(navigator.CSS_PATH,'/assets/scout-navigator-v7-global.css');

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
    assert.equal(response.status,200,`${route} must render successfully`);
    assert.equal(response.headers['x-apg-scout-navigator-presentation'],'v7.1',`${route} must expose Scout Navigator parity header`);
    assert.equal(count(response.body,'name="apg-scout-navigator-presentation"'),1,`${route} must contain exactly one Navigator parity marker`);
    assert.equal(count(response.body,'/assets/scout-navigator-v7-global.css?v=7.1'),1,`${route} must contain exactly one final Navigator stylesheet`);
    assert(response.body.includes('data-apg-scout-navigator="v7.1"'),`${route} must expose the Navigator body contract`);
    assert.equal(count(response.body,'id="apgAssistantLauncher"'),1,`${route} must retain exactly one Scout launcher`);
    assert.equal(count(response.body,'id="apgAssistantPanel"'),1,`${route} must retain exactly one Scout panel`);
    assert(response.body.includes('apg-scout-character-v34'),`${route} must retain the canonical Scout character hook`);
    const hrefs=directStylesheetHrefs(response.body);
    assert(hrefs.length>0,`${route} must expose direct stylesheets`);
    assert.equal(hrefs[hrefs.length-1],'/assets/scout-navigator-v7-global.css?v=7.1',`${route} must make Navigator v7.1 the final direct stylesheet in the CSS cascade`);
    const finalPos=response.body.lastIndexOf('/assets/scout-navigator-v7-global.css?v=7.1');
    for(const older of ['/assets/scout-concierge-v5.css','/assets/scout-global-surface-v111.css','/assets/premium-mobile-decision-commerce-v112.css','/assets/about-trust-navigation-v116.css','/assets/whole-site-experience-v109.css','/assets/pagespeed-home-v113.css','/assets/header-marketplace-v1222.css','/assets/header-marketplace-v1223.css','/assets/header-marketplace-v1224.css']){
      const olderPos=response.body.lastIndexOf(older);
      if(olderPos>=0)assert(finalPos>olderPos,`${route} must load Navigator parity after ${older}`);
    }
  }

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

  console.log(JSON.stringify({version:navigator.VERSION,status:'PASS',routesChecked:routes.length,checks:{sameComponentEverywhere:true,finalCascadeEverywhere:true,approvedNavigatorAsset:true,apgPalette:true,reducedMotion:true,geometryPreserved:true,decisionLogicUntouched:true,commercialScoringUntouched:true}},null,2));
  require('./header-marketplace-v1222-qa');
  require('./header-marketplace-v1223-qa');
  require('./header-marketplace-v1224-qa');
  require('./ebay-smart-placement-v1-qa');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
