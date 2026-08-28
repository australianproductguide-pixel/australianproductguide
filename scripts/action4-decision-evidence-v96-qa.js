'use strict';

const assert=require('assert');
const runtime=require('../lib/action4-decision-evidence-v96');
const {products}=require('../data');
const evidence=require('../data/action4-decision-evidence-v96');
const closure=require('../data/action4-closure-v97');
const final=require('../data/action4-final-v98');
const commerce=require('../data/commerce-eligibility-v114');

function criterion(result,key){return (result.criteria||[]).find(row=>row.criterion===key||row.key===`decision:${key}`);}
function noContradiction(result,key){const label=key.replace(/-/g,' ');const text=[...(result.reasons||[]),...(result.gaps||[]),...(result.verificationNeeds||[])].join(' ').toLowerCase();assert(!text.includes(`${label} is not a documented fit signal`),`legacy contradictory ${label} wording survived`);}

const snapshot=runtime.action4Snapshot();
assert.strictEqual(snapshot.version,'96.0');
assert.strictEqual(snapshot.catalogue.products,482,'Action 4 must run against the maintained 482-product catalogue baseline');
assert.strictEqual(snapshot.categorySchemas.length,5,'first-wave category schema count');
assert.strictEqual(snapshot.entityIntegrity.reviewed,24,'all known entity correction cases must be reviewed');
assert.strictEqual(snapshot.entityIntegrity.resolved,7,'v96 historical resolved count must remain stable');
assert.strictEqual(snapshot.entityIntegrity.open,17,'v96 historical open count must remain stable');
assert.strictEqual(snapshot.evidence.independentDecisionRecords,4,'independent first-wave evidence records');
assert.strictEqual(snapshot.governance.commercialRecommendationWeight,0);

const comfort=runtime.action4PublicDecision('Premium travel headphones. Comfort is the highest priority.',{category:'wireless-headphones'});
assert.strictEqual(comfort.action4Version,'96.0');assert.strictEqual(comfort.audit.criterionTraceParity,true);assert(comfort.results.length>1);assert.strictEqual(comfort.results[0].slug,'bose-quietcomfort-ultra-headphones');
const boseComfort=criterion(comfort.results[0],'comfort');assert(boseComfort);assert.strictEqual(boseComfort.evidenceStatus,'VERIFIED');assert.strictEqual(boseComfort.productValue,'excellent');assert(boseComfort.scoreContribution>0);assert(Array.isArray(boseComfort.evidenceRefs)&&boseComfort.evidenceRefs.length>=2);noContradiction(comfort.results[0],'comfort');assert(comfort.recommendation.whyItWon.some(x=>/comfort/i.test(x)));
const sony=comfort.results.find(row=>row.slug==='sony-wh-1000xm6');assert(sony);const sonyComfort=criterion(sony,'comfort');assert(sonyComfort&&sonyComfort.evidenceStatus==='VERIFIED');assert.strictEqual(sonyComfort.productValue,'average');assert.strictEqual(sonyComfort.evidenceConfidence,'medium');
const unknown=comfort.results.find(row=>!criterion(row,'comfort')||criterion(row,'comfort').evidenceStatus!=='VERIFIED');assert(unknown);const unknownComfort=criterion(unknown,'comfort');assert(unknownComfort);assert.strictEqual(unknownComfort.scoreContribution,0);assert.strictEqual(unknownComfort.explanationEligible,false);noContradiction(unknown,'comfort');

const robot=runtime.action4PublicDecision('Robot vacuum for pet hair and hard floors. Obstacle avoidance matters.',{category:'robot-vacuums'});assert.strictEqual(robot.categoryDecisionSchemaVersion,evidence.SCHEMA_VERSION);assert(robot.results.length);for(const row of robot.results){assert(criterion(row,'pet-hair'));assert(criterion(row,'hard-floor'));assert(criterion(row,'obstacle-avoidance'));}
const coffee=runtime.action4PublicDecision('Coffee machine for a beginner who wants good espresso without a complicated workflow.',{category:'coffee-machines'});assert(coffee.results.length);assert(criterion(coffee.results[0],'beginner'));
const tv=runtime.action4PublicDecision('TV for a bright living room, sport and streaming.',{category:'televisions'});assert(tv.results.length);assert(criterion(tv.results[0],'bright-room'));assert(criterion(tv.results[0],'sport'));assert(criterion(tv.results[0],'streaming'));
const laptop=runtime.action4PublicDecision('Lightweight laptop for university use with good battery.',{category:'laptops'});assert(laptop.results.length);assert(criterion(laptop.results[0],'portable'));assert(criterion(laptop.results[0],'university'));

