'use strict';
const puppeteer=require('puppeteer-core');
const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const fail=m=>{throw new Error(m)};
(async()=>{
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox']});
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  const response=await page.goto(BASE+'/categories/coffee-machines/',{waitUntil:'domcontentloaded',timeout:30000});
  if(!response||response.status()>=500)fail(`coffee-machines HTTP ${response&&response.status()}`);
  await page.waitForSelector('body[data-brand-system-v46="true"]',{timeout:10000});
  const media=await page.$('.category-hero-media');
  if(!media){console.log('APG v46 category-photo browser guard: CURRENT_RUNTIME_HAS_NO_CATEGORY_HERO_MEDIA');await browser.close();return;}
  const state=await page.evaluate(()=>{
    const one=s=>document.querySelector(s),style=s=>getComputedStyle(one(s));
    const shade=style('.category-hero-media-shade');
    const overlay=style('.category-hero-media-overlay strong');
    const label=style('.category-hero-photo-label');
    const caption=style('.category-hero-media figcaption');
    return {shade:shade.backgroundImage,overlay:overlay.color,labelBg:label.backgroundColor,labelColor:label.color,captionBg:caption.backgroundColor,captionColor:caption.color};
  });
  if(!/rgba\(15, 23, 42, 0\.9[6-9]\)/.test(state.shade))fail(`category photo lower scrim is not strong APG navy: ${state.shade}`);
  if(state.overlay!=='rgb(255, 255, 255)')fail(`category photo main overlay is not white: ${state.overlay}`);
  if(state.labelColor!=='rgb(255, 255, 255)')fail(`category photo label is not white: ${state.labelColor}`);
  if(!/rgba\(15, 23, 42, 0\.9[7-9]\)/.test(state.captionBg))fail(`category photo caption is not opaque APG navy: ${state.captionBg}`);
  if(!['rgb(203, 213, 225)','rgb(226, 232, 240)','rgb(255, 255, 255)'].includes(state.captionColor))fail(`category photo caption text is not high-contrast light text: ${state.captionColor}`);
  console.log('APG v46 category-photo browser guard: PASS '+JSON.stringify(state));
  await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exit(1)});
