'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';

function assert(ok,message){if(!ok)throw new Error(message)}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function visible(page,selector){for(const h of await page.$$(selector)){if(await h.evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'}))return h}return null}
async function dismissConsent(page){const b=await visible(page,'[data-consent-essential]');if(b){await b.click();await sleep(120)}}
async function inspectForm(page,form){return form.evaluate(f=>{
  const button=f.querySelector('button[type="submit"]');
  const input=f.querySelector('[data-site-search]');
  const box=f.querySelector('[data-search-suggestions]');
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
  const br=rect(button),sr=rect(box),x=br.left+br.width/2,y=br.top+br.height/2,hit=document.elementFromPoint(x,y);
  return {button:br,input:rect(input),suggestions:sr,suggestionsHidden:box?.hidden??null,position:box?getComputedStyle(box).position:null,top:box?getComputedStyle(box).top:null,hitTag:hit?.tagName||null,hitHref:hit?.closest?.('a')?.href||null,hitIsSubmit:hit===button||button?.contains(hit)};
})}
async function exercise(page,{openMenu=false,label}){
  if(openMenu){const toggle=await visible(page,'[data-mobile-toggle]');assert(toggle,`${label}: menu toggle missing`);await toggle.click();await page.waitForSelector('#mobileNav:not([hidden])',{timeout:5000})}
  const selector=openMenu?'#mobileNav form[data-search-shell]':'main form.apg-home-search-v9[data-search-shell]';
  const form=await visible(page,selector);assert(form,`${label}: visible Search form missing`);
  const input=await form.$('[data-site-search]');assert(input,`${label}: Search input missing`);await input.type('robot vacuum for pet hair');
  await page.waitForFunction(sel=>{const f=document.querySelector(sel),b=f?.querySelector('[data-search-suggestions]');return b&&!b.hidden&&b.querySelector('a')},{timeout:8000},selector);
  const state=await inspectForm(page,form);
  assert(state.position==='absolute',`${label}: suggestions must be absolute, got ${state.position}`);
  assert(state.suggestions&&state.button&&state.suggestions.top>=state.button.bottom+2,`${label}: suggestions overlap Search controls ${JSON.stringify(state)}`);
  assert(state.hitIsSubmit,`${label}: Search button tap is intercepted ${JSON.stringify(state)}`);
  const before=page.url();const button=await form.$('button[type="submit"]');await button.click();
  await page.waitForFunction(old=>location.href!==old&&location.pathname==='/search/',{timeout:12000},before);
  assert((await page.evaluate(()=>new URL(location.href).searchParams.get('q')))==='robot vacuum for pet hair',`${label}: query was not preserved`);
  await page.waitForSelector('main a[href^="/products/"]',{timeout:12000});
  const productLinks=await page.$$eval('main a[href^="/products/"]',links=>links.length);
  assert(productLinks>0,`${label}: results page has no product links`);
  return {...state,productLinks};
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  try{
    let response=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});assert(response&&response.status()===200,`home HTTP ${response&&response.status()}`);await dismissConsent(page);
    const hero=await exercise(page,{label:'mobile hero'});
    response=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:30000});assert(response&&response.status()===200,`home HTTP ${response&&response.status()}`);await dismissConsent(page);
    const menu=await exercise(page,{openMenu:true,label:'mobile menu'});
    console.log(JSON.stringify({status:'PASS',hero,menu},null,2));
  }finally{await browser.close()}
})().catch(error=>{console.error(error.stack||error);process.exit(1)});
