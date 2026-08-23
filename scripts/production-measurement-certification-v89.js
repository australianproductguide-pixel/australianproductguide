#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const OUT=process.env.MEASUREMENT_CERT_OUT||'artifacts/production-measurement-certification-v89';
const SHA=(process.env.APG_EXPECTED_SHA||process.env.GITHUB_SHA||'').trim();
const MARKER='apg-privacy-cert-v89-938241';
const report={suite:'production-measurement-certification-v89',baseUrl:BASE,gitSha:SHA||null,startedAt:new Date().toISOString(),checks:[],gaRequests:[],failures:[]};
fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const check=(ok,name,detail='')=>{report.checks.push({name,result:ok?'PASS':'FAIL',detail});if(!ok)throw new Error(`${name}${detail?`: ${detail}`:''}`);};
const isGoogle=u=>/https:\/\/(?:www\.)?(?:googletagmanager\.com|(?:[a-z0-9.-]+\.)?google-analytics\.com)\//i.test(u);
const isCollect=u=>/google-analytics\.com\/(?:g\/)?collect/i.test(u);
function paramsFor(req){
  const all=new URLSearchParams();
  try{const u=new URL(req.url());u.searchParams.forEach((v,k)=>all.append(k,v));}catch{}
  const post=req.postData&&req.postData();
  if(post){try{new URLSearchParams(post).forEach((v,k)=>all.append(k,v));}catch{}}
  return all;
}
function observe(page,bucket){
  page.on('request',req=>{
    if(!isGoogle(req.url()))return;
    const p=paramsFor(req);
    const row={url:req.url().replace(/([?&](?:cid|sid|_p|sct|seg|gtm|gcd|dma|dma_cps|are)=[^&]*)/g,''),collect:isCollect(req.url()),event:p.get('en')||null,pageLocation:p.get('dl')||null,pageReferrer:p.get('dr')||null,pageTitle:p.get('dt')||null};
    bucket.push(row);report.gaRequests.push(row);
  });
}
async function newPage(browser,viewport){
  const context=await browser.createBrowserContext();
  const page=await context.newPage();
  await page.setViewport(viewport);
  return {context,page};
}
async function consentState(page){return page.evaluate(()=>({allowed:window.__apgAnalyticsAllowed===true,loaded:window.__apgGaLoaded===true,pref:localStorage.getItem('apg:privacy-preferences:v1'),dataLayer:(window.dataLayer||[]).map(x=>Array.from(x||[]).slice(0,3))}));}
async function clickVisible(page,selector){await page.waitForSelector(selector,{visible:true,timeout:10000});await page.click(selector);}
async function run(name,fn){try{await fn();report.checks.push({name,result:'PASS'});}catch(e){report.failures.push({name,error:e.message});report.checks.push({name,result:'FAIL',detail:e.message});}}

(async()=>{
  if(!fs.existsSync(CHROME))throw new Error(`Chrome not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const desktop={width:1440,height:950};

  await run('denied-consent-blocks-ga',async()=>{
    const {context,page}=await newPage(browser,desktop);const net=[];observe(page,net);
    await page.goto(`${BASE}/search/?q=${MARKER}`,{waitUntil:'domcontentloaded',timeout:30000});await sleep(1600);
    const state=await consentState(page);const cookies=await page.cookies();
    check(!state.allowed,'analytics defaults denied');
    check(!state.loaded,'GA script not marked loaded before consent');
    check(net.length===0,'no Google tag/analytics network before consent',JSON.stringify(net));
    check(!cookies.some(c=>/^_ga/i.test(c.name)),'no GA cookie before consent',cookies.map(c=>c.name).join(','));
    await clickVisible(page,'[data-apg-consent] [data-consent-essential]');await sleep(1000);
    const essential=await consentState(page);const cookies2=await page.cookies();
    check(!essential.allowed,'Essential-only keeps analytics denied');
    check(net.length===0,'Essential-only sends no Google analytics network',JSON.stringify(net));
    check(!cookies2.some(c=>/^_ga/i.test(c.name)),'Essential-only creates no GA cookie',cookies2.map(c=>c.name).join(','));
    await context.close();
  });

  await run('granted-consent-sends-sanitised-ga',async()=>{
    const {context,page}=await newPage(browser,desktop);const net=[];observe(page,net);
    await page.goto(`${BASE}/search/?q=${MARKER}`,{waitUntil:'domcontentloaded',timeout:30000});
    await clickVisible(page,'[data-apg-consent] [data-consent-analytics]');
    await page.waitForFunction(()=>window.__apgAnalyticsAllowed===true&&window.__apgGaLoaded===true,{timeout:10000});await sleep(3000);
    const state=await consentState(page);const cookies=await page.cookies();
    check(state.allowed&&state.loaded,'analytics grant enables GA');
    check(net.some(r=>/googletagmanager\.com\/gtag\/js/i.test(r.url)),'GA library requested after consent');
    check(net.some(r=>r.collect),'GA collect transport observed after consent');
    check(cookies.some(c=>/^_ga/i.test(c.name)),'GA first-party cookie observed after consent',cookies.map(c=>c.name).join(','));
    const serial=JSON.stringify(net);
    check(!serial.includes(MARKER),'raw Search marker absent from Google network');
    for(const r of net.filter(x=>x.collect)){
      check(!r.pageLocation||!/[?#]/.test(r.pageLocation),'GA page_location excludes query/hash',String(r.pageLocation));
      check(!r.pageReferrer||!r.pageReferrer.includes(MARKER),'GA referrer excludes raw query',String(r.pageReferrer));
      check(!r.pageTitle||!r.pageTitle.includes(MARKER),'GA title excludes raw Search query',String(r.pageTitle));
    }
    await context.close();
  });

  await run('affiliate-events-single-transport',async()=>{
    const {context,page}=await newPage(browser,desktop);const net=[];observe(page,net);
    await page.goto(`${BASE}/products/sony-wh-1000xm6/`,{waitUntil:'domcontentloaded',timeout:30000});
    await clickVisible(page,'[data-apg-consent] [data-consent-analytics]');await sleep(2500);
    await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('[data-affiliate-link]'))e.preventDefault();},true));
    const start=net.length;
    const affiliate=await page.$('[data-affiliate-link]');check(!!affiliate,'measured Amazon affiliate CTA exists');
    await affiliate.click();await sleep(2500);
    const events=net.slice(start).filter(r=>r.collect).map(r=>r.event).filter(Boolean);
    const affiliateCount=events.filter(x=>x==='affiliate_click').length;
    const shoppingCount=events.filter(x=>x==='amazon_shopping_click').length;
    check(affiliateCount===1,'one affiliate_click transport per click',events.join(','));
    check(shoppingCount===1,'one amazon_shopping_click transport per click',events.join(','));
    await context.close();
  });

  report.finishedAt=new Date().toISOString();
  report.result=report.failures.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
  if(report.failures.length){console.error(JSON.stringify(report.failures,null,2));process.exit(1);}
  console.log('ACTION2_PRODUCTION_MEASUREMENT_V89=PASS');
})().catch(e=>{report.result='FAIL';report.failures.push({name:'fatal',error:e.message});try{fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));}catch{}console.error(e);process.exit(1);});