'use strict';
const assert=require('assert');
const {EventEmitter}=require('events');
const fs=require('fs');
const api=require('../api/index');
const runtime=require('../lib/interaction-runtime-v55');

assert.equal(runtime.INTERACTION_VERSION,'55.0');
assert.equal(runtime.INTERACTION_MODE,'ssr-native-v55');
assert.equal(api.INTERACTION_MODE,'ssr-native-v55');
assert.equal(api.VERSION,'52.0','Search v52 server contract must remain available beneath v55');
assert.equal(api.DECISION_VERSION,'50.6','Decision v50.6 server contract must remain available beneath v55');

const synthetic='<!doctype html><html><head>'+
  runtime.RETIRED_BROWSER_ASSETS.map(x=>`<script src="${x}?v=test" defer></script>`).join('')+
  '<script src="/assets/app.js?v=current" defer></script>'+
  '<script src="/assets/assistant.js?v=current" defer></script>'+
  '<script src="/assets/navigation-v8.js?v=current" defer></script>'+
  '</head><body><a href="/products/test/">Product</a></body></html>';
const reconciled=runtime.reconcileHtml(synthetic);
for(const asset of runtime.RETIRED_BROWSER_ASSETS)assert(!reconciled.includes(asset),`retired browser controller still emitted: ${asset}`);
for(const asset of ['/assets/app.js','/assets/assistant.js','/assets/navigation-v8.js'])assert(reconciled.includes(asset),`current functional asset unexpectedly removed: ${asset}`);
assert(reconciled.includes('name="apg-interaction-mode" content="ssr-native-v55"'));
assert(reconciled.includes('data-apg-interaction-runtime="ssr-native-v55"'));
assert(reconciled.includes('href="/products/test/"'),'native anchors must remain untouched');

function request(url){
  return new Promise((resolve,reject)=>{
    const req=new EventEmitter();
    req.method='GET';
    req.url=url;
    req.headers={host:'australianproductguide.au','x-forwarded-proto':'https'};
    const headers=new Map();
    const chunks=[];
    const res={
      statusCode:200,
      headersSent:false,
      setHeader(k,v){headers.set(String(k).toLowerCase(),v);},
      getHeader(k){return headers.get(String(k).toLowerCase());},
      removeHeader(k){headers.delete(String(k).toLowerCase());},
      end(body=''){
        this.headersSent=true;
        if(body!==undefined&&body!==null)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));
        resolve({status:this.statusCode,headers:Object.fromEntries(headers),body:Buffer.concat(chunks).toString('utf8')});
      },
      write(body){if(body!==undefined&&body!==null)chunks.push(Buffer.isBuffer(body)?body:Buffer.from(String(body)));return true;}
    };
    try{const returned=api(req,res);if(returned&&typeof returned.then==='function')returned.catch(reject);}catch(error){reject(error);}
  });
}

function assertRuntimeClean(page,label){
  assert.equal(page.status,200,`${label} must render 200`);
  assert.equal(page.headers['x-apg-interaction-runtime'],'ssr-native-v55',`${label} must expose v55 runtime header`);
  assert(page.body.includes('data-apg-interaction-runtime="ssr-native-v55"'),`${label} must expose v55 body diagnostic`);
  for(const asset of runtime.RETIRED_BROWSER_ASSETS)assert(!page.body.includes(asset),`${label} still emits ${asset}`);
  assert(page.body.includes('/assets/app.js'),`${label} must keep current core app interactions`);
  assert(page.body.includes('/assets/assistant.js'),`${label} must keep current Scout client`);
}

(async()=>{
  const search=await request('/search/?q=phone');
  assertRuntimeClean(search,'Search phone');
  assert(search.body.includes('Smartphones'),'Search phone must resolve to Smartphones');
  assert(search.body.includes('/products/oppo-find-x9/'),'Search phone must render native product destinations');
  assert(search.body.includes('Open product guide'),'Search phone must render product-guide CTA');

  const decision=await request('/decision-lab/?q=headphones%20under%20%24500%20for%20commuting');
  assertRuntimeClean(decision,'Decision Lab');
  assert(decision.body.includes('form class="decision-form" method="get"'),'Decision Lab must retain native GET form');
  assert(decision.body.includes('/products/'),'Decision Lab must render native product destinations');
  assert(decision.body.includes('Explainable shortlist'),'Decision Lab must render the shortlist server-side');

  const compare=await request('/compare/custom/?products=oppo-find-x9,samsung-galaxy-s26');
  assertRuntimeClean(compare,'Custom comparison');
  assert(compare.body.includes('Find X9'),'Compare must render first selected phone');
  assert(compare.body.includes('Galaxy S26'),'Compare must render second selected phone');
  assert(compare.body.includes('There is no universal winner'),'Compare must retain decision framing');

  const category=await request('/categories/smartphones/');
  assertRuntimeClean(category,'Smartphones category');
  assert(category.body.includes('Smartphones'),'Smartphones category destination must render');

  const scoutClient=fs.readFileSync(require.resolve('../lib/scout-concierge-v5-client'),'utf8');
  const actionStart=scoutClient.indexOf('function renderActions');
  assert(actionStart>=0,'Scout action renderer must exist');
  const actionBlock=scoutClient.slice(actionStart,actionStart+1400);
  assert(actionBlock.includes('if(a.url)'),'Scout actions must distinguish URL actions');
  assert(actionBlock.includes("return '<a"),'Scout URL actions must render anchors rather than navigation buttons');
  assert(actionBlock.includes('href='),'Scout URL action must include an href');
  assert(actionBlock.includes('esc(a.url)'),'Scout URL action href must use the maintained action URL');

  const runtimeSource=fs.readFileSync(require.resolve('../lib/interaction-runtime-v55'),'utf8');
  for(const forbidden of ['window.location','location.assign(','location.replace(','history.pushState(','event.preventDefault()','addEventListener(\'click\'']){
    assert(!runtimeSource.includes(forbidden),`v55 final reconciler must not become another browser router: ${forbidden}`);
  }

  console.log('INTERACTION_RUNTIME_V55=PASS routes=4 retired_browser_assets='+runtime.RETIRED_BROWSER_ASSETS.length);
})().catch(error=>{console.error(error);process.exitCode=1;});
