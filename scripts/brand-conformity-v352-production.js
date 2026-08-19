#!/usr/bin/env node
'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v352';
const failures=[];
const results=[];
const forbidden=new Map([
  ['rgb(8, 124, 118)','#087C76 retired teal'],
  ['rgb(8, 120, 111)','#08786F retired teal'],
  ['rgb(11, 110, 106)','#0B6E6A retired teal'],
  ['rgb(17, 108, 103)','#116C67 retired teal'],
  ['rgb(23, 110, 105)','#176E69 retired teal'],
  ['rgb(8, 47, 64)','#082F40 retired dark teal'],
  ['rgb(10, 86, 96)','#0A5660 retired launcher teal'],
  ['rgb(223, 241, 236)','#DFF1EC retired mint'],
  ['rgb(229, 244, 239)','#E5F4EF retired mint'],
  ['rgb(232, 245, 241)','#E8F5F1 retired mint'],
  ['rgb(233, 246, 242)','#E9F6F2 retired mint'],
  ['rgb(242, 249, 247)','#F2F9F7 retired mint'],
  ['rgb(237, 246, 243)','#EDF6F3 retired national mint']
]);

function fail(msg){failures.push(msg);console.error('V352_FAIL',msg);}
async function setPrivacy(page){
  await page.setCookie({name:'apg_cookie_preferences',value:encodeURIComponent(JSON.stringify({version:'2026-08-17-v1',analytics:false,updated_at:new Date().toISOString()})),url:BASE+'/',secure:true,sameSite:'Lax'});
}
async function scan(rootHandle,label){
  return rootHandle.evaluate((root,forbidden)=>{
    const bad=new Map(forbidden);
    const props=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','backgroundImage','boxShadow','textShadow'];
    const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0};
    const leaks=[];
    const els=[root,...root.querySelectorAll('*')];
    for(const el of els){
      if(!visible(el))continue;
      for(const prop of props){
        const value=String(getComputedStyle(el)[prop]||'');
        for(const [rgb,name] of bad){if(value.includes(rgb)){leaks.push({tag:el.tagName.toLowerCase(),cls:String(el.className||'').slice(0,100),prop,value,name});if(leaks.length>=20)return leaks;}}
      }
    }
    return leaks;
  },[...forbidden.entries()]);
}
async function colour(page,selector,prop='color'){
  return page.$eval(selector,(el,p)=>getComputedStyle(el)[p],prop);
}
async function shot(page,selector,path){
  const el=await page.$(selector);if(!el)throw new Error(`Missing screenshot target ${selector}`);await el.scrollIntoView();await new Promise(r=>setTimeout(r,150));await el.screenshot({path});
}

async function runViewport(browser,name,width,height){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.setViewport({width,height,deviceScaleFactor:1});
    await page.setCacheEnabled(false);await setPrivacy(page);
    const response=await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
    if(response?.status()!==200)fail(`${name}: homepage status ${response?.status()}`);
    await page.waitForSelector('body[data-brand-conformity-v352="true"]',{timeout:15000});
    await page.waitForSelector('.apg-national-v10');
    await new Promise(r=>setTimeout(r,500));

    const national=await page.$('.apg-national-v10');
    const nationalLeaks=await scan(national,'national');
    if(nationalLeaks.length)fail(`${name}/national: ${JSON.stringify(nationalLeaks.slice(0,8))}`);
    const nationalAccent=await colour(page,'.apg-national-v10 .apg-national-card span');
    const nationalLink=await colour(page,'.apg-national-v10 .apg-national-card b');
    if(nationalAccent!=='rgb(29, 78, 216)'||nationalLink!=='rgb(29, 78, 216)')fail(`${name}/national: expected APG blue-dark, got ${nationalAccent} / ${nationalLink}`);
    await shot(page,'.apg-national-v10',`${OUT}/${name}-national-category.png`);

    const search='#apgHomeSearchV9';
    await page.$eval(search,el=>{el.value='';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.focus(search);await page.type(search,'sony',{delay:35});
    await page.waitForSelector('#apgHomeSearchV9Suggestions .suggest-item',{visible:true,timeout:10000});
    await new Promise(r=>setTimeout(r,250));
    const suggest=await page.$('#apgHomeSearchV9Suggestions');
    const suggestLeaks=await scan(suggest,'suggestions');
    if(suggestLeaks.length)fail(`${name}/autocomplete: ${JSON.stringify(suggestLeaks.slice(0,8))}`);
    const title=await colour(page,'#apgHomeSearchV9Suggestions .suggest-item strong');
    const thumb=await colour(page,'#apgHomeSearchV9Suggestions .suggest-thumb');
    if(title!=='rgb(15, 23, 42)')fail(`${name}/autocomplete: title ${title}`);
    if(thumb!=='rgb(37, 99, 235)')fail(`${name}/autocomplete: icon ${thumb}`);
    await shot(page,'#apgHomeSearchV9Suggestions',`${OUT}/${name}-search-suggestions.png`);
    await page.keyboard.press('Escape');

    await page.click('#apgAssistantLauncher');
    await page.waitForSelector('#apgAssistantPanel:not([hidden])',{timeout:10000});
    await page.waitForSelector('#apgAssistantPanel .scout-thread',{timeout:10000});
    await new Promise(r=>setTimeout(r,350));
    const scout=await page.$('#apgAssistantPanel');
    const scoutLeaks=await scan(scout,'scout');
    if(scoutLeaks.length)fail(`${name}/scout: ${JSON.stringify(scoutLeaks.slice(0,10))}`);
    if(await page.$('#apgAssistantPanel .scout-kicker')){
      const kicker=await colour(page,'#apgAssistantPanel .scout-kicker');
      if(kicker!=='rgb(29, 78, 216)')fail(`${name}/scout: kicker ${kicker}`);
    }
    const send=await colour(page,'#apgAssistantPanel .scout-send','backgroundColor');
    if(send!=='rgb(37, 99, 235)')fail(`${name}/scout: send ${send}`);
    await shot(page,'#apgAssistantPanel',`${OUT}/${name}-scout.png`);

    const row={name,width,height,nationalAccent,nationalLink,autocompleteTitle:title,autocompleteIcon:thumb,scoutSend:send,nationalLeaks,suggestLeaks,scoutLeaks,pageErrors:errors};
    results.push(row);
    if(errors.length)fail(`${name}: page errors ${errors.join(' | ')}`);
  }catch(e){fail(`${name}: ${e.message}`);}finally{await page.close();}
}

(async()=>{
  if(!CHROME)throw new Error('CHROME required');
  fs.mkdirSync(OUT,{recursive:true});
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    await runViewport(browser,'desktop',1440,1000);
    await runViewport(browser,'mobile',390,844);
  }finally{await browser.close();}
  fs.writeFileSync(`${OUT}/audit.json`,JSON.stringify(results,null,2));
  fs.writeFileSync(`${OUT}/failures.json`,JSON.stringify(failures,null,2));
  console.log(`APG v35.2 focused visual audit complete; failures=${failures.length}`);
  if(failures.length)process.exit(1);
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
