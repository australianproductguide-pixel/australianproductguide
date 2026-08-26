'use strict';

// APG Evidence-aware Confidence v1.
// Confidence is a statement about recommendation evidence, not a review score or an
// arbitrary percentage. A failed hard constraint is INELIGIBLE, while an unverified hard
// constraint forces LOW confidence. HIGH is impossible until the category universe and
// category maturity are independently certified.

const VERSION='evidence-aware-confidence-v1';
const STATES=Object.freeze({HIGH:'HIGH',MODERATE:'MODERATE',LOW:'LOW',INELIGIBLE:'INELIGIBLE'});

function hardSummary(result={}){
  const rows=result.constraintVerification||[];
  return {
    requested:rows.length,
    verified:rows.filter(row=>row.state==='VERIFIED').length,
    unverified:rows.filter(row=>row.state==='UNVERIFIED').length,
    failed:rows.filter(row=>row.state==='FAILED').length
  };
}
function coverage(result={}){
  const c=result.criterionCoverage||{};
  const pct=Number(c.verifiedCriterionCoveragePct??c.coveragePct);
  return Number.isFinite(pct)?Math.max(0,Math.min(100,pct)):null;
}
function freshness(result={}){
  const value=String(result.freshnessStatus||'').toLowerCase();
  if(!value)return 'UNKNOWN';
  if(/stale|overdue|expired|review.due/.test(value))return 'STALE';
  if(/reviewed.this.month|current|fresh|verified/.test(value))return 'CURRENT';
  return 'UNKNOWN';
}
function assess(result={},context={}){
  const hard=hardSummary(result),criterionCoverage=coverage(result),freshnessState=freshness(result),reasons=[],caps=[];
  if(result.hardConstraintStatus==='ineligible'||hard.failed>0){
    return {version:VERSION,state:STATES.INELIGIBLE,label:'Constraint conflict',researchRequired:false,hard,criterionCoverage,freshness:freshnessState,reasons:['A verified hard constraint failed. This is a mismatch, not low confidence.'],caps:['HARD_CONSTRAINT_FAILED']};
  }
  if(result.hardConstraintStatus==='unverified'||hard.unverified>0){
    reasons.push('At least one recognised hard constraint is not verified.');caps.push('UNVERIFIED_HARD_CONSTRAINT');
    return {version:VERSION,state:STATES.LOW,label:'Low confidence — verify must-haves',researchRequired:true,hard,criterionCoverage,freshness:freshnessState,reasons,caps};
  }
  const evidenceTier=String(result.evidenceTier||'starter').toLowerCase();
  const verificationNeeds=(result.verificationNeeds||[]).length,gaps=(result.gaps||[]).length;
  if(verificationNeeds){reasons.push('Decision-relevant evidence still needs verification.');caps.push('VERIFICATION_NEEDS');}
  if(freshnessState==='STALE'){reasons.push('Decision-relevant evidence is stale or due for review.');caps.push('STALE_EVIDENCE');}
  if(criterionCoverage!==null&&criterionCoverage<60){reasons.push('Too much of the requested decision criteria remain unsupported.');caps.push('LOW_CRITERION_COVERAGE');}
  if(verificationNeeds||freshnessState==='STALE'||(criterionCoverage!==null&&criterionCoverage<60)){
    return {version:VERSION,state:STATES.LOW,label:'Low confidence — further research needed',researchRequired:true,hard,criterionCoverage,freshness:freshnessState,reasons,caps};
  }

  const categoryDecisionGrade=context.categoryDecisionGrade===true;
  const universeCoverage=context.universeCoverage==='CERTIFIED';
  const decisiveEvidenceCurrent=freshnessState==='CURRENT';
  const strongEvidence=evidenceTier==='deep'||context.strictEvidenceStrong===true;
  const highCoverage=criterionCoverage!==null&&criterionCoverage>=90;
  const stableWinner=context.decisionStability==='STABLE';
  if(!categoryDecisionGrade)caps.push('CATEGORY_NOT_DECISION_GRADE');
  if(!universeCoverage)caps.push('UNIVERSE_COVERAGE_NOT_CERTIFIED');
  if(!strongEvidence)caps.push('STRICT_EVIDENCE_NOT_STRONG');
  if(!decisiveEvidenceCurrent)caps.push('DECISIVE_EVIDENCE_FRESHNESS_NOT_CURRENT');
  if(!highCoverage)caps.push('CRITERION_COVERAGE_BELOW_HIGH_THRESHOLD');
  if(!stableWinner)caps.push('DECISION_STABILITY_NOT_CERTIFIED');

  if(!caps.length){
    return {version:VERSION,state:STATES.HIGH,label:'High confidence',researchRequired:false,hard,criterionCoverage,freshness:freshnessState,reasons:['Hard constraints, category maturity, candidate-universe coverage, decision-critical evidence, freshness and decision stability are all certified.'],caps:[]};
  }
  if(strongEvidence&&(criterionCoverage===null||criterionCoverage>=70)&&hard.unverified===0){
    reasons.push('The current evidence supports a useful recommendation, but one or more maturity/universe/freshness/stability controls prevent a High-confidence claim.');
    return {version:VERSION,state:STATES.MODERATE,label:'Moderate confidence',researchRequired:gaps>0||freshnessState==='UNKNOWN',hard,criterionCoverage,freshness:freshnessState,reasons,caps};
  }
  reasons.push('No hard constraint is known to fail, but the evidence base is not yet strong enough for a Moderate or High-confidence claim.');
  return {version:VERSION,state:STATES.LOW,label:'Low confidence — further research needed',researchRequired:true,hard,criterionCoverage,freshness:freshnessState,reasons,caps};
}

module.exports={VERSION,STATES,hardSummary,coverage,freshness,assess};
