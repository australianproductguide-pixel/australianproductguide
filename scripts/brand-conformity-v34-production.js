#!/usr/bin/env node
'use strict';
const puppeteer=require('puppeteer-core');
const fs=require('fs');

const BASE_URL=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v34';
const CONCURRENCY=Number(process.env.CRAWL_CONCURRENCY||8);
const VIEWPORTS=[['desktop',1440,1000],['mobile',390,844]];
const failures=[];
const crawlReport=[];
const fullRenderedReport=[];
const visualReport=[];

const forbiddenColours=new Map([
  ['rgb(4, 120, 87)','#047857 legacy dark green'],
  ['rgb(236, 253, 245)','#ECFDF5 legacy green wash'],
  ['rgb(167, 243, 208)','#A7F3D0 legacy mint border'],
  ['rgb(8, 145, 178)','#0891B2 legacy cyan'],
  ['rgb(236, 254, 255)','#ECFEFF legacy cyan wash'],
  ['rgb(14, 116, 144)','#0E7490 legacy cyan text'],
  ['rgb(56, 189, 248)','#38BDF8 legacy sky accent'],
  ['rgb(244, 181, 72)','#F4B548 old Scout yellow'],
  ['rgb(10, 114, 117)','#0A7275 old Scout teal'],
  ['rgb(8, 47, 64)','#082F40 old Scout dark teal'],
  ['rgb(255, 244, 216)','#FFF4D8 old Scout cream'],
  ['rgb(8, 124, 118)','#087C76 old Scout teal badge']
]);

