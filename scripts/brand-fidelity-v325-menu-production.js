#!/usr/bin/env node
'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');
const BASE_URL=process.env.BASE_URL||'https://australianproductguide.au';
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v325';
const VIEWPORTS=[['tablet',834,1112],['mobile',390,844]];
const failures=[];const report=[];
fs.mkdirSync(OUT,{recursive:true});
function fail(m){failures.push(m);console.error('V325_FAIL',m)}
async function run(){
  if(!CHROME)throw new Error('CHROME executable is required');
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const [vp,width,height] of VIEWPORTS){
      const page=await browser.newPage();
      await page.setViewport({width,height,deviceScaleFactor:1});
      await page.setCacheEnabled(false);
      const pref=encodeURIComponent(JSON.stringify({version:'2026-08-17-v1',analytics:false,updated_at:new Date().toISOString()}));
      await page.setCookie({name:'apg_cookie_preferences',value:pref,url:BASE_URL+'/',secure:true,sameSite:'Lax'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      const response=await page.goto(BASE_URL+'/',{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForSelector('body[data-brand-fidelity-v325="true"]',{timeout:15000});
      await page.waitForNetworkIdle({idleTime:350,timeout:7000}).catch(()=>{});
      await page.click('[data-mobile-toggle]');
      await new Promise(r=>setTimeout(r,1200));
      const state=await page.evaluate(()=>{
        const nav=document.getElementById('mobileNav');
        const inner=nav?.querySelector('.mobile-nav-inner');
        const decision=inner?.querySelector('.apg-v325-decision-mobile');
        const scout=inner?.querySelector('.apg-v325-scout-mobile');
        const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};
        const pseudo=(el,which)=>el?getComputedStyle(el,which).content:'';
        const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}};
        const unclassifiedVisible=[...inner.querySelectorAll(':scope > .mobile-power:not(.apg-v325-decision-mobile):not(.apg-v325-scout-mobile)')].filter(visible).length;
        const sections=[...inner.querySelectorAll(':scope > .mobile-section')].filter(visible);
        return {
          open:!nav.hidden,
          marker:document.body.dataset.brandFidelityV325||'',
          serverDecision:!!decision,
          serverScout:!!scout,
          decisionVisible:visible(decision),
          scoutVisible:visible(scout),
          decisionLabel:decision?.getAttribute('aria-label')||decision?.textContent.replace(/\s+/g,' ').trim()||'',
          scoutLabel:scout?.getAttribute('aria-label')||scout?.textContent.replace(/\s+/g,' ').trim()||'',
          decisionPseudo:pseudo(decision,'::before'),
          scoutPseudo:pseudo(scout,'::before'),
          decisionOrder:getComputedStyle(decision).order,
          scoutOrder:getComputedStyle(scout).order,
          decisionRect:rect(decision),
          scoutRect:rect(scout),
          firstSectionRect:rect(sections[0]),
          unclassifiedVisible,
          overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>document.documentElement.clientWidth+2,
          sectionCount:sections.length
        };
      });
      await page.screenshot({path:`${OUT}/${vp}-mobile-menu.png`,fullPage:false});
      const status=response?.status()||0;
      if(status<200||status>=400)fail(`${vp}: HTTP ${status}`);
      if(errors.length)fail(`${vp}: page errors ${errors.join(' | ')}`);
      if(!state.open||state.marker!=='true')fail(`${vp}: menu/final marker missing ${JSON.stringify(state)}`);
      if(!state.serverDecision||!state.serverScout||!state.decisionVisible||!state.scoutVisible)fail(`${vp}: intended controls not visibly rendered ${JSON.stringify(state)}`);
      if(state.decisionPseudo!=='"Decision Lab"'||state.scoutPseudo!=='"Ask Scout"')fail(`${vp}: CSS visual labels drifted ${JSON.stringify(state)}`);
      if(Number(state.decisionOrder)!==30||Number(state.scoutOrder)!==31)fail(`${vp}: tool order drifted ${JSON.stringify(state)}`);
      if(!(state.decisionRect.bottom<=state.scoutRect.top+1&&state.scoutRect.bottom<=state.firstSectionRect.top+1))fail(`${vp}: visual order is not Decision Lab -> Ask Scout -> sections ${JSON.stringify(state)}`);
      if(state.unclassifiedVisible!==0)fail(`${vp}: visible duplicate mobile power action detected`);
      if(state.overflow)fail(`${vp}: document overflow detected`);
      if(state.sectionCount<3)fail(`${vp}: expected mobile accordion groups missing`);
      report.push({vp,status,...state,errors});
      await page.close();
    }
  }finally{await browser.close();}
  fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));
  fs.writeFileSync(`${OUT}/failures.json`,JSON.stringify(failures,null,2));
  if(failures.length){console.error(`V325_MOBILE_VISUAL_FAIL=${failures.length}`);process.exit(1)}
  console.log(`V325_MOBILE_VISUAL=${report.length}_STATES_PASS`);
}
run().catch(e=>{console.error(e.stack||e);process.exit(1)});
