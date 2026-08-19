'use strict';

// IndexNow verification-key surface for APG Discoverability v1.
// The key is intentionally public: IndexNow requires search engines to verify it on APG's host.
// This module does not submit URLs or make outbound requests.
const upstream=require('./discoverability-v1');
const INDEXNOW_KEY='apg-20260819-discoverability-v1';
const INDEXNOW_KEY_PATH=`/${INDEXNOW_KEY}.txt`;

function handler(req,res){
  let path='/';try{path=new URL(req.url,upstream.CANONICAL_ORIGIN).pathname}catch{}
  if(path===INDEXNOW_KEY_PATH){
    res.statusCode=200;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    res.setHeader('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('X-Robots-Tag','noindex');
    res.setHeader('X-APG-IndexNow-Key','v1');
    return res.end(req.method==='HEAD'?'':INDEXNOW_KEY);
  }
  return upstream(req,res);
}

Object.assign(handler,upstream,{INDEXNOW_KEY,INDEXNOW_KEY_PATH});
module.exports=handler;
