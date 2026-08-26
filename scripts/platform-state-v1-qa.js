'use strict';

const assert=require('node:assert/strict');
const runtime=require('../lib/action5-catalogue-certification-v106-runtime');

const env={
  VERCEL_GIT_COMMIT_SHA:'0123456789abcdef0123456789abcdef01234567',
  VERCEL_GIT_COMMIT_REF:'apg/action1-platform-state-v1',
  VERCEL_ENV:'preview',
  VERCEL_URL:'example-preview.vercel.app'
};
const snap=runtime.platformStateSnapshot(env);

assert.equal(runtime.PLATFORM_STATE_VERSION,'1.0');
assert.equal(runtime.PLATFORM_STATE_ENDPOINT,'/api/platform-state');
assert.equal(snap.schemaVersion,'platform-state-v1.0');
assert.equal(snap.stateType,'RUNTIME_DERIVED');
assert.equal(snap.authority.canonicalDomain,'australianproductguide.au');
assert.equal(snap.authority.selfCertification,false,'runtime facts must never self-certify a release');
assert.equal(snap.authority.postDeployCertificationRequired,true,'exact Production post-deploy certification remains mandatory');

assert.equal(snap.release.gitSha,env.VERCEL_GIT_COMMIT_SHA);
assert.equal(snap.release.gitRef,env.VERCEL_GIT_COMMIT_REF);
assert.equal(snap.release.environment,'preview');
assert.equal(snap.release.deploymentHost,env.VERCEL_URL);
assert.equal(snap.release.outerRuntimeControl,'amazon-catalogue-certification-v106.0');

assert.equal(snap.catalogue.products,482);
assert.equal(snap.catalogue.categories,90);
assert.equal(snap.catalogue.brands,178);

assert.ok(snap.evidence,'Action 4 evidence state must be inherited through the current runtime lineage');
assert.equal(snap.evidence.categoryDecisionSchemaVersion,'category-decision-schema-v2.2');
assert.equal(snap.evidence.evidenceDepthStandardVersion,'evidence-depth-standard-v2.2');
assert.equal(snap.evidence.categories,90);
assert.equal(snap.evidence.schemaDefinedCategories,90);
assert.equal(snap.evidence.products,482);
assert.equal(snap.evidence.strong,61);
assert.equal(snap.evidence.belowStrong,421);
assert.equal(snap.evidence.strongPct,12.7);
assert.equal(snap.evidence.backlogStatus,'ONGOING_MAINTENANCE');

assert.ok(snap.retailer,'Action 5 retailer certification state must be present');
assert.equal(snap.retailer.catalogueCertificationVersion,'106.0');
assert.equal(snap.retailer.catalogueStatus,'NOT_CERTIFIED');
assert.equal(snap.retailer.exactVerified,20);
assert.equal(snap.retailer.verifiedVariation,13);
assert.equal(snap.retailer.totalVerifiedDirect,33);
assert.equal(snap.retailer.searchFallback,448);
assert.equal(snap.retailer.noSuitableAmazonDestination,1);
assert.equal(snap.retailer.brokenOrUncontrolled,0);
assert.equal(snap.retailer.affiliateTagIntegrityPct,100);
assert.equal(snap.retailer.documentedFallbackExceptions,3);
assert.equal(snap.retailer.investigationRequired,445);

assert.equal(snap.controls.hardConstraintFallbackVersion,'103.6');
assert.equal(snap.controls.categorySchemaGate,'GREEN');
assert.equal(snap.controls.retailerCatalogueGate,'NOT_CERTIFIED');
assert.equal(snap.controls.retailerStructuralErrorsZero,true);
assert.equal(snap.controls.retailerRecommendationCommercialNeutrality,true);
assert.equal(snap.controls.shallowCatalogueExpansion,'PAUSED_UNTIL_EVIDENCE_DEPTH_IMPROVES');
assert.equal(snap.controls.complexityGuardrail,'ACTIVE');

console.log('APG platform state v1 QA PASS: canonical runtime facts reconcile without self-certifying Production.');
