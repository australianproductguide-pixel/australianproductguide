'use strict';

const downstream=require('./action7-scout-decision-v1012');
const core=require('./scout-concierge-v5-core');
const VERSION='101.3';
const previousBuild=downstream.action7BuildResponse;

function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
function buildResponse(input={}){
  const state=input.decisionState&&typeof input.decisionState==='object'?clone(input.decisionState):null;
  const isWhy=/\bwhy (?:this|that|it|one)|why did you choose|why this one|what nearly won\b/i.test(String(input.text||''));
  let trace=state&&state.lastTrace;
  if(isWhy&&state&&state.category&&!trace&&typeof downstream.recommendationFromState==='function'){
    const rebuilt=downstream.recommendationFromState(clone(state),core.validatePageContext(input.pageContext||{}));
    if(rebuilt&&rebuilt.decisionState&&rebuilt.decisionState.lastTrace){trace=rebuilt.decisionState.lastTrace;state.lastTrace=trace;state.shortlist=rebuilt.decisionState.shortlist||state.shortlist;state.evidenceGaps=rebuilt.decisionState.evidenceGaps||state.evidenceGaps;}
  }
  const out=previousBuild({...input,decisionState:state||input.decisionState});
  out.meta={...(out.meta||{}),action7Version:VERSION};
  if(isWhy&&trace&&trace.productSlug&&core.PRODUCT_BY_SLUG.has(trace.productSlug)){
    const p=core.PRODUCT_BY_SLUG.get(trace.productSlug);
    out.intent='product_question';
    out.message=`I chose ${p.brand} ${p.name} from the same Decision Engine trace that produced your shortlist — not from a separate Scout score.`;
    out.bullets=[];
    if((trace.activeRequirements||[]).length)out.bullets.push('What you told me: '+trace.activeRequirements.join('; ')+'.');
    for(const reason of (trace.reasons||[]).slice(0,3))out.bullets.push(reason);
    for(const gap of (trace.verificationNeeds||[]).slice(0,2))out.bullets.push('Evidence limitation: '+gap);
    if(trace.whatAlmostWon&&trace.whatAlmostWon.name)out.bullets.push(`What nearly won: ${trace.whatAlmostWon.brand} ${trace.whatAlmostWon.name}.`);
    out.products=[core.card(p)];out.references=[p.slug];out.decisionState=state;
  }
  return out;
}
core.buildResponse=buildResponse;
function handler(req,res){res.setHeader('X-APG-Action7-Scout-Decision','v'+VERSION);return downstream(req,res);}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,action7BuildResponse:buildResponse});
module.exports=handler;