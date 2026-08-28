'use strict';

const assert=require('assert');
const runtime=require('../lib/action4-decision-evidence-v96');
const {products}=require('../data');
const evidence=require('../data/action4-decision-evidence-v96');
const closure=require('../data/action4-closure-v97');
const final=require('../data/action4-final-v98');
const commerce=require('../data/commerce-eligibility-v114');

function criterion(result,key){return (result.criteria||[]).find(row=>row.criterion===key||row.key===`decision:${key}`);}
function noContradiction(result,key){
  const label=key.replace(/-/g,' ');
  const text=[...(result.reasons||[]),...(result.gaps||[]),...(result.verificationNeeds||[])].join(' ').toLowerCase();
  assert(!text.includes(`${label} is not a documented fit signal`),`legacy contradictory ${label} wording survived`);
}

const snapshot=runtime.action4Snapshot();
assert.strictEqual(snapshot.version,'96.0');
assert.strictEqual(snapshot.catalogue.products,482,'Action 4 must run against the maintained 482-product catalogue baseline');
assert.strictEqual(snapshot.categorySchemas.length,5,'first-wave category schema count');
// These are intentionally historical v96 snapshot assertions. Later Action 4 closure layers
// must not rewrite the chronology of what v96 knew at its certification point.
assert.strictEqual(snapshot.entityIntegrity.reviewed,24,'all known entity correction cases must be reviewed');
assert.strictEqual(snapshot.entityIntegrity.resolved,7,'v96 historical resolved count must remain stable');
assert.strictEqual(snapshot.entityIntegrity.open,17,'v96 historical open count must remain stable');
assert.strictEqual(snapshot.evidence.independentDecisionRecords,4,'independent first-wave evidence records');
assert.strictEqual(snapshot.governance.commercialRecommendationWeight,0);

const comfort=runtime.action4PublicDecision('Premium travel headphones. Comfort is the highest priority.',{category:'wireless-headphones'});
assert.strictEqual(comfort.action4Version,'96.0');
assert.strictEqual(comfort.audit.criterionTraceParity,true);
assert(comfort.results.length>1,'comfort benchmark should return a maintained shortlist');
assert.strictEqual(comfort.results[0].slug,'bose-quietcomfort-ultra-headphones','Bose original Ultra should lead the current comfort-first trace from documented evidence');
const boseComfort=criterion(comfort.results[0],'comfort');
assert(boseComfort,'comfort criterion trace missing');
assert.strictEqual(boseComfort.evidenceStatus,'VERIFIED');
assert.strictEqual(boseComfort.productValue,'excellent');
assert(boseComfort.scoreContribution>0,'comfort must have an explicit positive score contribution');
assert(Array.isArray(boseComfort.evidenceRefs)&&boseComfort.evidenceRefs.length>=2,'subjective comfort signal requires multi-source evidence');
noContradiction(comfort.results[0],'comfort');
assert(comfort.recommendation.whyItWon.some(x=>/comfort/i.test(x)),'consumer explanation must reflect the comfort criterion that changed rank');

const sony=comfort.results.find(row=>row.slug==='sony-wh-1000xm6');
assert(sony,'Sony XM6 should remain in the maintained comparison set');
const sonyComfort=criterion(sony,'comfort');
assert(sonyComfort&&sonyComfort.evidenceStatus==='VERIFIED','Sony comfort conflict must be represented as documented evidence rather than guessed');
assert.strictEqual(sonyComfort.productValue,'average');
assert.strictEqual(sonyComfort.evidenceConfidence,'medium');

const unknown=comfort.results.find(row=>!criterion(row,'comfort')||criterion(row,'comfort').evidenceStatus!=='VERIFIED');
assert(unknown,'at least one first-wave headphone should demonstrate explicit unknown handling');
const unknownComfort=criterion(unknown,'comfort');
assert(unknownComfort,'unknown comfort still requires a trace row');
assert.strictEqual(unknownComfort.scoreContribution,0,'unknown evidence must contribute zero rather than average/poor');
assert.strictEqual(unknownComfort.explanationEligible,false,'unknown evidence cannot generate a positive explanation claim');
noContradiction(unknown,'comfort');

const robot=runtime.action4PublicDecision('Robot vacuum for pet hair and hard floors. Obstacle avoidance matters.',{category:'robot-vacuums'});
assert.strictEqual(robot.categoryDecisionSchemaVersion,evidence.SCHEMA_VERSION);
assert(robot.results.length,'robot-vacuum benchmark should return maintained candidates');
for(const row of robot.results){
  assert(criterion(row,'pet-hair'),'pet-hair schema trace missing');
  assert(criterion(row,'hard-floor'),'hard-floor schema trace missing');
  assert(criterion(row,'obstacle-avoidance'),'obstacle-avoidance schema trace missing');
}

const coffee=runtime.action4PublicDecision('Coffee machine for a beginner who wants good espresso without a complicated workflow.',{category:'coffee-machines'});
assert(coffee.results.length,'coffee benchmark should return maintained candidates');
assert(criterion(coffee.results[0],'beginner'),'beginner workflow trace missing');

