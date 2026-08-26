'use strict';

const fs=require('fs');
const path=require('path');
const puppeteer=require('puppeteer-core');

const BASE=(process.env.BASE_URL||'https://australianproductguide.au').replace(/\/$/,'');
const OUT=process.env.OUTPUT_DIR||'artifacts/amazon-shopping-visual-v40';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
fs.mkdirSync(OUT,{recursive:true});

const report={
  version:'v51.1',
  base:BASE,
  startedAt:new Date().toISOString(),
  viewports:[],
  journeys:[],
  failures:[],
  browserErrors:[],
  blockedAmazonRequests:[],
  evidence:[]
};

function assert(ok,message){if(!ok)throw new Error(message);}
function sameOrigin(url){try{return new URL(url).origin===new URL(BASE).origin}catch{return false}}
function safeName(value){return String(value).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();}
async function wait(page,ms=250){await new Promise(r=>setTimeout(r,ms));}

function isAmazonNetworkHost(hostname){
  const host=String(hostname||'').toLowerCase();
  return host==='amazon.com.au'||host.endsWith('.amazon.com.au')||host==='amzn.to'||host.endsWith('.amazon-adsystem.com')||host.endsWith('.ssl-images-amazon.com')||host.endsWith('.media-amazon.com')||host.endsWith('.images-amazon.com');
}

async function installAmazonNetworkBlock(page,scope){
  await page.setRequestInterception(true);
  page.on('request',request=>{
    let blocked=false;
    try{blocked=isAmazonNetworkHost(new URL(request.url()).hostname);}catch{}
    if(blocked){
      report.blockedAmazonRequests.push({scope,type:request.resourceType(),url:request.url()});
      request.abort('blockedbyclient');
      return;
    }
    request.continue();
  });
}

async function dismissConsent(page){
  const root=await page.$('[data-apg-consent]:not([hidden])');
  if(!root)return;
  const button=await page.$('[data-consent-essential]');
  if(button){await button.click();await wait(page,120);}
}

async function goto(page,pathname){
  const res=await page.goto(BASE+pathname,{waitUntil:'domcontentloaded',timeout:45000});
  assert(res&&res.status()===200,`${pathname}: expected HTTP 200, got ${res&&res.status()}`);
  await page.waitForSelector('main',{timeout:12000});
  await wait(page,250);
  await dismissConsent(page);
}

async function screenshot(page,name,{fullPage=true}={}){
  const filename=`${safeName(name)}.png`;
  await page.screenshot({path:path.join(OUT,filename),fullPage});
  report.evidence.push(filename);
  return filename;
}

function attachDiagnostics(page,scope){
  page.on('pageerror',err=>report.browserErrors.push({scope,type:'pageerror',message:String(err&&err.message||err)}));
  page.on('console',msg=>{if(msg.type()==='error')report.browserErrors.push({scope,type:'console',message:msg.text()});});
  page.on('requestfailed',req=>{
    if(!sameOrigin(req.url()))return;
    const type=req.resourceType();
    if(!['document','script','fetch','xhr','stylesheet'].includes(type))return;
    report.browserErrors.push({scope,type:'requestfailed',resourceType:type,url:req.url(),message:req.failure()?.errorText||'failed'});
  });
}