function fail(message){failures.push(message);console.error('V341_FAIL',message);}
function extractLocs(xml){return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));}
function localise(url){const u=new URL(url,BASE_URL);return BASE_URL+u.pathname+u.search;}
async function fetchText(url,timeout=25000){const ac=new AbortController();const timer=setTimeout(()=>ac.abort(),timeout);try{const r=await fetch(url,{headers:{'User-Agent':'APG-v34.1-brand-conformity-certification',Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'},signal:ac.signal,redirect:'follow'});return {status:r.status,text:await r.text(),headers:r.headers};}finally{clearTimeout(timer);}}

async function crawlCanonicalRoutes(){
  const sitemap=await fetchText(BASE_URL+'/sitemap.xml');
  if(sitemap.status!==200)throw new Error('sitemap.xml HTTP '+sitemap.status);
  const locs=extractLocs(sitemap.text);
  if(!locs.length)throw new Error('No canonical routes found in sitemap.xml');
  let cursor=0;
  const workers=Array.from({length:Math.min(CONCURRENCY,locs.length)},async()=>{
    while(cursor<locs.length){
      const i=cursor++,original=locs[i],url=localise(original),path=new URL(url).pathname;
      try{
        const r=await fetchText(url);
        const html=r.text;
        const title=(html.match(/<title>([\s\S]*?)<\/title>/i)||[])[1]||'';
        const canonical=(html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)||[])[1]||'';
        const marker=html.includes('data-brand-conformity-v341="true"');
        const main=/<main\b/i.test(html);
        const oldAssistant=/(>\s*Shopping Assistant\s*<|Evidence-backed product matching)/i.test(html);
        const mobileDecisionCount=((html.match(/<nav\b[^>]*id=["']mobileNav["'][\s\S]*?<\/nav>/i)||[''])[0].match(/href=["']\/decision-lab\/["']/gi)||[]).length;
        const ok=r.status===200&&marker&&main&&title.trim().length>0&&!oldAssistant&&mobileDecisionCount===1;
        crawlReport[i]={path,status:r.status,marker,main,title:title.replace(/\s+/g,' ').trim(),canonical,oldAssistant,mobileDecisionCount,ok};
        if(!ok)fail(`crawl ${path}: status=${r.status} marker=${marker} main=${main} title=${!!title.trim()} oldAssistant=${oldAssistant} mobileDecisionCount=${mobileDecisionCount}`);
      }catch(err){crawlReport[i]={path,status:0,error:err.message,ok:false};fail(`crawl ${path}: ${err.message}`);}
    }
  });
  await Promise.all(workers);
  return locs;
}

function selectTemplatePaths(locs){
  const paths=[...new Set(locs.map(x=>new URL(x).pathname))];
  const first=re=>paths.find(p=>re.test(p));
  const add=(name,path)=>path&&templates.push([name,path]);
  const templates=[];
  add('home','/');
  add('search','/search/?q=robot+vacuum+for+pet+hair');
  add('categories','/categories/');
  add('category',first(/^\/categories\/[^/]+\/$/));
  add('product',first(/^\/products\/[^/]+\/$/));
  add('compare','/compare/');
  add('comparison',first(/^\/compare\/(?!custom\/)[^/]+\/$/));
  add('decision','/decision-lab/');
  add('decision-result','/decision-lab/?q=65+inch+TV+for+a+bright+room+under+%242500');
  add('guides','/guides/');
  add('guide',first(/^\/guides\/[^/]+\/$/));
  add('brands','/brands/');
  add('brand',first(/^\/brands\/[^/]+\/$/));
  add('retailers','/retailers/');
  add('workspace','/my-apg/');
  add('methodology','/methodology/');
  add('sources','/sources/');
  add('privacy','/privacy/');
  add('terms','/terms/');
  add('affiliate','/affiliate-disclosure/');
  add('contact','/contact/');
  return templates;
}

async function setPrivacyCookie(page){const value=encodeURIComponent(JSON.stringify({version:'2026-08-17-v1',analytics:false,updated_at:new Date().toISOString()}));await page.setCookie({name:'apg_cookie_preferences',value,url:BASE_URL+'/',secure:true,sameSite:'Lax'});}
async function settle(page){await page.waitForSelector('body[data-brand-conformity-v341="true"]',{timeout:20000});await page.waitForNetworkIdle({idleTime:300,timeout:7000}).catch(()=>{});await new Promise(r=>setTimeout(r,500));}

async function inspectRendered(page,name,vp){
  return page.evaluate(({name,vp,forbidden})=>{
    const visible=el=>{if(!el)return false;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity)!==0;};
    const forbiddenMap=new Map(forbidden);
    const props=['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','fill','stroke','backgroundImage','boxShadow','textShadow'];
    const leaks=[];
    const inspectStyle=(el,cs,pseudo='')=>{
      for(const prop of props){const value=String(cs[prop]||'');for(const [rgb,label] of forbiddenMap){if(value.includes(rgb)){leaks.push({tag:el.tagName.toLowerCase(),id:el.id||'',cls:String(el.className||'').slice(0,120),pseudo,prop,value,label});if(leaks.length>=30)return;}}}
    };
    for(const el of document.querySelectorAll('body *')){
      if(!visible(el))continue;
      inspectStyle(el,getComputedStyle(el));if(leaks.length>=30)break;
      for(const pseudo of ['::before','::after']){const ps=getComputedStyle(el,pseudo);if(ps&&ps.content&&ps.content!=='none'&&ps.content!=='normal')inspectStyle(el,ps,pseudo);if(leaks.length>=30)break;}
    }
    const docWidth=Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0),clientWidth=document.documentElement.clientWidth;
    const bodyText=(document.body.innerText||'').replace(/\s+/g,' ').trim();
    return {name,vp,marker:document.body.dataset.brandConformityV341||'',v34:document.body.dataset.brandConformityV34||'',v325:document.body.dataset.brandFidelityV325||'',docWidth,clientWidth,overflow:docWidth>clientWidth+2,textLength:bodyText.length,oldAssistant:/\bShopping Assistant\b|Evidence-backed product matching/i.test(bodyText),leaks};
  },{name,vp,forbidden:[...forbiddenColours.entries()]});
}

async function auditEveryRenderedRoute(locs){
  if(!CHROME)throw new Error('CHROME executable is required');
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  let cursor=0;
  try{
    const workers=Array.from({length:Math.min(CONCURRENCY,locs.length)},async()=>{
      const page=await browser.newPage();
      await page.setViewport({width:1280,height:800,deviceScaleFactor:1});await page.setCacheEnabled(false);await setPrivacyCookie(page);
      try{
        while(cursor<locs.length){
          const i=cursor++,url=localise(locs[i]),path=new URL(url).pathname,errors=[];
          const onError=e=>errors.push(e.message);page.on('pageerror',onError);
          try{
            const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
            await page.waitForSelector('body[data-brand-conformity-v341="true"]',{timeout:15000});await new Promise(r=>setTimeout(r,180));
            const state=await inspectRendered(page,path,'all-routes-desktop');const status=response?.status()||0;
            fullRenderedReport[i]={path,status,...state,pageErrors:errors};
            if(status<200||status>=400)fail(`full-render ${path}: HTTP ${status}`);
            if(state.marker!=='true'||state.v34!=='true'||state.v325!=='true')fail(`full-render ${path}: presentation marker missing`);
            if(state.overflow)fail(`full-render ${path}: document overflow ${state.docWidth}>${state.clientWidth}`);
            if(state.oldAssistant)fail(`full-render ${path}: superseded assistant wording visible`);
            if(state.leaks.length)fail(`full-render ${path}: legacy computed colour leak ${JSON.stringify(state.leaks.slice(0,6))}`);
            if(errors.length)fail(`full-render ${path}: page errors ${errors.join(' | ')}`);
          }catch(err){fullRenderedReport[i]={path,status:0,error:err.message,pageErrors:errors};fail(`full-render ${path}: ${err.message}`);}finally{page.off('pageerror',onError);}
        }
      }finally{await page.close().catch(()=>{});}
    });
    await Promise.all(workers);
  }finally{await browser.close();}
}

async function renderTemplates(locs){
  if(!CHROME)throw new Error('CHROME executable is required');
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
  const templates=selectTemplatePaths(locs);
  try{
    for(const [vp,width,height] of VIEWPORTS){
      for(const [name,path] of templates){
        const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
        try{
          await page.setViewport({width,height,deviceScaleFactor:1});await page.setCacheEnabled(false);await setPrivacyCookie(page);
          const response=await page.goto(BASE_URL+path,{waitUntil:'domcontentloaded',timeout:35000});await settle(page);
          const state=await inspectRendered(page,name,vp);const status=response?.status()||0;
          await page.screenshot({path:`${OUT}/${vp}-${name}.png`,fullPage:name==='home'||name==='privacy'});
          visualReport.push({...state,status,path});
          if(status<200||status>=400)fail(`${vp}/${name}: HTTP ${status}`);
          if(state.marker!=='true'||state.v34!=='true'||state.v325!=='true')fail(`${vp}/${name}: v34.1/v34/v32.5 marker missing`);
          if(state.overflow)fail(`${vp}/${name}: document overflow ${state.docWidth}>${state.clientWidth}`);
          if(state.textLength<80)fail(`${vp}/${name}: unexpectedly little visible text`);
          if(state.oldAssistant)fail(`${vp}/${name}: superseded assistant wording visible`);
          if(state.leaks.length)fail(`${vp}/${name}: legacy computed colour leak ${JSON.stringify(state.leaks.slice(0,6))}`);
          if(errors.length)fail(`${vp}/${name}: page errors ${errors.join(' | ')}`);
        }catch(err){fail(`${vp}/${name}: ${err.message}`);await page.screenshot({path:`${OUT}/${vp}-${name}-failure.png`,fullPage:false}).catch(()=>{});}finally{await page.close().catch(()=>{});}
      }

      const scout=await browser.newPage(),errors=[];scout.on('pageerror',e=>errors.push(e.message));
      try{
        await scout.setViewport({width,height,deviceScaleFactor:1});await scout.setCacheEnabled(false);await setPrivacyCookie(scout);
        const response=await scout.goto(BASE_URL+'/',{waitUntil:'domcontentloaded',timeout:35000});await settle(scout);
        const clicked=await scout.evaluate(()=>{const el=[...document.querySelectorAll('[data-v26-scout-open],#apgAssistantLauncher')].find(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});if(!el)return false;el.click();return true;});
        await new Promise(r=>setTimeout(r,1000));
        const state=await scout.evaluate(()=>({
          open:!document.getElementById('apgAssistantPanel')?.hidden,
          panelCharacter:!!document.querySelector('.apg-assistant-avatar [data-apg-scout-character="v34.1"]'),
          botCharacter:!!document.querySelector('.scout-mini [data-apg-scout-character="v34.1"]'),
          launcherCharacter:!!document.querySelector('.apg-assistant-launcher-icon [data-apg-scout-character="v34.1"]'),
          legacyMascot:!!document.querySelector('.apg-assistant-avatar #scoutHat,.scout-mini #scoutHat'),
          panelTitle:document.querySelector('.apg-assistant-brand strong')?.textContent.trim()||'',
          panelSub:document.querySelector('.apg-assistant-brand small')?.textContent.trim()||'',
          overflow:Math.max(document.documentElement.scrollWidth,document.body?.scrollWidth||0)>document.documentElement.clientWidth+2
        }));
        await scout.screenshot({path:`${OUT}/${vp}-scout-character-open.png`,fullPage:false});
        visualReport.push({name:'scout-character-open',vp,path:'/',status:response?.status()||0,...state});
        if(!clicked||!state.open||!state.panelCharacter||!state.botCharacter||!state.launcherCharacter||state.legacyMascot||state.panelTitle!=='Scout'||state.panelSub!=='Your APG decision guide'||state.overflow||errors.length)fail(`${vp}/scout-character: ${JSON.stringify(state)} ${errors.join(' | ')}`);
      }catch(err){fail(`${vp}/scout-character: ${err.message}`);}finally{await scout.close().catch(()=>{});}
    }

    const nav=await browser.newPage(),errors=[];nav.on('pageerror',e=>errors.push(e.message));
    try{
      await nav.setViewport({width:390,height:844,deviceScaleFactor:1});await nav.setCacheEnabled(false);await setPrivacyCookie(nav);
      await nav.goto(BASE_URL+'/',{waitUntil:'domcontentloaded',timeout:35000});await settle(nav);
      await nav.click('[data-mobile-toggle]');await new Promise(r=>setTimeout(r,350));
      const state=await nav.evaluate(()=>{
        const root=document.getElementById('mobileNav');const links=[...root.querySelectorAll('a[href="/decision-lab/"]')];
        const visible=links.filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});
        const approved=visible.length===1&&visible[0].classList.contains('apg-v325-decision-mobile');
        const scout=root.querySelector('.apg-v325-scout-mobile');
        const order=approved&&scout&&Boolean(visible[0].compareDocumentPosition(scout)&Node.DOCUMENT_POSITION_FOLLOWING);
        return {totalDecisionLinks:links.length,visibleDecisionLinks:visible.length,approved,scoutPresent:!!scout,order};
      });
      await nav.screenshot({path:`${OUT}/mobile-navigation-contract.png`,fullPage:false});visualReport.push({name:'mobile-navigation-contract',vp:'mobile',path:'/',...state});
      if(state.totalDecisionLinks!==1||state.visibleDecisionLinks!==1||!state.approved||!state.scoutPresent||!state.order||errors.length)fail(`mobile/navigation-contract: ${JSON.stringify(state)} ${errors.join(' | ')}`);
    }catch(err){fail(`mobile/navigation-contract: ${err.message}`);}finally{await nav.close().catch(()=>{});}
  }finally{await browser.close();}
}

async function run(){
  fs.mkdirSync(OUT,{recursive:true});
  const locs=await crawlCanonicalRoutes();
  console.log(`V341_CANONICAL_HTML_ROUTES_AUDITED=${locs.length}`);
  await auditEveryRenderedRoute(locs);
  console.log(`V341_CANONICAL_RENDERED_ROUTES_AUDITED=${fullRenderedReport.filter(Boolean).length}`);
  await renderTemplates(locs);
  fs.writeFileSync(`${OUT}/canonical-route-audit.json`,JSON.stringify(crawlReport,null,2));
  fs.writeFileSync(`${OUT}/canonical-rendered-style-audit.json`,JSON.stringify(fullRenderedReport,null,2));
  fs.writeFileSync(`${OUT}/visual-brand-audit.json`,JSON.stringify(visualReport,null,2));
  fs.writeFileSync(`${OUT}/failures.json`,JSON.stringify(failures,null,2));
  if(failures.length){console.error(`V341_BRAND_CONFORMITY_FAIL=${failures.length}`);process.exit(1);}
  console.log(`V341_BRAND_CONFORMITY_PASS routes=${locs.length} renderedRoutes=${fullRenderedReport.filter(Boolean).length} visualStates=${visualReport.length}`);
}
run().catch(err=>{console.error(err.stack||err);process.exit(1);});