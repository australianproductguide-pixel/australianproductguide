'use strict';

// APG Proof Rail Runtime v103.5 source / P0 transport containment, 1 Sep 2026.
//
// The governed Proof Rail presentation remains source-controlled in apg-proof-rail-v103 and its
// CSS/JS regression suite remains authoritative for the feature itself. During the current
// Production homepage FUNCTION_INVOCATION_FAILED incident, however, this runtime must not own or
// replace the Home response's res.end implementation. Home is the only route this wrapper ever
// intercepted, which makes it a clean serverless-isolation boundary while all other routes remain
// unchanged.
//
// Re-enable the Home transform only through a renderer-integrated or otherwise production-safe
// delivery path after exact-SHA browser certification. Recommendation, catalogue, retailer,
// analytics, account, SEO and buying-guide behaviour remain entirely downstream.
const downstream=require('./buying-guide-theme-alignment-v102');
const proofRail=require('./apg-proof-rail-v103');

const VERSION=proofRail.VERSION;
const RUNTIME_STATE='P0_DISABLED_RESPONSE_INTERCEPTION';
const ORIGIN='https://australianproductguide.au';

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path==='/'){
    res.setHeader('X-APG-Proof-Rail','v'+VERSION);
    res.setHeader('X-APG-Proof-Rail-Runtime',RUNTIME_STATE);
  }
  // P0 containment: deliberately preserve downstream/native response semantics on Home.
  // No res.write/res.end replacement is permitted in this layer while the incident is open.
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  APG_PROOF_RAIL_VERSION:VERSION,
  APG_PROOF_RAIL_RUNTIME_STATE:RUNTIME_STATE,
  APG_PROOF_RAIL_CSS:proofRail.CSS,
  APG_PROOF_RAIL_JS:proofRail.JS,
  ApgProofRail:proofRail.ApgProofRail,
  apgProofRailStats:proofRail.proofStats,
  transformApgProofRailHomepage:proofRail.transformHomepage
});

module.exports=handler;
