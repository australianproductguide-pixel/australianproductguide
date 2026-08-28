'use strict';
const assert=require('node:assert/strict');
const coverage=require('../lib/catalogue-coverage-v117');
const app=require('../api/index');

function render(url){return new Promise((resolve,reject)=>{
  const headers={};const req={url,method:'GET',headers:{host:'australianproductguide.au'},on(){},destroy(){}};
  const res={statusCode:200,setHeader(k,v){headers[String(k).toLowerCase()]=v;},getHeader(k){return headers[String(k).toLowerCase()];},removeHeader(k){delete headers[String(k).toLowerCase()];},getHeaderNames(){return Object.keys(headers);},write(){return true;},end(body=''){resolve({status:this.statusCode,headers,body:String(body||'')});}};
  try{const r=app(req,res);if(r&&typeof r.then==='function')r.catch(reject);}catch(e){reject(e);}
});}

(async()=>{
  const x=coverage.snapshot();
  assert.equal(x.version,'117.0');
  assert.equal(x.status,'NOT_CERTIFIED','Whole-catalogue programme must remain explicit until product-level evidence and retailer research are complete');
  assert.equal(x.catalogue.products,482);
  assert.equal(x.catalogue.categories,90);
  assert.equal(x.catalogue.brands,178);
  assert.equal(x.catalogue.commerceEligible,470,'Current commerce gate must retain 470 eligible maintained products');
  assert.equal(x.catalogue.entityMarketLifecycleExcluded,11,'Five regional/non-AU plus six historical/lifecycle records must remain excluded');
  assert.equal(x.catalogue.safetyExcluded,1,'One recalled product must remain safety-suppressed');

  assert.equal(x.amazon.exactVerified,20,'Current exact Amazon mapping count must reconcile to Action 5');
  assert.equal(x.amazon.verifiedVariant,13,'Current verified Amazon variant count must reconcile to Action 5');
  assert.equal(x.amazon.searchFallback,448,'Current Amazon search fallback count must reconcile to Action 5');
  assert.equal(x.amazon.safetySuppressed,1);
  assert.equal(x.amazon.exactVerified+x.amazon.verifiedVariant+x.amazon.searchFallback+x.amazon.safetySuppressed,482);

  assert.equal(x.ebay.modelSpecificProductSearch,470,'Every commerce-eligible product must have the governed eBay model-specific search pathway');
  assert.equal(x.ebay.exactListingsCertified,0,'Generated eBay searches must not be upgraded into listing-level verification');
  assert.equal(x.ebay.listingLevelResearch,'INCOMPLETE');
  assert.equal(x.ebay.entityMarketLifecycleExcluded,11);
  assert.equal(x.ebay.safetyExcluded,1);

  assert.ok(x.otherAustralianRetailers.productsWithAtLeastOnePathway>=51,'Broader Australian retailer coverage must not regress below the established product floor');
  assert.ok(x.otherAustralianRetailers.productsWithExactPathway>=51,'Exact broader-retailer coverage must not regress below the established product floor');
  assert.equal(x.otherAustralianRetailers.wholeMarketCertification,'INCOMPLETE');

  assert.ok(x.evidence.firstPartyProductSourceEstablished>0,'Coverage view must detect maintained first-party manufacturer sources');
  assert.ok(x.evidence.firstPartyProductSourceEstablished<482,'Coverage view must not fabricate universal manufacturer-source completion');
  assert.equal(Object.values(x.evidence.provisionalGradeDistribution).reduce((a,b)=>a+b,0),482,'Every product requires one provisional information-quality grade');
  assert.equal(x.evidence.gradeStandard,'PROVISIONAL_SOURCE_DERIVED_INFORMATION_QUALITY_V117');
  assert.equal(x.certification.fullyCertifiedProducts,0,'No product may be marked fully certified while eBay listing-level and whole-market retailer research remain incomplete');
  assert.equal(x.certification.status,'NOT_CERTIFIED');
  assert.equal(x.certification.blockerCounts.EBAY_LISTING_LEVEL_RESEARCH_NOT_CERTIFIED,470,'Every commerce-eligible product must expose the current eBay listing-research gap');

  assert.equal(x.products.length,482);
  const slugs=new Set(x.products.map(row=>row.slug));assert.equal(slugs.size,482,'Coverage matrix must contain one unique row per maintained product');
  for(const row of x.products){
    assert.ok(row.url.endsWith(`/products/${row.slug}/`));
    assert.ok(row.brand&&row.productName&&row.category,'Coverage rows require canonical identity fields');
    assert.equal(row.amazon.recommendationWeight,0);
    if(row.amazon.url)assert.equal(row.amazon.affiliateTagPresent,true,`${row.slug} Amazon path must preserve APG tag`);
    if(row.ebay){assert.equal(row.ebay.recommendationWeight,0);assert.equal(row.ebay.exactModel,false);assert.equal(row.ebay.trackingValid,true,`${row.slug} eBay path must preserve EPN tracking`);}
    assert.ok(['A','B','C','D','E'].includes(row.informationQuality.grade));
    assert.equal(row.informationQuality.externallyCertified,false,'Provisional source grade must never masquerade as external product certification');
  }

  const recalled=x.products.find(row=>row.slug==='anker-power-bank-20000mah-22-5w');
  assert.ok(recalled);
  assert.equal(recalled.certification.status,'EXCLUDED_SAFETY');
  assert.equal(recalled.amazon.pathwayType,'safety-suppressed');
  assert.equal(recalled.ebay,null);
  assert.equal(recalled.officialEvidence.status,'VERIFIED_FIRST_PARTY_DOMAIN');
  assert.match(recalled.officialEvidence.source.url,/anker\.com\/au\/a1647-recall/);

  const response=await render(coverage.ENDPOINT);
  assert.equal(response.status,200,'Catalogue coverage endpoint must render');
  assert.equal(response.headers['content-type'],'application/json; charset=utf-8');
  assert.equal(response.headers['cache-control'],'no-store');
  assert.equal(response.headers['x-apg-catalogue-coverage'],'v117.0');
  const body=JSON.parse(response.body);assert.equal(body.catalogue.products,482);assert.equal(body.status,'NOT_CERTIFIED');

  console.log(`CATALOGUE_COVERAGE_V117_GREEN products=${x.catalogue.products} categories=${x.catalogue.categories} brands=${x.catalogue.brands} commerceEligible=${x.catalogue.commerceEligible} officialFirstParty=${x.evidence.firstPartyProductSourceEstablished} amazon=${x.amazon.exactVerified}/${x.amazon.verifiedVariant}/${x.amazon.searchFallback}/${x.amazon.safetySuppressed} ebaySearch=${x.ebay.modelSpecificProductSearch} otherRetailerProducts=${x.otherAustralianRetailers.productsWithAtLeastOnePathway} exactOtherRetailerProducts=${x.otherAustralianRetailers.productsWithExactPathway} verifiedImages=${x.imagery.verifiedExactProductPhotography} fullyCertified=${x.certification.fullyCertifiedProducts} status=${x.status}`);
})().catch(error=>{console.error(error.stack||error);process.exit(1);});
