'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const app=require('../api/index');
const diagnostic=require('../api/p0-home-stage');
const apiSource=fs.readFileSync(path.join(root,'api','index.js'),'utf8');
const diagnosticSource=fs.readFileSync(path.join(root,'api','p0-home-stage.js'),'utf8');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));

const EXPECTED_STAGES=['runtime','transport','premium','journey','stable','mobile','whole','audit','presentation','final'];
assert.equal(typeof app,'function','public APG export must remain a function');
assert(apiSource.includes('module.exports=finalHandler;'),'governed public export must remain finalHandler');
assert.deepEqual(Array.from(app.APG_P0_HOME_STAGE_NAMES||[]),EXPECTED_STAGES,'diagnostic stage names must remain explicit and ordered');
assert.deepEqual(Object.keys(app.APG_P0_HOME_STAGE_HANDLERS||{}),EXPECTED_STAGES,'diagnostic stage registry must expose only assembled handler boundaries');
for(const stage of EXPECTED_STAGES)assert.equal(typeof app.APG_P0_HOME_STAGE_HANDLERS[stage],'function',`${stage}: diagnostic stage must be a function`);
assert.equal(app.APG_P0_HOME_STAGE_HANDLERS.final,app,'final diagnostic stage must be the governed public export');

assert.equal(diagnostic.VERSION,'1.0');
assert.equal(diagnostic.PATH,'/__apg-p0-home-stage-20260901');
assert.equal(diagnostic.NATIVE_HOME_URL,'/?__apg_home_diag=1');
assert(diagnosticSource.includes("req.url=`${NATIVE_HOME_URL}&__apg_home_stage=${encodeURIComponent(stage)}`"),'diagnostic must enter native Home while retaining the P0 bypass marker');
assert(diagnosticSource.includes("res.setHeader('Cache-Control','no-store, max-age=0')"),'diagnostic must be no-store');
assert(diagnosticSource.includes("res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive')"),'diagnostic must be noindex');
assert(diagnosticSource.includes("throw error"),'diagnostic must preserve failure semantics');
assert(!diagnosticSource.includes('ebay-browse-api'),'diagnostic must not import eBay Browse');
assert(!diagnosticSource.includes('EBAY_BROWSE'),'diagnostic must not touch eBay Browse configuration');
assert(!diagnosticSource.includes('fetch('),'diagnostic must not create outbound network traffic');
assert(!diagnosticSource.includes('recommendationWeight'),'diagnostic must not alter recommendation scoring');

const stageRoute=(config.routes||[]).find(route=>route&&route.src===diagnostic.PATH);
assert(stageRoute&&stageRoute.dest==='/api/p0-home-stage','hidden diagnostic path must route only to the isolated diagnostic function');
const homeRoute=(config.routes||[])[0]||{};
assert.equal(homeRoute.src,'/');
assert.equal(homeRoute.status,307);
assert.equal(homeRoute.headers&&homeRoute.headers.Location,'/search/','public Home containment must remain in front of the native diagnostic');

function invokeUnknownStage(){
  return new Promise((resolve,reject)=>{
    const headers={};
    const req={url:`${diagnostic.PATH}?stage=not-a-stage`,method:'GET',headers:{host:'australianproductguide.au'}};
    const res={
      statusCode:200,
      setHeader(name,value){headers[String(name).toLowerCase()]=String(value);return this},
      end(body=''){resolve({statusCode:this.statusCode,headers,body:String(body||'')})}
    };
    try{
      const result=diagnostic(req,res);
      if(result&&typeof result.then==='function')result.catch(reject);
    }catch(error){reject(error)}
  });
}

(async()=>{
  const unknown=await invokeUnknownStage();
  assert.equal(unknown.statusCode,404,'unknown diagnostic stages must fail closed');
  assert.equal(unknown.body,'Not found','unknown diagnostic stages must not disclose the allowed stage list');
  assert.match(String(unknown.headers['x-robots-tag']||''),/noindex/);
  assert.match(String(unknown.headers['cache-control']||''),/no-store/);
  console.log(`P0_HOME_STAGE_DIAGNOSTIC_QA=PASS stages=${EXPECTED_STAGES.length} publicHome=edge-protected outboundNetwork=0 commercialWeight=unchanged`);
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});