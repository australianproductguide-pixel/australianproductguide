'use strict';
const downstream=require('./catalogue-intelligence-v49-pass7-runtime');
const {categories}=require('../data');
const pass8=require('../data/catalogue-evidence-depth-v49-pass8');
const enrichmentPass8=pass8.apply({categoryMaps:[categories]});
const API_PATH='/api/intelligence/catalogue-v49';
function snapshot(){
  const base=downstream.snapshot();
  const entityCorrections=[...(base.researchBacklog?.entityCorrections||[]),...(enrichmentPass8.unresolvedEntityCorrections||[])];
  return{
    ...base,
    enrichment:{...base.enrichment,pass8:{version:enrichmentPass8.version,verifiedAt:enrichmentPass8.verifiedAt,newPrimaryResearch:enrichmentPass8.newPrimaryResearch,missing:enrichmentPass8.missing,unresolvedEntityCorrections:enrichmentPass8.unresolvedEntityCorrections}},
    researchBacklog:{...base.researchBacklog,needsEntityCorrection:entityCorrections.length,entityCorrections}
  };
}
function urlOf(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,body,head=false){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':JSON.stringify(body));}
function handler(req,res){const url=urlOf(req),head=req.method==='HEAD';if(url.pathname===API_PATH)return send(res,200,snapshot(),head);return downstream(req,res);}
Object.assign(handler,downstream,{snapshot,enrichmentPass8,downstream});
module.exports=handler;
