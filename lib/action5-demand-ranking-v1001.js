'use strict';

// APG Action 5 demand-ranking correction v100.1.
// v100 correctly retrieved product-level GA4/GSC observations but its comparator read
// signal fields from the candidate root rather than candidate.signals, leaving ties in
// stable product-ID order. This outer layer fixes ordering without changing collection,
// retailer mappings, recommendation weights, privacy, or Amazon destinations.
const downstream=require('./action5-strategic-closure-v100');

const VERSION='100.1';
const ORIGIN='https://australianproductguide.au';
const DEMAND_ENDPOINT='/api/intelligence/action5-priority-demand';

function demandTuple(row){
  const d=row&&row.signals&&typeof row.signals==='object'?row.signals:(row||{});
  return [
    Number(d.affiliateClicks||0)>0?1:0,Number(d.affiliateClicks||0),
    Number(d.gscClicks||0)>0?1:0,Number(d.gscClicks||0),
    Number(d.gscImpressions||0),Number(d.productViews||0),
    Number(d.comparisonSignals||0)+Number(d.saveSignals||0)+Number(d.scoutSignals||0)+Number(d.decisionSignals||0),
    Number(d.observedEvents||0)
  ];
}
function compareDemandRows(a,b){
  const aa=demandTuple(a),bb=demandTuple(b);
  for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])return bb[i]-aa[i];
  return String(a?.productId||'').localeCompare(String(b?.productId||''));
}
function rankCandidates(candidates){
  return [...(candidates||[])].sort(compareDemandRows).map((row,index)=>({...row,demandRank:index+1}));
}
async function correctedDemandSnapshot(){
  const base=await downstream.demandPrioritySnapshot();
  const candidates=rankCandidates(base.candidates);
  const firstMeasured=candidates.find(x=>x.demandState==='MEASURED')||null;
  return {
    ...base,
    version:VERSION,
    method:'Lexicographic evidence ranking, not a fabricated composite score: observed affiliate/product commerce engagement first, then GSC clicks, GSC impressions, product views, other structured product interactions and total observed product events. Stable product ID is used only after every observed demand signal ties.',
    firstMeasured: firstMeasured?{productId:firstMeasured.productId,demandRank:firstMeasured.demandRank,signals:firstMeasured.signals}:null,
    candidates
  };
}

async function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname.replace(/\/$/,'')||'/';}catch{}
  if(path===DEMAND_ENDPOINT){
    if(!['GET','HEAD'].includes(req.method)){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end('Method Not Allowed');}
    try{
      const data=await correctedDemandSnapshot();
      res.statusCode=200;
      res.setHeader('Content-Type','application/json; charset=utf-8');
      res.setHeader('Cache-Control','no-store');
      res.setHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);
      return res.end(req.method==='HEAD'?'':JSON.stringify(data));
    }catch(error){
      res.statusCode=503;res.setHeader('Content-Type','application/json; charset=utf-8');
      return res.end(JSON.stringify({version:VERSION,status:'TEMPORARILY_UNAVAILABLE',error:error.message}));
    }
  }
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=function(name,value){if(String(name).toLowerCase()==='x-apg-action5-strategic-closure')return originalSetHeader(name,'v'+VERSION);return originalSetHeader(name,value);};
  originalSetHeader('X-APG-Action5-Strategic-Closure','v'+VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{ACTION5_DEMAND_RANKING_VERSION:VERSION,demandTuple,compareDemandRows,rankCandidates,correctedDemandSnapshot});
module.exports=handler;
