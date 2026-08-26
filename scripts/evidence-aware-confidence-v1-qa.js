'use strict';

const assert=require('node:assert/strict');
const confidence=require('../lib/evidence-aware-confidence-v1');
require('../api/index');
const decision=require('../lib/decision-engine-v4');
const categoryGate=require('../lib/category-completion-gate-v1');

const verifiedResult={
  hardConstraintStatus:'eligible',
  evidenceTier:'deep',
  freshnessStatus:'reviewed-this-month',
  constraintVerification:[{key:'required:anc',state:'VERIFIED'},{key:'required-brand:bose',state:'VERIFIED'}],
  criterionCoverage:{verifiedCriterionCoveragePct:100},
  verificationNeeds:[],gaps:[]
};
const high=confidence.assess(verifiedResult,{categoryDecisionGrade:true,universeCoverage:'CERTIFIED',strictEvidenceStrong:true,decisionStability:'STABLE'});
assert.equal(confidence.VERSION,'evidence-aware-confidence-v1');
assert.equal(high.state,'HIGH');
assert.equal(high.researchRequired,false);
assert.equal(high.caps.length,0);

const unverified=confidence.assess({...verifiedResult,hardConstraintStatus:'unverified',constraintVerification:[{key:'required:anc',state:'UNVERIFIED'}]},{categoryDecisionGrade:true,universeCoverage:'CERTIFIED',strictEvidenceStrong:true,decisionStability:'STABLE'});
assert.equal(unverified.state,'LOW');
assert.equal(unverified.researchRequired,true);
assert(unverified.caps.includes('UNVERIFIED_HARD_CONSTRAINT'));

const failed=confidence.assess({...verifiedResult,hardConstraintStatus:'ineligible',constraintVerification:[{key:'required:anc',state:'FAILED'}]},{categoryDecisionGrade:true,universeCoverage:'CERTIFIED',strictEvidenceStrong:true,decisionStability:'STABLE'});
assert.equal(failed.state,'INELIGIBLE');
assert.equal(failed.researchRequired,false);
assert(/mismatch/i.test(failed.reasons[0]));

const stale=confidence.assess({...verifiedResult,freshnessStatus:'stale'},{categoryDecisionGrade:true,universeCoverage:'CERTIFIED',strictEvidenceStrong:true,decisionStability:'STABLE'});
assert.equal(stale.state,'LOW');
assert(stale.caps.includes('STALE_EVIDENCE'));

const moderate=confidence.assess(verifiedResult,{categoryDecisionGrade:false,universeCoverage:'NOT_CERTIFIED',strictEvidenceStrong:true,decisionStability:'NOT_CERTIFIED'});
assert.equal(moderate.state,'MODERATE');
assert(moderate.caps.includes('CATEGORY_NOT_DECISION_GRADE'));
assert(moderate.caps.includes('UNIVERSE_COVERAGE_NOT_CERTIFIED'));

// Current APG priority categories are fail-closed; no current result may be promoted to
// HIGH merely because the older engine's heuristic label happens to say high.
const state={category:'wireless-headphones',hardConstraints:{requiredTags:['anc'],requiredBrands:['Bose'],excludedTags:[],excludedBrands:[]},softPreferences:[{tag:'comfort',priority:'high',weight:1.4}]};
const payload=decision.publicDecision('',{category:'wireless-headphones',decisionState:state});
const row=payload.results[0];
const maturity=categoryGate.gateRow('wireless-headphones');
const governed=confidence.assess(row,{categoryDecisionGrade:maturity.overall==='DECISION_GRADE',universeCoverage:maturity.gates.candidateCoverage==='PASS'?'CERTIFIED':'NOT_CERTIFIED',strictEvidenceStrong:false,decisionStability:'NOT_CERTIFIED'});
assert.notEqual(governed.state,'HIGH','current fail-closed category maturity must prevent an unsupported High-confidence claim');
assert.equal(maturity.overall,'NOT_DECISION_GRADE');

console.log('EVIDENCE_AWARE_CONFIDENCE_V1=PASS high-requires-all-controls unverified=LOW failed=INELIGIBLE current-high-claim-blocked');
