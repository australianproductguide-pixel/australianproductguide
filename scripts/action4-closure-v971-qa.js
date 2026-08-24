'use strict';
const assert=require('assert');
const runtime=require('../lib/action4-closure-v971');
const {products}=require('../data');
const snap=runtime.action41Snapshot();
assert.strictEqual(snap.version,'97.1');
assert.strictEqual(snap.entityIntegrity.reviewed,24);
assert.strictEqual(snap.entityIntegrity.resolved,22);
assert.strictEqual(snap.entityIntegrity.open,2);
assert.strictEqual(snap.evidenceDepth.products,47);
assert.strictEqual(snap.evidenceDepth.strong,14,'first-wave v2.1 strong recount should recognise maintained laptop memory/storage evidence');
assert.strictEqual(snap.evidenceDepth.below,33);
assert.strictEqual(snap.evidenceDepth.strongPct,29.8);
const laptop=snap.evidenceDepth.categories.find(c=>c.category==='laptops');
assert(laptop);assert.strictEqual(laptop.strong,4);assert.strictEqual(laptop.strongPct,57.1);
assert.strictEqual(snap.evidenceDepth.globalAllCategoryV2Status,'NOT_YET_DEFINED_FOR_NON_MIGRATED_CATEGORIES');
for(const scenario of snap.parity.scenarios){
  assert(scenario.category,`${scenario.name} missing explicit category binding`);
  assert(scenario.winner,`${scenario.name} missing parity winner`);
  assert(scenario.traceHash,`${scenario.name} missing parity trace`);
}
const lp=snap.parity.scenarios.find(s=>s.name==='laptopUniversity');
assert.strictEqual(lp.winner,'asus-zenbook-a14-ux3407');
const robot=snap.parity.scenarios.find(s=>s.name==='robotPetHardFloor');
assert.strictEqual(robot.winner,'eufy-robot-vacuum-omni-c28');
assert.strictEqual(snap.commerceRevalidation.requiredCount,9);
for(const slug of snap.commerceRevalidation.requiredSlugs){
  const product=products.find(p=>p.slug===slug);assert(product,slug);assert.strictEqual(product.entityRetailerRevalidationRequired,true,`${slug} retailer destination must remain in revalidation state`);
}
console.log(JSON.stringify({ok:true,version:snap.version,entity:snap.entityIntegrity&&{reviewed:snap.entityIntegrity.reviewed,resolved:snap.entityIntegrity.resolved,open:snap.entityIntegrity.open},firstWaveDepth:{products:snap.evidenceDepth.products,strong:snap.evidenceDepth.strong,below:snap.evidenceDepth.below,strongPct:snap.evidenceDepth.strongPct,laptopStrong:laptop.strong,laptopPct:laptop.strongPct},parity:snap.parity.scenarios.map(s=>({name:s.name,category:s.category,winner:s.winner})),commerceRevalidation:snap.commerceRevalidation.requiredCount},null,2));
