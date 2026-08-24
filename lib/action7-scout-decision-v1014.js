'use strict';

const downstream=require('./action7-scout-decision-v1013');
const core=require('./scout-concierge-v5-core');
const decision=require('./decision-engine-v4');
const action4=require('../data/action4-decision-evidence-v96');
const platform=require('./platform-facts-v101');
const fixtures=require('../data/action7-scout-evaluation-v101');
const VERSION='101.4';
const EVALUATION_VERSION='action7-eval-v1';
const DECISION_LAB_VERSION='50.6';
const previousBuild=downstream.action7BuildResponse;

function classifyTrace(trace){
  const criteria=(trace&&trace.criteria||[]).filter(c=>c&&c.kind==='decision');
  const notes=criteria.map(c=>String(c.note||'')).join(' ');
  const conflicts=[...(trace&&trace.conflicts||[])];
  if(conflicts.length||/\bconflict|sources differ|mixed evidence|disagree/i.test(notes))return 'CONFLICTING';
  if(/rule-derived|interpretation, not|derived from/i.test(notes))return 'INFERRED';
  const relevant=criteria.filter(c=>c.requested&&c.requested!=='low');
  const verified=relevant.filter(c=>c.evidenceStatus==='VERIFIED'&&c.explanationEligible!==false);
  const unknown=relevant.filter(c=>c.evidenceStatus!=='VERIFIED'||c.explanationEligible===false||c.productValue==='unknown');
  if(relevant.length&&verified.length===0&&unknown.length)return 'UNAVAILABLE';
  if(unknown.length)return 'WEAK_EVIDENCE';
  return 'KNOWN';
}
function classifyResponse(out){
  const trace=out&&out.decisionState&&out.decisionState.lastTrace;
  if(trace)return classifyTrace(trace);
  const existing=out&&out.meta&&out.meta.evidenceState;
  if(existing==='WEAK_OR_UNAVAILABLE')return 'WEAK_EVIDENCE';
  return existing||null;
}
function buildResponse(input={}){
  const out=previousBuild(input);
  out.meta={...(out.meta||{}),action7Version:VERSION};
  const evidenceState=classifyResponse(out);
  if(evidenceState)out.meta.evidenceState=evidenceState;
  const account=input.account&&typeof input.account==='object'?input.account:{authenticated:false};
  if(!account.authenticated&&/saved products|my saved|show me.*saved/i.test(String(input.text||''))){
    out.actions=Array.isArray(out.actions)?out.actions:[];
    if(!out.actions.some(a=>/my apg|sign in/i.test(String(a.label||''))))out.actions.unshift({label:'Sign in to My APG',url:'/my-apg/?account=login',kind:'link',primary:true});
  }
  return out;
}
core.buildResponse=buildResponse;

function certificationSnapshot(){return {
  version:VERSION,
  scoutVersion:core.VERSION,
  decisionEngineVersion:decision.ENGINE_VERSION||'decision-engine-v4',
  decisionLabVersion:DECISION_LAB_VERSION,
  categoryDecisionSchemaVersion:action4.SCHEMA_VERSION,
  evidenceDepthStandardVersion:action4.DEPTH_STANDARD_VERSION,
  platformFactsVersion:platform.VERSION,
  evaluationVersion:EVALUATION_VERSION,
  evaluationFixtureVersion:fixtures.VERSION,
  evaluationFixtureCount:fixtures.scenarios.length,
  evidenceStates:['KNOWN','INFERRED','WEAK_EVIDENCE','UNAVAILABLE','CONFLICTING'],
  retailerStates:['EXACT_VERIFIED','VARIANT_VERIFIED','SEARCH_FALLBACK','NO_SAFE_PATH_RECALL'],
  state:{sessionScoped:true,rawConversationPersisted:false,hardConstraints:true,softPreferences:true,brandExclusions:true,changedMindReconciliation:true,shortlistReferences:true,recommendationTrace:true},
  handoffs:{scoutToDecisionLab:true,decisionLabToScout:true,rawConversationTransferred:false},
  account:{serverAuthorised:true,canonicalProductIdentity:true,displayNameOptional:true},
  cost:{runtime:'deterministic shared Decision Engine',paidExternalModelDependency:false,newRecurringPaidCostAUD:0,catalogueReasoning:'bounded candidate retrieval; whole catalogue is not sent to an external model'},
  governance:{commercialRecommendationWeight:0,deskResearchOnly:true,unknownIsNotGuessed:true,liveSelfModification:false}
};}
function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=(name,value)=>{
    if(String(name||'').toLowerCase()==='x-apg-action7-scout-decision')return originalSetHeader(name,'v'+VERSION);
    return originalSetHeader(name,value);
  };
  res.setHeader('X-APG-Action7-Scout-Decision','v'+VERSION);
  if(path==='/api/intelligence/action7'){
    res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(certificationSnapshot()));
  }
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,ACTION7_EVALUATION_VERSION:EVALUATION_VERSION,action7BuildResponse:buildResponse,classifyTrace,classifyResponse,certificationSnapshot});
module.exports=handler;