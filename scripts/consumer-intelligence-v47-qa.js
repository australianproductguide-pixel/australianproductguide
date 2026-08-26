'use strict';
const assert=require('node:assert/strict');

// Install the v47 runtime patches before loading the shared decision/search/Scout
// consumers so this QA exercises the same contract Production will use.
const runtime=require('../lib/consumer-intelligence-v47-runtime');
const engine=require('../lib/decision-engine-v4');
const search=require('../lib/search-v4');
const scout=require('../lib/scout-concierge-v5-runtime').core;
const finalLayer=require('../lib/consumer-intelligence-v47');
const observability=require('../lib/intelligence-observability-v27');
const images=require('../data/product-images');
const categoryImages=require('../data/category-editorial-images-v45');
const categoryReview=require('../data/category-editorial-final-review-v45.json');
const creators=require('./amazon-creators-image-import-v28');
const {products,categories}=require('../data');

let passed=0;
function check(name,fn){try{fn();passed++;console.log('PASS',name);}catch(err){console.error('FAIL',name,'-',err.message);process.exitCode=1;}}

check('all maintained categories retain reviewed editorial imagery',()=>{
  assert.equal(Object.keys(categories).length,90);
  assert.equal(Object.keys(categoryImages).length,Object.keys(categories).length);
  assert.equal(categoryReview.summary?.categories,90);
  assert.equal(categoryReview.summary?.reviewRequired,0);
  assert.deepEqual(Object.keys(categoryImages).sort(),Object.keys(categories).sort());
});

check('verified product-image registry remains rights and identity gated',()=>{
  let verified=0;
  for(const product of products){
    const record=images.imageFor(product);if(!record)continue;
    const errors=images.validationErrors(product,record);
    assert.equal(errors.length,0,`${product.slug}: ${errors.join(', ')}`);
    if(record.imageStatus==='verified')verified++;
  }
  const exact=[...creators.exactAmazonMap().keys()][0];
  assert.ok(exact,'at least one exact Amazon identity should be available for future authorised image ingestion');
  const report=creators.report({ItemsResult:{Items:[{ASIN:exact,Images:{Primary:{Large:{URL:'https://example.invalid/approved-api-image.jpg'}}}}]}},{verifiedAt:'2026-08-20'});
  assert.equal(report.automaticPublication,false);
  assert.equal(report.candidateCount,1);
  const candidate=Object.values(report.candidates)[0];
  assert.equal(candidate.image_status,'needs_review');
  assert.equal(candidate.image_verified,false);
  assert.equal(candidate.image_product_match,'exact');
  assert.equal(candidate.image_link_url,candidate.amazon_affiliate_url);
  assert.ok(verified>=0);
});

check('verified multi-retailer Australian depth stays above the current release floor',()=>{
  const x=observability.retailerSnapshot();
  assert.ok(x.exactOfferCount>=57,`expected >=57 exact destinations, got ${x.exactOfferCount}`);
  assert.ok(x.productsWithExactOffers>=51,`expected >=51 products with exact destinations, got ${x.productsWithExactOffers}`);
  assert.ok(x.verifiedRetailers>=23,`expected >=23 verified retailer/manufacturer sources, got ${x.verifiedRetailers}`);
  assert.ok(x.independentOrDirectOfferCount>=57,'retailer participation must remain identity-controlled rather than inferred');
});

check('hard constraints still dominate the exact 75-inch consumer benchmark',()=>{
  const q='TV must be exactly 75 inches for a bright living room, sport and Netflix under $2500';
  const d=engine.publicDecision(q,{category:'televisions'}),top=d.results?.[0];
  assert.equal(d.consumerIntelligenceVersion,'consumer-decision-v47');
  assert.equal(d.commercialRecommendationWeight,0);
  assert.equal(top?.slug,'hisense-75u6sau-75-inch-u6s-uled-miniled-tv');
  assert.equal(top?.hardConstraintStatus,'eligible');
  assert.ok(Number(top?.priceBasis)<=2500);
  assert.ok(Array.isArray(top?.criteria)&&top.criteria.length>=3,'criterion trace must be consumer-visible data');
  assert.ok(top?.criterionCoverage&&Number.isFinite(top.criterionCoverage.coveragePct));
  assert.equal(Object.prototype.hasOwnProperty.call(top||{},'score'),false,'internal score must not leak into the public API');
  assert.equal(d.learningSignals.rawQueryPersisted,false);
  assert.equal(d.learningSignals.productionSelfModification,false);
  assert.doesNotMatch(JSON.stringify(d.learningSignals),/bright living room/i,'learning signal must not contain the raw shopping brief');
});

check('soft target budgets influence fit without becoming false hard ceilings',()=>{
  const d=engine.publicDecision('75 inch TV around $2300 for a bright living room, sport and Netflix',{category:'televisions'}),top=d.results?.[0];
  assert.equal(d.decisionState?.budget?.hard,false);
  assert.equal(top?.slug,'hisense-75u6sau-75-inch-u6s-uled-miniled-tv');
  assert.ok((top?.reasons||[]).some(x=>/target budget/i.test(x)),'target-budget explanation should be explicit');
  assert.ok((top?.criteria||[]).some(x=>x.key==='target-budget'&&['aligned','gap'].includes(x.status)));
});

