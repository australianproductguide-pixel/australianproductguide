'use strict';
const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/experience-v37';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,startedAt:new Date().toISOString(),journeys:[],failures:[],browserErrors:[],network:[]};

function assert(ok,message){if(!ok)throw new Error(message);}
function sameOrigin(url){try{return new URL(url).origin===new URL(BASE).origin}catch{return false}}
async function responsive(page,label){
  const elapsed=await page.evaluate(async()=>{const start=performance.now();await new Promise(r=>setTimeout(r,120));return performance.now()-start;});
  assert(elapsed<1800,`${label}: main thread was unresponsive for ${Math.round(elapsed)}ms`);
  return elapsed;
}
async function screenshot(page,name){try{await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true});}catch{}}
async function waitSettled(page,ms=250){await new Promise(r=>setTimeout(r,ms));await responsive(page,'settled');}
function attachDiagnostics(page,scope){
  page.on('pageerror',err=>report.browserErrors.push({scope,type:'pageerror',message:String(err&&err.message||err)}));
  page.on('console',msg=>{if(msg.type()==='error')report.browserErrors.push({scope,type:'console',message:msg.text()});});
  page.on('requestfailed',req=>{
    if(!sameOrigin(req.url()))return;
    const type=req.resourceType();
    if(!['document','script','fetch','xhr'].includes(type))return;
    report.browserErrors.push({scope,type:'requestfailed',resourceType:type,url:req.url(),message:req.failure()?.errorText||'failed'});
  });
  page.on('response',res=>{
    const req=res.request(),type=req.resourceType(),url=res.url();
    if(!sameOrigin(url))return;
    if(type==='document'||url.includes('/api/account/scout'))report.network.push({scope,type,status:res.status(),url});
  });
}
async function goto(page,url){
  const response=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});
  assert(response&&response.status()<500,`${url}: HTTP ${response&&response.status()}`);
  await waitSettled(page);
  await dismissConsent(page);
  return response;
}
async function dismissConsent(page){
  const root=await page.$('[data-apg-consent]:not([hidden])');
  if(!root)return;
  const button=await page.$('[data-consent-essential]');
  if(button){await button.click();await waitSettled(page,120);}
}
async function visible(page,selector){
  for(const handle of await page.$$(selector)){
    const ok=await handle.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0;});
    if(ok)return handle;
  }
  return null;
}
async function waitForUrlChange(page,before,expectedPath,timeout=12000){
  try{
    await page.waitForFunction((oldHref,path)=>location.href!==oldHref&&location.pathname===path,{timeout},before,expectedPath);
  }catch(error){
    const state=await page.evaluate(()=>({href:location.href,readyState:document.readyState,visibility:document.visibilityState}));
    throw new Error(`Navigation to ${expectedPath} timed out from ${before}; current ${JSON.stringify(state)}`);
  }
  await waitSettled(page);
}
async function clickAndWait(page,handle,expectedPath,timeout=12000){
  assert(handle,'Clickable target missing');const before=page.url();await handle.click();await waitForUrlChange(page,before,expectedPath,timeout);
}
async function submitVisibleForm(page,formSelector,fill,expectedPath,timeout=12000){
  const form=await visible(page,formSelector);assert(form,`Visible form missing: ${formSelector}`);
  if(fill)await fill(form);
  const button=await form.$('button[type="submit"],input[type="submit"]');assert(button,`Submit control missing: ${formSelector}`);
  const before=page.url();await button.click();await waitForUrlChange(page,before,expectedPath,timeout);
}
async function runJourney(browser,name,viewport,fn){
  const page=await browser.newPage();await page.setViewport(viewport);attachDiagnostics(page,name);const started=Date.now();
  try{await fn(page);report.journeys.push({name,ok:true,durationMs:Date.now()-started});}
  catch(error){report.journeys.push({name,ok:false,durationMs:Date.now()-started,error:error.message});report.failures.push({name,error:error.message});await screenshot(page,name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-failure');}
  finally{await page.close();}
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const desktop={width:1440,height:950};
  const mobile={width:390,height:844,isMobile:true,hasTouch:true};

  await runJourney(browser,'desktop-describe-what-you-need',desktop,async page=>{
    await goto(page,'/');
    const describe=await visible(page,'a.button[href^="/decision-lab/"]');
    assert(describe,'Visible homepage Describe what I need link missing');
    await clickAndWait(page,describe,'/decision-lab/');
    await submitVisibleForm(page,'form.decision-form',async form=>{
      const input=await form.$('textarea[name="q"]');assert(input,'Decision Lab description field missing');await input.type('quiet headphones for long flights');
    },'/decision-lab/');
    const text=await page.$eval('main',el=>el.innerText);
    assert(/Best fit|Strong fit|shortlist/i.test(text),'Decision Lab did not render a shortlist');
    assert(await page.$('main a[href^="/products/"]'),'Decision Lab rendered no product link');
  });

  await runJourney(browser,'desktop-global-search',desktop,async page=>{
    await goto(page,'/');
    await submitVisibleForm(page,'form[data-search-shell]',async form=>{
      const input=await form.$('input[name="q"]');assert(input,'Visible global search input missing');await input.type('Sony XM6');
    },'/search/');
    const q=await page.evaluate(()=>new URL(location.href).searchParams.get('q'));
    assert(q==='Sony XM6',`Search query was not preserved: ${q}`);
    const text=await page.$eval('main',el=>el.innerText);
    assert(/WH-1000XM6|Sony/i.test(text),'Search did not render Sony XM6 result context');
    assert(await page.$('a[href*="sony-wh-1000xm6"]'),'Exact Sony XM6 product link missing');
  });

  await runJourney(browser,'desktop-compare',desktop,async page=>{
    await goto(page,'/search/?q=wireless%20headphones');
    await page.evaluate(()=>localStorage.setItem('apgCompare','[]'));
    const slugs=await page.$$eval('[data-compare-product]',els=>[...new Set(els.map(x=>x.dataset.compareProduct).filter(Boolean))]);
    assert(slugs.length>=2,`Need at least two unique compare products, found ${slugs.length}`);
    for(const slug of slugs.slice(0,2)){
      const handles=await page.$$('[data-compare-product]');let target=null;
      for(const handle of handles){if(await handle.evaluate((el,s)=>el.dataset.compareProduct===s,slug)){target=handle;break;}}
      assert(target,`Compare control missing for ${slug}`);await target.click();await waitSettled(page,180);
      const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('apgCompare')||'[]'));
      assert(state.includes(slug),`Compare state did not retain ${slug}: ${JSON.stringify(state)}`);
    }
    const selected=await page.evaluate(()=>JSON.parse(localStorage.getItem('apgCompare')||'[]'));
    assert(new Set(selected).size>=2,`Compare state has fewer than two unique products: ${JSON.stringify(selected)}`);
    const tray=await page.$('#compareTray:not([hidden])');assert(tray,'Compare tray did not open after selecting two products');
    const href=await page.$eval('#compareTray [data-compare-link]',a=>a.getAttribute('href'));
    for(const slug of slugs.slice(0,2))assert(href.includes(slug),`Compare URL missing ${slug}: ${href}`);
    const link=await visible(page,'#compareTray [data-compare-link]');await clickAndWait(page,link,'/compare/custom/');
    const main=await page.$eval('main',el=>el.innerText);assert(/compare|comparison|versus|vs/i.test(main),'Comparison workspace content missing');
  });

  await runJourney(browser,'desktop-scout',desktop,async page=>{
    await goto(page,'/');
    const launcher=await visible(page,'#apgAssistantLauncher');assert(launcher,'Scout launcher missing');await launcher.click();
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    await page.type('.scout-v5-input','What is Australian Product Guide?');await page.click('.scout-v5-send');
    await page.waitForFunction(()=>{const b=document.getElementById('apgAssistantBody');return b&&b.getAttribute('aria-busy')!=='true'&&/Australian Product Guide|APG/i.test(b.innerText)&&!/checking APG…\s*$/.test(b.innerText);},{timeout:20000});
    const text=await page.$eval('#apgAssistantBody',el=>el.innerText);assert(!/couldn[’']t load Scout/i.test(text),'Scout returned its failure state');
  });

  await runJourney(browser,'mobile-core-journeys',mobile,async page=>{
    await goto(page,'/');
    const describe=await visible(page,'a.button[href^="/decision-lab/"]');assert(describe,'Mobile visible Describe what I need link missing');
    await clickAndWait(page,describe,'/decision-lab/');
    await goto(page,'/');
    await submitVisibleForm(page,'form[data-search-shell]',async form=>{const input=await form.$('input[name="q"]');assert(input,'Mobile visible search input missing');await input.type('robot vacuum for pet hair');},'/search/');
    assert(await page.$('main a[href^="/products/"]'),'Mobile Search rendered no product links');
    await goto(page,'/');
    const launcher=await visible(page,'#apgAssistantLauncher');assert(launcher,'Mobile Scout launcher missing');await launcher.click();
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    const panel=await page.$eval('#apgAssistantPanel',el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,hidden:el.hidden}));
    assert(!panel.hidden&&panel.w<=392&&panel.h<=846,`Mobile Scout geometry invalid: ${JSON.stringify(panel)}`);
  });

  await browser.close();
  const newErrors=report.browserErrors.filter(e=>!(/favicon|google-analytics|googletagmanager/i.test(e.url||e.message||'')));
  report.browserErrorCount=newErrors.length;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(report.failures.length||newErrors.length){if(newErrors.length)console.error('Browser errors:',newErrors);process.exit(1);}
})().catch(error=>{report.failures.push({name:'runner',error:error.message});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(error);process.exit(1);});
