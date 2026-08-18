const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {products,categories}=require('../data');
const graph=require('../lib/product-intelligence-v41');
const observability=require('../lib/intelligence-observability-v27');
const runtime=require('../lib/evidence-commerce-depth-v27');
const v27Retailers=require('../data/catalogue-v27-retailers');

let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name)}catch(err){console.error('FAIL',name,'-',err.message);process.exitCode=1}}

check('canonical catalogue truth remains 482 / 90 / 178',()=>{
  const x=graph.graphSummary();
  assert.equal(products.length,482);
  assert.equal(Object.keys(categories).length,90);
  assert.equal(x.products,482);
  assert.equal(x.categories,90);
  assert.equal(x.brands,178);
});

check('v27 retailer overlay materially deepens exact Australian destinations without catalogue expansion',()=>{
  const x=observability.retailerSnapshot();
  assert.ok(x.exactOfferCount>=19,`expected at least 19 exact offers, got ${x.exactOfferCount}`);
  assert.ok(x.productsWithExactOffers>=17,`expected at least 17 products with exact offers, got ${x.productsWithExactOffers}`);
  assert.ok(x.independentRetailerOfferCount>=9,`expected at least 9 independent retailer offers, got ${x.independentRetailerOfferCount}`);
  assert.ok(x.verifiedRetailers>=8,`expected broad retailer/manufacturer set, got ${x.verifiedRetailers}`);
});

check('new v27 retailer evidence is exact-model, non-affiliate and does not fabricate price or stock',()=>{
  const seen=new Set();let rows=0;
  for(const [slug,offers] of Object.entries(v27Retailers.OFFERS)){
    assert.ok(products.some(p=>p.slug===slug),`missing product ${slug}`);
    for(const offer of offers){
      rows++;
      assert.equal(offer.exactModel,true);
      assert.equal(offer.affiliate,false);
      assert.equal(offer.price,null,'new independent/direct retailer observations must not copy an unmaintained price');
      assert.equal(offer.availability,'listing-verified');
      assert.match(offer.url,/^https:\/\//);
      assert.ok(offer.variant,'variant/configuration identity is required');
      assert.ok(!seen.has(offer.url),`duplicate v27 offer URL ${offer.url}`);
      seen.add(offer.url);
    }
  }
  assert.equal(rows,10,'v27 should add the reviewed ten exact Australian destinations');
});

check('retailer participation remains zero recommendation weight',()=>{
  const x=observability.snapshot();
  assert.equal(x.recommendation.affiliateRecommendationWeight,0);
  assert.equal(x.retailers.exactOfferCount>=19,true);
});

check('imagery governance reports truth and produces an exact-model acquisition queue without publishing unlicensed images',()=>{
  const x=observability.imagerySnapshot();
  assert.equal(x.total,482);
  assert.equal(x.invalid,0);
  assert.equal(x.verified,0,'do not claim verified photography before rights-backed mappings exist');
  assert.equal(x.coveragePct,0);
  assert.equal(x.acquisition.exactAmazonIdentityReady,23,'all verified exact Amazon identities should be ready for an approved image delivery mechanism');
  assert.equal(x.acquisition.verifiedImageMappings,0);
  assert.match(x.acquisition.publicationRule,/not image permission/i);
  assert.ok(x.priority.some(row=>row.gap>0),'high-intent image acquisition gap must remain visible');
});

check('Scout benchmark suite passes deterministic buying scenarios',()=>{
  const x=observability.scoutEvaluation();
  assert.equal(x.total,5);
  assert.equal(x.passed,5,JSON.stringify(x.scenarios,null,2));
  assert.equal(x.pass,true);
});

check('governed observability release gate passes and forbids uncontrolled learning',()=>{
  const x=observability.snapshot();
  assert.equal(x.releaseGate.pass,true,JSON.stringify(x.releaseGate,null,2));
  assert.equal(x.searchLearning.externalVectorDatabase,false);
  assert.equal(x.searchLearning.externalSearchProvider,false);
  assert.equal(x.searchLearning.rawSearchTextTelemetry,false);
  assert.equal(x.governance.productionSelfModification,false);
  assert.equal(x.governance.humanApprovalForModelChange,true);
  assert.deepEqual(x.governance.loop,['OBSERVE','IDENTIFY','PROPOSE','EVALUATE','APPROVE','DEPLOY','MONITOR','RETAIN_OR_ROLLBACK']);
});

check('v27 HTML enhancement is idempotent and preserves v26',()=>{
  const base='<!doctype html><html><head></head><body data-cohesion-v26="true"><main><section></section><section class="section apg-national-shortcuts"></section></main></body></html>';
  const once=runtime.enhance(base,'https://australianproductguide.au/categories/laptops/');
  const twice=runtime.enhance(once,'https://australianproductguide.au/categories/laptops/');
  assert.equal((twice.match(/evidence-commerce-depth-v27\.css/g)||[]).length,1);
  assert.equal((twice.match(/evidence-commerce-depth-v27\.js/g)||[]).length,1);
  assert.equal((twice.match(/data-evidence-commerce-v27="true"/g)||[]).length,1);
  assert.equal((twice.match(/apg-v27-coverage-note/g)||[]).length,1);
  assert.match(twice,/data-cohesion-v26="true"/);
});

check('privacy disclosure explicitly limits v27 feature telemetry',()=>{
  const base='<!doctype html><html><head></head><body><main><h2 id="search">8. Search, comparison and recent activity</h2></main></body></html>';
  const out=runtime.enhance(base,'https://australianproductguide.au/privacy/');
  assert.match(out,/Feature-outcome analytics/);
  assert.match(out,/does not intentionally send free-text shopping queries/);
  assert.match(out,/account identifiers/);
  assert.equal((out.match(/data-v27-analytics-disclosure/g)||[]).length,1);
});

check('client telemetry respects existing analytics consent and stores structured session context only',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../public/assets/evidence-commerce-depth-v27.js'),'utf8');
  assert.match(js,/window\.__apgGaLoaded/);
  assert.match(js,/sessionStorage/);
  assert.match(js,/Forget session context/);
  assert.doesNotMatch(js,/localStorage\.setItem\([^)]*scout/i);
  assert.doesNotMatch(js,/rawConversation|conversationText|messageHistory/);
  assert.match(js,/apg_search_outcome/);
  assert.match(js,/apg_scout_outcome/);
  assert.match(js,/apg_retailer_click/);
});

check('README catalogue snapshot is executable source-of-truth control',()=>{
  const readme=fs.readFileSync(path.join(__dirname,'../README.md'),'utf8');
  assert.match(readme,/APG_CATALOGUE_SNAPSHOT_START/);
  assert.match(readme,/\*\*482 maintained products\*\*/);
  assert.match(readme,/\*\*90 populated categories\*\*/);
  assert.match(readme,/\*\*178 represented brands\*\*/);
  assert.match(readme,/Evidence & Commerce Depth v27/);
});

if(process.exitCode)process.exit(process.exitCode);
console.log(`EVIDENCE_COMMERCE_DEPTH_V27_QA=${passed}_CHECKS_PASS`);
