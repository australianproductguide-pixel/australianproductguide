'use strict';
const downstream=require('./catalogue-intelligence-v49-pass8-runtime');
const {categories}=require('../data');
const pass9=require('../data/catalogue-evidence-depth-v49-pass9');
const enrichmentPass9=pass9.apply({categoryMaps:[categories]});
const API_PATH='/api/intelligence/catalogue-v49';
function snapshot(){
  const base=downstream.snapshot();
  const entityCorrections=[...(base.researchBacklog?.entityCorrections||[]),...(enrichmentPass9.unresolvedEntityCorrections||[])];
  return{
    ...base,
    enrichment:{...base.enrichment,pass9:{version:enrichmentPass9.version,verifiedAt:enrichmentPass9.verifiedAt,newPrimaryResearch:enrichmentPass9.newPrimaryResearch,missing:enrichmentPass9.missing,unresolvedEntityCorrections:enrichmentPass9.unresolvedEntityCorrections}},
    researchBacklog:{...base.researchBacklog,needsEntityCorrection:entityCorrections.length,entityCorrections}
  };
}
function urlOf(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,body,head=false){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':JSON.stringify(body));}
function handler(req,res){const url=urlOf(req),head=req.method==='HEAD';if(url.pathname===API_PATH)return send(res,200,snapshot(),head);return downstream(req,res);}
Object.assign(handler,downstream,{snapshot,enrichmentPass9,downstream});
module.exports=handler;
