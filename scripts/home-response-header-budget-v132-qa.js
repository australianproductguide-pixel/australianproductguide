#!/usr/bin/env node
'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const budget=require('../lib/home-response-header-budget-v132-runtime');
const diagnostic=require('../api/home-assembly-diagnostic');
const app=require('../api/index');

const root=path.resolve(__dirname,'..');
const apiSource=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const budgetSource=fs.readFileSync(path.join(root,'lib','home-response-header-budget-v132-runtime.js'),'utf8');

function responseHarness(){
  const headers=new Map();
  const chunks=[];
  let resolveResult;
  let settled=false;
  const completed=new Promise(resolve=>{resolveResult=resolve;});
  const response={
    statusCode:200,
    headersSent:false,
    setHeader(name,value){
      if(this.headersSent)throw new Error(`setHeader after commit: ${name}`);
      headers.set(String(name).toLowerCase(),value);
      return this;
    },
    getHeader(name){return headers.get(String(name).toLowerCase());},
    getHeaderNames(){return Array.from(headers.keys());},
    getHeaders(){return Object.fromEntries(headers);},
    removeHeader(name){
      if(this.headersSent)throw new Error(`removeHeader after commit: ${name}`);
      headers.delete(String(name).toLowerCase());
      return this;
    },
    write(chunk='',encoding,callback){
      this.headersSent=true;
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      return true;
    },
    flushHeaders(){this.headersSent=true;},
    end(chunk='',encoding,callback){
      if(settled)return this;
      settled=true;
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(String(chunk),typeof encoding==='string'?encoding:'utf8'));
      if(typeof encoding==='function')encoding();
      else if(typeof callback==='function')callback();
      resolveResult({
        statusCode:this.statusCode,
        headers:new Map(headers),
        body:Buffer.concat(chunks).toString('utf8'),
        headersSent:this.headersSent
      });
      return this;
    }
  };
  return {response,completed};
}
async function invoke(handler,url='/',method='GET'){
  const harness=responseHarness();
  const result=handler({url,method},harness.response);
  if(result&&typeof result.then==='function')await result;
  return harness.completed;
}
function addHeaderLoad(res,count=120){
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'");
  res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Custom-Non-APG','must-survive');
  res.setHeader('X-APG-Google-Discoverability-Performance','v128.2');
  res.setHeader('X-APG-Delivery-Stability','v130.1');
  res.setHeader('X-APG-Final-Presentation-Stability','v131.0');
  res.setHeader('X-APG-Desktop-Home-Header','v126.2');
  res.setHeader('X-APG-Desktop-About-Trust-Contrast','v127.0');
  res.setHeader('X-APG-Home-CSS-Bundle','v128.2');
  res.setHeader('X-APG-Home-CSS-Manifest','8e16038f1b5056d5efd1');
  res.setHeader('X-APG-Platform-Facts','products=482; categories=90; brands=178');
  for(let index=0;index<count;index+=1){
    res.setHeader(`X-APG-Legacy-Layer-${String(index).padStart(3,'0')}`,`v${index}.0-${'diagnostic'.repeat(5)}`);
  }
}

