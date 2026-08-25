'use strict';
const assert=require('node:assert/strict');
const runtime=require('../lib/action5-catalogue-certification-v106-runtime');
const snap=runtime.amazonCatalogueCertificationSnapshot();

assert.equal(snap.version,'106.0');
assert.equal(snap.catalogue.total,482,'maintained catalogue must reconcile to current 482-product baseline');
assert.equal(snap.amazon.exactVerified+snap.amazon.verifiedVariation+snap.amazon.searchFallback+snap.amazon.noSuitableAmazonDestination,snap.catalogue.total,'every product must have one governed Amazon/safety state');
assert.equal(snap.amazon.brokenOrUncontrolled,0,'no malformed or uncontrolled Amazon states may ship');
assert.equal(snap.amazon.affiliateTagIntegrityPct,100,'every active Amazon pathway must carry the APG Associates tag');
assert.ok(snap.amazon.totalVerifiedDirect>0,'verified direct mappings must remain present');
assert.ok(snap.investigation.investigationRequired>0,'v106 must not falsely certify unresolved fallbacks');
assert.equal(snap.status,'NOT_CERTIFIED','catalogue cannot be certified while individual fallback investigations remain unresolved');
assert.equal(snap.gate.checks.everyRemainingFallbackIndividuallyDocumented,false);
assert.equal(snap.gate.checks.everyProductInvestigated,false);
assert.equal(snap.gate.checks.safetySuppressionPreserved,true);
assert.equal(snap.gate.checks.recommendationCommercialNeutrality,true);
assert.equal(snap.gate.checks.structuralErrorsZero,true);
assert.ok(snap.remainingExceptions.every(x=>x.currentPathwayType==='SEARCH_FALLBACK'));
assert.ok(snap.remainingExceptions.every(x=>x.currentAmazonDestination&&x.affiliateTagPresent===true));
for(const x of snap.remainingExceptions.filter(x=>x.verificationStatus==='DOCUMENTED_EXCEPTION')){
  assert.ok(x.reasonDirectMappingUnavailable);
  assert.ok(Array.isArray(x.searchesPerformed)&&x.searchesPerformed.length);
  assert.ok(Array.isArray(x.evidenceChecked)&&x.evidenceChecked.length);
  assert.ok(x.lastChecked);
  assert.ok(x.nextReviewDate);
}
console.log(`APG Amazon catalogue certification v106 QA PASS: ${snap.amazon.totalVerifiedDirect} direct, ${snap.investigation.documentedFallbackExceptions} documented fallback exceptions, ${snap.investigation.investigationRequired} investigations required, ${snap.amazon.noSuitableAmazonDestination} safety-suppressed.`);
