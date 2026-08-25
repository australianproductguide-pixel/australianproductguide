'use strict';

// APG Recommendation Trace v1.
// Converts the public Decision Engine payload into a causal audit object. Explanations
// are only causal when the exact reason was emitted by the ranked candidate trace that
// produced the recommendation. This module does not score products or generate new reasons.

const VERSION='recommendation-trace-v1';
const uniq=values=>[...new Set((values||[]).filter(Boolean))];

function findResult(payload,slug){return (payload&&payload.results||[]).find(row=>row&&row.slug===slug)||null;}
function exactReasons(result){return new Set((result&&result.reasons||[]).map(String));}
function causalReasonRows(payload){
  const winner=payload&&payload.results&&payload.results[0]||null;
  const winnerReasons=exactReasons(winner);
  const stated=payload&&payload.recommendation&&payload.recommendation.whyItWon||[];
  const winnerRows=(stated||[]).map(reason=>({productSlug:winner&&winner.slug||null,role:'winner',reason:String(reason),causal:winnerReasons.has(String(reason)),source:'ranked-result-reasons'}));
  const almost=payload&&payload.recommendation&&payload.recommendation.whatAlmostWon||null;
  if(!almost||!almost.slug)return winnerRows;
  const runner=findResult(payload,almost.slug),runnerReasons=exactReasons(runner);
  return [...winnerRows,...(almost.why||[]).map(reason=>({productSlug:almost.slug,role:'runner-up',reason:String(reason),causal:!!runner&&runnerReasons.has(String(reason)),source:'ranked-result-reasons'}))];
}
function confidenceState(payload,winner){
  if(!winner)return null;
  if(winner.hardConstraintStatus==='ineligible')return {state:'INELIGIBLE',reason:'A failed hard constraint is a mismatch, not low confidence.'};
  const hard=winner.constraintVerification||[];
  if(hard.some(row=>row.state==='FAILED'))return {state:'INELIGIBLE',reason:'At least one verified hard constraint failed.'};
  if(hard.some(row=>row.state==='UNVERIFIED'))return {state:'LOW',reason:'At least one recognised hard constraint is not verified.'};
  return {state:String(winner.confidence&&winner.confidence.level||'unknown').toUpperCase(),reason:'Inherited from the current engine confidence state after hard-constraint proof.'};
}
function buildTrace(payload={}){
  const winner=payload.results&&payload.results[0]||null,runner=payload.results&&payload.results[1]||null,reasonRows=causalReasonRows(payload),nonCausal=reasonRows.filter(row=>!row.causal);
  const recognised=payload.constraintVerification&&payload.constraintVerification.recognised||[];
  const winnerConstraints=winner&&winner.constraintVerification||[];
  const criteria=winner&&winner.criteria||[];
  return {
    version:VERSION,
    decisionEngineVersion:payload.version||null,
    stateSchemaVersion:payload.decisionState&&payload.decisionState.schemaVersion||payload.stateSchemaVersion||null,
    category:payload.decisionState&&payload.decisionState.category||null,
    situation:payload.decisionState&&payload.decisionState.situation||null,
    intendedUse:payload.decisionState&&payload.decisionState.intendedUse||null,
    mustHaves:recognised,
    winner:winner?{
      slug:winner.slug,brand:winner.brand,name:winner.name,
      hardConstraintStatus:winner.hardConstraintStatus,
      reasons:winner.reasons||[],
      conflicts:winner.conflicts||[],
      gaps:winner.gaps||[],
      verificationNeeds:winner.verificationNeeds||[],
      constraints:winnerConstraints,
      criteria,
      confidence:confidenceState(payload,winner)
    }:null,
    runnerUp:runner?{slug:runner.slug,brand:runner.brand,name:runner.name,reasons:runner.reasons||[],gaps:runner.gaps||[],verificationNeeds:runner.verificationNeeds||[],confidence:confidenceState(payload,runner)}:null,
    exclusions:{ineligibleCandidateCount:Number(payload.audit&&payload.audit.ineligibleCount)||0,hardConstraintFallback:!!(payload.audit&&payload.audit.hardConstraintFallback)},
    explanationCausality:{rows:reasonRows,allStatedReasonsCausal:reasonRows.length>0&&nonCausal.length===0,nonCausalReasons:nonCausal},
    missingEvidence:uniq([...(winner&&winner.verificationNeeds||[]),...(winner&&winner.gaps||[])]),
    commercialRecommendationWeight:Number(payload.commercialRecommendationWeight)||0,
    policy:'The trace does not invent recommendation reasons. A stated winner/runner-up reason is causal only when the exact ranked candidate trace contains it.'
  };
}
function audit(payload={}){
  const trace=buildTrace(payload),blockers=[];
  if(!trace.winner)blockers.push('missing-winner');
  if(trace.commercialRecommendationWeight!==0)blockers.push('commercial-weight-nonzero');
  if(trace.explanationCausality.nonCausalReasons.length)blockers.push('non-causal-explanation');
  if(trace.winner&&trace.winner.hardConstraintStatus==='eligible'&&trace.winner.constraints.some(row=>row.state==='FAILED'))blockers.push('eligible-winner-has-failed-hard-constraint');
  return {version:VERSION,status:blockers.length?'FAILED':'PASS',blockers,trace};
}

module.exports={VERSION,findResult,causalReasonRows,confidenceState,buildTrace,audit};
