'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,''),OUT=process.env.OUTPUT_DIR||'artifacts/decision-lab-v4-p0',CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const PATCH='decision-lab-p0-2026-08-20-stable-shell-r4';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,patch:PATCH,startedAt:new Date().toISOString(),journeys:[],browserErrors:[],expectedFailures:[],network:[],consentDismissals:0};
const assert=(ok,m)=>{if(!ok)throw new Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
function sameOrigin(raw){try{return new URL(raw).origin===new URL(BASE).origin}catch{return false}}
function attach(page,name){
 page.on('pageerror',e=>report.browserErrors.push({name,type:'pageerror',message:String(e?.message||e)}));
 page.on('console',m=>{
   if(m.type()!=='error'||/google-analytics|googletagmanager/i.test(m.text()))return;
   const item={name,type:'console',message:m.text()};
   const expected=name==='desktop-http-error-recovery'&&/503|service unavailable/i.test(m.text());
   (expected?report.expectedFailures:report.browserErrors).push(item);
 });
 page.on('requestfailed',r=>{
   if(!sameOrigin(r.url())||!['document','script','fetch','xhr'].includes(r.resourceType()))return;
   const item={name,type:'requestfailed',resourceType:r.resourceType(),url:r.url(),message:r.failure()?.errorText||'failed'};
   let expected=false;
   try{const u=new URL(r.url());expected=name==='desktop-forced-timeout-recovery'&&r.resourceType()==='fetch'&&u.pathname==='/decision-lab/'&&u.searchParams.get('q')==='forced timeout recovery test'}catch{}
   (expected?report.expectedFailures:report.browserErrors).push(item);
 });
 page.on('response',r=>{try{const req=r.request();if(sameOrigin(r.url())&&['document','fetch','xhr'].includes(req.resourceType()))report.network.push({name,type:req.resourceType(),status:r.status(),url:r.url()})}catch{}});
}
async function dismissConsent(page){
 const button=await page.$('[data-apg-consent]:not([hidden]) [data-consent-essential]');
 if(!button)return false;
 await button.click();report.consentDismissals++;
 await page.waitForFunction(()=>{const p=document.querySelector('[data-apg-consent]');return !p||p.hidden||getComputedStyle(p).display==='none'||getComputedStyle(p).visibility==='hidden'},{timeout:5000,polling:100}).catch(()=>{});
 return true;
}
async function go(page,url='/decision-lab/'){
 const r=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});assert(r&&r.status()<500,`${url}: HTTP ${r&&r.status()}`);
 await page.waitForSelector('form.decision-form',{timeout:10000});
 await page.waitForFunction(p=>window.__APG_DECISION_LAB_RESILIENCE_V50__===p,{timeout:10000,polling:100},PATCH);
 await dismissConsent(page);
}
async function setForm(page,{q='',category='',budget='',brand=''}){
 await page.$eval('textarea[name="q"]',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},q);
 await page.select('select[name="category"]',category||'');
 await page.$eval('input[name="budget"]',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},budget||'');
 await page.select('select[name="brand"]',brand||'');
}
function expectedParams(input){const o={};for(const k of ['q','category','budget','brand'])if(String(input[k]||'').trim())o[k]=String(input[k]).trim();return o}
async function readOutcomeState(page){
 return page.evaluate(()=>{
   const form=document.querySelector('form.decision-form');
   const button=form?.querySelector('button[type="submit"]');
   const params=Object.fromEntries(new URLSearchParams(location.search).entries());
   const values={q:form?.querySelector('[name="q"]')?.value?.trim()||'',category:form?.querySelector('[name="category"]')?.value||'',budget:form?.querySelector('[name="budget"]')?.value?.trim()||'',brand:form?.querySelector('[name="brand"]')?.value||''};
   return {terminal:document.body?.dataset.apgDecisionV50State||'',pathname:location.pathname,params,values,results:document.querySelectorAll('.decision-result').length,zero:!!document.querySelector('.zero-state'),recovery:!!document.querySelector('.decision-server-recovery'),busy:form?.hasAttribute('aria-busy')||false,buttonBusy:button?.hasAttribute('aria-busy')||false,disabled:!!button?.disabled,status:form?.querySelector('[data-decision-submit-status]')?.textContent||'',text:document.querySelector('main#main')?.innerText||'',marker:window.__APG_DECISION_LAB_RESILIENCE_V50__,stableShell:form?.dataset.apgStableShellProbe==='1'};
 });
}
async function boundedState(page,timeout=2000){
 let timer;
 try{return await Promise.race([readOutcomeState(page),new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeout)})])}
 finally{if(timer)clearTimeout(timer)}
}
function assertStateRetention(state,input){
 const expect=expectedParams(input);
 assert(state.pathname==='/decision-lab/',`unexpected Decision Lab pathname: ${state.pathname}`);
 for(const [k,v] of Object.entries(expect)){
   assert(state.params[k]===String(v),`URL state mismatch for ${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(state.params[k])}`);
   assert(state.values[k]===String(v),`form state mismatch for ${k}: expected ${JSON.stringify(v)}, got ${JSON.stringify(state.values[k])}`);
 }
}
async function waitForOutcome(page,input,timeout=15000){
 await page.waitForFunction(()=>{
   const terminal=document.body?.dataset.apgDecisionV50State||'';
   const outcome=document.querySelector('.decision-result,.zero-state,.decision-server-recovery');
   const form=document.querySelector('form.decision-form');
   const button=form?.querySelector('button[type="submit"]');
   return ['success','no-results','server-recovery'].includes(terminal)&&!!outcome&&!!form&&!form.hasAttribute('aria-busy')&&!button?.disabled&&!button?.hasAttribute('aria-busy');
 },{timeout,polling:100});
 const state=await readOutcomeState(page);
 assertStateRetention(state,input);
 return state;
}
async function submitSoft(page,input,trigger=null){
 const before=report.network.length;
 await page.$eval('form.decision-form',form=>{form.dataset.apgStableShellProbe='1'});
 await (trigger?trigger():page.click('form.decision-form button[type="submit"]'));
 const state=await waitForOutcome(page,input);
 await dismissConsent(page);
 const slice=report.network.slice(before);
 const resultDocs=slice.filter(x=>x.type==='document'&&new URL(x.url).pathname==='/decision-lab/');
 const resultFetches=slice.filter(x=>x.type==='fetch'&&new URL(x.url).pathname==='/decision-lab/');
 assert(resultDocs.length===0,`submission unexpectedly used ${resultDocs.length} full Decision Lab document navigation(s)`);
 assert(resultFetches.length===1,`submission expected one bounded Decision Lab fetch, saw ${resultFetches.length}`);
 assert(state.marker===PATCH,'v50.3 controller marker disappeared after soft render');
 assert(state.stableShell,'Decision Lab replaced the submitted form instead of preserving the stable shell');
 assert(state.results>0||state.zero||state.recovery,'no controlled Decision Lab outcome');
 assert(!state.busy&&!state.buttonBusy&&!state.disabled,'Decision Lab remained busy after outcome');
 return state;
}
async function journey(browser,name,viewport,fn){
 const page=await browser.newPage();await page.setViewport(viewport);attach(page,name);const started=Date.now();
 try{await fn(page);report.journeys.push({name,ok:true,durationMs:Date.now()-started})}
 catch(e){
   const state=await boundedState(page,2000).catch(()=>null);
   report.journeys.push({name,ok:false,durationMs:Date.now()-started,error:e.message,state});
   try{await Promise.race([page.screenshot({path:path.join(OUT,`${name}.png`),fullPage:false}),sleep(2000)])}catch{}
 }
 finally{await Promise.race([page.close().catch(()=>{}),sleep(2000)])}
}
(async()=>{
 assert(fs.existsSync(CHROME),`Chrome not found: ${CHROME}`);
 const browser=await puppeteer.launch({headless:true,executablePath:CHROME,protocolTimeout:30000,args:['--no-sandbox','--disable-setuid-sandbox']});
 const desktop={width:1440,height:950},mobile={width:390,height:844,isMobile:true,hasTouch:true};
 const matrix=[
  ['desktop-simple-headphones',{q:'I need headphones for commuting.'}],
  ['desktop-budget-tv',{q:'I want a TV under $2,000.',category:'televisions',budget:'2000'}],
  ['desktop-robot-vacuum',{q:'Robot vacuum under $1,000 for pets and hard floors.',category:'robot-vacuums',budget:'1000'}],
  ['desktop-coffee-brand-budget',{q:'Easy coffee machine for flat whites.',category:'coffee-machines',budget:'1300',brand:'breville'}],
  ['desktop-filter-only',{category:'air-fryers',budget:'300'}],
  ['desktop-brand-only',{brand:'bose'}],
  ['desktop-contradictory-filters',{q:'Headphones for commuting.',category:'coffee-machines',brand:'bose',budget:'500'}],
  ['desktop-impossible-budget',{q:'75-inch TV for sport and Netflix.',category:'televisions',budget:'1'}],
  ['desktop-large-budget',{q:'Premium projector for a bright room.',category:'projectors',budget:'100000'}],
  ['desktop-negative-wording',{q:'Headphones for travel but I do not want a premium-priced model.',category:'wireless-headphones',budget:'500'}],
  ['desktop-unicode',{q:'Quiet headphones for flights ✈️ with strong battery life.',category:'wireless-headphones',budget:'700'}],
  ['desktop-special-characters',{q:'headphones & ANC $$$ under 500 😀',budget:'500'}],
  ['desktop-laptop-multi-priority',{q:'Laptop for uni, long battery, light weight, video calls, no gaming requirement.',category:'laptops',budget:'1800'}],
  ['desktop-whitespace',{q:'   robot vacuum   for pets and hard floors   ',category:'robot-vacuums'}]
 ];
 for(const [name,input] of matrix){await journey(browser,name,desktop,async page=>{await go(page);await setForm(page,input);const state=await submitSoft(page,input);assert(state.results>0||state.zero||state.recovery,`${name}: no outcome`);assert(/fit|shortlist|maintained|verification|constraint|candidate/i.test(state.text),`${name}: explainability/fallback surface missing`)})}
 await journey(browser,'desktop-unsupported-category-fallback',desktop,async page=>{const input={q:'I need a quiet garden shredder for branches.'};await go(page);await setForm(page,input);const state=await submitSoft(page,input);assert(state.terminal==='no-results','unsupported category must produce a no-results terminal state');assert(state.zero&&state.results===0,'unsupported category must not guess unrelated products');assert(/not|maintained|category|match|search/i.test(state.text),'unsupported category fallback must explain the boundary')});
 await journey(browser,'desktop-vague-unsupported-fallback',desktop,async page=>{const input={q:'Something useful for a tiny apartment but not expensive.',budget:'100'};await go(page);await setForm(page,input);const state=await submitSoft(page,input);assert(state.terminal==='no-results','vague unsupported intent must produce no-results');assert(state.zero&&state.results===0,'vague unsupported intent must not guess unrelated products')});
 await journey(browser,'mobile-filtered-decision',mobile,async page=>{const input={q:'cordless vacuum for an apartment with a cat',category:'stick-vacuums',budget:'700'};await go(page);await setForm(page,input);await submitSoft(page,input);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert(!overflow,'mobile Decision Lab has horizontal overflow')});
 await journey(browser,'desktop-duplicate-submit-single-fetch',desktop,async page=>{const input={q:'quiet headphones under $500 for commuting',budget:'500'};await go(page);await setForm(page,input);await page.$eval('form.decision-form',form=>{form.dataset.apgStableShellProbe='1'});const before=report.network.length;await page.evaluate(()=>{const f=document.querySelector('form.decision-form');f.requestSubmit();f.requestSubmit()});const state=await waitForOutcome(page,input);assert(state.stableShell,'duplicate-submit flow replaced the submitted form');const slice=report.network.slice(before);const fetches=slice.filter(x=>x.type==='fetch'&&new URL(x.url).pathname==='/decision-lab/');assert(fetches.length===1,`duplicate submit emitted ${fetches.length} Decision Lab fetches`)});
 await journey(browser,'desktop-keyboard-submit',desktop,async page=>{const input={q:'university laptop with long battery life under $1500',category:'laptops',budget:'1500'};await go(page);await setForm(page,input);await page.focus('form.decision-form button[type="submit"]');await submitSoft(page,input,()=>page.keyboard.press('Enter'))});
 await journey(browser,'desktop-blank-input-validation',desktop,async page=>{await go(page);await setForm(page,{});const before=report.network.length;await page.click('form.decision-form button[type="submit"]');await page.waitForFunction(()=>document.body?.dataset.apgDecisionV50State==='validation'&&/choose at least one filter/i.test(document.querySelector('[data-decision-submit-status]')?.textContent||''),{timeout:5000,polling:100});const state=await readOutcomeState(page);assert(!state.disabled&&!state.busy&&!state.buttonBusy,'blank validation stranded the form');assert(report.network.slice(before).every(x=>!(x.type==='fetch'&&new URL(x.url).pathname==='/decision-lab/')),'blank input made an unnecessary Decision Lab request')});
 await journey(browser,'desktop-long-description-validation',desktop,async page=>{await go(page);const q='x'.repeat(2001);await setForm(page,{q});await page.click('form.decision-form button[type="submit"]');await page.waitForFunction(()=>document.body?.dataset.apgDecisionV50State==='validation'&&/under 2,000 characters/i.test(document.querySelector('[data-decision-submit-status]')?.textContent||''),{timeout:5000,polling:100});const state=await page.evaluate(()=>({disabled:document.querySelector('form.decision-form button[type="submit"]')?.disabled,busy:document.querySelector('form.decision-form')?.hasAttribute('aria-busy'),value:document.querySelector('textarea[name="q"]')?.value||''}));assert(!state.disabled&&!state.busy&&state.value.length===2001,'long input validation lost state or disabled retry')});
 await journey(browser,'desktop-http-error-recovery',desktop,async page=>{await go(page);const input={q:'forced http recovery test',budget:'444'};await setForm(page,input);await page.setRequestInterception(true);page.on('request',req=>{try{const u=new URL(req.url());if(req.resourceType()==='fetch'&&u.pathname==='/decision-lab/'&&u.searchParams.get('q')===input.q)return req.respond({status:503,contentType:'text/html',body:'temporary'}).catch(()=>{})}catch{}req.continue().catch(()=>{})});await page.click('form.decision-form button[type="submit"]');await page.waitForFunction(()=>document.body?.dataset.apgDecisionV50State==='error'&&/could not complete that request just now/i.test(document.querySelector('[data-decision-submit-status]')?.textContent||''),{timeout:7000,polling:100});const state=await readOutcomeState(page);assert(state.values.q===input.q&&state.values.budget===input.budget&&!state.disabled&&!state.busy&&!state.buttonBusy,'HTTP failure did not restore retained, retryable form state')});
 await journey(browser,'desktop-forced-timeout-recovery',desktop,async page=>{await go(page);const input={q:'forced timeout recovery test',budget:'555'};await setForm(page,input);await page.setRequestInterception(true);page.on('request',req=>{try{const u=new URL(req.url());if(req.resourceType()==='fetch'&&u.pathname==='/decision-lab/'&&u.searchParams.get('q')===input.q){setTimeout(()=>req.continue().catch(()=>{}),15000);return}}catch{}req.continue().catch(()=>{})});const started=Date.now();await page.click('form.decision-form button[type="submit"]');await page.waitForFunction(()=>document.body?.dataset.apgDecisionV50State==='timeout'&&/could not complete that request in time/i.test(document.querySelector('[data-decision-submit-status]')?.textContent||''),{timeout:13000,polling:100});const elapsed=Date.now()-started;const state=await readOutcomeState(page);assert(elapsed<12500,`timeout recovery exceeded bounded deadline: ${elapsed}ms`);assert(state.values.q===input.q&&state.values.budget===input.budget&&!state.disabled&&!state.busy&&!state.buttonBusy,'forced timeout did not restore retained, retryable form state')});
 await journey(browser,'desktop-save-after-soft-result',desktop,async page=>{await go(page);await page.evaluate(()=>localStorage.setItem('apgSaved','[]'));await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction(p=>window.__APG_DECISION_LAB_RESILIENCE_V50__===p,{timeout:10000,polling:100},PATCH);await dismissConsent(page);const input={q:'quiet headphones for commuting',category:'wireless-headphones'};await setForm(page,input);await submitSoft(page,input);const button=await page.$('.decision-result [data-save-product]');assert(button,'save action missing after soft result');const slug=await button.evaluate(e=>e.dataset.saveProduct);await button.click();await page.waitForFunction(s=>{let saved=[];try{saved=JSON.parse(localStorage.getItem('apgSaved')||'[]')}catch{}return document.querySelector(`[data-save-product="${s}"]`)?.getAttribute('aria-pressed')==='true'&&saved.includes(s)},{timeout:5000,polling:100},slug)});
 await journey(browser,'desktop-compare-after-soft-result',desktop,async page=>{await go(page);await page.evaluate(()=>localStorage.setItem('apgCompare','[]'));await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction(p=>window.__APG_DECISION_LAB_RESILIENCE_V50__===p,{timeout:10000,polling:100},PATCH);await dismissConsent(page);const input={q:'quiet headphones for commuting',category:'wireless-headphones'};await setForm(page,input);await submitSoft(page,input);const buttons=await page.$$('.decision-result [data-compare-product]');assert(buttons.length>=2,'need two compare actions after soft result');await buttons[0].click();await sleep(100);await buttons[1].click();await page.waitForFunction(()=>{const tray=document.getElementById('compareTray');return tray&&!tray.hidden&&/products=/.test(tray.querySelector('[data-compare-link]')?.getAttribute('href')||'')},{timeout:5000,polling:100})});
 await Promise.race([browser.close(),sleep(3000)]);
 report.finishedAt=new Date().toISOString();report.ok=report.journeys.every(x=>x.ok)&&report.browserErrors.length===0;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.ok)process.exit(1);
})().catch(e=>{report.fatal=e.message;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)});
