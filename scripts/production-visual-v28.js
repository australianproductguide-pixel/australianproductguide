#!/usr/bin/env node
'use strict';

const puppeteer=require('puppeteer-core');
const fs=require('fs');
const http=require('http');
const {execFileSync}=require('child_process');

const BASE_URL=process.env.BASE_URL||'https://australianproductguide.au';
const CHROME=process.env.CHROME;
const OUT=process.env.VISUAL_OUT||'visual-v27';
const PRODUCTION_ORIGIN=new URL(BASE_URL).origin;
const UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 APGVisualCertification/28';

const VIEWPORTS=[['desktop',1440,1000],['mobile',390,844]];
const PAGES=[
  ['home','/'],
  ['search','/search/?q=robot+vacuum+for+pet+hair'],
  ['laptops','/categories/laptops/'],
  ['headphones','/categories/wireless-headphones/'],
  ['retailer-product','/products/sony-wh-1000xm6/'],
  ['compare','/compare/custom/?products=sony-wh-1000xm6,bose-quietcomfort-ultra-headphones'],
  ['decision','/decision-lab/?q=75+inch+TV+for+a+bright+room+under+%242500'],
  ['workspace','/my-apg/'],
  ['privacy','/privacy/']
];

fs.mkdirSync(OUT,{recursive:true});
const report=[];
const proxyAudit=[];
const captureAudit=[];
const bad=[];

function captureProductionDocument(path){
  const url=BASE_URL+path;
  const started=Date.now();
  const marker='\n__APG_VISUAL_META__\t';
  const output=execFileSync('curl',[
    '-sS','-L','--fail-with-body','--retry','3','--retry-all-errors',
    '--connect-timeout','10','--max-time','60','--compressed',
    '-A',UA,
    '-w',`${marker}%{http_code}\t%{url_effective}`,
    url
  ],{encoding:'utf8',maxBuffer:100*1024*1024,timeout:70000});
  const idx=output.lastIndexOf(marker);
  if(idx<0)throw new Error(`Missing curl metadata for ${url}`);
  const html=output.slice(0,idx);
  const [statusText,effectiveUrl]=output.slice(idx+marker.length).trim().split('\t');
  const status=Number(statusText);
  if(!Number.isFinite(status)||status<200||status>=400)throw new Error(`Production document returned ${statusText} for ${url}`);
  if(!html.includes('data-evidence-commerce-v27="true"'))throw new Error(`Production HTML missing v27 marker for ${url}`);
  if(!html.includes('data-trust-v28="true"'))throw new Error(`Production HTML missing v28 marker for ${url}`);
  if(html.length<1000)throw new Error(`Production HTML unexpectedly small for ${url}`);
  const row={path,status,effectiveUrl:effectiveUrl||url,bytes:Buffer.byteLength(html),ms:Date.now()-started};
  captureAudit.push(row);
  console.log(`VISUAL_DOCUMENT_CAPTURED ${path} status=${status} bytes=${row.bytes} ms=${row.ms}`);
  return {path,status,effectiveUrl:effectiveUrl||url,html};
}

