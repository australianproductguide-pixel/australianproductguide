#!/usr/bin/env node
'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');

const BASE_URL=process.env.BASE_URL||'https://australianproductguide.au';
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v36';
const failures=[];
const report=[];
fs.mkdirSync(OUT,{recursive:true});
function fail(message){failures.push(message);console.error('V36_FAIL',message);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function navigate(page,url){
  let lastError=null;
  for(let attempt=1;attempt<=2;attempt++){
    try{
      return await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    }catch(error){
      lastError=error;
      if(attempt===2)break;
      console.warn(`V36_NAV_RETRY attempt=${attempt} url=${url} reason=${error.message}`);
      await page.goto('about:blank',{waitUntil:'domcontentloaded',timeout:10000}).catch(()=>{});
      await sleep(750);
    }
  }
  throw lastError;
}
async function prepare(page,width,height,path){
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.setCacheEnabled(false);
  page.setDefaultNavigationTimeout(60000);
  const pref=encodeURIComponent(JSON.stringify({version:'2026-08-17-v1',analytics:false,updated_at:new Date().toISOString()}));
  await page.setCookie({name:'apg_cookie_preferences',value:pref,url:BASE_URL+'/',secure:true,sameSite:'Lax'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const response=await navigate(page,BASE_URL+path);
  await page.waitForSelector('body[data-brand-conformity-v351="true"]',{timeout:20000});
  await page.waitForNetworkIdle({idleTime:300,timeout:7000}).catch(()=>{});
  return {response,errors};
}

async function state(page){
  return page.evaluate(()=>{
    const launcher=document.getElementById('apgAssistantLauncher');
    const copy=launcher?.querySelector('.apg-assistant-launcher-copy');
    const nav=document.getElementById('mobileNav');
    const menuScout=nav?.querySelector('[data-v26-scout-mobile]');
    const panel=document.getElementById('apgAssistantPanel');
    const visible=el=>{if(!el)return false;const rect=el.getBoundingClientRect();const css=getComputedStyle(el);return rect.width>0&&rect.height>0&&css.display!=='none'&&css.visibility!=='hidden'&&Number(css.opacity||1)!==0;};
    const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,right:r.right,bottom:r.bottom,left:r.left,width:r.width,height:r.height};};
    return {
      page:document.body.dataset.v26Page||'',
      launcherVisible:visible(launcher),
      launcherRect:rect(launcher),
      launcherCopyDisplay:copy?getComputedStyle(copy).display:null,
      navOpen:!!nav&&!nav.hidden,
      menuScoutVisible:visible(menuScout),
      panelVisible:visible(panel),
      overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>document.documentElement.clientWidth+2
    };
  });
}

async function comparisonState(page){
  return page.evaluate(()=>[...document.querySelectorAll('.visual-comparison .comparison-visuals')].slice(0,6).map((el,index)=>{
    const parent=el.getBoundingClientRect();
    const products=[...el.children].filter(child=>!child.classList.contains('vs-badge')).map(child=>{
      const r=child.getBoundingClientRect();
      return {left:r.left,right:r.right,width:r.width,clipped:r.left<parent.left-1||r.right>parent.right+1};
    });
    return {index,gridTemplateColumns:getComputedStyle(el).gridTemplateColumns,parentWidth:parent.width,products};
  }));
}

async function decisionPriceState(page){
  return page.evaluate(()=>[...document.querySelectorAll('.decision-price')].slice(0,8).map((el,index)=>{
    const strong=el.querySelector('.price');
    const note=el.querySelector('.price-note');
    const er=el.getBoundingClientRect();
    const sr=strong?.getBoundingClientRect();
    const nr=note?.getBoundingClientRect();
    return {
      index,
      display:getComputedStyle(el).display,
      direction:getComputedStyle(el).flexDirection,
      noteDisplay:note?getComputedStyle(note).display:null,
      stacked:!!(sr&&nr&&nr.top>=sr.bottom-1),
      clipped:!!(nr&&(nr.left<er.left-1||nr.right>er.right+1))
    };
  }));
}

async function run(){
  if(!CHROME)throw new Error('CHROME executable is required');
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    // Tablet homepage: retain compact direct Scout access, but never behind the open mobile menu.
    {
      const page=await browser.newPage();
      const {response,errors}=await prepare(page,834,1112,'/');
      let s=await state(page);
      if((response?.status()||0)!==200)fail(`tablet-home: HTTP ${response?.status()||0}`);
      if(errors.length)fail(`tablet-home: page errors ${errors.join(' | ')}`);
      if(s.page!=='home')fail(`tablet-home: expected home marker, got ${s.page}`);
      if(!s.launcherVisible)fail('tablet-home: compact Scout launcher must remain directly available');
      if(!s.launcherRect||s.launcherRect.width>60||s.launcherRect.height>60||s.launcherRect.width<44||s.launcherRect.height<44)fail(`tablet-home: launcher must be compact/touch-safe ${JSON.stringify(s.launcherRect)}`);
      if(s.launcherCopyDisplay!=='none')fail(`tablet-home: launcher copy should collapse at <=920px, got ${s.launcherCopyDisplay}`);
      if(s.overflow)fail('tablet-home: horizontal overflow detected');
      await page.screenshot({path:`${OUT}/tablet-home-closed.png`,fullPage:false});
      await page.click('[data-mobile-toggle]');
      await sleep(450);
      s=await state(page);
      if(!s.navOpen||!s.menuScoutVisible)fail(`tablet-home-menu: mobile navigation/Scout unavailable ${JSON.stringify(s)}`);
      if(s.launcherVisible)fail('tablet-home-menu: fixed Scout launcher must not sit behind the open mobile navigation');
      await page.screenshot({path:`${OUT}/tablet-home-menu-open.png`,fullPage:false});
      await page.click('#mobileNav [data-v26-scout-mobile]');
      await sleep(450);
      s=await state(page);
      if(!s.panelVisible)fail(`tablet-home-scout: menu Ask Scout did not open Scout ${JSON.stringify(s)}`);
      await page.screenshot({path:`${OUT}/tablet-home-scout-open.png`,fullPage:false});
      report.push({case:'tablet-home',status:response?.status()||0,state:s,errors});
      await page.close();
    }

    // Mobile and tablet inner research surfaces: no fixed overlay; Scout remains reachable from menu.
    for(const [name,width,height] of [['mobile-search',390,844],['tablet-search',834,1112]]){
      const page=await browser.newPage();
      const {response,errors}=await prepare(page,width,height,'/search/?q=robot+vacuum+for+pet+hair');
      let s=await state(page);
      if((response?.status()||0)!==200)fail(`${name}: HTTP ${response?.status()||0}`);
      if(errors.length)fail(`${name}: page errors ${errors.join(' | ')}`);
      if(s.page!=='search')fail(`${name}: expected search marker, got ${s.page}`);
      if(s.launcherVisible)fail(`${name}: fixed Scout launcher must not obscure research controls at <=920px`);
      if(s.overflow)fail(`${name}: horizontal overflow detected`);

      let comparisons=[];
      if(name==='mobile-search'){
        comparisons=await comparisonState(page);
        if(!comparisons.length)fail('mobile-search: expected comparison preview cards');
        for(const item of comparisons){
          const columnCount=item.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
          if(columnCount!==1)fail(`mobile-search: comparison ${item.index} must stack to one column, got ${item.gridTemplateColumns}`);
          if(item.products.some(product=>product.clipped))fail(`mobile-search: comparison ${item.index} clips a product panel ${JSON.stringify(item)}`);
        }
        await page.evaluate(()=>document.querySelector('.visual-comparison .comparison-visuals')?.scrollIntoView({block:'center'}));
        await sleep(250);
        await page.screenshot({path:`${OUT}/mobile-search-comparisons.png`,fullPage:false});
      }

      await page.screenshot({path:`${OUT}/${name}-closed.png`,fullPage:false});
      await page.click('[data-mobile-toggle]');
      await sleep(350);
      s=await state(page);
      if(!s.navOpen||!s.menuScoutVisible)fail(`${name}: mobile navigation Ask Scout action unavailable ${JSON.stringify(s)}`);
      if(s.launcherVisible)fail(`${name}: hidden fixed launcher reappeared while menu open`);
      await page.click('#mobileNav [data-v26-scout-mobile]');
      await sleep(450);
      s=await state(page);
      if(!s.panelVisible)fail(`${name}: menu Ask Scout did not open Scout ${JSON.stringify(s)}`);
      await page.screenshot({path:`${OUT}/${name}-scout-open.png`,fullPage:false});
      report.push({case:name,status:response?.status()||0,state:s,comparisons,errors});
      await page.close();
    }

    // Decision Lab: price context must remain readable at phone width.
    {
      const page=await browser.newPage();
      const {response,errors}=await prepare(page,390,844,'/decision-lab/?q=75+inch+TV+for+a+bright+room+under+%242500');
      const s=await state(page);
      const prices=await decisionPriceState(page);
      if((response?.status()||0)!==200)fail(`mobile-decision: HTTP ${response?.status()||0}`);
      if(errors.length)fail(`mobile-decision: page errors ${errors.join(' | ')}`);
      if(s.overflow)fail('mobile-decision: horizontal overflow detected');
      if(!prices.length)fail('mobile-decision: expected recommendation price contexts');
      for(const item of prices){
        if(item.display!=='flex'||item.direction!=='column')fail(`mobile-decision: price context ${item.index} must use a column layout ${JSON.stringify(item)}`);
        if(item.noteDisplay!=='block'||!item.stacked||item.clipped)fail(`mobile-decision: price note ${item.index} is not cleanly stacked ${JSON.stringify(item)}`);
      }
      await page.evaluate(()=>document.querySelector('.decision-price')?.scrollIntoView({block:'center'}));
      await sleep(250);
      await page.screenshot({path:`${OUT}/mobile-decision-price.png`,fullPage:false});
      report.push({case:'mobile-decision',status:response?.status()||0,state:s,prices,errors});
      await page.close();
    }

    // Desktop remains unchanged: the persistent launcher is still a first-class entry point.
    {
      const page=await browser.newPage();
      const {response,errors}=await prepare(page,1440,1000,'/search/?q=Sony+XM6');
      const s=await state(page);
      if((response?.status()||0)!==200)fail(`desktop-search: HTTP ${response?.status()||0}`);
      if(errors.length)fail(`desktop-search: page errors ${errors.join(' | ')}`);
      if(!s.launcherVisible)fail('desktop-search: persistent Scout launcher must remain visible above 920px');
      if(s.overflow)fail('desktop-search: horizontal overflow detected');
      await page.screenshot({path:`${OUT}/desktop-search.png`,fullPage:false});
      report.push({case:'desktop-search',status:response?.status()||0,state:s,errors});
      await page.close();
    }
  }finally{
    await browser.close();
  }

  fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));
  fs.writeFileSync(`${OUT}/failures.json`,JSON.stringify(failures,null,2));
  if(failures.length){console.error(`APG_UX_REMEDIATION_V36_FAIL=${failures.length}`);process.exit(1);}
  console.log(`APG_UX_REMEDIATION_V36=${report.length}_CASES_PASS`);
}
run().catch(error=>{console.error(error.stack||error);process.exit(1);});
