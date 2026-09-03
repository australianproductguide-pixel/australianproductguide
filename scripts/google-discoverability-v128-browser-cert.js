'use strict';

const fs=require('node:fs');
const path=require('node:path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const CANONICAL_ORIGIN='https://australianproductguide.au';
const OUT=process.env.OUTPUT_DIR||'artifacts/google-discoverability-v128-browser';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});

const report={
  version:'128.2',
  base:BASE,
  commit:process.env.GITHUB_SHA||null,
  startedAt:new Date().toISOString(),
  preflight:[],
  routes:[],
  interactions:[],
  browserErrors:[],
  blockedExternalNavigations:[],
  evidence:[],
  failures:[]
};

const viewports=[
  {label:'desktop',width:1440,height:1000,isMobile:false,hasTouch:false},
  {label:'mobile',width:390,height:844,isMobile:true,hasTouch:true}
];
const routes=[
  {name:'home',path:'/',productLinks:1,search:true,scout:true,screenshot:true},
  {name:'search',path:'/search/?q=breville',productLinks:1,screenshot:true},
  {name:'category',path:'/categories/coffee-machines/',productLinks:3},
  {name:'product',path:'/products/breville-barista-express-impress-bes876/',productJsonLd:true,scout:true,screenshot:true},
  {name:'compare',path:'/compare/coffee-machines/',productLinks:2},
  {name:'decision-lab',path:'/decision-lab/?category=coffee-machines&budget=1500',decisionControls:true,screenshot:true},
  {name:'methodology',path:'/methodology/'},
  {name:'deals',path:'/deals/',shoppingCards:6}
];

function assert(ok,message){if(!ok)throw new Error(message)}
function safeName(value){return String(value).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()}
function sameOrigin(value){try{return new URL(value).origin===new URL(BASE).origin}catch{return false}}
function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function criticalResource(type){return ['document','script','stylesheet','fetch','xhr'].includes(type)}
async function textResponse(pathname,options={}){
  const response=await fetch(BASE+pathname,{signal:AbortSignal.timeout(20000),...options});
  return {response,text:await response.text()};
}
async function screenshot(page,name,fullPage=false){
  const filename=`${safeName(name)}.png`;
  await page.screenshot({path:path.join(OUT,filename),fullPage});
  report.evidence.push(filename);
}

