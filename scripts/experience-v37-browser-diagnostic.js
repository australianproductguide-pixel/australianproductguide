'use strict';
const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/experience-v37';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,startedAt:new Date().toISOString(),journeys:[],failures:[],browserErrors:[]};

function assert(ok,message){if(!ok)throw new Error(message);}
function sameOrigin(url){try{return new URL(url).origin===new URL(BASE).origin}catch{return false}}
async function responsive(page,label){
  const elapsed=await page.evaluate(async()=>{const start=performance.now();await new Promise(r=>setTimeout(r,120));return performance.now()-start;});
  assert(elapsed<1800,`${label}: main thread was unresponsive for ${Math.round(elapsed)}ms`);
  return elapsed;
}
async function screenshot(page,name){try{await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});}catch{}}
async function waitSettled(page,ms=350){await new Promise(r=>setTimeout(r,ms));await responsive(page,'settled');}
function attachDiagnostics(page,scope){
  page.on('pageerror',err=>report.browserErrors.push({scope,type:'pageerror',message:String(err&&err.message||err)}));
  page.on('console',msg=>{if(msg.type()==='error')report.browserErrors.push({scope,type:'console',message:msg.text()});});
  page.on('requestfailed',req=>{
    if(!sameOrigin(req.url()))return;
    const type=req.resourceType();
    if(!['script','fetch','xhr'].includes(type))return;
    report.browserErrors.push({scope,type:'requestfailed',resourceType:type,url:req.url(),message:req.failure()?.errorText||'failed'});
  });
}
async function goto(page,url){
  const response=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});
  assert(response&&response.status()<500,`${url}: HTTP ${response&&response.status()}`);
  await waitSettled(page);
  return response;
}
async function clickNav(page,selector,expectedPath){
  const nav=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000});
  await page.click(selector);
  await nav;
  await waitSettled(page);
  const pathname=await page.evaluate(()=>location.pathname);
  assert(pathname===expectedPath,`Expected ${expectedPath}, got ${pathname}`);
}
async function submitNav(page,formSelector,expectedPath){
  const nav=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:25000});
  await page.$eval(formSelector,f=>f.requestSubmit());
  await nav;
  await waitSettled(page);
  const pathname=await page.evaluate(()=>location.pathname);
  assert(pathname===expectedPath,`Expected ${expectedPath}, got ${pathname}`);
}
async function runJourney(browser,name,viewport,fn){
  const page=await browser.newPage();
  await page.setViewport(viewport);
  attachDiagnostics(page,name);
  const started=Date.now();
  try{
    await fn(page);
    report.journeys.push({name,ok:true,durationMs:Date.now()-started});
  }catch(error){
    report.journeys.push({name,ok:false,durationMs:Date.now()-started,error:error.message});
    report.failures.push({name,error:error.message});
    await screenshot(page,name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-failure');
  }finally{await page.close();}
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const desktop={width:1440,height:950};
  const mobile={width:390,height:844,isMobile:true,hasTouch:true};

  await runJourney(browser,'desktop-describe-what-you-need',desktop,async page=>{
    await goto(page,'/');
    const selector='a.button[href="/decision-lab/"]';
    assert(await page.$(selector),'Homepage Describe what I need link missing');
    await clickNav(page,selector,'/decision-lab/');
    assert(await page.$('form.decision-form'),'Decision Lab form missing after navigation');
    await page.type('form.decision-form textarea[name="q"]','quiet headphones for long flights');
    await submitNav(page,'form.decision-form','/decision-lab/');
    const text=await page.$eval('main',el=>el.innerText);
    assert(/Best fit|Strong fit|shortlist/i.test(text),'Decision Lab did not render a shortlist');
    assert(await page.$('main a[href^="/products/"]'),'Decision Lab rendered no product link');
  });

  await runJourney(browser,'desktop-global-search',desktop,async page=>{
    await goto(page,'/');
    const form='form[data-search-shell]';
    const input=`${form} input[name="q"]`;
    assert(await page.$(input),'Global search input missing');
    await page.type(input,'Sony XM6');
    await submitNav(page,form,'/search/');
    const q=await page.evaluate(()=>new URL(location.href).searchParams.get('q'));
    assert(q==='Sony XM6',`Search query was not preserved: ${q}`);
    const text=await page.$eval('main',el=>el.innerText);
    assert(/WH-1000XM6|Sony/i.test(text),'Search did not render Sony XM6 result context');
    assert(await page.$('a[href*="sony-wh-1000xm6"]'),'Exact Sony XM6 product link missing');
  });

  await runJourney(browser,'desktop-compare',desktop,async page=>{
    await goto(page,'/search/?q=wireless%20headphones');
    const buttons=await page.$$('[data-compare-product]');
    assert(buttons.length>=2,`Need at least two compare buttons, found ${buttons.length}`);
    await buttons[0].click();await buttons[1].click();await waitSettled(page,150);
    const tray=await page.$('#compareTray:not([hidden])');
    assert(tray,'Compare tray did not open after selecting two products');
    const href=await page.$eval('#compareTray [data-compare-link]',a=>a.getAttribute('href'));
    assert(href&&href.includes('products=')&&href.includes(','),`Compare URL not built correctly: ${href}`);
    const nav=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000});
    await page.click('#compareTray [data-compare-link]');await nav;await waitSettled(page);
    assert((await page.evaluate(()=>location.pathname))==='/compare/custom/','Custom comparison did not load');
    const main=await page.$eval('main',el=>el.innerText);
    assert(/compare|comparison|versus|vs/i.test(main),'Comparison workspace content missing');
  });

  await runJourney(browser,'desktop-scout',desktop,async page=>{
    await goto(page,'/');
    await page.click('#apgAssistantLauncher');
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    await page.type('.scout-v5-input','What is Australian Product Guide?');
    await page.click('.scout-v5-send');
    await page.waitForFunction(()=>{
      const b=document.getElementById('apgAssistantBody');
      return b&&b.getAttribute('aria-busy')!=='true'&&/Australian Product Guide|APG/i.test(b.innerText)&&!/checking APG…\s*$/.test(b.innerText);
    },{timeout:25000});
    const text=await page.$eval('#apgAssistantBody',el=>el.innerText);
    assert(!/couldn[’']t load Scout/i.test(text),'Scout returned its failure state');
  });

  await runJourney(browser,'mobile-core-journeys',mobile,async page=>{
    await goto(page,'/');
    assert(await page.$('a.button[href="/decision-lab/"]'),'Mobile Describe what I need link missing');
    await clickNav(page,'a.button[href="/decision-lab/"]','/decision-lab/');
    await goto(page,'/');
    const form='form[data-search-shell]';
    await page.type(`${form} input[name="q"]`,'robot vacuum for pet hair');
    await submitNav(page,form,'/search/');
    assert(await page.$('main a[href^="/products/"]'),'Mobile Search rendered no product links');
    await goto(page,'/');
    await page.click('#apgAssistantLauncher');
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    const panel=await page.$eval('#apgAssistantPanel',el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,hidden:el.hidden}));
    assert(!panel.hidden&&panel.w<=392&&panel.h<=846,`Mobile Scout geometry invalid: ${JSON.stringify(panel)}`);
  });

  await browser.close();
  const newErrors=report.browserErrors.filter(e=>!(/favicon|google-analytics|googletagmanager/i.test(e.url||e.message||'')));
  report.browserErrorCount=newErrors.length;
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
  if(report.failures.length||newErrors.length){
    if(newErrors.length)console.error('Browser errors:',newErrors);
    process.exit(1);
  }
})().catch(error=>{report.failures.push({name:'runner',error:error.message});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(error);process.exit(1);});