'use strict';

// APG Hard-constraint Result Parity v1.
// Install only after the complete current runtime lineage. Action 4 may legitimately
// re-rank candidates after the earlier Consumer Intelligence payload is built; this guard
// therefore reapplies evidence-bound hard-constraint eligibility to the final ranked rows
// and derives candidate proof from that same corrected rank.
const engine=require('./decision-engine-v4');
const hard=require('./hard-constraint-verification-v1');

const VERSION='hard-constraint-result-parity-v1.1';
const ERANK={eligible:2,unverified:1,ineligible:0};
let installed=false;
let originalPublic=null;
let originalRank=null;

const norm=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const uniq=values=>[...new Set((values||[]).filter(Boolean))];
const escapeRegExp=value=>String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Compatibility grammar for natural hard exclusions. v4 already understands forms such
// as "without gaming" and "exclude gaming"; this final parity layer also recognises the
// common customer phrasing "must not have/include/support/contain X" and equivalent
// cannot/can't forms. Recognition remains separate from proof: candidates are still
// VERIFIED/UNVERIFIED/FAILED only from maintained evidence.
function naturalHardExcludedTags(q=''){
  const text=norm(q);if(!text)return[];
  const found=[];
  const prefixes='(?:must\\s+not(?:\\s+(?:have|include|support|contain))?|cannot(?:\\s+(?:have|include|support|contain))?|cant(?:\\s+(?:have|include|support|contain))?|without|exclude|excluding|no)';
  for(const [tag,rawAliases] of Object.entries(hard.TAG_ALIASES||{})){
    const terms=uniq([tag,String(tag).replace(/-/g,' '),...(rawAliases||[])]).map(norm).filter(Boolean).sort((a,b)=>b.length-a.length);
    if(terms.some(term=>new RegExp(`(?:^|\\s)${prefixes}\\s+${escapeRegExp(term)}(?:\\s|$)`).test(` ${text} `)))found.push(tag);
  }
  return uniq(found);
}
function mergeRecognisedQueryConstraints(intent={},q=''){
  const queryExcluded=naturalHardExcludedTags(q);
  if(!queryExcluded.length)return intent;
  const hardExcludedTags=uniq([...(intent.hardExcludedTags||[]),...queryExcluded]);
  const excludedTags=uniq([...(intent.excludedTags||[]),...queryExcluded]);
  const state=intent.decisionState&&typeof intent.decisionState==='object'?intent.decisionState:null;
  const decisionState=state?{
    ...state,
    hardConstraints:{...(state.hardConstraints||{}),excludedTags:uniq([...(state.hardConstraints&&state.hardConstraints.excludedTags||[]),...queryExcluded])}
  }:state;
  return {...intent,hardExcludedTags,excludedTags,decisionState};
}
function intentFor(q='',opts={},fallback=null){
  let intent;
  if(fallback&&typeof fallback==='object')intent=fallback;
  else if(opts&&opts.decisionState&&typeof opts.decisionState==='object')intent=engine.intentFromDecisionState(opts.decisionState,opts);
  else intent=engine.interpretQuery(q,opts);
  return mergeRecognisedQueryConstraints(intent||{},q);
}
function rankDecision(q='',opts={}){
  const base=originalRank(q,opts),intent=intentFor(q,opts,base&&base.intent),ranked=(base.ranked||[]).map(row=>hard.applyConstraintEvidence(row,intent));
  ranked.sort((a,b)=>(ERANK[b.eligibility]??-1)-(ERANK[a.eligibility]??-1)||(Number(b.score)||0)-(Number(a.score)||0)||String(a.p&&a.p.name||'').localeCompare(String(b.p&&b.p.name||'')));
  ranked.forEach((row,index)=>{row.matchLabel=row.eligibility==='ineligible'?'Constraint conflict':row.eligibility==='unverified'?'Needs verification':index===0?'Strong fit':index<3?'Good fit':'Alternative';});
  const counts={eligible:ranked.filter(row=>row.eligibility==='eligible').length,unverified:ranked.filter(row=>row.eligibility==='unverified').length,ineligible:ranked.filter(row=>row.eligibility==='ineligible').length};
  const recognised=hard.recognisedConstraints(intent),hardConstraintFallback=recognised.length>0&&counts.eligible===0;
  return {...base,intent,ranked,counts,hardConstraintFallback,hardConstraintResultParityVersion:VERSION};
}
function apply(payload,q='',opts={}){
  if(!payload||typeof payload!=='object'||!Array.isArray(payload.results))return payload;
  const ranked=rankDecision(q,opts),intent=ranked.intent,bySlug=new Map((ranked.ranked||[]).map(row=>[row&&row.p&&row.p.slug,row])),recognised=hard.recognisedConstraints(intent);
  const results=payload.results.map(result=>{
    if(!result||!result.slug)return result;
    const row=bySlug.get(result.slug);
    if(!row)return {...result,constraintVerification:Array.isArray(result.constraintVerification)?result.constraintVerification:[]};
    const proof=hard.constraintVerification(row,intent);
    return {...result,hardConstraintStatus:row.eligibility,match:row.matchLabel,constraintVerification:proof,hardFailures:row.hardFailures||result.hardFailures||[],conflicts:row.conflicts||result.conflicts||[],verificationNeeds:row.verificationNeeds||result.verificationNeeds||[]};
  });
  const topSummary=hard.summary(results[0]&&results[0].constraintVerification||[]);
  const audit={
    ...(payload.audit||{}),
    candidateCount:ranked.ranked.length,
    eligibleCount:ranked.counts.eligible,
    unverifiedCount:ranked.counts.unverified,
    ineligibleCount:ranked.counts.ineligible,
    hardConstraintFallback:ranked.hardConstraintFallback,
    hardConstraintsRecognised:recognised.length,
    topHardConstraintsVerified:topSummary.verified,
    topHardConstraintsUnverified:topSummary.unverified,
    topHardConstraintsFailed:topSummary.failed,
    constraintVerificationParity:true,
    constraintEligibilityParity:true
  };
  return {
    ...payload,
    hardConstraintVerificationVersion:hard.VERSION,
    hardConstraintResultParityVersion:VERSION,
    constraintVerification:{
      version:hard.VERSION,
      recognised,
      states:Object.values(hard.STATES),
      topResultSummary:topSummary,
      policy:'Recognition is not proof. Evidence-bound eligibility and candidate proof are both re-applied to the final ranked rows after all current re-ranking layers have run; natural hard-exclusion language is normalised before proof and missing positive evidence never proves absence.'
    },
    results,
    audit
  };
}
function publicDecision(q='',opts={}){return apply(originalPublic(q,opts),q,opts);}
function install(){
  if(installed)return engine;
  originalRank=engine.rankDecision;
  originalPublic=engine.publicDecision;
  engine.rankDecision=rankDecision;
  engine.publicDecision=publicDecision;
  engine.HARD_CONSTRAINT_RESULT_PARITY_VERSION=VERSION;
  engine.HARD_CONSTRAINT_VERIFICATION_VERSION=hard.VERSION;
  installed=true;
  return engine;
}

module.exports={VERSION,naturalHardExcludedTags,mergeRecognisedQueryConstraints,intentFor,rankDecision,apply,publicDecision,install,get installed(){return installed;}};
