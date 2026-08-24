'use strict';

const downstream=require('./action7-scout-decision-v1011');
const core=require('./scout-concierge-v5-core');
const VERSION='101.2';
const previousBuild=downstream.action7BuildResponse;

function buildResponse(input={}){
  const state=input.decisionState&&typeof input.decisionState==='object'?input.decisionState:null;
  const trace=state&&state.lastTrace;
  const isWhy=/\bwhy (?:this|that|it|one)|why did you choose|why this one|what nearly won\b/i.test(String(input.text||''));
  const out=previousBuild(input);
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