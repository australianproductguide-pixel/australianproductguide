'use strict';

const assert=require('node:assert/strict');
require('../api/index');
const decision=require('../lib/decision-engine-v4');
const stateV2=require('../lib/decision-state-v2');

const rawState={
  schemaVersion:'decision-state-v1',
  category:'wireless-headphones',
  situation:'Daily office work and long-haul travel',
  intendedUse:'Comfortable ANC headphones for calls and flights',
  budget:{amount:1000,currency:'AUD',mode:'target',hard:false},
  hardConstraints:{budgetCeiling:null,requiredTags:['anc'],excludedTags:[],excludedBrands:['Sony'],requiredBrands:['Bose']},
  priorities:[{tag:'comfort',priority:'highest',weight:1.8}],
  softPreferences:[{tag:'travel',priority:'high',weight:1.4}],
  softExclusions:['gaming'],
  numericConstraints:[],
  categoryIntent:{useCase:'travel-and-work'},
  preferences:{platform:'multi-device'},
  brandPreference:null,
  candidateUniverse:['bose-quietcomfort-ultra-headphones','sennheiser-momentum-4-wireless'],
  evidenceGaps:['Microphone performance still needs exact maintained evidence'],
  shortlist:['bose-quietcomfort-ultra-headphones','sennheiser-momentum-4-wireless'],
  comparisons:['bose-quietcomfort-ultra-headphones','sennheiser-momentum-4-wireless'],
  recommendation:{winnerSlug:'bose-quietcomfort-ultra-headphones',alternativeSlugs:['sennheiser-momentum-4-wireless'],confidence:'moderate'},
  confidence:'moderate',
  retailerIntent:{readyToBuy:false,preferredRetailers:['Amazon Australia']}
};

const normalised=stateV2.normaliseState(rawState);
assert.equal(stateV2.VERSION,'decision-state-v2');
assert.equal(decision.CANONICAL_STATE_SCHEMA_VERSION,'decision-state-v2');
assert.equal(normalised.schemaVersion,'decision-state-v2');
assert.equal(normalised.category,'wireless-headphones');
assert.equal(normalised.situation,'Daily office work and long-haul travel');
assert.equal(normalised.intendedUse,'Comfortable ANC headphones for calls and flights');
assert.deepEqual(normalised.hardConstraints.requiredBrands,['Bose']);
assert.deepEqual(normalised.hardConstraints.excludedBrands,['Sony']);
assert(normalised.softPreferences.some(x=>x.tag==='comfort'&&x.weight===1.8));
assert(normalised.softPreferences.some(x=>x.tag==='travel'&&x.weight===1.4));
assert(normalised.shortlist.includes('bose-quietcomfort-ultra-headphones'));
assert(normalised.evidenceGaps.length===1);
assert.equal(normalised.retailerIntent.readyToBuy,false);

// The structured state must be authoritative even when the accompanying text tries to
// describe a different category/constraint. This proves the engine is not serialising the
// state back into prose and re-parsing it as the source of truth.
const ranked=decision.rankDecision('TV must be exactly 999 inches',{category:'wireless-headphones',decisionState:rawState});
assert.equal(ranked.decisionInputMode,'structured-state');
assert.equal(ranked.intent.inputMode,'structured-state');
assert.equal(ranked.intent.categorySlug,'wireless-headphones');
assert.equal(ranked.intent.decisionState.schemaVersion,'decision-state-v2');
assert.deepEqual(ranked.intent.requiredBrands,['Bose']);
assert.equal(ranked.intent.numericConstraints.length,0,'irrelevant text must not inject a 999-inch constraint into structured state');
assert(ranked.counts.eligible>0,'required Bose + ANC state should retain at least one verified eligible candidate');
assert(ranked.ranked.filter(x=>x.eligibility==='eligible').every(x=>x.p.brand==='Bose'),'required brand must be enforced inside the shared engine, not post-filtered by Scout');

const payload=decision.publicDecision('',{category:'wireless-headphones',decisionState:rawState});
assert.equal(payload.commercialRecommendationWeight,0);
assert.equal(payload.decisionState.schemaVersion,'decision-state-v2');
assert.equal(payload.decisionState.category,'wireless-headphones');
assert(payload.decisionState.evidenceGaps.includes('Microphone performance still needs exact maintained evidence'));
assert(payload.results.length>0);
assert(payload.results.every(row=>row.brand==='Bose'),'public structured-state results must respect the required-brand hard constraint');
assert(payload.results[0].constraintVerification.some(row=>row.key==='required-brand:bose'&&row.state==='VERIFIED'),'top result must expose required-brand proof');
assert(payload.constraintVerification.recognised.some(row=>row.key==='required-brand:bose'&&row.state==='RECOGNISED'));

// Legacy query interpretation remains supported during migration.
const legacy=decision.rankDecision('TV must be exactly 75 inches',{category:'televisions'});
assert.equal(legacy.decisionInputMode,'query');
assert.equal(legacy.intent.decisionState.schemaVersion,'decision-state-v1');
assert(legacy.counts.eligible>0);

console.log('CANONICAL_DECISION_STATE_V2=PASS structured-state-authoritative required-brand-enforced legacy-query-compatible commercialWeight=0');