const tv=runtime.action4PublicDecision('TV for a bright living room, sport and streaming.',{category:'televisions'});
assert(tv.results.length,'TV benchmark should return maintained candidates');
assert(criterion(tv.results[0],'bright-room'),'bright-room schema trace missing');
assert(criterion(tv.results[0],'sport'),'sport schema trace missing');
assert(criterion(tv.results[0],'streaming'),'streaming schema trace missing');

const laptop=runtime.action4PublicDecision('Lightweight laptop for university use with good battery.',{category:'laptops'});
assert(laptop.results.length,'laptop benchmark should return maintained candidates');
assert(criterion(laptop.results[0],'portable'),'portability schema trace missing');
assert(criterion(laptop.results[0],'university'),'university schema trace missing');

// v96 records retain their historical marker. CURRENT commerce is reconciled through v97 and
// final v98: five regional/non-AU cases plus two final historical cases remain fail-closed, while
// explicitly resolved current AU identities may regain model-specific retailer pathways.
const closureBySlug=new Map((closure.entityOverrides||[]).map(row=>[row.slug,row]));
const finalBySlug=new Map((final.finalEntityOverrides||[]).map(row=>[row.slug,row]));
const historicallyExcluded=products.filter(product=>product.recommendationEligibility===evidence.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE);
assert(historicallyExcluded.length>0,'v96 entity-unverified historical set is empty');
let laterResolvedForCommerce=0;
for(const product of historicallyExcluded){
  const currentException=commerce.exceptionFor(product);
  if(currentException?.type==='ENTITY_MARKET_EXCLUDED'){
    assert.strictEqual(product.commerceSuppressed,true,`${product.slug} must remain commerce-suppressed under final entity/market/lifecycle state`);
    assert.deepStrictEqual(product.retailers||[],[],`${product.slug} retained a retailer pathway despite final commerce exclusion`);
    if(currentException.eligibility==='HISTORICAL'){
      const finalResolution=finalBySlug.get(product.slug);
      assert(finalResolution,`${product.slug} historical current-commerce exclusion must come from v98 final closure`);
      assert(/^RESOLVED_HISTORICAL_/.test(String(finalResolution.resolution||'')));
    }
    continue;
  }
  const resolved=closureBySlug.get(product.slug);
  assert(resolved,`${product.slug} cannot re-enter commerce without an explicit later Action 4 entity resolution`);
  assert.notStrictEqual(resolved.eligibility,evidence.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,`${product.slug} cannot re-enter commerce while v97 still excludes the entity`);
  assert(resolved.authoritativeSource,`${product.slug} commerce re-entry requires an authoritative resolution source`);
  assert(/^RESOLVED_/.test(String(resolved.resolution||'')),`${product.slug} commerce re-entry requires explicit resolution provenance`);
  assert.strictEqual(product.commerceSuppressed,false,`${product.slug} was explicitly resolved and should not remain commerce-suppressed`);
  laterResolvedForCommerce++;
}
assert(laterResolvedForCommerce>0,'No historical v96 identity exclusions were reconciled through later closure evidence');

const currentEntityExcluded=products.filter(product=>commerce.exceptionFor(product)?.type==='ENTITY_MARKET_EXCLUDED');
assert.strictEqual(currentEntityExcluded.length,Object.keys(commerce.ENTITY_EXCLUSIONS).length,'Current product state must match shared commerce entity exclusions');
assert.strictEqual(currentEntityExcluded.length,7,'Final v98-over-v97-over-v96 state should retain seven non-current/non-AU commerce exclusions');
assert.strictEqual(commerce.eligibilitySummary().entityOpenCases,0,'Final v98 state must retain zero unresolved entity cases');
assert.strictEqual(commerce.eligibilitySummary().historicalExclusions,2,'Two final entity records are historical rather than unresolved');
for(const product of currentEntityExcluded){
  assert.strictEqual(product.commerceSuppressed,true,`${product.slug} current entity exclusion must suppress commerce`);
  assert.deepStrictEqual(product.retailers||[],[],`${product.slug} current entity exclusion retained retailer rows`);
}

const philips=products.find(product=>product.slug==='philips-5000-series-handheld-steamer-sth5030-20');
assert(philips,'corrected Philips Australian STH5030/20 entity missing');
assert.strictEqual(philips.entityStatus,evidence.ENTITY_STATUS.CURRENT);
assert.strictEqual(philips.entityCorrectedFrom,'philips-5000-series-handheld-steamer-sth5030-80');

console.log(JSON.stringify({ok:true,version:snapshot.version,products:snapshot.catalogue.products,schemas:snapshot.categorySchemas.length,entityReviewed:snapshot.entityIntegrity.reviewed,entityResolved:snapshot.entityIntegrity.resolved,entityOpen:snapshot.entityIntegrity.open,currentCommerceEntityExclusions:currentEntityExcluded.length,currentEntityOpen:commerce.eligibilitySummary().entityOpenCases,historicalExclusions:commerce.eligibilitySummary().historicalExclusions,laterResolvedForCommerce,independentDecisionEvidence:snapshot.evidence.independentDecisionRecords,comfortWinner:comfort.results[0].slug,comfortCoverage:comfort.audit.topCriterionCoverage},null,2));
