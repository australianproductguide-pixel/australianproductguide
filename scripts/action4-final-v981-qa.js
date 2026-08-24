'use strict';
const assert=require('assert');
const runtime=require('../lib/action4-final-v981');
const {products,categories}=require('../data');
const snap=runtime.action4FinalSnapshot();

assert.strictEqual(snap.version,'98.1');
assert.strictEqual(snap.schemaVersion,'category-decision-schema-v2.2');
assert.strictEqual(snap.categoryDecisionSchemaVersion,'category-decision-schema-v2.2');
assert.strictEqual(snap.evidenceDepth.schemaVersion,'category-decision-schema-v2.2');
assert.strictEqual(snap.evidenceDepthStandardVersion,'evidence-depth-standard-v2.2');
assert.strictEqual(snap.evidenceDepth.standard,'evidence-depth-standard-v2.2');
assert.strictEqual(products.length,482,'maintained catalogue count changed unexpectedly');
assert.strictEqual(Object.keys(categories).length,90,'maintained category count changed unexpectedly');

assert.strictEqual(snap.entityIntegrity.reviewed,24);
assert.strictEqual(snap.entityIntegrity.resolved,24);
assert.strictEqual(snap.entityIntegrity.open,0);
for(const slug of ['russell-hobbs-steam-genie-handheld-garment-steamer','wahl-stainless-steel-lithium-ion-beard-trimmer']){
  const row=snap.entityIntegrity.rows.find(x=>x.slug===slug);assert(row,slug);assert(/^RESOLVED/.test(row.resolution),`${slug} must be lifecycle-resolved`);assert.notStrictEqual(row.eligibility,'CURRENT_RECOMMENDABLE',`${slug} must not become a current recommendation`);
}

assert.strictEqual(snap.commerceRevalidation.reviewed,9);
assert.strictEqual(snap.commerceRevalidation.complete,9);
assert.strictEqual(snap.commerceRevalidation.pending,0);
for(const row of snap.commerceRevalidation.rows){
  const product=products.find(p=>p.slug===row.slug);assert(product,row.slug);assert.strictEqual(product.entityRetailerRevalidationRequired,false,`${row.slug} should have a completed revalidation conclusion`);assert(product.entityRetailerRevalidationStatus.startsWith('REVALIDATED_'),`${row.slug} missing revalidation status`);
}

assert.strictEqual(snap.evidenceDepth.categoryCount,90);
assert.strictEqual(snap.evidenceDepth.schemaDefinedCategories,90,'every maintained category needs decision-depth requirements');
assert.strictEqual(snap.evidenceDepth.products,482,'full-estate v2.2 recount must cover all products');
assert.strictEqual(snap.evidenceDepth.firstWave.products,47);
assert.strictEqual(snap.evidenceDepth.firstWave.strong,14,'first-wave strong count must not regress');
assert(Array.isArray(snap.evidenceDepth.priorityGapBacklog));
assert(snap.evidenceDepth.priorityGapBacklog.length>0,'full-estate recount must expose the remaining evidence backlog rather than hide it');
for(const row of snap.evidenceDepth.categories){assert(row.requiredCriteria.length>0,`${row.category} has no evidence requirements`);assert.strictEqual(row.products,(categories[row.category]?.products||[]).length,`${row.category} census count mismatch`);}

const expected={
  laptopUniversity:'asus-zenbook-a14-ux3407',
  robotPetHardFloor:'eufy-robot-vacuum-omni-c28',
  headphoneComfort:'bose-quietcomfort-ultra-headphones',
  headphoneAnc:'bose-quietcomfort-ultra-headphones',
  televisionBrightSport:'hisense-75u6sau-75-inch-u6s-uled-miniled-tv',
  coffeeBeginner:'breville-barista-express-impress-bes876'
};
for(const scenario of snap.parity.scenarios){assert(scenario.category,`${scenario.name} missing category binding`);assert(scenario.winner,`${scenario.name} missing winner`);assert.strictEqual(scenario.winner,expected[scenario.name],`${scenario.name} benchmark regressed`);assert(scenario.traceHash,`${scenario.name} missing shared trace`);}
assert.strictEqual(snap.perCategoryDemand.status,'NOT_YET_MEASURED');
assert.strictEqual(snap.action4Gate.checks.authoritativeSchemaSignal,true,'authoritative v2.2 schema signals must reconcile');
assert.strictEqual(snap.action4Gate.status,'GREEN',`Action 4 final gate blockers: ${(snap.action4Gate.blockers||[]).join(', ')}`);
assert.strictEqual(snap.action4Gate.evidenceBacklogStatus,'ONGOING_MAINTENANCE');

console.log(JSON.stringify({ok:true,version:snap.version,schemaVersion:snap.schemaVersion,depthStandard:snap.evidenceDepthStandardVersion,gate:snap.action4Gate.status,entities:{reviewed:snap.entityIntegrity.reviewed,resolved:snap.entityIntegrity.resolved,open:snap.entityIntegrity.open},commerce:{reviewed:snap.commerceRevalidation.reviewed,complete:snap.commerceRevalidation.complete,exactDestinations:snap.commerceRevalidation.exactDestinationCount,noExactCurrentDestination:snap.commerceRevalidation.noExactCurrentDestinationCount},depth:{categories:snap.evidenceDepth.categoryCount,products:snap.evidenceDepth.products,strong:snap.evidenceDepth.strong,below:snap.evidenceDepth.below,strongPct:snap.evidenceDepth.strongPct,firstWave:snap.evidenceDepth.firstWave,topGaps:snap.evidenceDepth.priorityGapBacklog.slice(0,10)},parity:snap.parity.scenarios.map(s=>({name:s.name,winner:s.winner,category:s.category})),demand:snap.perCategoryDemand.status},null,2));
