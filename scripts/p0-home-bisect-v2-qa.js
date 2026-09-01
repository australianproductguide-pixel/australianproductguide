'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bisect=require('../lib/p0-home-bisect-v2');

function response(){
  const headers=new Map();
  let body='';
  return {
    statusCode:200,
    setHeader(name,value){headers.set(String(name).toLowerCase(),String(value));return this},
    getHeader(name){return headers.get(String(name).toLowerCase())},
    removeHeader(name){headers.delete(String(name).toLowerCase())},
    end(chunk){if(chunk!==undefined&&chunk!==null)body+=Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk);return body},
    headers,
    get body(){return body}
  };
}

(async()=>{
  assert.equal(bisect.VERSION,'2.0');
  assert.equal(bisect.HOME_URL,'/?__apg_home_diag=1');
  assert.deepEqual(bisect.TARGETS,[
    'action5','search104','decision1036','proof103','buying102','action1016','related69',
    'branddeep70','brandvisual69','brandofficial69','brand68','brand67','brand66'
  ]);
  assert.equal(bisect.normaliseTarget('ACTION5'),'action5');
  assert.equal(bisect.normaliseTarget('not-a-target'),null);
  for(const target of bisect.TARGETS){
    assert.equal(typeof bisect.loadTarget(target),'function',`${target}: diagnostic checkpoint must resolve to a handler`);
  }
  assert.equal(bisect.loadTarget('unknown'),null);

  const deterministicReq={url:'/api/home-diagnostic?target=action5',method:'GET'};
  const deterministicRes=response();
  let observedUrl='';
  const fakeCheckpoint=(req,res)=>{
    observedUrl=req.url;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.statusCode=200;
    return res.end('<!doctype html><h1>Native Home</h1>');
  };
  bisect.invokeCheckpoint(deterministicReq,deterministicRes,'action5',fakeCheckpoint);
  assert.equal(observedUrl,bisect.HOME_URL,'checkpoint must receive the native Home URL with diagnostic bypass');
  assert.equal(deterministicRes.statusCode,200);
  assert.match(deterministicRes.body,/Native Home/);
  assert.equal(deterministicRes.getHeader('cache-control'),'no-store, max-age=0');
  assert.match(deterministicRes.getHeader('x-robots-tag'),/noindex/);
  assert.equal(deterministicRes.getHeader('x-apg-p0-home-bisect'),'v2.0');
  assert.equal(deterministicRes.getHeader('x-apg-p0-home-bisect-target'),'action5');

  const asyncReq={url:'/api/home-diagnostic?target=brand66',method:'GET'};
  const asyncRes=response();
  await bisect.invokeCheckpoint(asyncReq,asyncRes,'brand66',async(req,res)=>{
    await Promise.resolve();
    res.statusCode=200;
    return res.end('async-native-home');
  });
  assert.equal(asyncReq.url,bisect.HOME_URL);
  assert.equal(asyncRes.body,'async-native-home');

  const missingReq={url:'/api/home-diagnostic',method:'GET'};
  const missingRes=response();
  bisect.handler(missingReq,missingRes);
  assert.equal(missingRes.statusCode,400);
  assert.match(missingRes.getHeader('cache-control'),/no-store/);
  assert.match(missingRes.getHeader('x-robots-tag'),/noindex/);
  assert.match(missingRes.body,/unknown or missing target/);

  const postReq={url:'/api/home-diagnostic?target=action5',method:'POST'};
  const postRes=response();
  bisect.handler(postReq,postRes);
  assert.equal(postRes.statusCode,405);
  assert.equal(postRes.getHeader('allow'),'GET, HEAD');
  assert.match(postRes.getHeader('x-robots-tag'),/noindex/);

  const helperSource=fs.readFileSync(path.join(__dirname,'..','lib','p0-home-bisect-v2.js'),'utf8');
  const apiSource=fs.readFileSync(path.join(__dirname,'..','api','home-diagnostic.js'),'utf8');
  assert(!/\bfetch\s*\(/.test(helperSource),'bisect harness itself must perform no external discovery/network fetch');
  assert(!/recommendationWeight\s*=/.test(helperSource),'bisect harness must not alter recommendation scoring');
  assert(!/commercialWeight\s*=/.test(helperSource),'bisect harness must not alter commercial scoring');
  assert(!/EBAY_[A-Z0-9_]*TOKEN|CLIENT_SECRET|ACCESS_TOKEN/.test(helperSource),'bisect harness must not touch eBay credentials');
  assert(apiSource.includes("require('../lib/p0-home-bisect-v2')"),'diagnostic API must delegate to the governed bisect harness');
  assert(apiSource.includes('module.exports=bisect.handler'),'diagnostic API must expose only the governed handler');

  console.log(JSON.stringify({
    suite:'p0-home-bisect-v2',
    version:bisect.VERSION,
    status:'PASS',
    checkpoints:bisect.TARGETS.length,
    nativeHomeRewrite:true,
    noStore:true,
    noIndex:true,
    methodGuard:true,
    externalDiscoveryFromHarness:false,
    ebayCredentialsUntouched:true,
    recommendationLogic:'unchanged',
    commercialScoring:'unchanged',
    publicHomeExposure:'none-edge-containment-remains-authoritative'
  },null,2));
})().catch(error=>{console.error(error&&error.stack||error);process.exit(1)});