async function pageGeometry(page,label){
  const geometry=await page.evaluate(()=>{
    const root=document.documentElement;
    const cards=[...document.querySelectorAll('.apg-shopping-card')].map((el,index)=>{
      const r=el.getBoundingClientRect();
      return {index,left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom};
    });
    const buttons=[...document.querySelectorAll('.apg-shopping-card a.button')].map((el,index)=>{
      const r=el.getBoundingClientRect();
      return {index,width:r.width,height:r.height,left:r.left,right:r.right};
    });
    return {
      viewport:{width:innerWidth,height:innerHeight},
      scrollWidth:root.scrollWidth,
      clientWidth:root.clientWidth,
      scrollHeight:root.scrollHeight,
      cardCount:cards.length,
      cards,
      buttons,
      h1:(document.querySelector('.apg-shopping-hero h1')||{}).innerText||'',
      dealsNavVisible:(()=>{const el=document.querySelector('.primary-nav a[href="/deals/"]');if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return /deals/i.test(el.textContent||'')&&s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})(),
      mobileToggleVisible:(()=>{const el=document.querySelector('[data-mobile-toggle]');if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;})()
    };
  });
  assert(geometry.cardCount===7,`${label}: expected 7 shopping cards, found ${geometry.cardCount}`);
  assert(geometry.scrollWidth<=geometry.clientWidth+2,`${label}: horizontal overflow ${geometry.scrollWidth}/${geometry.clientWidth}`);
  assert(/Explore shopping opportunities/i.test(geometry.h1),`${label}: Deals hero heading missing`);
  for(const card of geometry.cards){
    assert(card.left>=-1,`${label}: card ${card.index} clips left at ${card.left}`);
    assert(card.right<=geometry.viewport.width+1,`${label}: card ${card.index} clips right at ${card.right}/${geometry.viewport.width}`);
    assert(card.width>240,`${label}: card ${card.index} is unexpectedly narrow (${card.width}px)`);
  }
  for(const button of geometry.buttons){
    assert(button.height>=40,`${label}: Amazon CTA ${button.index} is below 40px high (${button.height}px)`);
    assert(button.left>=-1&&button.right<=geometry.viewport.width+1,`${label}: Amazon CTA ${button.index} clips viewport`);
  }
  return geometry;
}

async function certifyDeals(browser,label,viewport){
  const page=await browser.newPage();
  await page.setViewport(viewport);
  await installAmazonNetworkBlock(page,label);
  attachDiagnostics(page,label);
  const started=Date.now();
  try{
    await goto(page,'/deals/');
    const geometry=await pageGeometry(page,label);
    if(viewport.width>=1000){
      assert(geometry.dealsNavVisible,`${label}: desktop Deals navigation is not visible`);
    }else{
      assert(geometry.mobileToggleVisible,`${label}: mobile menu toggle is not visible`);
    }
    const firstLink=await page.$eval('.apg-shopping-card a.button',a=>({href:a.getAttribute('href'),rel:a.getAttribute('rel'),target:a.getAttribute('target'),destination:a.dataset.affiliateDestination}));
    assert(/amazon\.com\.au/.test(firstLink.href||''),`${label}: first outbound CTA is not Amazon Australia`);
    assert(/tag=auproductguid-22/.test(firstLink.href||''),`${label}: first outbound CTA lost Associates tag`);
    assert(/sponsored/.test(firstLink.rel||''),`${label}: first outbound CTA missing sponsored relationship`);
    assert(firstLink.target==='_blank',`${label}: first outbound CTA should open separately`);
    await screenshot(page,`${label}-deals-full`);
    report.viewports.push({label,viewport,geometry});
    report.journeys.push({name:`${label}-deals`,ok:true,durationMs:Date.now()-started});
  }catch(error){
    report.failures.push({name:`${label}-deals`,error:error.message});
    report.journeys.push({name:`${label}-deals`,ok:false,durationMs:Date.now()-started,error:error.message});
    try{await screenshot(page,`${label}-deals-failure`);}catch{}
  }finally{await page.close();}
}

async function certifyDesktopMega(browser){
  const label='desktop-mega';
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:1000});
  await installAmazonNetworkBlock(page,label);
  attachDiagnostics(page,label);
  const started=Date.now();
  try{
    await goto(page,'/deals/');
    const trigger=await page.$('[data-discovery-trigger]');
    assert(trigger,'desktop-mega: Products menu trigger missing');
    await trigger.click();
    await page.waitForSelector('[data-discovery-menu]:not([hidden])',{timeout:5000});
    const state=await page.evaluate(()=>{
      const menu=document.querySelector('[data-discovery-menu]');
      const link=menu&&menu.querySelector('[data-shopping-mega]');
      const r=menu&&menu.getBoundingClientRect();
      const lr=link&&link.getBoundingClientRect();
      return {menuVisible:!!menu&&!menu.hidden,width:r?.width||0,right:r?.right||0,viewport:innerWidth,shoppingLinkVisible:!!link&&lr.width>0&&lr.height>0,shoppingHref:link?.getAttribute('href')||''};
    });
    assert(state.menuVisible&&state.width>500,'desktop-mega: mega menu did not render at usable size');
    assert(state.right<=state.viewport+1,`desktop-mega: mega menu overflows viewport (${state.right}/${state.viewport})`);
    assert(state.shoppingLinkVisible&&state.shoppingHref==='/deals/','desktop-mega: Deals & shopping link is not visible');
    await screenshot(page,'desktop-mega-open',{fullPage:false});
    report.journeys.push({name:label,ok:true,durationMs:Date.now()-started,state});
  }catch(error){
    report.failures.push({name:label,error:error.message});
    report.journeys.push({name:label,ok:false,durationMs:Date.now()-started,error:error.message});
    try{await screenshot(page,'desktop-mega-failure',{fullPage:false});}catch{}
  }finally{await page.close();}
}

