'use strict';

// APG Search Platform Verification v80.
// Keeps Google Search Console's secondary HTML verification route byte-clean on the
// canonical host so presentation/social layers cannot decorate the verification body.
// Bing Webmaster ownership is deliberately not fabricated here: APG uses its canonical
// sitemap/robots/IndexNow surfaces until a genuine Bing ownership/import proof exists.
const downstream=require('./analytics-funnel-v79');

const SEARCH_PLATFORM_VERIFICATION_VERSION='80.0';
const PRIMARY_HOST='australianproductguide.au';
const GOOGLE_VERIFICATION_PATH='/google2e35d1ac089ebb56.html';
const GOOGLE_VERIFICATION_BODY='google-site-verification: google2e35d1ac089ebb56.html';

function requestHost(req){
  return String(req.headers['x-forwarded-host']||req.headers.host||'').toLowerCase().split(':')[0];
}

function sendGoogleVerification(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('X-APG-Search-Platform-Verification','v'+SEARCH_PLATFORM_VERIFICATION_VERSION);
  return res.end(req.method==='HEAD'?'':GOOGLE_VERIFICATION_BODY);
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://'+PRIMARY_HOST).pathname}catch{}
  if(path===GOOGLE_VERIFICATION_PATH&&requestHost(req)===PRIMARY_HOST){
    return sendGoogleVerification(req,res);
  }
  res.setHeader('X-APG-Search-Platform-Verification','v'+SEARCH_PLATFORM_VERIFICATION_VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  SEARCH_PLATFORM_VERIFICATION_VERSION,
  PRIMARY_HOST,
  GOOGLE_VERIFICATION_PATH,
  GOOGLE_VERIFICATION_BODY,
  requestHost,
  sendGoogleVerification
});
module.exports=handler;
