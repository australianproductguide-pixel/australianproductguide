'use strict';
const assert=require('assert');
const data=require('../data');
const batch=require('../data/catalogue-evidence-enrichment-v118');
assert.strictEqual(batch.VERSION,'118.0');
assert.deepStrictEqual(data.evidenceEnrichmentV118Result.missing,[],'Every v118 target must resolve to a maintained product');
assert.strictEqual(data.evidenceEnrichmentV118Result.applied.length,2,'v118 first batch should apply to two bread makers');
const bySlug=new Map(data.products.map(p=>[p.slug,p]));
for(const slug of data.evidenceEnrichmentV118Result.applied){
  const p=bySlug.get(slug);assert(p,`Missing ${slug}`);
  assert.strictEqual(p.catalogueEvidenceEnrichmentVersion,'118.0');
  assert.strictEqual(p.evidenceTier,'deep');
  assert.strictEqual(p.testingStatus,'Desk-researched against exact Australian manufacturer product/specification evidence; no hands-on testing claimed.');
  assert.strictEqual(p.lastSourceVerification,'2026-08-29');
  assert((p.evidenceSources||[]).some(s=>String(s&&s.sourceType||'').startsWith('manufacturer-au')),'Must retain Australian manufacturer evidence');
  assert(p.factEvidence&&p.factEvidence.loafSize&&p.factEvidence.programs&&p.factEvidence.timer&&p.factEvidence.footprint&&p.factEvidence.cleaning,'Bread-maker decision evidence must cover size, programs, timer, footprint and cleaning');
  assert((p.specs||[]).length>=10,'Product must expose substantial structured specifications');
}
const yr=bySlug.get('panasonic-sd-yr2550-bread-maker');
assert.strictEqual(yr.model,'SD-YR2550SST');
assert(/yeast dispenser/i.test(yr.factEvidence.ingredientDispensing.value));
const r=bySlug.get('panasonic-sd-r2530-bread-maker');
assert.strictEqual(r.model,'SD-R2530KST');
assert(/no automatic yeast dispenser/i.test(r.factEvidence.ingredientDispensing.value));
assert(!(r.verifiedRetailers||[]).some(x=>x.url==='https://store.apac.panasonic.com/au/sd-r2530wst.html'&&/exact.*KST/i.test(String(x.note||''))),'Colour sibling must never be represented as exact KST retailer binding');
console.log(JSON.stringify({ok:true,version:batch.VERSION,applied:data.evidenceEnrichmentV118Result.applied,models:data.evidenceEnrichmentV118Result.applied.map(slug=>({slug,model:bySlug.get(slug).model}))},null,2));
