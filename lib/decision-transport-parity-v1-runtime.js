'use strict';

// APG Decision Transport Parity v1.
// This is a narrow compatibility guard, not a second recommendation engine.
// Historical transport layers captured publicDecision during module load, which meant
// later evidence-bound parity installs could be correct inside Decision Engine v4 yet
// invisible to the real HTTP caller. Resolve the shared engine object at request time
// for the two public decision JSON transports and delegate every other request unchanged.
const decision=require('./decision-engine-v4');

const VERSION='decision-transport-parity-v1';
const DECISION_LAB_JSON_HEADER='x-apg-decision-json';
const DECISION_LAB_RESILIENCE='decision-lab-p0-2026-08-20-stable-shell-r4';
const HARD_CONSTRAINT_FALLBACK_HEADER='X-APG-Decision-Hard-Constraint-Fallback';
const HARD_CONSTRAINT_FALLBACK_VERSION='v103.6';

function parse(req){
  try{return new URL(req.url||'/','https://australianproductguide.au')}catch{return null}
}
function opts(url){
  return {
    category:url.searchParams.get('category')||'',
    budget:url.searchParams.get('budget')||'',
    brand:url.searchParams.get('brand')||''
  };
}
function provenance(res,{decisionLab=false}={}){
  // v103.6 remains part of the governed lineage even though this compatibility guard
  // answers the two decision JSON transports after the full lineage has been installed.
  res.setHeader(HARD_CONSTRAINT_FALLBACK_HEADER,HARD_CONSTRAINT_FALLBACK_VERSION);
  res.setHeader('X-APG-Decision-Transport-Parity',VERSION);
  if(decisionLab)res.setHeader('X-APG-Decision-Lab-Resilience',DECISION_LAB_RESILIENCE);
}
function send(req,res,payload,{decisionLab=false}={}){
  res.statusCode=200;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex');
  provenance(res,{decisionLab});
  return res.end(req.method==='HEAD'?'':JSON.stringify(payload));
}
function failure(req,res,error,{decisionLab=false}={}){
  console.error('decision_transport_parity_error',{name:error?.name||'Error',message:String(error?.message||error).slice(0,300),decisionLab});
  res.statusCode=500;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Robots-Tag','noindex');
  provenance(res,{decisionLab});
  return res.end(req.method==='HEAD'?'':JSON.stringify({error:'decision_unavailable',version:'decision-engine-v4'}));
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('decision transport parity requires downstream handler');
  function handler(req,res){
    const url=parse(req);
    if(!url)return downstream(req,res);
    const readOnly=req.method==='GET'||req.method==='HEAD';
    const apiDecision=url.pathname==='/api/decision'||url.pathname==='/api/decision/';
    const decisionLabJson=url.pathname==='/decision-lab/'&&String(req.headers?.[DECISION_LAB_JSON_HEADER]||'')==='1';
    if((apiDecision||decisionLabJson)&&readOnly){
      try{
        const payload=decision.publicDecision(url.searchParams.get('q')||'',opts(url));
        return send(req,res,payload,{decisionLab:decisionLabJson});
      }catch(error){
        return failure(req,res,error,{decisionLab:decisionLabJson});
      }
    }
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    DECISION_TRANSPORT_PARITY_VERSION:VERSION,
    DECISION_LAB_JSON_HEADER,
    DECISION_LAB_RESILIENCE,
    HARD_CONSTRAINT_FALLBACK_HEADER,
    HARD_CONSTRAINT_FALLBACK_VERSION
  });
  return handler;
}

module.exports={VERSION,DECISION_LAB_JSON_HEADER,DECISION_LAB_RESILIENCE,HARD_CONSTRAINT_FALLBACK_HEADER,HARD_CONSTRAINT_FALLBACK_VERSION,wrap};