async function main(){
  assert.equal(budget.VERSION,'132.0');
  assert.equal(budget.HEADER_NAME,'X-APG-Home-Header-Budget');
  assert.equal(budget.MAX_ESTIMATED_HEADER_BYTES,8192);
  assert(budget.PRESERVED_HOME_HEADERS.has('x-apg-google-discoverability-performance'));
  assert(budget.PRESERVED_HOME_HEADERS.has('x-apg-final-presentation-stability'));
  assert(!budget.PRESERVED_HOME_HEADERS.has('x-apg-legacy-layer-001'));
  for(const token of ['content-security-policy','strict-transport-security','cache-control','content-type']){
    assert(!budget.PRESERVED_HOME_HEADERS.has(token),'budget allowlist must apply only to X-APG diagnostics');
  }
  for(const prohibited of ['scoreProduct(','rankDecision(','commissionWeight','commercialRecommendationWeight:1']){
    assert(!budgetSource.includes(prohibited),`header budget must not contain ${prohibited}`);
  }

  const buffered=budget.wrap((req,res)=>{
    addHeaderLoad(res,120);
    res.end('<!doctype html><html><body><main id="main"><h1>APG</h1></main></body></html>');
  });
  const bufferedResult=await invoke(buffered,'/?cold=1');
  assert.equal(bufferedResult.statusCode,200);
  assert.equal(bufferedResult.headers.get('x-apg-home-header-budget'),'v132.0');
  assert(Number(bufferedResult.headers.get('x-apg-home-headers-removed'))>=120,'all superseded APG diagnostics must be removed');
  assert(Number(bufferedResult.headers.get('x-apg-home-header-bytes'))<=budget.MAX_ESTIMATED_HEADER_BYTES,'final Home headers must meet the maintained budget');
  assert.equal(bufferedResult.headers.get('x-apg-home-header-over-budget'),undefined);
  assert.equal(bufferedResult.headers.get('x-apg-legacy-layer-001'),undefined);
  assert.equal(bufferedResult.headers.get('x-apg-google-discoverability-performance'),'v128.2');
  assert.equal(bufferedResult.headers.get('x-apg-delivery-stability'),'v130.1');
  assert.equal(bufferedResult.headers.get('x-apg-final-presentation-stability'),'v131.0');
  assert.equal(bufferedResult.headers.get('x-apg-desktop-home-header'),'v126.2');
  assert.equal(bufferedResult.headers.get('x-apg-desktop-about-trust-contrast'),'v127.0');
  assert.equal(bufferedResult.headers.get('x-custom-non-apg'),'must-survive');
  assert.match(String(bufferedResult.headers.get('content-security-policy')||''),/default-src/);
  assert.match(String(bufferedResult.headers.get('strict-transport-security')||''),/max-age/);
  assert.equal(bufferedResult.body.includes('<h1>APG</h1>'),true,'Home body must remain unchanged');

  const streamed=budget.wrap((req,res)=>{
    addHeaderLoad(res,120);
    res.write('<!doctype html><html><body>');
    res.end('<main id="main"><h1>Streamed APG</h1></main></body></html>');
  });
  const streamedResult=await invoke(streamed,'/?stream=1');
  assert.equal(streamedResult.statusCode,200);
  assert.equal(streamedResult.headers.get('x-apg-home-header-budget'),'v132.0');
  assert(Number(streamedResult.headers.get('x-apg-home-headers-removed'))>=120,'streaming compaction must occur before first write');
  assert.equal(streamedResult.headers.get('x-apg-legacy-layer-119'),undefined);
  assert.equal(streamedResult.headers.get('x-custom-non-apg'),'must-survive');
  assert.equal(streamedResult.body.includes('Streamed APG'),true);

  const flushed=budget.wrap((req,res)=>{
    addHeaderLoad(res,120);
    res.flushHeaders();
    res.end('flushed');
  });
  const flushedResult=await invoke(flushed,'/?flush=1');
  assert.equal(flushedResult.headers.get('x-apg-home-header-budget'),'v132.0');
  assert(Number(flushedResult.headers.get('x-apg-home-headers-removed'))>=120,'explicit flush must trigger compaction first');

  const nonHome=budget.wrap((req,res)=>{
    addHeaderLoad(res,3);
    res.end('search');
  });
  const nonHomeResult=await invoke(nonHome,'/search/?q=coffee');
  assert.equal(nonHomeResult.headers.get('x-apg-home-header-budget'),undefined,'non-Home routes must remain untouched');
  assert.equal(nonHomeResult.headers.get('x-apg-legacy-layer-001'),'v1.0-diagnosticdiagnosticdiagnosticdiagnosticdiagnostic');
  assert.equal(nonHomeResult.body,'search');

  const diagnosticStages=app.APG_P0_HOME_ASSEMBLY_HANDLERS||{};
  assert.equal(diagnostic.VERSION,'3.1');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'desktopHome').name,'desktopHome');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'DESKTOPHOME').name,'desktopHome');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'desktoptrust').name,'desktopTrust');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'googleDelivery').name,'googleDelivery');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'HOMEBUDGET').name,'homeBudget');
  assert.equal(diagnostic.resolveStage(diagnosticStages,'not-a-stage'),null);

  for(const required of [
    "const homeResponseHeaderBudget=require('../lib/home-response-header-budget-v132-runtime')",
    'const homeResponseHeaderBudgetHandler=homeResponseHeaderBudget.wrap(googleDiscoverabilityPerformanceHandler)',
    'homeBudget:homeResponseHeaderBudgetHandler',
    'HOME_RESPONSE_HEADER_BUDGET_VERSION=homeResponseHeaderBudget.VERSION',
    'module.exports=homeResponseHeaderBudgetHandler'
  ])assert(apiSource.includes(required),`api outer delivery chain missing ${required}`);
  assert.equal(app.HOME_RESPONSE_HEADER_BUDGET_VERSION,'132.0');
  assert.equal(app.APG_P0_HOME_ASSEMBLY_HANDLERS.homeBudget,app,'homeBudget diagnostic stage must be the exact public export');

  console.log(JSON.stringify({
    status:'PASS',version:budget.VERSION,
    scope:'canonical-home-only',
    preserved:{standardHttp:true,security:true,content:true,cache:true,currentReleaseMarkers:true},
    removed:{supersededXapgDiagnostics:true,minimumRegressionCount:120},
    streaming:{writeBeforeCommit:true,flushBeforeCommit:true,endBeforeCommit:true},
    diagnostics:{caseInsensitive:true,stages:['desktopHome','desktopTrust','googleDelivery','homeBudget']},
    recommendationLogicTouched:false,
    commercialWeightTouched:false
  },null,2));
}

main().catch(error=>{console.error(error&&error.stack||error);process.exit(1);});
