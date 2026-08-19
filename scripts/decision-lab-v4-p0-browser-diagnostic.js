'use strict';
const fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,''),OUT=process.env.OUTPUT_DIR||'artifacts/decision-lab-v4-p0',CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,patch:'decision-lab-p0-2026-08-20',startedAt:new Date().toISOString(),journeys:[],browserErrors:[],network:[]};
const assert=(ok,m)=>{if(!ok)throw new Error(m)},sleep=ms=>new Promise(r=>setTimeout(r,ms));
function attach(page,name){
 page.on('pageerror',e=>report.browserErrors.push({name,type:'pageerror',message:String(e?.message||e)}));
 page.on('console',m=>{if(m.type()==='error'&&!/google-analytics|googletagmanager/i.test(m.text()))report.browserErrors.push({name,type:'console',message:m.text()})});
 page.on('requestfailed',r=>{if(new URL(r.url()).origin===new URL(BASE).origin&&['document','script','fetch','xhr'].includes(r.resourceType()))report.browserErrors.push({name,type:'requestfailed',url:r.url(),message:r.failure()?.errorText||'failed'})});
 page.on('response',r=>{const req=r.request();if(new URL(r.url()).origin===new URL(BASE).origin&&['document','fetch','xhr'].includes(req.resourceType()))report.network.push({name,type:req.resourceType(),status:r.status(),url:r.url()})});
}
async function go(page,url='/decision-lab/'){const r=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});assert(r&&r.status()<500,`${url}: HTTP ${r&&r.status()}`);await page.waitForSelector('form.decision-form',{timeout:10000})}
async function setForm(page,{q='',category='',budget='',brand=''}){
 await page.$eval('textarea[name="q"]',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},q);
 if(category)await page.select('select[name="category"]',category);
 if(budget)await page.$eval('input[name="budget"]',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},budget);
 if(brand)await page.select('select[name="brand"]',brand);
}
async function submit(page,expect={}){
 const nav=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000});
 await page.click('form.decision-form button[type="submit"]');
 await nav;await page.waitForSelector('main',{timeout:10000});
 const u=new URL(page.url());assert(u.pathname==='/decision-lab/','Decision Lab navigation escaped route');
 for(const [k,v] of Object.entries(expect))assert(u.searchParams.get(k)===String(v),`${k} not retained`);
}
async function assertResults(page){await page.waitForSelector('.decision-result,.zero-state',{timeout:12000});const state=await page.evaluate(()=>({results:document.querySelectorAll('.decision-result').length,zero:!!document.querySelector('.zero-state'),text:document.querySelector('main')?.innerText||''}));assert(state.results>0||state.zero,'no controlled result state');assert(/shortlist|maintained candidate|closest maintained/i.test(state.text),'result reasoning surface missing');return state}
async function journey(browser,name,viewport,fn){const page=await browser.newPage();await page.setViewport(viewport);attach(page,name);const t=Date.now();try{await fn(page);report.journeys.push({name,ok:true,durationMs:Date.now()-t})}catch(e){report.journeys.push({name,ok:false,durationMs:Date.now()-t,error:e.message});try{await page.screenshot({path:path.join(OUT,name+'-failure.png'),fullPage:true})}catch{}}finally{await page.close()}}
(async()=>{
 assert(fs.existsSync(CHROME),`Chrome not found: ${CHROME}`);
 const browser=await puppeteer.launch({headless:true,executablePath:CHROME,protocolTimeout:240000,args:['--no-sandbox','--disable-setuid-sandbox']});
 const desktop={width:1440,height:950},mobile={width:390,height:844,isMobile:true,hasTouch:true};
 await journey(browser,'desktop-simple-headphones',desktop,async page=>{await go(page);await setForm(page,{q:'I need headphones for commuting.'});await submit(page,{q:'I need headphones for commuting.'});const x=await assertResults(page);assert(x.results>0,'simple request returned no shortlist')});
 await journey(browser,'desktop-budget-tv',desktop,async page=>{await go(page);await setForm(page,{q:'I want a TV under $2,000.',category:'televisions',budget:'2000'});await submit(page,{category:'televisions',budget:'2000'});const x=await assertResults(page);assert(x.results>0,'budget TV returned no shortlist');assert(/A\$2,000|Maximum A\$2,000/i.test(x.text),'budget reasoning missing')});
 await journey(browser,'desktop-detailed-robot-vacuum',desktop,async page=>{await go(page);const q='I need a robot vacuum under $1,000 for a house with pets and mostly hard floors.';await setForm(page,{q,category:'robot-vacuums',budget:'1000'});await submit(page,{q,category:'robot-vacuums',budget:'1000'});const x=await assertResults(page);assert(x.results>0,'robot-vacuum request returned no shortlist');assert(/pet|budget|verification|fit/i.test(x.text),'detailed reasoning missing')});
 await journey(browser,'desktop-duplicate-submit-single-navigation',desktop,async page=>{await go(page);const q='quiet headphones under $500 for commuting';await setForm(page,{q,budget:'500'});let docs=0;page.on('request',r=>{try{const u=new URL(r.url());if(r.resourceType()==='document'&&u.pathname==='/decision-lab/'&&u.searchParams.get('q')===q)docs++}catch{}});const nav=page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000});await page.evaluate(()=>{const f=document.querySelector('form.decision-form');f.requestSubmit();f.requestSubmit()});await nav;await assertResults(page);await sleep(300);assert(docs===1,`duplicate submit emitted ${docs} Decision Lab document requests`)});
 await journey(browser,'desktop-back-restores-form',desktop,async page=>{await go(page);const q='manual espresso machine for a beginner around $700';await setForm(page,{q});await submit(page,{q});await assertResults(page);const product=await page.$('.decision-result a[href^="/products/"]');assert(product,'product action missing');await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),product.click()]);await page.goBack({waitUntil:'domcontentloaded'});await page.waitForSelector('form.decision-form');const state=await page.evaluate(()=>({q:document.querySelector('textarea[name="q"]')?.value,busy:document.querySelector('form.decision-form')?.getAttribute('aria-busy'),buttonBusy:document.querySelector('form.decision-form button[type="submit"]')?.getAttribute('aria-busy'),disabled:document.querySelector('form.decision-form button[type="submit"]')?.disabled}));assert(state.q===q,'back navigation lost decision input');assert(!state.busy&&!state.buttonBusy&&!state.disabled,'back navigation restored stale busy state')});
 await journey(browser,'mobile-filtered-decision',mobile,async page=>{await go(page);const q='cordless vacuum for an apartment with a cat';await setForm(page,{q,category:'stick-vacuums'});await submit(page,{q,category:'stick-vacuums'});const x=await assertResults(page);assert(x.results>0,'mobile filtered request returned no shortlist');const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert(!overflow,'mobile Decision Lab has horizontal overflow')});
 await journey(browser,'desktop-compare-from-result',desktop,async page=>{await go(page,'/decision-lab/?q=quiet%20headphones%20for%20commuting');await assertResults(page);const buttons=await page.$$('.decision-result [data-compare-product]');assert(buttons.length>=2,'need at least two compare actions');await buttons[0].click();await buttons[1].click();await page.waitForSelector('#compareTray:not([hidden])',{timeout:5000});const href=await page.$eval('#compareTray [data-compare-link]',a=>a.getAttribute('href'));assert(/products=/.test(href),'comparison handoff missing product IDs')});
 await browser.close();
 report.finishedAt=new Date().toISOString();report.ok=report.journeys.every(x=>x.ok)&&report.browserErrors.length===0;fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.ok)process.exit(1);
})().catch(e=>{report.fatal=e.message;report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)});
