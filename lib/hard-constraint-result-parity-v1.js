'use strict';

// APG Hard-constraint Result Parity v1.
// Install only after the complete current runtime lineage. Action 4 may legitimately
// re-rank candidates after the earlier Consumer Intelligence payload is built; this guard
// therefore derives hard-constraint proof from the final ranked row for every returned
// candidate instead of trusting a stale top-five baseline object.
const engine=require('./decision-engine-v4');
const hard=require('./hard-constraint-verification-v1');

const VERSION='hard-constraint-result-parity-v1';
let installed=false;
let originalPublic=null;

function intentFor(q='',opts={}){
  if(opts&&opts.decisionState&&typeof opts.decisionState==='object')return engine.intentFromDecisionState(opts.decisionState,opts);
  return engine.interpretQuery(q,opts);
}
function apply(payload,q='',opts={}){
  if(!payload||typeof payload!=='object'||!Array.isArray(payload.results))return payload;
  const intent=intentFor(q,opts),ranked=engine.rankDecision(q,opts),bySlug=new Map((ranked.ranked||[]).map(row=>[row&&row.p&&row.p.slug,row])),recognised=hard.recognisedConstraints(intent);
  const results=payload.results.map(result=>{
    if(!result||!result.slug)return result;
    const row=bySlug.get(result.slug);
    if(!row)return {...result,constraintVerification:Array.isArray(result.constraintVerification)?result.constraintVerification:[]};
    const proof=hard.constraintVerification(row,intent);
    return {...result,hardConstraintStatus:row.eligibility,constraintVerification:proof};
  });
  const topSummary=hard.summary(results[0]&&results[0].constraintVerification||[]);
  const audit={...(payload.audit||{}),hardConstraintsRecognised:recognised.length,topHardConstraintsVerified:topSummary.verified,topHardConstraintsUnverified:topSummary.unverified,topHardConstraintsFailed:topSummary.failed,constraintVerificationParity:true};
  return {
    ...payload,
    hardConstraintVerificationVersion:hard.VERSION,
    constraintVerification:{
      version:hard.VERSION,
      recognised,
      states:Object.values(hard.STATES),
      topResultSummary:topSummary,
      policy:'Recognition is not proof. Candidate proof is derived from the final ranked row after all current re-ranking layers have run; missing positive evidence never proves absence.'
    },
    results,
    audit
  };
}
function publicDecision(q='',opts={}){return apply(originalPublic(q,opts),q,opts);}
function install(){
  if(installed)return engine;
  originalPublic=engine.publicDecision;
  engine.publicDecision=publicDecision;
  engine.HARD_CONSTRAINT_RESULT_PARITY_VERSION=VERSION;
  engine.HARD_CONSTRAINT_VERIFICATION_VERSION=hard.VERSION;
  installed=true;
  return engine;
}

module.exports={VERSION,intentFor,apply,publicDecision,install,get installed(){return installed;}};
