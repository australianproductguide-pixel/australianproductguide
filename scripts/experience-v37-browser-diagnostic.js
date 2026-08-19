'use strict';
const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/experience-v37';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,startedAt:new Date().toISOString(),journeys:[],failures:[],browserErrors:[],navigationAborts:[],network:[]};
const navigationState=new WeakMap();
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const sameOrigin=url=>{try{return new URL(url).origin===new URL(BASE).origin}catch{return false}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function isIntentionalNavigation(page){return (navigationState.get(page)||0)>0;}
async function duringNavigation(page,fn){navigationState.set(page,(navigationState.get(page)||0)+1);try{return await fn();}finally{const n=(navigationState.get(page)||1)-1;if(n)navigationState.set(page,n);else navigationState.delete(page);}}
function isExpectedNavigationAbort(page,req){if(!isIntentionalNavigation(page)||req.resourceType()!=='script'||req.failure()?.errorText!=='net::ERR_ABORTED'||!sameOrigin(req.url()))return false;try{return new URL(req.url()).pathname.startsWith('/assets/')}catch{return false}}
async function responsive(page,label){const elapsed=await page.evaluate(async()=>{const start=performance.now();await new Promise(r=>setTimeout(r,120));return performance.now()-start;});assert(elapsed<1800,`${label}: main thread unresponsive for ${Math.round(elapsed)}ms`);}
async function waitSettled(page,ms=180){await sleep(ms);await responsive(page,'settled');}
async function screenshot(page,name){try{await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:true})}catch{}}
function attachDiagnostics(page,scope){
  page.on('pageerror',err=>report.browserErrors.push({scope,type:'pageerror',message:String(err?.message||err)}));
  page.on('console',msg=>{if(msg.type()==='error')report.browserErrors.push({scope,type:'console',message:msg.text()})});
  page.on('requestfailed',req=>{if(!sameOrigin(req.url()))return;const type=req.resourceType();if(!['document','script','fetch','xhr'].includes(type))return;const failure={scope,type:'requestfailed',resourceType:type,url:req.url(),message:req.failure()?.errorText||'failed'};if(isExpectedNavigationAbort(page,req))report.navigationAborts.push(failure);else report.browserErrors.push(failure);});
  page.on('response',res=>{const req=res.request(),url=res.url();if(sameOrigin(url)&&(req.resourceType()==='document'||url.includes('/api/account/scout')))report.network.push({scope,type:req.resourceType(),status:res.status(),url});});
}
async function dismissConsent(page){const b=await page.$('[data-apg-consent]:not([hidden]) [data-consent-essential]');if(b){await b.click();await waitSettled(page,100)}}
async function waitForRenderedMain(page,timeout=12000){await page.waitForFunction(()=>document.readyState!=='loading'&&document.querySelector('main'),{timeout});await waitSettled(page);}
async function goto(page,url){const response=await duringNavigation(page,()=>page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000}));assert(response&&response.status()<500,`${url}: HTTP ${response&&response.status()}`);await waitForRenderedMain(page);await dismissConsent(page);return response;}
async function visible(page,selector){for(const h of await page.$$(selector)){if(await h.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0}))return h}return null}
async function waitForUrlChange(page,before,expectedPath,timeout=12000){await page.waitForFunction((oldHref,p)=>location.href!==oldHref&&location.pathname===p,{timeout},before,expectedPath).catch(async()=>{throw new Error(`Navigation to ${expectedPath} timed out; current ${await page.url()}`)});await waitForRenderedMain(page,timeout);}
async function clickAndWait(page,handle,expectedPath,timeout=12000){assert(handle,'Clickable target missing');const before=page.url();await duringNavigation(page,async()=>{await handle.click();await waitForUrlChange(page,before,expectedPath,timeout)});}
async function submitVisibleForm(page,selector,fill,expectedPath,timeout=12000){const form=await visible(page,selector);assert(form,`Visible form missing: ${selector}`);if(fill)await fill(form);const button=await form.$('button[type="submit"],input[type="submit"]');assert(button,`Submit control missing: ${selector}`);const before=page.url();await duringNavigation(page,async()=>{await button.click();await waitForUrlChange(page,before,expectedPath,timeout)});}
async function openScoutFromMobileMenu(page){
  const before=new URL(page.url());
  const toggle=await visible(page,'[data-mobile-toggle]');assert(toggle,'Mobile navigation toggle missing');await toggle.click();await page.waitForSelector('#mobileNav:not([hidden])',{timeout:5000});
  const scout=await visible(page,'#mobileNav [data-v26-scout-mobile]');assert(scout,'Mobile navigation Ask Scout action missing');await scout.click();
  await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:7000});await waitSettled(page,120);
  const after=new URL(page.url());
  assert(after.pathname===before.pathname&&after.search===before.search,`Scout changed page URL: ${before.href} -> ${after.href}`);
  assert(!after.search.includes('%5Bobject')&&!after.search.includes('[object'),`Scout produced malformed Search query: ${after.href}`);
  const state=await page.evaluate(()=>({navHidden:document.getElementById('mobileNav')?.hidden,panelHidden:document.getElementById('apgAssistantPanel')?.hidden,expanded:document.getElementById('apgAssistantLauncher')?.getAttribute('aria-expanded')}));
  assert(state.navHidden===true,`Mobile navigation stayed open behind Scout: ${JSON.stringify(state)}`);
  assert(state.panelHidden===false&&state.expanded==='true',`Mobile menu Scout hand-off failed: ${JSON.stringify(state)}`);
  return state;
}
async function runJourney(browser,name,viewport,fn){const page=await browser.newPage();await page.setViewport(viewport);attachDiagnostics(page,name);const started=Date.now();try{await fn(page);report.journeys.push({name,ok:true,durationMs:Date.now()-started});}catch(error){report.journeys.push({name,ok:false,durationMs:Date.now()-started,error:error.message});report.failures.push({name,error:error.message});await screenshot(page,name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()+'-failure');}finally{await page.close();}}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const desktop={width:1440,height:950},tablet={width:834,height:1112,isMobile:true,hasTouch:true},mobile={width:390,height:844,isMobile:true,hasTouch:true};

  await runJourney(browser,'desktop-describe-what-you-need',desktop,async page=>{
    await goto(page,'/');const describe=await visible(page,'a.button[href^="/decision-lab/"]');assert(describe,'Visible homepage Describe what I need link missing');await clickAndWait(page,describe,'/decision-lab/');
    await submitVisibleForm(page,'form.decision-form',async form=>{const input=await form.$('textarea[name="q"]');assert(input,'Decision Lab description field missing');await input.type('quiet headphones for long flights');},'/decision-lab/');
    await page.waitForSelector('main a[href^="/products/"]',{timeout:12000});
    const text=await page.$eval('main',el=>el.innerText);assert(/Best fit|Strong fit|shortlist/i.test(text),'Decision Lab did not render a shortlist');
  });

  await runJourney(browser,'desktop-global-search',desktop,async page=>{
    await goto(page,'/');await submitVisibleForm(page,'form[data-search-shell]',async form=>{const input=await form.$('input[name="q"]');assert(input,'Visible global search input missing');await input.type('Sony XM6');},'/search/');
    await page.waitForSelector('a[href*="sony-wh-1000xm6"]',{timeout:12000});const q=await page.evaluate(()=>new URL(location.href).searchParams.get('q'));assert(q==='Sony XM6',`Search query was not preserved: ${q}`);
    const text=await page.$eval('main',el=>el.innerText);assert(/WH-1000XM6|Sony/i.test(text),'Search did not render Sony XM6 result context');
  });

  await runJourney(browser,'desktop-compare',desktop,async page=>{
    await goto(page,'/search/?q=wireless%20headphones');await page.waitForSelector('[data-compare-product]',{timeout:12000});await page.evaluate(()=>localStorage.setItem('apgCompare','[]'));
    const slugs=await page.$$eval('[data-compare-product]',els=>[...new Set(els.map(x=>x.dataset.compareProduct).filter(Boolean))]);assert(slugs.length>=2,`Need two compare products, found ${slugs.length}`);
    for(const slug of slugs.slice(0,2)){const target=await page.$(`[data-compare-product="${slug}"]`);assert(target,`Compare control missing ${slug}`);await target.click();await waitSettled(page,180);const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('apgCompare')||'[]'));assert(state.includes(slug),`Compare state missed ${slug}`);}
    const tray=await page.$('#compareTray:not([hidden])');assert(tray,'Compare tray did not open');const link=await visible(page,'#compareTray [data-compare-link]');await clickAndWait(page,link,'/compare/custom/');await page.waitForFunction(()=>/compare|comparison|versus|vs/i.test(document.querySelector('main')?.innerText||''),{timeout:12000});
  });

  await runJourney(browser,'desktop-scout-launcher-and-nav',desktop,async page=>{
    await goto(page,'/');const launcher=await visible(page,'#apgAssistantLauncher');assert(launcher,'Scout launcher missing');await launcher.click();await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    await page.type('.scout-v5-input','What is Australian Product Guide?');await page.click('.scout-v5-send');await page.waitForFunction(()=>{const b=document.getElementById('apgAssistantBody');return b&&b.getAttribute('aria-busy')!=='true'&&/Australian Product Guide|APG/i.test(b.innerText)&&!/checking APG…\s*$/.test(b.innerText)},{timeout:20000});
    const text=await page.$eval('#apgAssistantBody',el=>el.innerText);assert(!/couldn[’']t load Scout/i.test(text),'Scout returned failure state');await page.click('[data-apg-assistant-close]');await page.waitForSelector('#apgAssistantPanel[hidden]',{timeout:5000});
    const navScout=await visible(page,'.primary-nav [data-v26-scout-open]');assert(navScout,'Desktop navigation Ask Scout missing');await navScout.click();await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:7000});
  });

  await runJourney(browser,'tablet-menu-scout-handoff',tablet,async page=>{await goto(page,'/search/?q=robot%20vacuum%20for%20pet%20hair');await page.waitForSelector('main a[href^="/products/"]',{timeout:12000});await openScoutFromMobileMenu(page);const p=await page.$eval('#apgAssistantPanel',el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,hidden:el.hidden}));assert(!p.hidden&&p.w<=836&&p.h<=1114,`Tablet Scout geometry invalid ${JSON.stringify(p)}`);});

  await runJourney(browser,'mobile-core-journeys',mobile,async page=>{
    await goto(page,'/');const describe=await visible(page,'a.button[href^="/decision-lab/"]');assert(describe,'Mobile Describe what I need missing');await clickAndWait(page,describe,'/decision-lab/');
    await goto(page,'/');await submitVisibleForm(page,'form[data-search-shell]',async form=>{const input=await form.$('input[name="q"]');assert(input,'Mobile Search input missing');await input.type('robot vacuum for pet hair');},'/search/');await page.waitForSelector('main a[href^="/products/"]',{timeout:12000});
    await openScoutFromMobileMenu(page);const p=await page.$eval('#apgAssistantPanel',el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height,hidden:el.hidden}));assert(!p.hidden&&p.w<=392&&p.h<=846,`Mobile Scout geometry invalid ${JSON.stringify(p)}`);
    await page.type('.scout-v5-input','How do recommendations work?');await page.click('.scout-v5-send');await page.waitForFunction(()=>{const b=document.getElementById('apgAssistantBody');return b&&b.getAttribute('aria-busy')!=='true'&&b.innerText.length>100},{timeout:20000});
  });

  await browser.close();
  const unexpected=report.browserErrors.filter(e=>!(/favicon|google-analytics|googletagmanager/i.test(e.url||e.message||'')));
  report.navigationAbortCount=report.navigationAborts.length;report.browserErrorCount=unexpected.length;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  if(report.failures.length||unexpected.length){if(unexpected.length)console.error('Browser errors:',unexpected);process.exit(1);}
})().catch(error=>{report.failures.push({name:'runner',error:error.message});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(error);process.exit(1);});
