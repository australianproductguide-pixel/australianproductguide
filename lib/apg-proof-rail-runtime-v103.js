'use strict';

// APG Proof Rail Runtime v103.0
// Outermost presentation layer for the homepage only. All catalogue, recommendation,
// retailer, analytics, account, SEO and buying-guide behaviour remains downstream.
const downstream=require('./buying-guide-theme-alignment-v102');
const proofRail=require('./apg-proof-rail-v103');

const VERSION=proofRail.VERSION;
const ORIGIN='https://australianproductguide.au';

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path!=='/')return downstream(req,res);

  res.setHeader('X-APG-Proof-Rail','v'+VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=proofRail.transformHomepage(original,path);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  APG_PROOF_RAIL_VERSION:VERSION,
  APG_PROOF_RAIL_CSS:proofRail.CSS,
  APG_PROOF_RAIL_JS:proofRail.JS,
  ApgProofRail:proofRail.ApgProofRail,
  apgProofRailStats:proofRail.proofStats,
  transformApgProofRailHomepage:proofRail.transformHomepage
});

module.exports=handler;
