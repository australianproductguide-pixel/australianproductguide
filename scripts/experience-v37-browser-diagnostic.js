'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core'),{spawnSync}=require('child_process');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,''),OUT=process.env.OUTPUT_DIR||'artifacts/experience-v37',CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,startedAt:new Date().toISOString(),journeys:[],failures:[],browserErrors:[],navigationAborts:[],network:[]},nav=new WeakMap();
const assert=(ok,m)=>{if(!ok)throw new Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms)),sameOrigin=u=>{try{return new URL(u).origin===new URL(BASE).origin}catch{return false}};
async function duringNav(page,fn){nav.set(page,(nav.get(page)||0)+1);try{return await fn()}finally{const n=(nav.get(page)||1)-1;n?nav.set(page,n):nav.delete(page)}}
async function settled(page,ms=180){await sleep(ms);const lag=await page.evaluate(async()=>{const s=performance.now();await new Promise(r=>setTimeout(r,120));return performance.now()-s});assert(lag<1800,`main thread unresponsive for ${Math.round(lag)}ms`)}
function attach(page,scope){
  page.on('pageerror',e=>report.browserErrors.push({scope,type:'pageerror',message:String(e?.message||e)}));
  page.on('console',m=>{if(m.type()==='error')report.browserErrors.push({scope,type:'console',message:m.text()})});
  page.on('requestfailed',req=>{if(!sameOrigin(req.url())||!['document','script','fetch','xhr'].includes(req.resourceType()))return;const item={scope,type:'requestfailed',resourceType:req.resourceType(),url:req.url(),message:req.failure()?.errorText||'failed'};let expected=false;try{expected=(nav.get(page)||0)>0&&req.resourceType()==='script'&&item.message==='net::ERR_ABORTED'&&new URL(req.url()).pathname.startsWith('/assets/')}catch{};(expected?report.navigationAborts:report.browserErrors).push(item)});
  page.on('response',res=>{const req=res.request(),u=res.url();if(sameOrigin(u)&&(req.resourceType()==='document'||u.includes('/api/account/scout')))report.network.push({scope,type:req.resourceType(),status:res.status(),url:u})});
}
async function waitMain(page,t=12000){await page.waitForSelector('main',{timeout:t});await settled(page)}
async function dismiss(page){const b=await page.$('[data-apg-consent]:not([hidden]) [data-consent-essential]');if(b){await b.click();await settled(page,100)}}
async function go(page,p){const r=await duringNav(page,()=>page.goto(BASE+p,{waitUntil:'domcontentloaded',timeout:30000}));assert(r&&r.status()<500,`${p}: HTTP ${r&&r.status()}`);await waitMain(page);await dismiss(page)}
async function visible(page,s){for(const h of await page.$$(s)){if(await h.evaluate(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return r.width>0&&r.height>0&&c.display!=='none'&&c.visibility!=='hidden'}))return h}return null}
async function navClick(page,h,p,t=12000){assert(h,'click target missing');const before=page.url();await duringNav(page,async()=>{await h.click();await page.waitForFunction((old,x)=>location.href!==old&&location.pathname===x,{timeout:t},before,p);await waitMain(page,t)})}
async function submit(page,selector,fill,p){const form=await visible(page,selector);assert(form,`form missing ${selector}`);if(fill)await fill(form);const b=await form.$('button[type="submit"],input[type="submit"]');await navClick(page,b,p)}
async function nativeSubmit(page,selector,fill,p,t=15000){
  const form=await visible(page,selector);assert(form,`form missing ${selector}`);if(fill)await fill(form);
  const b=await form.$('button[type="submit"],input[type="submit"]');assert(b,'submit control missing');
  await duringNav(page,async()=>{
    await b.click();
    const deadline=Date.now()+t;
    while(Date.now()<deadline){
      let u;try{u=new URL(page.url())}catch{}
      if(u&&u.pathname===p)return;
      await sleep(100);
    }
    throw new Error(`URL did not reach ${p} within ${t}ms; current=${page.url()}`);
  });
  const u=new URL(page.url());assert(u.pathname===p,`native form navigated to ${u.pathname}, expected ${p}`);
  await page.waitForSelector('main',{timeout:12000});await dismiss(page);
}
async function scoutMenu(page){
  const before=new URL(page.url()),toggle=await visible(page,'[data-mobile-toggle]');assert(toggle,'mobile nav toggle missing');await toggle.click();await page.waitForSelector('#mobileNav:not([hidden])',{timeout:5000});
  const s=await visible(page,'#mobileNav [data-v26-scout-mobile]');assert(s,'mobile Scout missing');await s.click();await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:7000});await settled(page,120);
  const after=new URL(page.url());assert(after.pathname===before.pathname&&after.search===before.search,`Scout changed URL: ${before.href} -> ${after.href}`);assert(!/\[object(?:%20| )Object\]/i.test(after.href),`Scout malformed query: ${after.href}`);
  const st=await page.evaluate(()=>({navHidden:document.getElementById('mobileNav')?.hidden,panelHidden:document.getElementById('apgAssistantPanel')?.hidden,expanded:document.getElementById('apgAssistantLauncher')?.getAttribute('aria-expanded')}));assert(st.navHidden&&st.panelHidden===false&&st.expanded==='true',`Scout hand-off failed ${JSON.stringify(st)}`);return st;
}
async function journey(browser,name,vp,fn){const p=await browser.newPage();await p.setViewport(vp);attach(p,name);const start=Date.now();try{await fn(p);report.journeys.push({name,ok:true,durationMs:Date.now()-start})}catch(e){report.journeys.push({name,ok:false,durationMs:Date.now()-start,error:e.message});report.failures.push({name,error:e.message});try{await p.screenshot({path:path.join(OUT,name+'-failure.png'),fullPage:true})}catch{}}finally{await p.close()}}
(async()=>{
  assert(fs.existsSync(CHROME),`Chrome not found: ${CHROME}`);const b=await puppeteer.launch({headless:true,executablePath:CHROME,protocolTimeout:240000,args:['--no-sandbox','--disable-setuid-sandbox']});
  const d={width:1440,height:950},t={width:834,height:1112,isMobile:true,hasTouch:true},m={width:390,height:844,isMobile:true,hasTouch:true};
  await journey(b,'desktop-describe-what-you-need',d,async p=>{await go(p,'/');await navClick(p,await visible(p,'a.button[href^="/decision-lab/"]'),'/decision-lab/');await submit(p,'form.decision-form',async f=>{const i=await f.$('textarea[name="q"]');await i.type('quiet headphones for long flights')},'/decision-lab/');await p.waitForSelector('main a[href^="/products/"]',{timeout:12000});const x=await p.$eval('main',e=>e.innerText);assert(/Best fit|Strong fit|shortlist/i.test(x),'Decision Lab shortlist missing')});
  await journey(b,'desktop-global-search',d,async p=>{await go(p,'/');await nativeSubmit(p,'form[data-search-shell]',async f=>{const i=await f.$('input[name="q"]');await i.type('Sony XM6')},'/search/');await p.waitForSelector('a[href*="sony-wh-1000xm6"]',{timeout:12000});assert(new URL(p.url()).searchParams.get('q')==='Sony XM6','Search query lost')});
  await journey(b,'desktop-compare',d,async p=>{await go(p,'/search/?q=wireless%20headphones');await p.waitForSelector('[data-compare-product]',{timeout:12000});await p.evaluate(()=>localStorage.setItem('apgCompare','[]'));const slugs=await p.$$eval('[data-compare-product]',e=>[...new Set(e.map(x=>x.dataset.compareProduct).filter(Boolean))]);assert(slugs.length>=2,'need two compare products');for(const s of slugs.slice(0,2)){const h=await p.$(`[data-compare-product="${s}"]`);await h.click();await settled(p,180)}assert(await p.$('#compareTray:not([hidden])'),'compare tray missing');await navClick(p,await visible(p,'#compareTray [data-compare-link]'),'/compare/custom/');await p.waitForFunction(()=>/compare|comparison|versus|vs/i.test(document.querySelector('main')?.innerText||''),{timeout:12000})});
  await journey(b,'desktop-scout-launcher-and-nav',d,async p=>{await go(p,'/');const l=await visible(p,'#apgAssistantLauncher');await l.click();await p.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});await p.type('.scout-v5-input','What is Australian Product Guide?');await p.click('.scout-v5-send');await p.waitForFunction(()=>{const x=document.getElementById('apgAssistantBody');return x&&x.getAttribute('aria-busy')!=='true'&&/Australian Product Guide|APG/i.test(x.innerText)},{timeout:20000});await p.click('[data-apg-assistant-close]');await p.waitForSelector('#apgAssistantPanel[hidden]',{timeout:5000});const before=p.url();await (await visible(p,'.primary-nav [data-v26-scout-open]')).click();await p.waitForSelector('#apgAssistantPanel:not([hidden])',{timeout:7000});assert(p.url()===before,'desktop Scout changed URL')});
  await journey(b,'tablet-menu-scout-handoff',t,async p=>{await go(p,'/search/?q=robot%20vacuum%20for%20pet%20hair');await p.waitForSelector('main a[href^="/products/"]',{timeout:12000});await scoutMenu(p)});
  await journey(b,'mobile-core-journeys',m,async p=>{await go(p,'/');await navClick(p,await visible(p,'a.button[href^="/decision-lab/"]'),'/decision-lab/');await go(p,'/');await nativeSubmit(p,'form[data-search-shell]',async f=>{const i=await f.$('input[name="q"]');await i.type('robot vacuum for pet hair')},'/search/');await p.waitForSelector('main a[href^="/products/"]',{timeout:12000});await scoutMenu(p);await p.type('.scout-v5-input','How do recommendations work?');await p.click('.scout-v5-send');await p.waitForFunction(()=>{const x=document.getElementById('apgAssistantBody');return x&&x.getAttribute('aria-busy')!=='true'&&x.innerText.length>100},{timeout:20000})});
  await b.close();
  const p0=spawnSync(process.execPath,['scripts/decision-lab-v4-p0-browser-diagnostic.js'],{cwd:process.cwd(),env:{...process.env,BASE_URL:BASE,OUTPUT_DIR:path.join(OUT,'decision-lab-v4-p0'),CHROME},stdio:'inherit'});
  report.decisionLabP0={ok:p0.status===0,status:p0.status,signal:p0.signal||null};
  if(p0.status!==0)report.failures.push({name:'decision-lab-v4-p0-browser-diagnostic',error:`child diagnostic exited ${p0.status}${p0.signal?' signal '+p0.signal:''}`});
  const unexpected=report.browserErrors.filter(e=>!(/favicon|google-analytics|googletagmanager/i.test(e.url||e.message||'')));report.navigationAbortCount=report.navigationAborts.length;report.browserErrorCount=unexpected.length;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length||unexpected.length)process.exit(1);
})().catch(e=>{report.failures.push({name:'runner',error:e.message});fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)});