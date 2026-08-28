'use strict';

// Manual, explicitly gated IndexNow notifier for APG.
// This script is NOT part of Vercel build/deploy and makes no request unless
// APG_INDEXNOW_SUBMIT=CONFIRM is deliberately supplied by an authorised operator.
//
// Bing Webmaster Tools recommends streaming changed URLs rather than sending one
// large urlList batch. APG therefore sends each canonical URL as an individual
// IndexNow notification, sequentially and with conservative pacing.
const https=require('https');
const {indexableRoutes}=require('../lib/routes');
const {CANONICAL_ORIGIN}=require('../lib/discoverability-v1');
const {INDEXNOW_KEY}=require('../lib/indexnow-key-v1');

const args=process.argv.slice(2);
const all=args.includes('--all');
const supplied=args.filter(a=>a!=='--all');
const requestedDelay=Number(process.env.APG_INDEXNOW_DELAY_MS||300);
const STREAM_DELAY_MS=Number.isFinite(requestedDelay)?Math.max(250,Math.min(5000,requestedDelay)):300;
const MAX_ATTEMPTS=3;

function canonicalise(value){
  try{
    const u=new URL(value,CANONICAL_ORIGIN);
    if(u.origin!==CANONICAL_ORIGIN)throw new Error('non-APG origin');
    return CANONICAL_ORIGIN+u.pathname+(u.search||'');
  }catch(err){throw new Error(`Invalid APG URL for IndexNow: ${value}`);}
}

let urls;
if(all)urls=indexableRoutes.map(path=>CANONICAL_ORIGIN+path);
else urls=[...new Set(supplied.map(canonicalise))];
if(!urls.length){
  console.error('No URLs supplied. Use --all for an authorised catch-up submission, or pass one or more APG paths/URLs.');
  process.exit(2);
}
if(urls.length>10000){
  console.error(`IndexNow submission limit exceeded: ${urls.length} URLs.`);
  process.exit(2);
}

function buildEndpoint(url){
  const endpoint=new URL('https://api.indexnow.org/indexnow');
  endpoint.searchParams.set('url',url);
  endpoint.searchParams.set('key',INDEXNOW_KEY);
  return endpoint;
}

if(process.env.APG_INDEXNOW_SUBMIT!=='CONFIRM'){
  console.log('DRY RUN — no external request sent. Set APG_INDEXNOW_SUBMIT=CONFIRM only after explicit release/submission approval.');
  console.log(JSON.stringify({mode:'single-url-stream',count:urls.length,delayMs:STREAM_DELAY_MS,urls},null,2));
  process.exit(0);
}

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function requestOne(url){
  const endpoint=buildEndpoint(url);
  return new Promise((resolve,reject)=>{
    const req=https.get(endpoint,{headers:{'User-Agent':'AustralianProductGuide-IndexNow/2.0'}},res=>{
      let response='';
      res.on('data',chunk=>response+=chunk);
      res.on('end',()=>resolve({statusCode:res.statusCode,response}));
    });
    req.setTimeout(15000,()=>req.destroy(new Error('request timeout')));
    req.on('error',reject);
  });
}

async function submitOne(url){
  for(let attempt=1;attempt<=MAX_ATTEMPTS;attempt++){
    try{
      const result=await requestOne(url);
      if([200,202].includes(result.statusCode))return result;
      if([400,403,422].includes(result.statusCode)){
        throw new Error(`non-retryable IndexNow response ${result.statusCode}: ${result.response||'(empty body)'}`);
      }
      if(result.statusCode===429 || result.statusCode>=500){
        if(attempt<MAX_ATTEMPTS){
          await sleep(attempt*2000);
          continue;
        }
      }
      throw new Error(`IndexNow response ${result.statusCode}: ${result.response||'(empty body)'}`);
    }catch(err){
      if(attempt>=MAX_ATTEMPTS || /non-retryable/.test(err.message))throw err;
      await sleep(attempt*2000);
    }
  }
  throw new Error('IndexNow submission exhausted retry attempts');
}

(async()=>{
  console.log(`IndexNow streaming start: ${urls.length} URL(s), delay=${STREAM_DELAY_MS}ms`);
  for(let i=0;i<urls.length;i++){
    const url=urls[i];
    try{
      const result=await submitOne(url);
      console.log(`IndexNow ${i+1}/${urls.length} ${result.statusCode} ${url}`);
    }catch(err){
      console.error(`IndexNow failed for ${url}: ${err.message}`);
      process.exitCode=1;
      return;
    }
    if(i<urls.length-1)await sleep(STREAM_DELAY_MS);
  }
  console.log(`IndexNow streaming complete: ${urls.length} URL(s) submitted individually.`);
})().catch(err=>{console.error(`IndexNow stream failed: ${err.message}`);process.exitCode=1;});
