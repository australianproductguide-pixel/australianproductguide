#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const OUT=process.env.SCOUT_GLOBAL_BROWSER_OUT||'artifacts/production-scout-global-v111';
const EXPECTED='v111.0';
const SHA=(process.env.APG_EXPECTED_SHA||process.env.GITHUB_SHA||'').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
fs.mkdirSync(OUT,{recursive:true});

const report={suite:'production-scout-global-browser-v111',version:EXPECTED,baseUrl:BASE,gitSha:SHA||null,started:new Date().toISOString(),checks:[],failures:[]};

async function waitForProduction(){
  for(let attempt=1;attempt<=150;attempt++){
    try{
      const response=await fetch(BASE+'/categories/?apg-scout-cert='+Date.now(),{headers:{'cache-control':'no-cache'}});
      const surface=response.headers.get('x-apg-scout-global-surface')||'';
      const text=await response.text();
      if(response.ok&&surface===EXPECTED&&text.includes('data-apg-scout-global-surface="v111.0"'))return;
      console.log(`Waiting for ${EXPECTED}: attempt=${attempt} status=${response.status} surface=${surface||'none'}`);
    }catch(error){console.log(`Waiting for ${EXPECTED}: attempt=${attempt} transport=${error.message}`)}
    await sleep(4000);
  }
  throw new Error(`Production did not expose ${EXPECTED} within certification window`);
}
async function visible(page,selector){
  const handle=await page.$(selector);if(!handle)return null;
  const ok=await handle.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return !el.hidden&&r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0});
  return ok?handle:null;
}
async function dismissOverlays(page){
  for(const selector of ['[data-apg-consent] [data-consent-essential]','[data-account-nudge] [data-account-nudge-dismiss]']){
    const button=await visible(page,selector);if(button){try{await button.click();await sleep(80)}catch{}}
  }
}
async function certifyRoute(browser,route,viewport,label){
  const page=await browser.newPage();
  await page.setViewport(viewport);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message||String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/google-analytics|googletagmanager|doubleclick|favicon/i.test(m.text()))errors.push(m.text())});
  try{
    const response=await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});
    assert(response&&response.status()<500,`${label} ${route}: HTTP ${response?.status()}`);
    assert((response.headers()['x-apg-scout-global-surface']||'')===EXPECTED,`${label} ${route}: response is not ${EXPECTED}`);
    await page.waitForSelector('main',{timeout:12000});
    await dismissOverlays(page);
    await sleep(180);
    const state=await page.evaluate(()=>{
      const launcher=document.getElementById('apgAssistantLauncher');
      if(!launcher)return {exists:false};
      const r=launcher.getBoundingClientRect(),s=getComputedStyle(launcher);
      const x=Math.min(innerWidth-1,Math.max(0,r.left+r.width/2));
      const y=Math.min(innerHeight-1,Math.max(0,r.top+r.height/2));
      const top=document.elementFromPoint(x,y);
      return {
        exists:true,hidden:launcher.hidden,display:s.display,visibility:s.visibility,opacity:Number(s.opacity||1),pointerEvents:s.pointerEvents,
        position:s.position,zIndex:s.zIndex,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,
        rightGap:innerWidth-r.right,bottomGap:innerHeight-r.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,
        bodySurface:document.body.dataset.apgScoutGlobalSurface||'',occluded:!(top===launcher||launcher.contains(top)),occluder:top?.tagName+'#'+(top?.id||'')+'.'+(top?.className||'')
      };
    });
    assert(state.exists,`${label} ${route}: launcher missing`);
    assert(!state.hidden&&state.display!=='none'&&state.visibility!=='hidden'&&state.opacity>0,`${label} ${route}: launcher not visibly rendered ${JSON.stringify(state)}`);
    assert(state.pointerEvents!=='none'&&state.position==='fixed',`${label} ${route}: launcher not interactive/fixed ${JSON.stringify(state)}`);
    assert(state.width>=44&&state.height>=44,`${label} ${route}: launcher below touch target ${JSON.stringify(state)}`);
    assert(state.left>state.viewportWidth/2,`${label} ${route}: launcher is not on right side ${JSON.stringify(state)}`);
    assert(state.rightGap>=0&&state.rightGap<=36,`${label} ${route}: right gap out of range ${JSON.stringify(state)}`);
    assert(state.bottomGap>=0&&state.bottomGap<=40,`${label} ${route}: bottom gap out of range ${JSON.stringify(state)}`);
    assert(!state.occluded,`${label} ${route}: launcher is occluded by ${state.occluder}`);
    assert(state.bodySurface==='v111.0',`${label} ${route}: body surface marker missing ${JSON.stringify(state)}`);

    const launcher=await visible(page,'#apgAssistantLauncher');assert(launcher,`${label} ${route}: launcher not clickable`);
    await launcher.click();
    await page.waitForSelector('#apgAssistantPanel:not([hidden])',{timeout:5000});
    assert(await visible(page,'#apgAssistantPanel .scout-v5-input'),`${label} ${route}: Scout panel/input did not open`);
    const close=await visible(page,'#apgAssistantPanel [data-apg-assistant-close]');assert(close,`${label} ${route}: close control missing`);await close.click();
    await page.waitForFunction(()=>document.getElementById('apgAssistantPanel')?.hidden===true,{timeout:3000});
    assert(await visible(page,'#apgAssistantLauncher'),`${label} ${route}: launcher did not return after close`);
    assert(errors.length===0,`${label} ${route}: browser errors ${errors.join(' | ')}`);
    report.checks.push({label,route,result:'PASS',geometry:state});
  }catch(error){
    report.failures.push({label,route,error:error.message});
    try{await page.screenshot({path:path.join(OUT,`${label}-${route.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'home'}-failure.png`),fullPage:true})}catch{}
  }finally{await page.close()}
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome not found: ${CHROME}`);
  await waitForProduction();
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const nonHome=[
    '/categories/','/categories/wireless-headphones/','/categories/wireless-headphones/finder/',
    '/products/bose-quietcomfort-ultra-headphones/','/search/?q=wireless+headphones','/compare/wireless-headphones/',
    '/decision-lab/','/my-apg/','/guides/wireless-headphones-buying-guide/','/retailers/','/deals/','/methodology/'
  ];
  const mobile390={width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:3};
  const mobile430={width:430,height:932,isMobile:true,hasTouch:true,deviceScaleFactor:3};
  const desktop={width:1440,height:950};
  for(const route of nonHome)await certifyRoute(browser,route,mobile390,'mobile-390');
  for(const route of nonHome)await certifyRoute(browser,route,mobile430,'mobile-430');
  for(const route of ['/categories/','/products/bose-quietcomfort-ultra-headphones/','/search/?q=headphones','/compare/wireless-headphones/','/decision-lab/','/methodology/'])await certifyRoute(browser,route,desktop,'desktop');
  await browser.close();
  report.completed=new Date().toISOString();
  report.result=report.failures.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({suite:report.suite,result:report.result,checks:report.checks.length,failures:report.failures},null,2));
  if(report.failures.length)process.exit(1);
  console.log(`APG_SCOUT_GLOBAL_BROWSER=PASS version=${EXPECTED} checks=${report.checks.length} nonHomeRoutes=${nonHome.length}`);
})().catch(error=>{report.result='ERROR';report.failures.push({label:'runner',route:'',error:error.message});try{fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2))}catch{};console.error(error.stack||error);process.exit(1)});