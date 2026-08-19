'use strict';
const downstream=require('./catalogue-intelligence-v49-pass9-runtime');
const {categories}=require('../data');
const pass10=require('../data/catalogue-evidence-depth-v49-pass10');
const enrichmentPass10=pass10.apply({categoryMaps:[categories]});
const API_PATH='/api/intelligence/catalogue-v49';
function snapshot(){
  const base=downstream.snapshot();
  const entityCorrections=[...(base.researchBacklog?.entityCorrections||[]),...(enrichmentPass10.unresolvedEntityCorrections||[])];
  return{
    ...base,
    enrichment:{...base.enrichment,pass10:{version:enrichmentPass10.version,verifiedAt:enrichmentPass10.verifiedAt,newPrimaryResearch:enrichmentPass10.newPrimaryResearch,missing:enrichmentPass10.missing,unresolvedEntityCorrections:enrichmentPass10.unresolvedEntityCorrections}},
    researchBacklog:{...base.researchBacklog,needsEntityCorrection:entityCorrections.length,entityCorrections}
  };
}
function urlOf(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,body,head=false){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':JSON.stringify(body));}
function handler(req,res){const url=urlOf(req),head=req.method==='HEAD';if(url.pathname===API_PATH)return send(res,200,snapshot(),head);return downstream(req,res);}
Object.assign(handler,downstream,{snapshot,enrichmentPass10,downstream});
module.exports=handler;
