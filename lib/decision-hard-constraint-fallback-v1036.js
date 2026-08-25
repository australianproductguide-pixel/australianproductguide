'use strict';

// APG Decision hard-constraint fallback remediation v103.6.
//
// Action 4 correctly re-ranks eligibility after evidence/entity controls, but its
// historical wrapper narrowed hardConstraintFallback to the special case where
// zero eligible products and at least one unverified product remained. That loses
// the fallback state when every maintained candidate is a VERIFIED conflict — for
// example an exact 999-inch TV request. Preserve the core Decision Engine rule:
// a maintained-category request with an explicit hard constraint and zero eligible
// products is a hard-constraint fallback, whether the blocker is verified conflict
// or missing proof. This does not make any conflicting product eligible.
const downstream=require('./apg-proof-rail-runtime-v103');
const decision=require('./decision-engine-v4');

const VERSION='103.6';
const HEADER='X-APG-Decision-Hard-Constraint-Fallback';

function rows(value){return Array.isArray(value)?value:[];}
function hasHardConstraint(state){
  const s=state&&typeof state==='object'?state:{};
  const hard=s.hardConstraints&&typeof s.hardConstraints==='object'?s.hardConstraints:{};
  return !!(
    s.budget?.hard===true ||
    hard.budgetCeiling!==null&&hard.budgetCeiling!==undefined ||
    rows(hard.requiredTags).length ||
    rows(hard.excludedTags).length ||
    rows(hard.excludedBrands).length ||
    rows(s.numericConstraints).some(item=>item&&item.hard===true)
  );
}
function correctedFallback(state,eligibleCount,unsupportedCategory=false){
  return !unsupportedCategory&&Number(eligibleCount)===0&&hasHardConstraint(state);
}

// The app's downstream lineage loads Action 4 before this remediation. Patch the
// shared Decision Engine object once so every dynamic API consumer sees the same
// corrected state while keeping Action 4 scoring/evidence logic authoritative.
if(decision.HARD_CONSTRAINT_FALLBACK_REMEDIATION_VERSION!==VERSION){
  const priorRank=decision.rankDecision;
  const priorPublic=decision.publicDecision;

  decision.rankDecision=function rankDecisionWithHardConstraintFallback(q='',opts={}){
    const out=priorRank(q,opts);
    const fallback=correctedFallback(
      out?.intent?.decisionState,
      out?.counts?.eligible,
      out?.unsupportedCategory
    );
    return {...out,hardConstraintFallback:fallback};
  };

  decision.publicDecision=function publicDecisionWithHardConstraintFallback(q='',opts={}){
    const out=priorPublic(q,opts);
    const audit=out&&out.audit&&typeof out.audit==='object'?out.audit:{};
    const fallback=correctedFallback(
      out?.decisionState,
      audit.eligibleCount,
      audit.unsupportedCategory
    );
    return {...out,audit:{...audit,hardConstraintFallback:fallback}};
  };

  decision.HARD_CONSTRAINT_FALLBACK_REMEDIATION_VERSION=VERSION;
}

function handler(req,res){
  const originalSetHeader=res.setHeader?res.setHeader.bind(res):()=>{};
  res.setHeader=function(name,value){
    if(String(name||'').toLowerCase()===HEADER.toLowerCase())return originalSetHeader(name,'v'+VERSION);
    return originalSetHeader(name,value);
  };
  originalSetHeader(HEADER,'v'+VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  DECISION_HARD_CONSTRAINT_FALLBACK_VERSION:VERSION,
  decisionHardConstraintFallbackHasHardConstraint:hasHardConstraint,
  decisionHardConstraintFallbackState:correctedFallback
});

module.exports=handler;