// Preserve the historical v96 state while checking CURRENT commerce against v97/v98 closure.
// Current exclusions include five resolved non-AU/regional entities and six maintained historical
// entities (including records already historical before v97), plus the separate safety gate.
const closureBySlug=new Map((closure.entityOverrides||[]).map(row=>[row.slug,row]));
const finalBySlug=new Map((final.finalEntityOverrides||[]).map(row=>[row.slug,row]));
const historicallyExcluded=products.filter(product=>product.recommendationEligibility===evidence.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE);
assert(historicallyExcluded.length>0);
let laterResolvedForCommerce=0;
for(const product of historicallyExcluded){
  const currentException=commerce.exceptionFor(product);
  if(currentException?.type==='ENTITY_MARKET_EXCLUDED'){
    assert.strictEqual(product.commerceSuppressed,true,`${product.slug} must remain commerce-suppressed under final entity/market/lifecycle state`);
    assert.deepStrictEqual(product.retailers||[],[],`${product.slug} retained retailer pathways despite final exclusion`);
    if(currentException.eligibility==='HISTORICAL'){
      const resolution=finalBySlug.get(product.slug)||closureBySlug.get(product.slug);
      assert(resolution,`${product.slug} historical exclusion requires explicit later closure evidence`);
      assert(/^RESOLVED_HISTORICAL/.test(String(resolution.resolution||'')),`${product.slug} historical exclusion must be explicitly resolved as historical`);
    }
    continue;
  }
  const resolved=closureBySlug.get(product.slug);
  assert(resolved,`${product.slug} cannot re-enter commerce without an explicit later Action 4 resolution`);
  assert.notStrictEqual(resolved.eligibility,evidence.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE);
  assert(resolved.authoritativeSource);assert(/^RESOLVED_/.test(String(resolved.resolution||'')));
  assert.strictEqual(product.commerceSuppressed,false,`${product.slug} explicitly resolved current entity should regain eligible commerce`);
  laterResolvedForCommerce++;
}
assert(laterResolvedForCommerce>0);

const currentEntityExcluded=products.filter(product=>commerce.exceptionFor(product)?.type==='ENTITY_MARKET_EXCLUDED');
assert.strictEqual(currentEntityExcluded.length,Object.keys(commerce.ENTITY_EXCLUSIONS).length);
assert.strictEqual(currentEntityExcluded.length,11,'Final catalogue state should suppress eleven non-current/non-AU entity records');
const currentSummary=commerce.eligibilitySummary();
assert.strictEqual(currentSummary.entityOpenCases,0,'Final v98 retains zero unresolved entity cases');
assert.strictEqual(currentSummary.historicalExclusions,6,'Six maintained historical records must not receive current retailer paths');
assert.strictEqual(currentSummary.regionalOrCurrentMarketExclusions,5,'Five non-AU/regional records must not receive current Australian retailer paths');
for(const product of currentEntityExcluded){assert.strictEqual(product.commerceSuppressed,true);assert.deepStrictEqual(product.retailers||[],[]);}

const philips=products.find(product=>product.slug==='philips-5000-series-handheld-steamer-sth5030-20');assert(philips);assert.strictEqual(philips.entityStatus,evidence.ENTITY_STATUS.CURRENT);assert.strictEqual(philips.entityCorrectedFrom,'philips-5000-series-handheld-steamer-sth5030-80');

console.log(JSON.stringify({ok:true,version:snapshot.version,products:snapshot.catalogue.products,schemas:snapshot.categorySchemas.length,entityReviewed:snapshot.entityIntegrity.reviewed,entityResolved:snapshot.entityIntegrity.resolved,entityOpen:snapshot.entityIntegrity.open,currentCommerceEntityExclusions:currentEntityExcluded.length,currentEntityOpen:currentSummary.entityOpenCases,historicalExclusions:currentSummary.historicalExclusions,regionalExclusions:currentSummary.regionalOrCurrentMarketExclusions,laterResolvedForCommerce,independentDecisionEvidence:snapshot.evidence.independentDecisionRecords,comfortWinner:comfort.results[0].slug,comfortCoverage:comfort.audit.topCriterionCoverage},null,2));
