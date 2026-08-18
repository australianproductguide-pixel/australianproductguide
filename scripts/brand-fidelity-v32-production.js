#!/usr/bin/env node
'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');

const BASE_URL=process.env.BASE_URL||'https://australianproductguide.au';
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v32';
const VIEWPORTS=[['desktop',1440,1000],['tablet',834,1112],['mobile',390,844]];
const PAGES=[
  ['home','/'],
  ['search','/search/?q=robot+vacuum+for+pet+hair'],
  ['category','/categories/wireless-headphones/'],
  ['product','/products/sony-wh-1000xm6/'],
  ['compare','/compare/custom/?products=sony-wh-1000xm6,bose-quietcomfort-ultra-headphones'],
  ['decision','/decision-lab/?q=75+inch+TV+for+a+bright+room+under+%242500'],
  ['workspace','/my-apg/'],
  ['trust','/privacy/']
];

fs.mkdirSync(OUT,{recursive:true});
const report=[];
const failures=[];

function fail(msg){failures.push(msg);console.error('VISUAL_FAIL',msg)}
async function setPrivacyCookie(page){
  const value=encodeURIComponent(JSON.stringify({version:'2026-08-17-v1',analytics:false,updated_at:new Date().toISOString()}));
  await page.setCookie({name:'apg_cookie_preferences',value,url:BASE_URL+'/',secure:true,sameSite:'Lax'});
}
async function settle(page){
  await page.waitForSelector('body[data-brand-fidelity-v32="true"]',{timeout:20000});
  await page.waitForNetworkIdle({idleTime:350,timeout:7000}).catch(()=>{});
  await new Promise(r=>setTimeout(r,250));
}
async function openPage(browser,width,height,path,{javascript=true}={}){
  const page=await browser.newPage();
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.setJavaScriptEnabled(javascript);
  await page.setCacheEnabled(false);
  await setPrivacyCookie(page);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    const response=await page.goto(BASE_URL+path,{waitUntil:'domcontentloaded',timeout:60000});
    await settle(page);
    return {page,response,errors};
  }catch(err){
    await page.close().catch(()=>{});
    throw err;
  }
}
async function inspect(page,name,vp){
  return page.evaluate(({name,vp})=>{
    const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'};
    const rgb=el=>el?getComputedStyle(el).color:'';
    const proof=document.querySelector('.apg-proof-band-v20');
    const proofCounter=document.querySelector('.apg-counter-v20 span');
    const darkHeading=document.querySelector('.apg-home-decision-panel-v9 h2,.search-hero h1,.decision-hero h1');
    const darkCopy=document.querySelector('.apg-home-decision-panel-v9 p,.search-hero p,.decision-hero p');
    const footerCopy=document.querySelector('footer.apg-footer-v11 .footer-v11-disclosure p');
    const header=document.querySelector('.site-header .apg-brand-v32-lockup');
    const mark=header?.querySelector('.apg-brand-v32-symbol');
    const monogram=header?.querySelector('.apg-brand-v32-monogram');
    const type=header?.querySelector('.apg-brand-v32-type');
    const scrollWidth=Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0);
    const clientWidth=document.documentElement.clientWidth;
    const documentOverflow=scrollWidth>clientWidth+2;
    const diagnosticOffenders=documentOverflow?[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return {tag:el.tagName.toLowerCase(),cls:String(el.className||'').slice(0,100),left:r.left,right:r.right,width:r.width,display:cs.display,position:cs.position,overflowX:cs.overflowX};}).filter(x=>x.display!=='none'&&x.width>0&&x.position!=='fixed'&&(x.left<-2||x.right>innerWidth+2)).slice(0,12):[];
    return {
      name,vp,scrollWidth,clientWidth,documentOverflow,
      v32:document.body.dataset.brandFidelityV32||'',v31:document.body.dataset.themeV31||'',v27:document.body.dataset.evidenceCommerceV27||'',v28:document.body.dataset.trustV28||'',
      headerV32:!!header,markPaths:mark?.querySelectorAll('path').length||0,markGeometry:[...mark?.querySelectorAll('path')||[]].map(x=>x.getAttribute('d')),
      fullWordmarkVisible:visible(type),monogramVisible:visible(monogram),legacyHeader:!!document.querySelector('.site-header .apg-brand-v30-lockup'),
      proofPresent:!!proof,proofBackground:proof?getComputedStyle(proof).backgroundImage:'',proofColor:rgb(proof),proofCounterColor:rgb(proofCounter),
      darkHeadingColor:rgb(darkHeading),darkCopyColor:rgb(darkCopy),footerCopyColor:rgb(footerCopy),
      textLength:(document.body.innerText||'').length,diagnosticOffenders
    };
  },{name,vp});
}
function assertState(state,status,errors){
  const tag=`${state.vp}/${state.name}`;
  if(status<200||status>=400)fail(`${tag}: HTTP ${status}`);
  if(state.v32!=='true')fail(`${tag}: v32 body marker missing`);
  if(state.v31!=='true'||state.v27!=='true'||state.v28!=='true')fail(`${tag}: mature runtime markers missing`);
  if(!state.headerV32||state.markPaths!==4)fail(`${tag}: board-faithful v32 header mark missing`);
  if(state.legacyHeader)fail(`${tag}: legacy v30 header lockup survived`);
  if(state.markGeometry[0]!=='M54 81 86 83 105 51 123 83 154 83 125 32 83 33Z')fail(`${tag}: traced top geometry drifted`);
  if(state.vp==='desktop'&&!state.fullWordmarkVisible)fail(`${tag}: desktop horizontal wordmark hidden`);
  if(['tablet','mobile'].includes(state.vp)&&!state.monogramVisible)fail(`${tag}: compact APG monogram hidden at standard responsive width`);
  if(state.documentOverflow)fail(`${tag}: document width ${state.scrollWidth}px exceeds viewport ${state.clientWidth}px; offenders=${JSON.stringify(state.diagnosticOffenders)}`);
  if(state.textLength<80)fail(`${tag}: unexpectedly little rendered text`);
  if(errors.length)fail(`${tag}: page errors ${errors.join(' | ')}`);
  if(state.name==='home'){
    if(!state.proofPresent)fail(`${tag}: maintained-research banner missing`);
    if(!/rgb\(255, 214, 91\)|#ffd65b/i.test(state.proofBackground))fail(`${tag}: recovered yellow proof gradient not rendered: ${state.proofBackground}`);
    if(state.proofColor!=='rgb(8, 39, 53)')fail(`${tag}: proof foreground must remain #082735; found ${state.proofColor}`);
    if(state.proofCounterColor!=='rgb(255, 255, 255)')fail(`${tag}: split-flap proof digits must remain white`);
    if(state.darkHeadingColor&&state.darkHeadingColor!=='rgb(255, 255, 255)')fail(`${tag}: dark-panel heading is not white: ${state.darkHeadingColor}`);
    if(state.darkCopyColor&&state.darkCopyColor!=='rgb(203, 213, 225)')fail(`${tag}: dark-panel secondary copy is not #CBD5E1: ${state.darkCopyColor}`);
  }
}

async function capturePage(browser,vp,width,height,name,path){
  let opened;
  try{
    opened=await openPage(browser,width,height,path,{javascript:true});
    const {page,response,errors}=opened;
    const state=await inspect(page,name,vp);
    const status=response?.status()||0;
    await page.screenshot({path:`${OUT}/${vp}-${name}.png`,fullPage:true});
    assertState(state,status,errors);
    report.push({...state,status,errors,path});
  }catch(err){
    fail(`${vp}/${name}: ${err.message}`);
    if(opened?.page)await opened.page.screenshot({path:`${OUT}/${vp}-${name}-failure.png`,fullPage:true}).catch(()=>{});
  }finally{
    if(opened?.page)await opened.page.close().catch(()=>{});
  }
}

async function run(){
  if(!CHROME)throw new Error('CHROME executable is required');
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    for(const [vp,width,height] of VIEWPORTS){
      for(const [name,path] of PAGES){
        console.log(`V32_VISUAL ${vp} ${name} ${path}`);
        await capturePage(browser,vp,width,height,name,path);
      }
      const scout=await openPage(browser,width,height,'/');
      try{
        const clicked=await scout.page.evaluate(()=>{const els=[...document.querySelectorAll('[data-v26-scout-open],#apgAssistantLauncher')];const el=els.find(x=>{const r=x.getBoundingClientRect(),cs=getComputedStyle(x);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'});if(!el)return false;el.click();return true;});
        await new Promise(r=>setTimeout(r,250));
        const state=await scout.page.evaluate(()=>({open:!document.getElementById('apgAssistantPanel')?.hidden,scoutGraphic:!!document.querySelector('#scoutHat.apg-brand-v32-symbol'),overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>document.documentElement.clientWidth+2}));
        await scout.page.screenshot({path:`${OUT}/${vp}-scout-open.png`,fullPage:false});
        if(!clicked||!state.open||!state.scoutGraphic||state.overflow||scout.errors.length)fail(`${vp}/scout: ${JSON.stringify(state)} ${scout.errors.join('|')}`);
        report.push({vp,name:'scout-open',...state,status:scout.response?.status()||0});
      }finally{await scout.page.close();}
      if(vp!=='desktop'){
        const nav=await openPage(browser,width,height,'/');
        try{
          const clicked=await nav.page.evaluate(()=>{const el=document.querySelector('[data-mobile-toggle]');if(!el)return false;el.click();return true;});
          await new Promise(r=>setTimeout(r,200));
          const state=await nav.page.evaluate(()=>({open:!document.getElementById('mobileNav')?.hidden,overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>document.documentElement.clientWidth+2,brand:!!document.querySelector('.site-header .apg-brand-v32-monogram-svg')}));
          await nav.page.screenshot({path:`${OUT}/${vp}-mobile-menu.png`,fullPage:false});
          if(!clicked||!state.open||state.overflow||!state.brand||nav.errors.length)fail(`${vp}/mobile-menu: ${JSON.stringify(state)} ${nav.errors.join('|')}`);
          report.push({vp,name:'mobile-menu',...state,status:nav.response?.status()||0});
        }finally{await nav.page.close();}
      }
    }
  }finally{await browser.close();}
  fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));
  fs.writeFileSync(`${OUT}/failures.json`,JSON.stringify(failures,null,2));
  const expected=PAGES.length*VIEWPORTS.length+VIEWPORTS.length+2;
  if(report.length!==expected)fail(`Expected ${expected} responsive visual states, recorded ${report.length}`);
  if(failures.length){console.error(`V32_VISUAL_CERTIFICATION_FAIL=${failures.length}`);process.exit(1)}
  console.log(`V32_VISUAL_CERTIFICATION=${report.length}_STATES_PASS`);
}
run().catch(err=>{console.error(err.stack||err);process.exit(1)});