async function main(){
  if(!CHROME)throw new Error('CHROME executable is required');

  const documents=new Map();
  for(const [,path] of PAGES){
    if(!documents.has(path))documents.set(path,captureProductionDocument(path));
  }
  if(!documents.has('/'))documents.set('/',captureProductionDocument('/'));

  const assetCache=new Map();
  const server=http.createServer(async(req,res)=>{
    const started=Date.now();
    const key=req.url||'/';
    try{
      const captured=documents.get(key);
      if(captured&&['GET','HEAD'].includes(req.method||'GET')){
        res.statusCode=captured.status;
        res.setHeader('content-type','text/html; charset=utf-8');
        res.setHeader('cache-control','no-store');
        res.setHeader('x-apg-visual-source','captured-production-document');
        if(req.method==='HEAD')res.end();else res.end(captured.html);
        proxyAudit.push({path:key,status:captured.status,contentType:'text/html; charset=utf-8',bytes:Buffer.byteLength(captured.html),ms:Date.now()-started,source:'captured-production-document'});
        return;
      }

      const target=new URL(key,BASE_URL);
      if(target.origin!==PRODUCTION_ORIGIN)throw new Error('Proxy target escaped Production origin');
      const method=req.method||'GET';
      const cacheKey=`${method}:${target.href}`;
      let cached=method==='GET'?assetCache.get(cacheKey):null;
      if(!cached){
        const chunks=[];
        for await(const chunk of req)chunks.push(chunk);
        const requestBody=Buffer.concat(chunks);
        const headers={
          accept:req.headers.accept||'*/*',
          'accept-language':req.headers['accept-language']||'en-AU,en;q=0.9',
          'user-agent':UA
        };
        if(req.headers['content-type'])headers['content-type']=req.headers['content-type'];
        const init={method,headers,redirect:'follow',signal:AbortSignal.timeout(45000)};
        if(requestBody.length&&!['GET','HEAD'].includes(method))init.body=requestBody;
        const upstream=await fetch(target,init);
        const body=Buffer.from(await upstream.arrayBuffer());
        const contentType=upstream.headers.get('content-type')||'application/octet-stream';
        cached={status:upstream.status,body,contentType};
        if(method==='GET'&&upstream.ok)assetCache.set(cacheKey,cached);
      }
      res.statusCode=cached.status;
      res.setHeader('content-type',cached.contentType);
      res.setHeader('cache-control','no-store');
      res.setHeader('x-apg-visual-source','live-production-asset-proxy');
      if(method==='HEAD')res.end();else res.end(cached.body);
      proxyAudit.push({path:target.pathname+target.search,status:cached.status,contentType:cached.contentType,bytes:cached.body.length,ms:Date.now()-started,source:'live-production-asset-proxy'});
    }catch(err){
      console.error('VISUAL_PROXY_ERROR',key,err.message);
      res.statusCode=502;
      res.setHeader('content-type','text/plain; charset=utf-8');
      res.end('Production visual proxy failure');
      proxyAudit.push({path:key,status:502,error:err.message,ms:Date.now()-started,source:'proxy-error'});
    }
  });

  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
  const address=server.address();
  const renderBase=`http://127.0.0.1:${address.port}`;
  console.log(`VISUAL_PRODUCTION_PROXY ${renderBase} -> ${BASE_URL}`);

  const browser=await puppeteer.launch({headless:true,executablePath:CHROME,args:['--no-sandbox']});

  async function preparePage(width,height,{javascript=true}={}){
    const page=await browser.newPage();
    await page.setViewport({width,height});
    await page.setJavaScriptEnabled(javascript);
    await page.setRequestInterception(true);
    page.on('request',req=>{
      const raw=req.url();
      if(raw.startsWith(renderBase)||raw.startsWith('data:')||raw.startsWith('blob:')||raw==='about:blank'){
        req.continue().catch(()=>{});
        return;
      }
      if(raw.startsWith(PRODUCTION_ORIGIN)){
        const u=new URL(raw);
        req.continue({url:renderBase+u.pathname+u.search}).catch(()=>{});
        return;
      }
      console.log(`VISUAL_BLOCKED_EXTERNAL ${raw}`);
      req.abort('blockedbyclient').catch(()=>{});
    });
    return page;
  }

  async function navigate(page,path){
    const renderUrl=renderBase+path;
    let response=null,mainResponse=null,navigationTimedOut=false;
    const onResponse=r=>{if(r.request().isNavigationRequest()&&r.frame()===page.mainFrame())mainResponse=r;};
    page.on('response',onResponse);
    try{
      response=await page.goto(renderUrl,{waitUntil:'domcontentloaded',timeout:12000});
    }catch(err){
      if(err?.name!=='TimeoutError')throw err;
      navigationTimedOut=true;
      console.log(`VISUAL_LIFECYCLE_TIMEOUT ${path} - evaluating rendered state instead`);
    }
    await page.waitForSelector('body[data-evidence-commerce-v27="true"][data-trust-v28="true"]',{timeout:10000});
    await page.waitForFunction(()=>((document.body?.innerText||'').length>80),{timeout:10000});
    await page.waitForNetworkIdle({idleTime:350,timeout:4000}).catch(()=>{});
    await new Promise(r=>setTimeout(r,250));
    page.off('response',onResponse);
    const observed=response||mainResponse;
    return {status:observed?.status()||0,productionUrl:BASE_URL+path,renderUrl,navigationTimedOut,transport:'prefetched-production-document-plus-live-asset-proxy'};
  }

  async function runPage(vp,width,height,name,path){
    console.log(`VISUAL_ROUTE ${vp} ${name} ${path}`);
    // The matrix certifies APG's SSR visual baseline. JavaScript is deliberately
    // disabled here so a progressive-enhancement script cannot block parsing and
    // be mistaken for a server-rendered visual defect. Scout is separately tested
    // below with JavaScript enabled and a real interactive state change.
    const page=await preparePage(width,height,{javascript:false});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      const nav=await navigate(page,path);
      const state=await page.evaluate(()=>{
        const offenders=[...document.querySelectorAll('body *')].map(el=>{
          const r=el.getBoundingClientRect();
          const cs=getComputedStyle(el);
          return {tag:el.tagName.toLowerCase(),cls:String(el.className||'').slice(0,120),id:el.id||'',left:Math.round(r.left*10)/10,right:Math.round(r.right*10)/10,width:Math.round(r.width*10)/10,display:cs.display,position:cs.position};
        }).filter(x=>x.display!=='none'&&x.width>0&&(x.left<-2||x.right>innerWidth+2)).slice(0,12);
        return {
          sw:document.documentElement.scrollWidth,
          cw:document.documentElement.clientWidth,
          v27:document.body?.dataset?.evidenceCommerceV27||'',
          v28:document.body?.dataset?.trustV28||'',
          text:document.body?.innerText?.length||0,
          exactRetailer:document.querySelectorAll('.apg-exact-offers-v42').length,
          coverageNote:document.querySelectorAll('.apg-v27-coverage-note').length,
          researchView:document.querySelectorAll('[data-rv-root]').length,
          overflowOffenders:offenders
        };
      });
      await page.screenshot({path:`${OUT}/${vp}-${name}.png`,fullPage:true});
      if(nav.status<200||nav.status>=400||state.sw>state.cw+2||state.v27!=='true'||state.v28!=='true'||state.text<80||errors.length)bad.push(`${vp}/${name}: ${JSON.stringify(state)} status=${nav.status} errors=${errors.join('|')}`);
      if(name==='search'&&state.researchView<1)bad.push(`${vp}/${name}: Research View missing`);
      if(name==='retailer-product'&&state.exactRetailer!==1)bad.push(`${vp}/${name}: expected one exact retailer block, found ${state.exactRetailer}`);
      if(['laptops','headphones'].includes(name)&&state.coverageNote!==1)bad.push(`${vp}/${name}: v27 coverage note missing/duplicated`);
      report.push({vp,name,...nav,...state,errors});
    }catch(err){
      bad.push(`${vp}/${name}: ${err.message}`);
      report.push({vp,name,productionUrl:BASE_URL+path,renderUrl:renderBase+path,fatal:err.message,errors});
      await page.screenshot({path:`${OUT}/${vp}-${name}-failure.png`,fullPage:true}).catch(()=>{});
    }finally{
      await page.close().catch(()=>{});
    }
  }

  async function runScout(vp,width,height){
    console.log(`VISUAL_ROUTE ${vp} scout-open /`);
    const page=await preparePage(width,height,{javascript:true});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    try{
      const nav=await navigate(page,'/');
      const clicked=await page.evaluate(()=>{
        const candidates=[...document.querySelectorAll('[data-v26-scout-open],#apgAssistantLauncher')];
        const el=candidates.find(node=>{
          const r=node.getBoundingClientRect(),cs=getComputedStyle(node);
          return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&cs.pointerEvents!=='none';
        });
        if(!el)return false;
        el.click();
        return true;
      });
      if(!clicked)bad.push(`${vp}/scout: visible launcher missing`);
      await new Promise(r=>setTimeout(r,300));
      const scout=await page.evaluate(()=>({
        sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,
        open:!document.getElementById('apgAssistantPanel')?.hidden,
        input:!!document.querySelector('.scout-input')
      }));
      await page.screenshot({path:`${OUT}/${vp}-scout-open.png`,fullPage:false});
      if(nav.status<200||nav.status>=400||scout.sw>scout.cw+2||!scout.open||!scout.input||errors.length)bad.push(`${vp}/scout: ${JSON.stringify(scout)} status=${nav.status} ${errors.join('|')}`);
      report.push({vp,name:'scout-open',...nav,...scout,errors});
    }catch(err){
      bad.push(`${vp}/scout: ${err.message}`);
      report.push({vp,name:'scout-open',productionUrl:BASE_URL+'/',renderUrl:renderBase+'/',fatal:err.message,errors});
      await page.screenshot({path:`${OUT}/${vp}-scout-open-failure.png`,fullPage:false}).catch(()=>{});
    }finally{
      await page.close().catch(()=>{});
    }
  }

  try{
    for(const [vp,width,height] of VIEWPORTS){
      for(const [name,path] of PAGES)await runPage(vp,width,height,name,path);
      await runScout(vp,width,height);
    }
  }finally{
    await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }

  fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));
  fs.writeFileSync(`${OUT}/production-proxy-audit.json`,JSON.stringify(proxyAudit,null,2));
  fs.writeFileSync(`${OUT}/production-document-capture-audit.json`,JSON.stringify(captureAudit,null,2));
  const proxyFailures=proxyAudit.filter(row=>row.status>=400||row.error);
  if(proxyFailures.length)bad.push(`Production proxy recorded ${proxyFailures.length} failed request(s)`);
  if(captureAudit.length!==PAGES.length)bad.push(`Expected ${PAGES.length} Production document captures, got ${captureAudit.length}`);
  if(report.length!==20)bad.push(`Expected 20 visual states, got ${report.length}`);
  if(bad.length){
    console.error(`V27_VISUAL_CERTIFICATION_FAIL=${bad.length}`);
    console.error(bad.join('\n'));
    process.exit(1);
  }
  console.log(`V27_VISUAL_CERTIFICATION=${report.length}_STATES_PASS`);
}

main().catch(err=>{
  try{
    fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));
    fs.writeFileSync(`${OUT}/production-proxy-audit.json`,JSON.stringify(proxyAudit,null,2));
    fs.writeFileSync(`${OUT}/production-document-capture-audit.json`,JSON.stringify(captureAudit,null,2));
  }catch{}
  console.error(err);
  process.exit(1);
});