async function preflight(){
  const files=[
    {path:'/robots.txt',contains:['Sitemap:','User-agent:']},
    {path:'/sitemap.xml',contains:['<?xml','sitemap']},
    {path:'/llms.txt',contains:['Australian Product Guide']}
  ];
  for(const item of files){
    const {response,text}=await textResponse(item.path);
    assert(response.status===200,`${item.path}: HTTP ${response.status}`);
    for(const token of item.contains)assert(text.includes(token),`${item.path}: missing ${token}`);
    report.preflight.push({name:item.path,status:response.status,bytes:Buffer.byteLength(text)});
  }

  for(const userAgent of ['OAI-SearchBot','PerplexityBot','Claude-SearchBot']){
    const {response,text}=await textResponse('/',{headers:{'user-agent':userAgent}});
    assert(response.status===200,`${userAgent}: HTTP ${response.status}`);
    assert(text.includes('<h1'),`${userAgent}: server-rendered H1 missing`);
    assert(text.includes('rel="canonical"'),`${userAgent}: canonical missing`);
    assert(text.includes('name="apg-google-discoverability-performance" content="v128.2"'),`${userAgent}: v128.2 marker missing`);
    report.preflight.push({name:`agent:${userAgent}`,status:response.status,serverRendered:true});
  }

  const redirects=[
    {
      legacy:'/products/philips-5000-series-handheld-steamer-sth5030-80/?source=%3Cscript%3E',
      target:'/products/philips-5000-series-handheld-steamer-sth5030-20/'
    },
    {
      legacy:'/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-80/?source=gsc',
      target:'/compare/garment-steamers/philips-3000-series-handheld-steamer-sth3000-20-vs-philips-5000-series-handheld-steamer-sth5030-20/'
    }
  ];
  for(const item of redirects){
    const legacy=await fetch(BASE+item.legacy,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    const body=await legacy.text();
    assert(legacy.status===308,`${item.legacy}: expected 308, got ${legacy.status}`);
    assert(legacy.headers.get('location')===item.target,`${item.legacy}: wrong Location ${legacy.headers.get('location')}`);
    assert(body==='Permanent redirect',`${item.legacy}: redirect body must remain static`);
    const target=await fetch(BASE+item.target,{redirect:'manual',signal:AbortSignal.timeout(20000)});
    assert(target.status===200,`${item.target}: target HTTP ${target.status}`);
    const targetHtml=await target.text();
    assert(targetHtml.includes(`rel="canonical" href="${CANONICAL_ORIGIN}${item.target}"`),`${item.target}: canonical target mismatch`);
    report.preflight.push({name:`redirect:${item.legacy.split('?')[0]}`,status:308,location:item.target,targetStatus:target.status});
  }

  const versioned=await fetch(BASE+'/assets/desktop-home-header-v126.css?v=126.2',{signal:AbortSignal.timeout(20000)});
  const unversioned=await fetch(BASE+'/assets/desktop-home-header-v126.css',{signal:AbortSignal.timeout(20000)});
  const empty=await fetch(BASE+'/assets/desktop-home-header-v126.css?v=',{signal:AbortSignal.timeout(20000)});
  assert(versioned.status===200&&unversioned.status===200&&empty.status===200,'asset cache probes must return 200');
  assert(/immutable/i.test(versioned.headers.get('cache-control')||''),'versioned repository asset must be immutable');
  assert(!/immutable/i.test(unversioned.headers.get('cache-control')||''),'unversioned repository asset must remain revalidated');
  assert(!/immutable/i.test(empty.headers.get('cache-control')||''),'empty version query must remain revalidated');
  report.preflight.push({
    name:'asset-cache-parity',
    versioned:versioned.headers.get('cache-control'),
    unversioned:unversioned.headers.get('cache-control'),
    emptyVersion:empty.headers.get('cache-control')
  });
}

async function protect(page,scope){
  await page.setRequestInterception(true);
  page.on('request',request=>{
    if(request.isNavigationRequest()&&request.frame()===page.mainFrame()&&!sameOrigin(request.url())){
      report.blockedExternalNavigations.push({scope,url:request.url()});
      return request.abort('blockedbyclient');
    }
    return request.continue();
  });
  page.on('pageerror',error=>report.browserErrors.push({scope,type:'pageerror',message:String(error&&error.message||error)}));
  page.on('requestfailed',request=>{
    if(sameOrigin(request.url())&&criticalResource(request.resourceType())){
      report.browserErrors.push({scope,type:'requestfailed',resourceType:request.resourceType(),url:request.url(),message:request.failure()?.errorText||'failed'});
    }
  });
  page.on('console',message=>{
    if(message.type()!=='error')return;
    const text=message.text();
    if(/favicon|google-analytics|googletagmanager|ERR_BLOCKED_BY_CLIENT/i.test(text))return;
    report.browserErrors.push({scope,type:'console-error',message:text});
  });
}

async function acceptEssentialConsent(page){
  const selector='[data-apg-consent]:not([hidden]) [data-consent-essential]';
  const button=await page.$(selector);
  if(button){await button.click();await delay(150);}
}

async function inspectRoute(page,route,viewport,response){
  const state=await page.evaluate(()=>{
    const visible=element=>{
      if(!element)return false;
      const rect=element.getBoundingClientRect();
      const style=getComputedStyle(element);
      return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
    };
    const canonical=document.querySelector('link[rel="canonical"]')?.href||'';
    const ld=[...document.querySelectorAll('script[type="application/ld+json"]')].map(node=>node.textContent||'').join('\n');
    const productLinks=[...new Set([...document.querySelectorAll('a[href^="/products/"]')].map(link=>link.getAttribute('href')).filter(Boolean))];
    const searchInputs=[...document.querySelectorAll('input[type="search"],form[role="search"] input,.header-search input,[data-apg-mobile-search-v1226] input')];
    const decisionControls=[...document.querySelectorAll('main form input,main form select,main form textarea,main form button')].filter(visible);
    const shoppingCards=[...document.querySelectorAll('.apg-shopping-card')].filter(visible);
    const mediaFor=needle=>[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>(link.getAttribute('href')||'').includes(needle))?.getAttribute('media')||'';
    return {
      title:document.title,
      h1:[...document.querySelectorAll('h1')].map(node=>node.textContent.trim()).filter(Boolean),
      canonical,
      v128:document.querySelector('meta[name="apg-google-discoverability-performance"]')?.content||'',
      main:Boolean(document.querySelector('main#main,main')),
      mainId:document.querySelector('main')?.id||'',
      skipLink:Boolean(document.querySelector('a[href="#main"]')),
      productLinks,
      productJsonLd:/"@type"\s*:\s*"Product"/.test(ld),
      searchVisible:searchInputs.some(visible),
      decisionControlCount:decisionControls.length,
      shoppingCardCount:shoppingCards.length,
      scoutLauncherVisible:visible(document.querySelector('#apgAssistantLauncher')),
      scoutPanelPresent:Boolean(document.querySelector('#apgAssistantPanel')),
      scrollWidth:document.documentElement.scrollWidth,
      clientWidth:document.documentElement.clientWidth,
      desktopHomeMedia:mediaFor('desktop-home-header-v126.css'),
      desktopTrustMedia:mediaFor('desktop-about-trust-contrast-v127.css'),
      mobileWordmarkMedia:mediaFor('mobile-header-wordmark-v75.css'),
      mobileMenuMedia:mediaFor('mobile-menu-polish-v21.css')
    };
  });

  assert(response&&response.status()===200,`${viewport.label}/${route.name}: HTTP ${response&&response.status()}`);
  const headers=response.headers();
  assert(headers['x-apg-google-discoverability-performance']==='v128.2',`${viewport.label}/${route.name}: v128 response header missing`);
  assert(state.title,`${viewport.label}/${route.name}: title missing`);
  assert(state.h1.length===1,`${viewport.label}/${route.name}: expected one H1, found ${state.h1.length}`);
  assert(state.canonical.startsWith(CANONICAL_ORIGIN+'/'),`${viewport.label}/${route.name}: canonical mismatch ${state.canonical}`);
  assert(state.v128==='v128.2',`${viewport.label}/${route.name}: v128 meta missing`);
  assert(state.main,`${viewport.label}/${route.name}: main landmark missing`);
  assert(state.mainId==='main',`${viewport.label}/${route.name}: addressable main landmark missing`);
  assert(state.skipLink,`${viewport.label}/${route.name}: skip link missing`);
  assert(state.scoutLauncherVisible&&state.scoutPanelPresent,`${viewport.label}/${route.name}: Scout surface missing`);
  assert(state.scrollWidth<=state.clientWidth+2,`${viewport.label}/${route.name}: horizontal overflow ${state.scrollWidth}/${state.clientWidth}`);
  assert(state.desktopHomeMedia==='(min-width:981px)',`${viewport.label}/${route.name}: desktop Home media hint missing`);
  assert(state.desktopTrustMedia==='(min-width:921px)',`${viewport.label}/${route.name}: desktop trust media hint missing`);
  assert(state.mobileWordmarkMedia==='(max-width:920px)',`${viewport.label}/${route.name}: mobile wordmark media hint missing`);
  assert(state.mobileMenuMedia==='(max-width:920px)',`${viewport.label}/${route.name}: mobile menu media hint missing`);
  if(route.productLinks)assert(state.productLinks.length>=route.productLinks,`${viewport.label}/${route.name}: expected at least ${route.productLinks} product links, found ${state.productLinks.length}`);
  if(route.search)assert(state.searchVisible,`${viewport.label}/${route.name}: visible search surface missing`);
  if(route.productJsonLd)assert(state.productJsonLd,`${viewport.label}/${route.name}: Product JSON-LD missing`);
  if(route.decisionControls)assert(state.decisionControlCount>=3,`${viewport.label}/${route.name}: Decision Lab controls missing`);
  if(route.shoppingCards)assert(state.shoppingCardCount>=route.shoppingCards,`${viewport.label}/${route.name}: shopping cards missing`);
  return state;
}

async function certifyScout(page,route,viewport){
  const launcher=await page.$('#apgAssistantLauncher');
  assert(launcher,`${viewport.label}/${route.name}: Scout launcher missing`);
  const box=await launcher.boundingBox();
  assert(box&&box.width>=40&&box.height>=40,`${viewport.label}/${route.name}: Scout launcher below 40px target`);
  await launcher.click();
  await page.waitForFunction(()=>{
    const panel=document.querySelector('#apgAssistantPanel');
    if(!panel||panel.hidden)return false;
    const rect=panel.getBoundingClientRect(),style=getComputedStyle(panel);
    return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
  },{timeout:5000});
  const panelState=await page.$eval('#apgAssistantPanel',panel=>({hidden:panel.hidden,role:panel.getAttribute('role'),ariaLabel:panel.getAttribute('aria-label')||''}));
  assert(panelState.hidden===false,`${viewport.label}/${route.name}: Scout panel did not open`);
  report.interactions.push({name:`${viewport.label}/${route.name}:scout-open`,ok:true,panelState});
}

async function certifyRoute(browser,route,viewport){
  const scope=`${viewport.label}/${route.name}`;
  const page=await browser.newPage();
  await page.setViewport({width:viewport.width,height:viewport.height,isMobile:viewport.isMobile,hasTouch:viewport.hasTouch,deviceScaleFactor:1});
  await protect(page,scope);
  const started=Date.now();
  try{
    const response=await page.goto(BASE+route.path,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForSelector('main',{timeout:15000});
    await page.waitForSelector('h1',{timeout:15000});
    await acceptEssentialConsent(page);
    await delay(200);
    const state=await inspectRoute(page,route,viewport,response);
    if(route.scout)await certifyScout(page,route,viewport);
    if(route.screenshot)await screenshot(page,`${viewport.label}-${route.name}`,route.name==='home'||route.name==='product');
    report.routes.push({scope,path:route.path,ok:true,durationMs:Date.now()-started,state});
  }catch(error){
    report.failures.push({scope,path:route.path,error:String(error&&error.message||error)});
    report.routes.push({scope,path:route.path,ok:false,durationMs:Date.now()-started,error:String(error&&error.message||error)});
    try{await screenshot(page,`${scope}-failure`,true)}catch{}
  }finally{
    await page.close();
  }
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome missing: ${CHROME}`);
  await preflight();
  const browser=await puppeteer.launch({
    headless:true,
    executablePath:CHROME,
    args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-background-networking']
  });
  for(const viewport of viewports){
    for(const route of routes)await certifyRoute(browser,route,viewport);
  }
  await browser.close();

  const meaningfulErrors=report.browserErrors.filter(error=>!/(google-analytics|googletagmanager|favicon|ebayimg)/i.test(`${error.url||''} ${error.message||''}`));
  report.meaningfulBrowserErrors=meaningfulErrors;
  report.finishedAt=new Date().toISOString();
  report.summary={
    preflightPassed:report.preflight.length,
    routesPassed:report.routes.filter(route=>route.ok).length,
    routesTotal:report.routes.length,
    interactionsPassed:report.interactions.filter(item=>item.ok).length,
    screenshots:report.evidence.length,
    blockedExternalNavigations:report.blockedExternalNavigations.length,
    browserErrors:meaningfulErrors.length,
    agenticBrowsing:'3/3'
  };
  report.status=report.failures.length||meaningfulErrors.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(`APG_GOOGLE_DISCOVERABILITY_V128_BROWSER=${report.status}`);
  console.log(`ROUTES=${report.summary.routesPassed}/${report.summary.routesTotal}`);
  console.log(`AGENTIC=${report.summary.agenticBrowsing}`);
  console.log(`SCREENSHOTS=${report.evidence.join(',')}`);
  if(report.status!=='PASS')process.exit(1);
})().catch(error=>{
  report.failures.push({scope:'runner',error:String(error&&error.stack||error)});
  report.status='FAIL';
  report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.error(error&&error.stack||error);
  process.exit(1);
});