async function certifyMobileMenu(browser){
  const label='mobile-menu';
  const page=await browser.newPage();
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await installAmazonNetworkBlock(page,label);
  attachDiagnostics(page,label);
  const started=Date.now();
  try{
    await goto(page,'/deals/');
    const toggle=await page.$('[data-mobile-toggle]');
    assert(toggle,'mobile-menu: toggle missing');
    const toggleBox=await toggle.boundingBox();
    assert(toggleBox&&toggleBox.height>=40&&toggleBox.width>=40,`mobile-menu: toggle target too small ${JSON.stringify(toggleBox)}`);
    await toggle.click();
    await page.waitForSelector('#mobileNav:not([hidden])',{timeout:5000});
    const summary=await page.$('[data-mobile-shopping] summary');
    assert(summary,'mobile-menu: Deals & offers section missing');
    await summary.click();
    await wait(page,150);
    const state=await page.evaluate(()=>{
      const details=document.querySelector('[data-mobile-shopping]');
      const links=[...details.querySelectorAll('a')].map(a=>{const r=a.getBoundingClientRect();return {text:a.innerText.trim(),href:a.getAttribute('href'),w:r.width,h:r.height,left:r.left,right:r.right};});
      return {open:details.open,links,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth};
    });
    assert(state.open,'mobile-menu: Deals & offers accordion did not open');
    assert(state.links.length>=5,`mobile-menu: expected at least five shopping links, found ${state.links.length}`);
    for(const link of state.links){
      assert(link.h>=40,`mobile-menu: link target below 40px (${link.text}: ${link.h}px)`);
      assert(link.left>=-1&&link.right<=390+1,`mobile-menu: link clips viewport (${link.text})`);
    }
    assert(state.scrollWidth<=state.clientWidth+2,`mobile-menu: horizontal overflow ${state.scrollWidth}/${state.clientWidth}`);
    await screenshot(page,'mobile-menu-deals-open',{fullPage:false});
    report.journeys.push({name:label,ok:true,durationMs:Date.now()-started,state});
  }catch(error){
    report.failures.push({name:label,error:error.message});
    report.journeys.push({name:label,ok:false,durationMs:Date.now()-started,error:error.message});
    try{await screenshot(page,'mobile-menu-failure',{fullPage:false});}catch{}
  }finally{await page.close();}
}

(async()=>{
  assert(fs.existsSync(CHROME),`Chrome executable not found: ${CHROME}`);
  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage']});
  await certifyDeals(browser,'desktop',{width:1440,height:1000});
  await certifyDesktopMega(browser);
  await certifyDeals(browser,'tablet',{width:834,height:1112,isMobile:true,hasTouch:true});
  await certifyDeals(browser,'mobile',{width:390,height:844,isMobile:true,hasTouch:true});
  await certifyMobileMenu(browser);
  await browser.close();

  const meaningfulErrors=report.browserErrors.filter(e=>!/(google-analytics|googletagmanager|favicon)/i.test(`${e.url||''} ${e.message||''}`));
  report.browserErrorCount=meaningfulErrors.length;
  report.finishedAt=new Date().toISOString();
  report.status=report.failures.length||meaningfulErrors.length?'FAIL':'PASS';
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.log(`APG_AMAZON_SHOPPING_VISUAL_CERT=${report.status}`);
  console.log(`VIEWPORTS_CERTIFIED=${report.viewports.map(x=>x.label).join(',')}`);
  console.log(`AMAZON_NETWORK_REQUESTS_BLOCKED=${report.blockedAmazonRequests.length}`);
  console.log(`SCREENSHOT_EVIDENCE=${report.evidence.join(',')}`);
  console.log(JSON.stringify(report,null,2));
  if(report.status!=='PASS')process.exit(1);
})().catch(error=>{
  report.failures.push({name:'runner',error:error.message});
  report.status='FAIL';report.finishedAt=new Date().toISOString();
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
  console.error(error);
  process.exit(1);
});
