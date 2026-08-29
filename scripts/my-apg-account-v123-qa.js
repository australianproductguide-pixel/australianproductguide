'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=require('../api/index');
const account=require('../lib/my-apg-account-v123-runtime');

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
  assert.equal(account.VERSION,'123.0');
  assert.equal(account.CSS_PATH,'/assets/my-apg-account-v123.css');
  assert.equal(account.JS_PATH,'/assets/my-apg-account-v123.js');
  assert.equal(account.JOURNEY_JS,'/assets/account-journey-v242.js');

  const response=await render('/my-apg/');
  assert.equal(response.status,200,'/my-apg/ must render');
  assert.equal(response.headers['x-apg-my-apg-account-journey'],'v123.0','route must expose v123 response marker');
  assert.equal(response.headers['x-apg-header-marketplace-mobile-left-lockup'],'v122.6','accepted header v122.6 must remain intact');
  assert.equal(response.headers['x-apg-header-marketplace-mobile-supermenu'],'v122.5','accepted supermenu v122.5 must remain intact');
  assert.equal(response.headers['x-apg-scout-navigator-presentation'],'v7.1','Navigator final presentation lineage must remain intact');

  assert.equal(count(response.body,'name="apg-my-apg-account-journey"'),1,'one v123 page marker required');
  assert.equal(count(response.body,'data-apg-account-primary-mount'),1,'one primary account mount required');
  assert.equal(count(response.body,'/assets/my-apg-account-v123.css?v=123.0'),1,'one v123 stylesheet required');
  assert.equal(count(response.body,'/assets/my-apg-account-v123.js?v=123.0'),1,'one v123 route client required');
  assert.equal(count(response.body,'/assets/account-journey-v242.js?v=24.2'),1,'one validation-only account journey required');
  assert.equal(count(response.body,'account-journey-v241.js'),0,'superseded multi-owner account journey must be removed');
  assert.equal(count(response.body,'v5-account-status'),0,'repeated account status panel must be removed');
  assert.equal(count(response.body,'decision-hero workspace-hero'),0,'oversized duplicate workspace hero must be removed');
  assert.equal(count(response.body,'Your product decision workspace.'),1,'compact account-first heading must render once');
  assert.equal(count(response.body,'Continue your product research'),1,'workspace must retain a clear downstream heading');

  const mount=response.body.indexOf('data-apg-account-primary-mount');
  const rail=response.body.indexOf('class="apg-system-rail"');
  const workspace=response.body.indexOf('data-apg-workspace');
  assert(mount>=0&&rail>mount&&workspace>rail,'journey order must be account access -> Continue rail -> workspace');

  const unrelated=await render('/about/');
  assert.equal(unrelated.status,200,'unrelated route must render');
  assert.equal(count(unrelated.body,'name="apg-my-apg-account-journey"'),0,'v123 HTML changes must remain route-scoped');
  assert.equal(count(unrelated.body,'data-apg-account-primary-mount'),0,'account mount must not leak to unrelated routes');

  const css=await render('/assets/my-apg-account-v123.css?v=123.0');
  assert.equal(css.status,200,'v123 CSS must be served');
  assert.equal(css.headers['content-type'],'text/css; charset=utf-8');
  assert.equal(css.headers['x-apg-my-apg-account-journey'],'v123.0');
  for(const token of ['[data-account-panel]{display:none!important}','grid-template-columns:1fr 1fr','[data-apg-account-primary-mount]>.apg-account-shell','@media(max-width:760px)'])assert(css.body.includes(token),`v123 CSS must retain ${token}`);

  const js=await render('/assets/my-apg-account-v123.js?v=123.0');
  assert.equal(js.status,200,'v123 JS must be served');
  assert.equal(js.headers['content-type'],'application/javascript; charset=utf-8');
  assert(js.body.includes("document.querySelectorAll('[data-account-panel]').forEach(el=>el.remove())"),'route client must remove legacy duplicate panels defensively');
  assert(js.body.includes("target.appendChild(shell)"),'route client must move the authoritative account shell to the primary mount');

  const journey=fs.readFileSync(path.join(__dirname,'..','public','assets','account-journey-v242.js'),'utf8');
  assert(journey.includes("root.dataset.mode==='signup'"),'v24.2 must validate according to authoritative account-platform mode');
  assert(!journey.includes('URLSearchParams'),'v24.2 must not become a second query-param/mode owner');
  assert(!journey.includes('.click()'),'v24.2 must not mutate login/signup mode by clicking tabs');
  assert(journey.includes('12 characters'),'v24.2 must preserve strong signup password guidance');
  assert(journey.includes('Passwords do not match'),'v24.2 must preserve confirm-password validation');

  const legacy=fs.readFileSync(path.join(__dirname,'..','lib','account-sync-client.js'),'utf8');
  assert(legacy.includes("document.body.dataset.apgMyApgAccountJourney)return"),'legacy direct-browser account panel must be disabled on v123');

  const platform=fs.readFileSync(path.join(__dirname,'..','lib','account-platform.js'),'utf8');
  for(const route of ['/api/account/signup','/api/account/login','/api/account/recover','/api/account/password','/api/account/preferences','/api/account/delete'])assert(platform.includes(route),`server-mediated account control must remain present: ${route}`);
  for(const banned of ['scoreProduct(','rankDecision(','commissionWeight'])assert(!fs.readFileSync(path.join(__dirname,'..','lib','my-apg-account-v123-runtime.js'),'utf8').includes(banned),`v123 must not alter recommendation/commercial weighting: ${banned}`);

  console.log('MY_APG_ACCOUNT_V123=PASS accountSurface=single order=account-continue-workspace authOwner=account-platform legacyPanel=retired validation=v24.2 header=v122.6 recommendationWeight=0');
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
