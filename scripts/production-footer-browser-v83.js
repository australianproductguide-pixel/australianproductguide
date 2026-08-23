#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const OUT=process.env.FOOTER_BROWSER_OUT||'artifacts/production-footer-browser-v83';
const SHA=(process.env.APG_EXPECTED_SHA||process.env.GITHUB_SHA||'').trim();
const REQUIRED=['/about/','/methodology/','/editorial-standards/','/sources/','/corrections-policy/','/coverage/','/contact/','/affiliate-disclosure/','/privacy/','/terms/'];
const report={suite:'production-footer-browser-v83',baseUrl:BASE,gitSha:SHA||null,started:new Date().toISOString(),viewports:[],failures:[]};
fs.mkdirSync(OUT,{recursive:true});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};

async function dismissConsent(page){
  const button=await page.$('[data-apg-consent] [data-consent-essential]');
  if(button){
    const visible=await button.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';});
    if(visible){await button.click();await sleep(100);}
  }
}

async function prepare(page,route='/'){
  const response=await page.goto(BASE+route,{waitUntil:'domcontentloaded',timeout:30000});
  assert(response&&response.status()<500,`${route}: HTTP ${response&&response.status()}`);
  await page.waitForSelector('.apg-footer-v11 .footer-v11-nav',{timeout:12000});
  await dismissConsent(page);
  await page.evaluate(()=>{
    try{
      const now=Date.now();
      localStorage.setItem('apg_account_nudge_v1',JSON.stringify({dismissedUntil:now+86400000,lastShown:now}));
    }catch{}
  });
  await sleep(120);
}

async function hrefs(page){
  return page.$$eval('.apg-footer-v11 .footer-v11-nav a[href]',links=>[...new Set(links.map(a=>a.getAttribute('href')).filter(h=>h&&h.startsWith('/')))]);
}

async function clickFooterLink(page,href,label){
  await prepare(page,'/');
  const handle=await page.$(`.apg-footer-v11 .footer-v11-nav a[href="${href.replace(/"/g,'\\"')}"]`);
  assert(handle,`${label}: missing footer link ${href}`);
  await handle.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
  await sleep(180);
  const hit=await handle.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const x=r.left+r.width/2,y=r.top+r.height/2;
    const top=document.elementFromPoint(x,y);
    const nav=getComputedStyle(el.closest('.footer-v11-nav'));
    const own=getComputedStyle(el);
    const launcher=document.getElementById('apgAssistantLauncher');
    const ls=launcher?getComputedStyle(launcher):null;
    return {
      width:r.width,height:r.height,x,y,
      topTag:top&&top.tagName||null,
      topClass:top&&String(top.className||'')||null,
      topHref:top&&top.getAttribute?top.getAttribute('href'):null,
      ownsPoint:top===el||el.contains(top),
      navColumns:nav.gridTemplateColumns,
      pointerEvents:own.pointerEvents,
      launcherVisibility:ls&&ls.visibility||null,
      launcherPointerEvents:ls&&ls.pointerEvents||null,
      launcherGuard:!!launcher&&launcher.classList.contains('apg-footer-overlap-guard')
    };
  });
  assert(hit.ownsPoint,`${label}: tap point for ${href} is intercepted by ${hit.topTag}.${hit.topClass||''} href=${hit.topHref||''}`);
  assert(hit.pointerEvents!=='none',`${label}: footer link ${href} has pointer-events:none`);
  const expected=new URL(BASE+href);
  await Promise.all([
    page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}),
    handle.click({delay:35})
  ]);
  const actual=new URL(page.url());
  assert(actual.pathname===expected.pathname,`${label}: ${href} navigated to ${actual.pathname}`);
  if(expected.hash)assert(actual.hash===expected.hash,`${label}: ${href} lost hash ${expected.hash}`);
  return hit;
}

async function runViewport(browser,name,viewport){
  const page=await browser.newPage();
  await page.setViewport(viewport);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message||String(error)));
  page.on('console',message=>{if(message.type()==='error'&&!/google-analytics|googletagmanager|doubleclick|favicon/i.test(message.text()))errors.push(message.text());});
  try{
    await prepare(page,'/');
    const routes=await hrefs(page);
    for(const required of REQUIRED)assert(routes.includes(required),`${name}: required footer destination missing ${required}`);
    const rows=[];
    for(const route of routes){
      const geometry=await clickFooterLink(page,route,name);
      rows.push({route,result:'PASS',geometry});
    }
    await prepare(page,'/');
    const mobileState=await page.evaluate(()=>{
      const first=document.querySelector('.apg-footer-v11 .footer-v11-group a');
      const nav=document.querySelector('.apg-footer-v11 .footer-v11-nav');
      if(!first||!nav)return null;
      first.scrollIntoView({block:'center'});
      const r=first.getBoundingClientRect();
      const launcher=document.getElementById('apgAssistantLauncher');
      const ls=launcher?getComputedStyle(launcher):null;
      return {height:r.height,columns:getComputedStyle(nav).gridTemplateColumns,launcherGuard:!!launcher&&launcher.classList.contains('apg-footer-overlap-guard'),launcherVisibility:ls&&ls.visibility||null,launcherPointerEvents:ls&&ls.pointerEvents||null};
    });
    await sleep(180);
    if(viewport.width<=700){
      const state=await page.evaluate(()=>{
        const first=document.querySelector('.apg-footer-v11 .footer-v11-group a');
        const nav=document.querySelector('.apg-footer-v11 .footer-v11-nav');
        const launcher=document.getElementById('apgAssistantLauncher');
        const r=first&&first.getBoundingClientRect();
        const ls=launcher&&getComputedStyle(launcher);
        return {height:r&&r.height||0,columns:nav&&getComputedStyle(nav).gridTemplateColumns||'',launcherGuard:!!launcher&&launcher.classList.contains('apg-footer-overlap-guard'),launcherVisibility:ls&&ls.visibility||null,launcherPointerEvents:ls&&ls.pointerEvents||null};
      });
      assert(state.height>=43.5,`${name}: mobile footer tap target ${state.height}px is below 44px`);
      assert(!/\s/.test(state.columns.trim()),`${name}: mobile footer remains multi-column: ${state.columns}`);
      assert(state.launcherGuard&&state.launcherPointerEvents==='none',`${name}: Scout footer overlap guard not active: ${JSON.stringify(state)}`);
    }
    assert(errors.length===0,`${name}: browser errors: ${errors.join(' | ')}`);
    report.viewports.push({name,viewport,result:'PASS',links:rows.length,routes,rows});
  }catch(error){
    report.failures.push({name,error:error.message});
    report.viewports.push({name,viewport,result:'FAIL',error:error.message});
    try{await page.screenshot({path:path.join(OUT,`${name}-failure.png`),fullPage:true});}catch{}
  }finally{await page.close();}
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  try{
    await runViewport(browser,'desktop-footer-navigation',{width:1440,height:950});
    await runViewport(browser,'mobile-390-footer-navigation',{width:390,height:844,isMobile:true,hasTouch:true});
    await runViewport(browser,'mobile-430-footer-navigation',{width:430,height:932,isMobile:true,hasTouch:true});
  }finally{await browser.close();}
  report.finished=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  if(report.failures.length){console.error(JSON.stringify(report.failures,null,2));process.exit(1);}
  console.log(`FOOTER_NAVIGATION_V83_PRODUCTION=PASS viewports=${report.viewports.length} clicks=${report.viewports.reduce((sum,row)=>sum+(row.links||0),0)}`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
