'use strict';

const assert=require('assert');
const runtime=require('../lib/action4-closure-v97');
const engine=require('../lib/decision-engine-v4');
const scout=require('../lib/scout-concierge-v5-core');
const closure=require('../data/action4-closure-v97');
const {products}=require('../data');

function criterion(result,key){return (result.criteria||[]).find(row=>row.criterion===key||row.key===`decision:${key}`);}
function criterionCount(result,key){return (result.criteria||[]).filter(row=>row.criterion===key||row.key===`decision:${key}`).length;}

const snapshot=runtime.action41Snapshot();
assert.strictEqual(snapshot.version,'97.0');
assert.strictEqual(snapshot.catalogue.products,482,'maintained catalogue count changed unexpectedly');
assert.strictEqual(snapshot.catalogue.categories,90,'maintained category count changed unexpectedly');
assert.strictEqual(snapshot.entityIntegrity.reviewed,24,'known entity register count');
assert.strictEqual(snapshot.entityIntegrity.resolved,22,'Action 4.1 should resolve 15 of the 17 remaining cases');
assert.strictEqual(snapshot.entityIntegrity.open,2,'only genuinely unresolved entity cases should remain');
const openSlugs=snapshot.entityIntegrity.rows.filter(r=>!/^RESOLVED/.test(String(r.resolution||''))).map(r=>r.slug).sort();
assert.deepStrictEqual(openSlugs,['russell-hobbs-steam-genie-handheld-garment-steamer','wahl-stainless-steel-lithium-ion-beard-trimmer']);
for(const slug of openSlugs){
  const p=products.find(row=>row.slug===slug);assert(p,`missing unresolved entity ${slug}`);
  assert.strictEqual(p.recommendationEligibility,closure.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE,`${slug} must remain fail closed`);
  assert.strictEqual(p.amazonMappingSuppressedByAction4,true,`${slug} Amazon mapping must remain suppressed`);
}

const laptopQuery='Lightweight portable laptop for university use with good battery under $1,500.';
const laptop=runtime.action41PublicDecision(laptopQuery,{category:'laptops'});
assert(laptop.results.length>=2,'laptop benchmark should return current candidates');
assert.strictEqual(laptop.audit.intentAliasCanonicalised,true);
assert.strictEqual(laptop.audit.categoryNounsExcluded,true);
for(const row of laptop.results){
  assert(criterionCount(row,'portable')<=1,`${row.slug} double-counted portable/lightweight`);
  assert(!(row.criteria||[]).some(c=>['laptop','laptops'].includes(String(c.criterion||'').toLowerCase())),`${row.slug} treated category noun as criterion`);
}
const laptopWinner=laptop.results[0];
assert(['asus-zenbook-a14-ux3407','dell-xps-13-2026'].includes(laptopWinner.slug),`unexpected under-A$1,500 university winner ${laptopWinner.slug}`);
assert(criterion(laptopWinner,'battery')?.evidenceStatus==='VERIFIED','laptop winner battery must be evidence-backed');
assert(criterion(laptopWinner,'university')?.evidenceStatus==='VERIFIED','laptop winner university fit must be evidence-backed');
assert(Number(laptopWinner.priceBasis?.price||laptopWinner.priceBasis)<=1500,'laptop winner must respect current A$1,500 ceiling');

const robotQuery='Robot vacuum for pet hair and hard floors under $1,000.';
const robot=runtime.action41PublicDecision(robotQuery,{category:'robot-vacuums'});
assert(robot.results.length>=2,'robot benchmark should return current candidates');
assert.strictEqual(robot.results[0].slug,'eufy-robot-vacuum-omni-c28','C28 should lead X10 under A$1,000 on documented hard-floor + pet-hair evidence');
assert.strictEqual(criterion(robot.results[0],'hard-floor')?.evidenceStatus,'VERIFIED','C28 hard-floor trace missing');
assert.strictEqual(criterion(robot.results[0],'pet-hair')?.evidenceStatus,'VERIFIED','C28 pet-hair trace missing');
assert(Number(robot.results[0].priceBasis?.price||robot.results[0].priceBasis)<=1000,'robot winner must respect current A$1,000 ceiling');

