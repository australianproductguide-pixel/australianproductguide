'use strict';
const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/brand-system-v46';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});
const report={base:BASE,startedAt:new Date().toISOString(),checks:[],failures:[]};
const retired=['rgb(8, 39, 53)','rgb(8, 124, 118)','rgb(7, 94, 90)','rgb(11, 111, 112)','rgb(11, 52, 69)','rgb(8, 120, 111)','rgb(255, 217, 93)','rgb(246, 189, 69)','rgb(243, 181, 72)','rgb(244, 181, 72)'];

function assert(ok,message){if(!ok)throw new Error(message);}
function parseRgb(value){const m=String(value||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);return m?[+m[1],+m[2],+m[3]]:null;}
function luminance(rgb){return rgb.map(v=>{const s=v/255;return s<=.03928?s/12.92:Math.pow((s+.055)/1.055,2.4)}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
async function snap(page,name,fullPage=false){try{await page.screenshot({path:path.join(OUT,`${name}.png`),fullPage});}catch{}}
async function dismissConsent(page){const b=await page.$('[data-apg-consent]:not([hidden]) [data-consent-essential]');if(b){await b.click();await new Promise(r=>setTimeout(r,100));}}
async function goto(page,url){const r=await page.goto(BASE+url,{waitUntil:'domcontentloaded',timeout:30000});assert(r&&r.status()<500,`${url} HTTP ${r&&r.status()}`);await page.waitForSelector('body[data-brand-system-v46="true"]',{timeout:10000});await dismissConsent(page);return r;}
async function check(name,fn){try{await fn();report.checks.push({name,ok:true});process.stdout.write(`PASS ${name}\n`);}catch(e){report.checks.push({name,ok:false,error:e.message});report.failures.push({name,error:e.message});process.stderr.write(`FAIL ${name}: ${e.message}\n`);}}
async function style(page,selector){return page.$eval(selector,el=>{const s=getComputedStyle(el);return {color:s.color,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,borderColor:s.borderTopColor,fontFamily:s.fontFamily,display:s.display,visibility:s.visibility};});}
async function assertNoRetired(page,selector,label){const hits=await page.$$eval(selector,(els,bad)=>{const out=[];for(const el of els.slice(0,1000)){const s=getComputedStyle(el);for(const [prop,value] of [['color',s.color],['backgroundColor',s.backgroundColor],['borderColor',s.borderTopColor],['backgroundImage',s.backgroundImage]]){if(bad.some(x=>String(value).includes(x)))out.push({tag:el.tagName,className:String(el.className||''),prop,value});}}return out.slice(0,20);},retired);assert(!hits.length,`${label} still exposes retired visual colours: ${JSON.stringify(hits)}`);}
async function assertContrast(page,fgSelector,bgSelector,min,label){const pair=await page.evaluate((fgSel,bgSel)=>{const fg=getComputedStyle(document.querySelector(fgSel)),bg=getComputedStyle(document.querySelector(bgSel));return {fg:fg.color,bg:bg.backgroundColor};},fgSelector,bgSelector);const a=parseRgb(pair.fg),b=parseRgb(pair.bg);assert(a&&b,`${label} computed colours unavailable ${JSON.stringify(pair)}`);const ratio=contrast(a,b);assert(ratio>=min,`${label} contrast ${ratio.toFixed(2)} below ${min}:1 (${pair.fg} on ${pair.bg})`);return ratio;}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:950});

  await check('global v46 marker, typography and primary action',async()=>{
    await goto(page,'/');
    const body=await style(page,'body');assert(/Inter/i.test(body.fontFamily),`Inter is not first-choice in computed font stack: ${body.fontFamily}`);
    const button=await style(page,'main .button:not(.secondary)');assert(button.backgroundColor==='rgb(37, 99, 235)',`primary action is not APG blue: ${button.backgroundColor}`);assert(button.color==='rgb(255, 255, 255)',`primary action text is not white: ${button.color}`);
    await assertContrast(page,'main .button:not(.secondary)','main .button:not(.secondary)',4.5,'primary action');
    const deals=await style(page,'.apg-nav-v8 .apg-deals-link');assert(!/255, 247, 232|138, 93, 25/.test(deals.backgroundColor+' '+deals.color),`Deals nav retained amber skin ${JSON.stringify(deals)}`);
    await assertNoRetired(page,'.site-header *,main *','homepage core surfaces');
    const creative=await page.$('.apg-amz-v41-card');assert(creative,'Amazon creative v41 homepage card missing');
    const creativeStyle=await style(page,'.apg-amz-v41-card');assert(/rgb\(255, 255, 255\)|rgb\(239, 246, 255\)/.test(creativeStyle.backgroundImage),`v41 creative card is not governed by v46: ${creativeStyle.backgroundImage}`);
    await assertNoRetired(page,'.apg-amz-v41 *','Amazon creative v41 homepage');
    await snap(page,'brand-home-desktop');
  });

  await check('desktop Search autocomplete uses current APG preview styling',async()=>{
    await goto(page,'/');
    const input=await page.$('.header-search [data-site-search]');assert(input,'header Search input missing');await input.focus();await input.type('Sony');
    await page.waitForFunction(()=>[...document.querySelectorAll('.search-suggestions')].some(x=>!x.hidden&&x.querySelector('.suggest-item')),{timeout:10000});
    const selector='.header-search .search-suggestions:not([hidden])';
    const box=await style(page,selector);assert(box.backgroundColor==='rgb(255, 255, 255)',`Search preview surface is not white: ${box.backgroundColor}`);
    const item=await style(page,selector+' .suggest-item');assert(item.color==='rgb(15, 23, 42)',`Search preview text is not APG navy: ${item.color}`);
    await assertContrast(page,selector+' .suggest-item strong',selector,7,'Search suggestion title');
    await assertNoRetired(page,selector+' *','Search autocomplete');
  });

  await check('Research View is blue/navy rather than historical teal',async()=>{
    await goto(page,'/search/?q=robot%20vacuum%20for%20pet%20hair');
    await page.waitForSelector('.apg-rv-v43',{timeout:10000});
    const kicker=await style(page,'.apg-rv-kicker-v43');assert(kicker.color==='rgb(29, 78, 216)',`Research View kicker is not APG blue: ${kicker.color}`);
    const card=await style(page,'.apg-rv-card-v43');assert(card.backgroundColor==='rgb(255, 255, 255)',`Research View card is not white: ${card.backgroundColor}`);
    await assertNoRetired(page,'.apg-rv-v43 *','Research View');
    await snap(page,'brand-search-research-desktop');
  });

  await check('My APG and login surfaces use the master palette',async()=>{
    await goto(page,'/my-apg/?account=login');
    await page.waitForSelector('.v5-account-status, .apg-account-shell, [data-account-signed-out]',{timeout:10000});
    const status=await style(page,'.v5-account-status');assert(status.backgroundColor==='rgb(255, 255, 255)',`My APG status is not white: ${status.backgroundColor}`);
    await assertNoRetired(page,'main *,[class*="apg-profile"] *,[class*="apg-verification"] *','My APG / account');
    const active=await page.$('.apg-account-tabs button[aria-selected="true"],.apg-account-tabs button.is-active');if(active){const s=await active.evaluate(el=>getComputedStyle(el).backgroundColor);assert(s==='rgb(37, 99, 235)',`account active tab is not APG blue: ${s}`);}
    await snap(page,'brand-my-apg-login-desktop');
  });

  await check('category/product surfaces use navy hero art and readable cards',async()=>{
    await goto(page,'/categories/coffee-machines/');
    const art=await style(page,'.category-hero-art');assert(/rgb\(15, 23, 42\)/.test(art.backgroundImage),`category hero art does not use APG navy: ${art.backgroundImage}`);
    const title=await style(page,'.category-hero-art strong');assert(title.color==='rgb(255, 255, 255)',`category hero art title is not white: ${title.color}`);
    const card=await style(page,'.product-card');assert(card.backgroundColor==='rgb(255, 255, 255)',`product card is not white: ${card.backgroundColor}`);
    await assertNoRetired(page,'.category-hero *, .product-card *, .feature-card *, .comparison-card *, .apg-amz-v41 *','category and product discovery');
    await snap(page,'brand-category-desktop');
  });

  await check('shopping discovery and creative v41 are APG-owned blue/navy UI',async()=>{
    await goto(page,'/deals/');
    const hero=await style(page,'.apg-shopping-hero');assert(/rgb\(239, 246, 255\)/.test(hero.backgroundImage),`shopping hero does not use APG blue-soft: ${hero.backgroundImage}`);
    const icon=await style(page,'.apg-shopping-icon');assert(icon.color==='rgb(37, 99, 235)',`shopping icon is not APG blue: ${icon.color}`);
    const card=await style(page,'.apg-shopping-card');assert(card.backgroundColor==='rgb(255, 255, 255)',`shopping card is not white: ${card.backgroundColor}`);
    const creative=await style(page,'.apg-amz-v41-card');assert(creative.color==='rgb(15, 23, 42)',`Amazon v41 creative text is not APG navy: ${creative.color}`);
    const cta=await style(page,'.apg-amz-v41-cta');assert(cta.backgroundColor==='rgb(37, 99, 235)'&&cta.color==='rgb(255, 255, 255)',`Amazon v41 CTA is not APG blue/white: ${JSON.stringify(cta)}`);
    await assertNoRetired(page,'[class*="apg-shopping"] *, .apg-amz-v41 *','shopping discovery');
    await snap(page,'brand-deals-desktop');
  });

  await check('Scout uses navy shell, blue actions and controlled cyan accent',async()=>{
    await goto(page,'/');
    await page.click('#apgAssistantLauncher');
    await page.waitForSelector('#apgAssistantPanel:not([hidden]) .scout-v5-input',{timeout:10000});
    const head=await style(page,'.apg-assistant-head');assert(/rgb\(15, 23, 42\)/.test(head.backgroundImage),`Scout header is not APG navy: ${head.backgroundImage}`);
    const send=await style(page,'.scout-v5-send');assert(send.backgroundColor==='rgb(37, 99, 235)',`Scout send action is not APG blue: ${send.backgroundColor}`);
    await assertNoRetired(page,'#apgAssistantPanel *,#apgAssistantLauncher *','Scout');
    await snap(page,'brand-scout-desktop');
    await page.click('[data-apg-assistant-close]');
  });

  await check('mobile navigation, account and Search remain branded and legible',async()=>{
    await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
    await goto(page,'/');
    await page.click('[data-mobile-toggle]');
    await page.waitForSelector('#mobileNav:not([hidden])',{timeout:5000});
    const account=await style(page,'.apg-mobile-account-v20');assert(account.backgroundColor==='rgb(248, 250, 252)',`mobile account surface is not APG surface grey: ${account.backgroundColor}`);
    const join=await style(page,'.apg-mobile-account-v20 a.is-primary');assert(join.backgroundColor==='rgb(37, 99, 235)',`mobile Join action is not APG blue: ${join.backgroundColor}`);
    await assertNoRetired(page,'#mobileNav *','mobile navigation');
    const mobileInput=await page.$('#mobileNav [data-site-search]');assert(mobileInput,'mobile Search input missing');await mobileInput.type('robot vacuum');
    await page.waitForFunction(()=>[...document.querySelectorAll('#mobileNav .search-suggestions')].some(x=>!x.hidden&&x.querySelector('.suggest-item')),{timeout:10000});
    await assertNoRetired(page,'#mobileNav .search-suggestions *','mobile Search preview');
    await snap(page,'brand-mobile-navigation');
  });

  await browser.close();
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'brand-system-v46-report.json'),JSON.stringify(report,null,2));
  if(report.failures.length)process.exit(1);
  console.log(`APG Brand System v46 browser certification passed (${report.checks.length}/${report.checks.length})`);
})().catch(async error=>{report.failures.push({name:'runner',error:error.message});report.finishedAt=new Date().toISOString();fs.writeFileSync(path.join(OUT,'brand-system-v46-report.json'),JSON.stringify(report,null,2));console.error(error);process.exit(1);});
