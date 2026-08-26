'use strict';

const assert=require('node:assert/strict');
const gate=require('../lib/category-completion-gate-v1');

const snap=gate.snapshot();
assert.equal(snap.version,'category-completion-gate-v1');
assert.equal(snap.summary.priorityCategoryCount,8);
assert.equal(snap.summary.decisionGradeCount,0,'no Wave 1 category is currently fully certified decision-grade');
assert.equal(snap.summary.notDecisionGradeCount,8);
assert.equal(snap.requiredGates.length,13);
assert.equal(snap.governance.depthBeforeBreadth,true);
assert.equal(snap.governance.shallowCatalogueExpansionPaused,true);
assert.equal(snap.governance.partialDoesNotPass,true);
assert.equal(snap.governance.publicDecisionGradeClaimRequiresAllGates,true);
assert.equal(snap.governance.commercialRecommendationWeight,0);
assert.equal(snap.source.categorySchemaVersion,'category-decision-schema-v2.2');
assert.equal(snap.source.evidenceDepthStandard,'evidence-depth-standard-v2.2');

for(const row of snap.rows){
  assert.equal(row.gates.schema,'PASS',`${row.category} must retain a defined category schema`);
  assert(row.blockers.length>0,`${row.category} must remain fail-closed until every gate is certified`);
  assert.equal(row.overall,'NOT_DECISION_GRADE');
  assert.equal(row.publicMaturityClaimAllowed,false);
  assert.notEqual(row.gates.candidateCoverage,'PASS');
  assert.notEqual(row.gates.identity,'PASS');
  assert.notEqual(row.gates.retailer,'PASS');
  assert.notEqual(row.gates.imagery,'PASS');
  assert.notEqual(row.gates.mobileAccessibility,'PASS');
  assert.notEqual(row.gates.analytics,'PASS');
}

for(const slug of ['coffee-machines','robot-vacuums','televisions','laptops','smartphones','washing-machines']){
  const row=snap.rows.find(x=>x.category===slug);assert(row,slug);assert.equal(row.gates.search,'PARTIAL',`${slug} should inherit current v104 curated search/guide depth only as PARTIAL`);
}
for(const slug of ['wireless-headphones','air-fryers']){
  const row=snap.rows.find(x=>x.category===slug);assert(row,slug);assert.equal(row.gates.search,'NOT_YET_CERTIFIED',`${slug} must not inherit v104 certification it does not have`);
}

console.log(`CATEGORY_COMPLETION_GATE_V1=PASS priority=${snap.summary.priorityCategoryCount} decisionGrade=${snap.summary.decisionGradeCount} failClosed=true`);