check('brand preference remains a soft preference rather than a commercial shortcut',()=>{
  const d=engine.publicDecision('Sony noise cancelling headphones for flights',{category:'wireless-headphones'}),top=d.results?.[0];
  assert.equal(top?.brand,'Sony');
  assert.ok((top?.reasons||[]).some(x=>/brand preference/i.test(x)));
  assert.equal(d.commercialRecommendationWeight,0);
});

check('Search uses the same hard-constraint decision contract',()=>{
  const s=search.searchSite('TV must be exactly 999 inches');
  assert.equal(s.version,'search-ranking-v4');
  assert.equal(s.zeroResult?.reason,'hard-constraint-no-match');
  assert.equal(s.products.length,0);
  assert.equal(s.queryUnderstanding?.hardConstraints,true);
});

check('Scout carries a shopping brief into Decision Lab and APG Search',()=>{
  const s=scout.buildResponse({text:'I need noise cancelling headphones for flights under $800',pageContext:{path:'/search/?q=noise-cancelling-headphones'}});
  assert.equal(s.meta?.intelligenceVersion,runtime.VERSION);
  assert.equal(s.meta?.commercialRecommendationWeight,0);
  assert.equal(s.learningSignals?.rawConversationPersisted,false);
  assert.equal(s.learningSignals?.productionSelfModification,false);
  assert.ok((s.actions||[]).some(x=>String(x.url||'').startsWith('/decision-lab/?q=')),'Scout should preserve the brief when handing off to Decision Lab');
  assert.ok((s.actions||[]).some(x=>String(x.url||'').startsWith('/search/?q=')),'Scout should preserve the brief when handing off to Search');
});

check('Scout product questions expose a direct route into a close comparison',()=>{
  const s=scout.buildResponse({text:'What should I know about this product?',pageContext:{path:'/products/sony-wh-1000xm6/'}});
  assert.equal(s.intent,'product_question');
  assert.ok((s.actions||[]).some(x=>String(x.url||'').startsWith('/compare/custom/?products=sony-wh-1000xm6')));
  assert.ok(s.meta?.closestMaintainedAlternative?.slug);
});

check('final consumer layer owns the single evidence-aware product continuity surface',()=>{
  const shell='<!doctype html><html><head></head><body><main><h1>APG</h1></main></body></html>';
  const product=finalLayer.transform(shell,new URL('https://australianproductguide.au/products/sony-wh-1000xm6/'));
  assert.match(product,/data-consumer-intelligence-v47="true"/);
  assert.match(product,/Connected decision intelligence/);
  assert.match(product,/Refine in Decision Lab/);
  assert.match(product,/category=wireless-headphones/,'product Decision Lab handoff must preserve category context');
  assert.match(product,/Compare closest alternative/);
  assert.match(product,/Ask Scout about this product/,'single product continuity panel must include page-aware Scout');
  assert.match(product,/class="ci47-actions"/,'rendered product continuity surface must use the governed action class');
  assert.match(finalLayer.CSS,/\.ci47-actions :where\(a,button\)\{[^}]*min-height:44px/,'product continuity actions must meet practical touch-target height in the canonical stylesheet contract');

  const searched=finalLayer.transform(shell,new URL('https://australianproductguide.au/search/?q=quiet+dishwasher+under+1000'));
  assert.doesNotMatch(searched,/Want a more explicit decision\?/,'v47 must not duplicate v108 Search continuity presentation');
  assert.doesNotMatch(searched,/ci47-handoff/,'v47 Search transform must leave journey presentation to v108');
  const lab=finalLayer.transform(shell,new URL('https://australianproductguide.au/decision-lab/?q=quiet+dishwasher+under+1000'));
  assert.doesNotMatch(lab,/Want to widen the discovery set\?/,'v47 must not duplicate v108 Decision Lab continuity presentation');
  assert.doesNotMatch(lab,/ci47-handoff/,'v47 Decision Lab transform must leave journey presentation to v108');

  const legacySearch=finalLayer.handoffPanel(new URL('https://australianproductguide.au/search/?q=quiet+dishwasher+under+1000'));
  assert.match(legacySearch,/\/decision-lab\/\?q=/,'compatibility helper may remain while runtime ownership is consolidated');
});

check('consumer intelligence release snapshot preserves trust controls',()=>{
  const x=finalLayer.consumerSnapshot();
  assert.equal(x.categoryImagery.coveragePct,100);
  assert.equal(x.categoryImagery.finalReviewRequired,0);
  assert.equal(x.productImagery.invalid,0);
  assert.ok(x.retailers.exactOfferCount>=57);
  assert.ok(x.retailers.productsWithExactOffers>=51);
  assert.ok(x.retailers.verifiedRetailers>=23);
  assert.equal(x.recommendation.commercialRecommendationWeight,0);
  assert.equal(x.continuousImprovement.productionSelfModification,false);
  assert.equal(x.continuousImprovement.rawSearchTextTelemetry,false);
  assert.equal(x.continuousImprovement.rawScoutTranscriptPersistence,false);
  assert.equal(x.releaseGate.pass,true);
});

if(process.exitCode)process.exit(process.exitCode);
console.log(`CONSUMER_INTELLIGENCE_V47_QA=${passed}_CHECKS_PASS`);
