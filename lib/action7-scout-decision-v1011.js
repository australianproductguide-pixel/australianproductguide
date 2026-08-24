'use strict';

const downstream=require('./action7-scout-decision-v101');
const core=require('./scout-concierge-v5-core');
const action4=require('../data/action4-decision-evidence-v96');
const platform=require('./platform-facts-v101');
const VERSION='101.1';
const previousBuild=downstream.action7BuildResponse;

function normaliseDecisionTurn(text,state){
  let out=String(text||'');
  const brands=(state&&state.hardConstraints&&state.hardConstraints.excludedBrands)||[];
  if(/^\s*nothing\s+([A-Za-z0-9 .&'-]+)[.!]?\s*$/i.test(out))out=out.replace(/^\s*nothing\s+/i,'no ').replace(/[.!]?\s*$/,' products');
  if(/(?:ignore|forget|remove|drop).*(?:\$\s*\d|\d+\s*(?:dollars|aud)|limit)/i.test(out)&&!/(budget|price)/i.test(out))out='ignore the budget';
  if(/^\s*([A-Za-z0-9 .&'-]+)\s+only[.!]?\s*$/i.test(out)){const m=out.match(/^\s*([A-Za-z0-9 .&'-]+)\s+only/i);if(m)out='only '+m[1].trim();}
  return out;
}
function strip(html){return String(html||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function authoritativeAffiliateSentence(){const text=strip(platform.content['affiliate-disclosure']&&platform.content['affiliate-disclosure'].body);const sentences=text.match(/[^.!?]+[.!?]+/g)||[];return (sentences.find(s=>/zero (?:points|recommendation)/i.test(s))||sentences.find(s=>/commercial relationship.*recommend/i.test(s))||'').trim();}
function buildResponse(input={}){
  const text=normaliseDecisionTurn(input.text,input.decisionState);
  const out=previousBuild({...input,text});
  out.meta={...(out.meta||{}),action7Version:VERSION};
  if(out.decisionState&&out.decisionState.category&&action4.categorySchemas[out.decisionState.category])out.meta.categoryDecisionSchemaVersion=action4.SCHEMA_VERSION;
  if(out.meta.platformFactSource==='/affiliate-disclosure/'&&!/zero/i.test(String(out.message||''))){const sentence=authoritativeAffiliateSentence();if(sentence)out.message=[out.message,sentence].filter(Boolean).join(' ');}
  return out;
}
core.buildResponse=buildResponse;
function handler(req,res){res.setHeader('X-APG-Action7-Scout-Decision','v'+VERSION);return downstream(req,res);}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,action7BuildResponse:buildResponse,normaliseDecisionTurn});
module.exports=handler;