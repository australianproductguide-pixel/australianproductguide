'use strict';

const assert=require('node:assert/strict');
require('../api/index');
const decision=require('../lib/decision-engine-v4');
const trace=require('../lib/recommendation-trace-v1');

const state={
  category:'wireless-headphones',
  situation:'Long flights and office calls',
  intendedUse:'Comfortable noise-cancelling headphones',
  budget:{amount:1000,currency:'AUD',mode:'target',hard:false},
  hardConstraints:{requiredTags:['anc'],excludedTags:[],excludedBrands:[],requiredBrands:['Bose']},
  softPreferences:[{tag:'comfort',priority:'highest',weight:1.8},{tag:'travel',priority:'high',weight:1.4}],
  evidenceGaps:[]
};
const payload=decision.publicDecision('',{category:'wireless-headphones',decisionState:state});
const audited=trace.audit(payload);
assert.equal(trace.VERSION,'recommendation-trace-v1');
assert.equal(audited.status,'PASS',`trace blockers: ${audited.blockers.join(', ')}`);
assert.equal(audited.trace.commercialRecommendationWeight,0);
assert.equal(audited.trace.stateSchemaVersion,'decision-state-v2');
assert.equal(audited.trace.category,'wireless-headphones');
assert.equal(audited.trace.situation,'Long flights and office calls');
assert(audited.trace.winner,'winner trace required');
assert.equal(audited.trace.winner.brand,'Bose');
assert(audited.trace.mustHaves.some(row=>row.key==='required:anc'&&row.state==='RECOGNISED'));
assert(audited.trace.mustHaves.some(row=>row.key==='required-brand:bose'&&row.state==='RECOGNISED'));
assert(audited.trace.winner.constraints.some(row=>row.key==='required:anc'&&row.state==='VERIFIED'));
assert(audited.trace.winner.constraints.some(row=>row.key==='required-brand:bose'&&row.state==='VERIFIED'));
assert.equal(audited.trace.explanationCausality.allStatedReasonsCausal,true);
assert.equal(audited.trace.explanationCausality.nonCausalReasons.length,0);

const tampered=JSON.parse(JSON.stringify(payload));
tampered.recommendation.whyItWon=['Affiliate commission was higher'];
const failed=trace.audit(tampered);
assert.equal(failed.status,'FAILED');
assert(failed.blockers.includes('non-causal-explanation'));
assert.equal(failed.trace.explanationCausality.rows[0].causal,false);

const contradictory=JSON.parse(JSON.stringify(payload));
contradictory.results[0].hardConstraintStatus='eligible';
contradictory.results[0].constraintVerification=[...(contradictory.results[0].constraintVerification||[]),{key:'required:test',state:'FAILED'}];
const contradictoryAudit=trace.audit(contradictory);
assert.equal(contradictoryAudit.status,'FAILED');
assert(contradictoryAudit.blockers.includes('eligible-winner-has-failed-hard-constraint'));

console.log('RECOMMENDATION_TRACE_V1=PASS causal-explanations-only hard-constraint-consistency commercialWeight=0');
