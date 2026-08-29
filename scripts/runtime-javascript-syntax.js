const http=require('http');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const app=require('../lib/account-release-reconcile');

const runtimeAssets=[
  '/assets/app.js',
  '/assets/assistant.js',
  '/assets/brand-polish.js',
  '/assets/navigation-v8.js',
  '/assets/amazon-associates.js',
  '/assets/account-platform.js'
];
const v124Path=path.join(__dirname,'..','public','assets','my-apg-account-v124.js');
const journeyPath=path.join(__dirname,'..','public','assets','account-journey-v241.js');
const publicAssets=[
  path.join(__dirname,'..','public','assets','brand-missing-logo-loader-v73.js'),
  path.join(__dirname,'..','public','assets','apg-proof-rail-v103.js'),
  journeyPath,
  v124Path
];

function assertMyApgV124Contract(){
  const v124=fs.readFileSync(v124Path,'utf8');
  const journey=fs.readFileSync(journeyPath,'utf8');
  const legacy=fs.readFileSync(path.join(__dirname,'..','lib','account-sync-client.js'),'utf8');
  const platform=fs.readFileSync(path.join(__dirname,'..','lib','account-platform.js'),'utf8');
  const checks=[
    ['route-guard',v124.includes("location.pathname!=='/my-apg/'")],
    ['fail-safe-shell-first',v124.includes("if(!shell)return false")&&v124.indexOf("if(!shell)return false")<v124.indexOf('document.body.dataset.apgMyApgConsolidated=VERSION')],
    ['single-surface-cleanup',v124.includes("qa('[data-account-panel]',root).forEach(el=>el.remove())")],
    ['loader-css',journey.includes('/assets/my-apg-account-v124.css?v=124.0')],
    ['loader-js',journey.includes('/assets/my-apg-account-v124.js?v=124.0')],
    ['legacy-auth-retired',legacy.includes("if(location.pathname==='/my-apg/')return;")],
    ['server-account-login',platform.includes('data-account-tab=\\"login\\"')||platform.includes('data-account-tab="login"')],
    ['server-account-signup',platform.includes('data-account-tab=\\"signup\\"')||platform.includes('data-account-tab="signup"')],
    ['no-server-response-wrapper',!/(?:\bres\.|setHeader\s*\(|module\.exports|require\s*\()/.test(v124)]
  ];
  const failed=checks.filter(([,ok])=>!ok).map(([name])=>name);
  if(failed.length)throw new Error(`MY_APG_ACCOUNT_V124=FAIL ${failed.join(',')}`);
  console.log(`MY_APG_ACCOUNT_V124=PASS route=my-apg accountSurface=single authOwner=account-platform failSafe=shell-first serverWrapper=none checks=${checks.length}`);
}

async function assertMyApgV124ServerSmoke(port){
  // P0 regression: the rolled-back v123 account release destabilised the homepage.
  // Repeatedly exercise the outer server runtime plus the account and adjacent routes
  // before a deployment can pass qa:deploy. This is intentionally independent of the
  // browser-only v124 presentation so an account UI change cannot hide a server failure.
  const homeRepeats=8;
  const checks=[];
  for(let i=0;i<homeRepeats;i++)checks.push({path:'/',label:`home-${i+1}`});
  checks.push(
    {path:'/my-apg/',label:'my-apg'},
    {path:'/my-apg/?account=login',label:'my-apg-login'},
    {path:'/my-apg/?account=signup',label:'my-apg-signup'},
    {path:'/decision-lab/',label:'decision-lab'},
    {path:'/deals/',label:'deals'},
    // The local APG smoke server resolves static assets by pathname only. Versioned
    // query strings are separately preserved and asserted in the loader contract above.
    {path:'/assets/account-journey-v241.js',label:'account-journey-v241'},
    {path:'/assets/my-apg-account-v124.js',label:'my-apg-v124-js'},
    {path:'/assets/my-apg-account-v124.css',label:'my-apg-v124-css'}
  );
  for(const check of checks){
    const response=await fetch(`http://127.0.0.1:${port}${check.path}`,{redirect:'follow'});
    if(!response.ok)throw new Error(`MY_APG_V124_SERVER_SMOKE=FAIL ${check.label} HTTP ${response.status}`);
    const body=await response.text();
    if(!body)throw new Error(`MY_APG_V124_SERVER_SMOKE=FAIL ${check.label} empty-body`);
  }
  console.log(`MY_APG_V124_SERVER_SMOKE=PASS homeRepeats=${homeRepeats} keyRoutes=5 assets=3 serverWrapper=none`);
}

const server=http.createServer((req,res)=>app(req,res));
server.listen(0,'127.0.0.1',async()=>{
  const {port}=server.address();
  try{
    for(const assetPath of runtimeAssets){
      const response=await fetch(`http://127.0.0.1:${port}${assetPath}`);
      if(!response.ok)throw new Error(`${assetPath} returned HTTP ${response.status}`);
      const source=await response.text();
      new vm.Script(source,{filename:assetPath});
      console.log(`RUNTIME_JS_PARSE=PASS ${assetPath}`);
    }
    for(const filePath of publicAssets){
      const source=fs.readFileSync(filePath,'utf8');
      new vm.Script(source,{filename:filePath});
      console.log(`RUNTIME_JS_PARSE=PASS /assets/${path.basename(filePath)}`);
    }
    assertMyApgV124Contract();
    await assertMyApgV124ServerSmoke(port);
    console.log(`RUNTIME_JS_SYNTAX=PASS assets=${runtimeAssets.length+publicAssets.length}`);
  }catch(error){
    console.error(error.stack||error.message||String(error));
    process.exitCode=1;
  }finally{
    server.close();
  }
});