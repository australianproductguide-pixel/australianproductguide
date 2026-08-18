const assert=require('assert');
const {products,categories}=require('../data');
const graph=require('../lib/product-intelligence-v41');
const observability=require('../lib/intelligence-observability-v27');
const pass5=require('../data/catalogue-v27-retailers-pass5');

let passed=0;
function check(name,fn){
  try{fn();passed++;console.log('PASS',name)}
  catch(err){console.error('FAIL',name,'-',err.message);process.exitCode=1}
}

check('catalogue truth remains 482 / 90 / 178',()=>{
  const x=graph.graphSummary();
  assert.equal(products.length,482);
  assert.equal(Object.keys(categories).length,90);
  assert.equal(x.products,482);
  assert.equal(x.categories,90);
  assert.equal(x.brands,178);
});

check('pass 5 materially raises exact Australian retailer depth',()=>{
  const x=observability.retailerSnapshot();
  assert.ok(x.exactOfferCount>=52,`expected >=52 exact offers, got ${x.exactOfferCount}`);
  assert.ok(x.productsWithExactOffers>=46,`expected >=46 products with exact offers, got ${x.productsWithExactOffers}`);
  assert.ok(x.independentRetailerOfferCount>=41,`expected >=41 independent retailer offers, got ${x.independentRetailerOfferCount}`);
  assert.ok(x.manufacturerDirectOfferCount>=11,`expected >=11 manufacturer-direct offers, got ${x.manufacturerDirectOfferCount}`);
  assert.ok(x.independentOrDirectOfferCount>=52,`expected >=52 independent-or-direct offers, got ${x.independentOrDirectOfferCount}`);
  assert.ok(x.verifiedRetailers>=20,`expected >=20 verified retailer/manufacturer sources, got ${x.verifiedRetailers}`);
});

check('pass 5 closes five high-intent category coverage gaps',()=>{
  const x=observability.retailerSnapshot();
  for(const category of ['soundbars','projectors','gaming-monitors','gaming-headsets','webcams']){
    assert.ok(x.byCategory[category],`missing retailer summary for ${category}`);
    assert.ok(x.byCategory[category].exactOffers>=1,`expected exact offer coverage for ${category}`);
  }
  assert.ok(x.byCategory.soundbars.exactOffers>=2,'soundbars should expose at least two exact destinations');
  assert.ok(x.byCategory.projectors.exactOffers>=2,'projectors should expose at least two exact destinations');
  assert.ok(x.byCategory['gaming-headsets'].exactOffers>=2,'gaming headsets should expose at least two exact destinations');
  assert.ok(x.byCategory.webcams.exactOffers>=2,'webcams should expose at least two exact destinations');
});

check('every pass 5 record is exact-model, non-affiliate and price/stock neutral',()=>{
  const seen=new Set();
  let rows=0;
  for(const [slug,offers] of Object.entries(pass5.OFFERS)){
    const product=products.find(p=>p.slug===slug);
    assert.ok(product,`missing maintained product ${slug}`);
    for(const offer of offers){
      rows++;
      assert.equal(offer.exactModel,true,`${slug} must be exact model`);
      assert.equal(offer.affiliate,false,`${slug} retailer observation must be non-affiliate`);
      assert.equal(offer.price,null,`${slug} must not copy an unmaintained price`);
      assert.equal(offer.availability,'listing-verified',`${slug} must not imply live stock`);
      assert.ok(offer.variant,`${slug} requires variant/model identity`);
      assert.match(offer.url,/^https:\/\//);
      assert.ok(!seen.has(offer.url),`duplicate pass5 URL ${offer.url}`);
      seen.add(offer.url);
      assert.ok((product.offers||[]).some(x=>x.url===offer.url&&x.retailer===offer.retailer),`${slug} overlay did not reach maintained product`);
    }
  }
  assert.equal(rows,9,'pass 5 should contain nine reviewed exact destinations');
});

check('retailer participation remains zero recommendation weight',()=>{
  const x=observability.snapshot();
  assert.equal(x.recommendation.affiliateRecommendationWeight,0);
  assert.equal(x.retailers.exactOfferCount>=52,true);
});

if(process.exitCode)process.exit(process.exitCode);
console.log(`RETAILER_DEPTH_PASS5_QA=${passed}_CHECKS_PASS`);
