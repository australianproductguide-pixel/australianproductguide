'use strict';
const assert=require('assert');
const data=require('../data');
assert.deepStrictEqual(data.evidenceEnrichmentV118Result.missing,[],'Every v118 target must resolve');
assert.deepStrictEqual(data.evidenceEnrichmentV119Result.missing,[],'Every v119 target must resolve');
assert.strictEqual(data.evidenceEnrichmentV118Result.applied.length,2);
assert.strictEqual(data.evidenceEnrichmentV119Result.applied.length,3);
const all=[...data.evidenceEnrichmentV118Result.applied,...data.evidenceEnrichmentV119Result.applied];
assert.strictEqual(new Set(all).size,5,'All five maintained bread makers must be uniquely enriched');
const bySlug=new Map(data.products.map(p=>[p.slug,p]));
for(const slug of all){const p=bySlug.get(slug);assert(p,`Missing ${slug}`);assert.strictEqual(p.evidenceTier,'deep');assert.strictEqual(p.lastSourceVerification,'2026-08-29');assert(p.factEvidence&&p.factEvidence.loafSize&&p.factEvidence.programs&&p.factEvidence.timer&&p.factEvidence.footprint&&p.factEvidence.cleaning,'Decision evidence incomplete');assert((p.specs||[]).length>=10,'Structured specifications too shallow');assert(!/hands-on testing claimed/i.test(p.testingStatus)||/no hands-on testing claimed/i.test(p.testingStatus),'Testing disclosure must never imply hands-on review');}
const yr=bySlug.get('panasonic-sd-yr2550-bread-maker');assert.strictEqual(yr.model,'SD-YR2550SST');assert(/yeast dispenser/i.test(yr.factEvidence.ingredientDispensing.value));
const r=bySlug.get('panasonic-sd-r2530-bread-maker');assert.strictEqual(r.model,'SD-R2530KST');assert(/no automatic yeast dispenser/i.test(r.factEvidence.ingredientDispensing.value));assert(!(r.verifiedRetailers||[]).some(x=>x.url==='https://store.apac.panasonic.com/au/sd-r2530wst.html'),'Sibling colour must not be bound as exact KST retailer');
const breville=bySlug.get('breville-the-custom-loaf-bbm800');assert.strictEqual(breville.model,'BBM800');assert(/9 custom/i.test(breville.factEvidence.programs.value));
const sunbeam=bySlug.get('sunbeam-bakehouse-bread-maker');assert.strictEqual(sunbeam.model,'BM4500');assert((sunbeam.verifiedRetailers||[]).some(x=>/target\.com\.au/.test(x.url)),'BM4500 exact AU retailer evidence expected');
const rh=bySlug.get('russell-hobbs-classics-breadmaker');assert.strictEqual(rh.model,'27260-56');assert.strictEqual((rh.verifiedRetailers||[]).length,0,'Russell Hobbs current AU retailer binding must remain unverified');assert(/current Australian retail availability not established/i.test(rh.sourceType));
console.log(JSON.stringify({ok:true,versions:[data.evidenceEnrichmentV118Result.version,data.evidenceEnrichmentV119Result.version],applied:all,models:all.map(slug=>({slug,model:bySlug.get(slug).model}))},null,2));