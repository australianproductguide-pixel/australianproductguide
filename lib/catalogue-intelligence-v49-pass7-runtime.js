'use strict';
require('../data/catalogue-evidence-depth-v49-pass6-canonical').install();
const downstream=require('./catalogue-intelligence-v49-final');
const {categories}=require('../data');
const pass7=require('../data/catalogue-evidence-depth-v49-pass7');
const enrichmentPass7=pass7.apply({categoryMaps:[categories]});
const API_PATH='/api/intelligence/catalogue-v49';
function snapshot(){const base=downstream.snapshot();return{...base,enrichment:{...base.enrichment,pass7:{version:enrichmentPass7.version,verifiedAt:enrichmentPass7.verifiedAt,newPrimaryResearch:enrichmentPass7.newPrimaryResearch,missing:enrichmentPass7.missing}}};}
function urlOf(req){try{return new URL(req?.url||'/','https://australianproductguide.au');}catch{return new URL('https://australianproductguide.au/');}}
function send(res,status,body,head=false){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(head?'':JSON.stringify(body));}
function handler(req,res){const url=urlOf(req),head=req.method==='HEAD';if(url.pathname===API_PATH)return send(res,200,snapshot(),head);return downstream(req,res);}
Object.assign(handler,downstream,{snapshot,enrichmentPass7,downstream});
module.exports=handler;
