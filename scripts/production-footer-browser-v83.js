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
const report={suite:'production-footer-browser-v83.1',baseUrl:BASE,gitSha:SHA||null,started:new Date().toISOString(),viewports:[],failures:[]};
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

async function positionFooterLink(handle){
  await handle.evaluate(el=>{
    el.scrollIntoView({block:'nearest',inline:'nearest'});
    const r=el.getBoundingClientRect();
    const desired=Math.max(80,Math.min(innerHeight*0.42,360));
    const delta=r.top-desired;
    if(Math.abs(delta)>2)window.scrollBy({top:delta,left:0,behavior:'instant'});
  });
  await sleep(220);
}

async function clickFooterLink(page,href,label){
  await prepare(page,'/');
  const handle=await page.$(`.apg-footer-v11 .footer-v11-nav a[href="${href.replace(/"/g,'\\"')}"]`);
  assert(handle,`${label}: missing footer link ${href}`);
  await positionFooterLink(handle);
  const hit=await handle.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const left=Math.max(0,r.left),right=Math.min(innerWidth,r.right);
    const topEdge=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
    const visibleWidth=Math.max(0,right-left),visibleHeight=Math.max(0,bottom-topEdge);
    const x=left+visibleWidth/2,y=topEdge+visibleHeight/2;
    const top=visibleWidth>0&&visibleHeight>0?document.elementFromPoint(x,y):null;
    const nav=getComputedStyle(el.closest('.footer-v11-nav'));
    const own=getComputedStyle(el);
    const launcher=document.getElementById('apgAssistantLauncher');
    const ls=launcher?getComputedStyle(launcher):null;
    return {
      width:r.width,height:r.height,x,y,rectTop:r.top,rectBottom:r.bottom,
      viewportWidth:innerWidth,viewportHeight:innerHeight,
      visibleWidth,visibleHeight,
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
  assert(hit.visibleWidth>0&&hit.visibleHeight>0,`${label}: footer link ${href} is outside the viewport after positioning: ${JSON.stringify(hit)}`);
  assert(hit.ownsPoint,`${label}: tap point for ${href} is intercepted by ${hit.topTag}.${hit.topClass||''} href=${hit.topHref||''}; geometry=${JSON.stringify(hit)}`);
  assert(hit.pointerEvents!=='none',`${label}: footer link ${href} has pointer-events:none`);
  const expected=new URL(BASE+href);
  await Promise.all([
    page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}),
    page.mouse.click(hit.x,hit.y,{delay:35})
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
  const context={route:'initialising'};
  let routes=[];
  const rows=[];
  const pushError=(type,text,location)=>errors.push({
    type,
    text:String(text||''),
    route:context.route,
    pageUrl:page.url(),
    sourceUrl:location&&location.url||null,
    lineNumber:location&&Number.isFinite(location.lineNumber)?location.lineNumber:null,
    columnNumber:location&&Number.isFinite(location.columnNumber)?location.columnNumber:null
  });
  page.on('pageerror',error=>pushError('pageerror',error.message||String(error),null));
  page.on('console',message=>{
    if(message.type()!=='error'||/google-analytics|googletagmanager|doubleclick|favicon/i.test(message.text()))return;
    pushError('console',message.text(),message.location());
  });
  try{
    context.route='footer-discovery';
    await prepare(page,'/');
    routes=await hrefs(page);
    for(const required of REQUIRED)assert(routes.includes(required),`${name}: required footer destination missing ${required}`);
    for(const route of routes){
      context.route=route;
      const errorStart=errors.length;
      const geometry=await clickFooterLink(page,route,name);
      rows.push({route,result:'PASS',destination:page.url(),geometry,newErrors:errors.slice(errorStart)});
    }
    context.route='final-footer-geometry';
    await prepare(page,'/');
    const first=await page.$('.apg-footer-v11 .footer-v11-group a');
    assert(first,`${name}: footer contains no navigation links`);
    await positionFooterLink(first);
    let mobileState=null;
    if(viewport.width<=700){
      mobileState=await page.evaluate(()=>{
        const first=document.querySelector('.apg-footer-v11 .footer-v11-group a');
        const nav=document.querySelector('.apg-footer-v11 .footer-v11-nav');
        const launcher=document.getElementById('apgAssistantLauncher');
        const r=first&&first.getBoundingClientRect();
        const ls=launcher&&getComputedStyle(launcher);
        const groups=[...document.querySelectorAll('.apg-footer-v11 .footer-v11-group')].slice(0,4).map(group=>{
          const box=group.getBoundingClientRect();
          return {left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height};
        });
        return {
          height:r&&r.height||0,
          columns:nav&&getComputedStyle(nav).gridTemplateColumns||'',
          groups,
          launcherGuard:!!launcher&&launcher.classList.contains('apg-footer-overlap-guard'),
          launcherVisibility:ls&&ls.visibility||null,
          launcherPointerEvents:ls&&ls.pointerEvents||null
        };
      });
      assert(mobileState.height>=43.5,`${name}: mobile footer tap target ${mobileState.height}px is below 44px`);
      assert(mobileState.groups.length===4,`${name}: expected four footer groups, got ${mobileState.groups.length}`);
      const [one,two,three,four]=mobileState.groups;
      const sameRow=(a,b)=>Math.abs(a.top-b.top)<=3;
      assert(sameRow(one,two)&&two.left>one.left+20,`${name}: first two footer groups are not a two-column row: ${JSON.stringify(mobileState)}`);
      assert(sameRow(three,four)&&four.left>three.left+20,`${name}: second two footer groups are not a two-column row: ${JSON.stringify(mobileState)}`);
      assert(three.top>one.top+20,`${name}: footer groups did not form a second row: ${JSON.stringify(mobileState)}`);
      assert(one.width>100&&two.width>100&&three.width>100&&four.width>100,`${name}: footer columns are too narrow: ${JSON.stringify(mobileState)}`);
      assert(mobileState.launcherGuard&&mobileState.launcherPointerEvents==='none',`${name}: Scout footer overlap guard not active: ${JSON.stringify(mobileState)}`);
    }
    if(errors.length)throw new Error(`${name}: browser errors: ${JSON.stringify(errors)}`);
    report.viewports.push({name,viewport,result:'PASS',links:rows.length,routes,rows,mobileState,errors});
  }catch(error){
    report.failures.push({name,error:error.message,errors});
    report.viewports.push({name,viewport,result:'FAIL',error:error.message,linksCompleted:rows.length,routes,rows,errors});
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
  console.log(`FOOTER_NAVIGATION_V83_1_PRODUCTION=PASS viewports=${report.viewports.length} clicks=${report.viewports.reduce((sum,row)=>sum+(row.links||0),0)}`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
