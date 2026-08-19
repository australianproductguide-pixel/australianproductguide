'use strict';

// Manual, explicitly gated IndexNow notifier for APG.
// This script is NOT part of Vercel build/deploy and makes no request unless
// APG_INDEXNOW_SUBMIT=CONFIRM is deliberately supplied by an authorised operator.
const https=require('https');
const {indexableRoutes}=require('../lib/routes');
const {CANONICAL_ORIGIN}=require('../lib/discoverability-v1');
const {INDEXNOW_KEY,INDEXNOW_KEY_PATH}=require('../lib/indexnow-key-v1');

const args=process.argv.slice(2);
const all=args.includes('--all');
const supplied=args.filter(a=>a!=='--all');

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
  console.error('No URLs supplied. Use --all for an authorised initial submission, or pass one or more APG paths/URLs.');
  process.exit(2);
}
if(urls.length>10000){
  console.error(`IndexNow batch limit exceeded: ${urls.length} URLs.`);
  process.exit(2);
}

const payload={
  host:new URL(CANONICAL_ORIGIN).hostname,
  key:INDEXNOW_KEY,
  keyLocation:CANONICAL_ORIGIN+INDEXNOW_KEY_PATH,
  urlList:urls
};

if(process.env.APG_INDEXNOW_SUBMIT!=='CONFIRM'){
  console.log('DRY RUN — no external request sent. Set APG_INDEXNOW_SUBMIT=CONFIRM only after explicit release/submission approval.');
  console.log(JSON.stringify(payload,null,2));
  process.exit(0);
}

const body=JSON.stringify(payload);
const req=https.request('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body)}},res=>{
  let response='';
  res.on('data',chunk=>response+=chunk);
  res.on('end',()=>{
    console.log(`IndexNow response ${res.statusCode}: ${response||'(empty body)'}`);
    if(![200,202].includes(res.statusCode))process.exitCode=1;
  });
});
req.on('error',err=>{console.error(`IndexNow request failed: ${err.message}`);process.exitCode=1;});
req.write(body);
req.end();