const comfort=runtime.action41PublicDecision('Premium travel headphones. Comfort is the highest priority.',{category:'wireless-headphones'});
assert.strictEqual(comfort.results[0].slug,'bose-quietcomfort-ultra-headphones','v96 comfort regression');
const noSony=runtime.action41PublicDecision('Premium travel headphones. Comfort is the highest priority. Not Sony.',{category:'wireless-headphones'});
assert.strictEqual(noSony.results[0].slug,'bose-quietcomfort-ultra-headphones','Sony exclusion regression');
assert(!noSony.results.some(r=>/^sony$/i.test(r.brand)&&r.hardConstraintStatus!=='ineligible'),'excluded Sony must not survive as viable result');

const depth=snapshot.evidenceDepth;
assert.strictEqual(depth.standard,'evidence-depth-standard-v2.1');
assert.strictEqual(depth.scope,'first-wave category-specific recount');
assert.strictEqual(depth.globalAllCategoryV2Status,'NOT_YET_DEFINED_FOR_NON_MIGRATED_CATEGORIES','must not mislabel first-wave recount as global 90-category completion');
const robotDepth=depth.categories.find(row=>row.category==='robot-vacuums');
assert(robotDepth&&robotDepth.requiredCriteria.includes('hard-floor'),'robot depth standard must include hard-floor evidence');
const laptopDepth=depth.categories.find(row=>row.category==='laptops');
assert(laptopDepth&&laptopDepth.requiredCriteria.includes('battery'),'laptop depth standard must include battery evidence');

assert.strictEqual(engine.publicDecision,runtime.action41PublicDecision,'Decision Lab/shared engine must use v97 public decision contract');
const scoutResult=scout.buildResponse({text:'Recommend a robot vacuum for pet hair and hard floors under $1,000.',pageContext:{path:'/decision-lab/',categorySlug:'robot-vacuums'}});
assert(scoutResult.products&&scoutResult.products.length,'Scout recommendation benchmark returned no products');
assert.strictEqual(scoutResult.products[0].slug,robot.results[0].slug,'Scout winner diverges from Decision Lab/shared engine');
const compareResult=scout.buildResponse({text:'Which suits me better for pet hair and hard floors under $1,000?',pageContext:{path:'/compare/custom/?products=eufy-robot-vacuum-omni-c28,eufy-x10-pro-omni',categorySlug:'robot-vacuums',comparisonProductSlugs:['eufy-robot-vacuum-omni-c28','eufy-x10-pro-omni']},references:['eufy-robot-vacuum-omni-c28','eufy-x10-pro-omni']});
assert.strictEqual(compareResult.intent,'product_comparison');
assert(/Omni C28/i.test(compareResult.message),'comparison winner diverges from shared engine trace');

console.log(JSON.stringify({
  ok:true,version:snapshot.version,
  entityReviewed:snapshot.entityIntegrity.reviewed,entityResolved:snapshot.entityIntegrity.resolved,entityOpen:snapshot.entityIntegrity.open,openSlugs,
  laptopWinner:laptop.results[0].slug,laptopCoverage:laptop.audit.topCriterionCoverage,
  robotWinner:robot.results[0].slug,robotCoverage:robot.audit.topCriterionCoverage,
  comfortWinner:comfort.results[0].slug,
  firstWaveDepth:{products:depth.products,strong:depth.strong,below:depth.below,strongPct:depth.strongPct,categories:depth.categories.map(c=>({category:c.category,strong:c.strong,products:c.products,strongPct:c.strongPct}))},
  scoutWinner:scoutResult.products[0].slug,comparisonMessage:compareResult.message
},null,2));
