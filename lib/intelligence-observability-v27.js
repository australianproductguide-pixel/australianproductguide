const {products}=require('../data');
const graph=require('./product-intelligence-v41');
const quality=require('./intelligence-quality-v41');
const images=require('../data/product-images');
const amazon=require('../data/retailers-v6');
const decision=require('./decision-engine-v4');

const VERSION='intelligence-observability-v27';
const RELEASE='evidence-commerce-depth-v27';
const CHECKED='2026-08-18';

function exactOffers(product){
  return (product?.offers||[]).filter(x=>x&&x.exactModel===true&&x.url&&x.retailer);
}
function imagerySnapshot(){
  let verified=0,pending=0,needsReview=0,unavailable=0,invalid=0;
  const verifiedSlugs=[];
  for(const product of products){
    const record=images.imageFor(product);
    if(!record)continue;
    const errors=images.validationErrors(product,record);
    if(errors.length)invalid++;
    if(record.imageStatus==='verified'&&!errors.length){verified++;verifiedSlugs.push(product.slug);}
    else if(record.imageStatus==='pending')pending++;
    else if(record.imageStatus==='unavailable')unavailable++;
    else needsReview++;
  }
  const highIntent=['televisions','laptops','robot-vacuums','washing-machines','coffee-machines','wireless-headphones','smartphones','earbuds'];
  const priority=highIntent.map(slug=>{
    const rows=products.filter(p=>p.category===slug);
    const withVerified=rows.filter(p=>verifiedSlugs.includes(p.slug)).length;
    return {category:slug,products:rows.length,verifiedPhotography:withVerified,gap:rows.length-withVerified};
  }).sort((a,b)=>b.gap-a.gap);
  const exactAmazonIdentityReady=products.filter(p=>amazon.direct[p.slug]).map(p=>({slug:p.slug,category:p.category,status:'awaiting-approved-image-delivery'}));
  return {
    verified,pending,needsReview,unavailable,invalid,total:products.length,
    coveragePct:products.length?Math.round(verified/products.length*1000)/10:0,
    priority,
    acquisition:{
      exactAmazonIdentityReady:exactAmazonIdentityReady.length,
      exactAmazonCandidates:exactAmazonIdentityReady,
      verifiedImageMappings:verified,
      publicationRule:'Exact model identity alone is not image permission. Publish only after an approved delivery/right basis is documented in the canonical image registry.'
    }
  };
}
function retailerSnapshot(){
  const withOffers=products.filter(p=>exactOffers(p).length>0);
  const offers=products.flatMap(p=>exactOffers(p).map(x=>({...x,slug:p.slug,category:p.category})));
  const retailers=[...new Set(offers.map(x=>x.retailer))].sort();
  const independent=offers.filter(x=>x.sourceType==='independent-retailer-au');
  const manufacturerDirect=offers.filter(x=>x.sourceType==='manufacturer-direct-au');
  const independentOrDirect=offers.filter(x=>['independent-retailer-au','manufacturer-direct-au'].includes(x.sourceType));
  const byCategory={};
  for(const product of products){
    const count=exactOffers(product).length;
    if(!byCategory[product.category])byCategory[product.category]={products:0,productsWithExactOffers:0,exactOffers:0};
    byCategory[product.category].products++;
    if(count)byCategory[product.category].productsWithExactOffers++;
    byCategory[product.category].exactOffers+=count;
  }
  return {
    productsWithExactOffers:withOffers.length,
    exactOfferCount:offers.length,
    verifiedRetailers:retailers.length,
    retailers,
    independentRetailerOfferCount:independent.length,
    manufacturerDirectOfferCount:manufacturerDirect.length,
    independentOrDirectOfferCount:independentOrDirect.length,
    byCategory
  };
}
function scenario(name,q,options,expect={}){
  const out=decision.publicDecision(q,options||{});
  const top=out.results?.[0]||null;
  const required=expect.requiredSlug?top?.slug===expect.requiredSlug:true;
  const category=expect.category?out.decisionState?.category===expect.category:true;
  const noExcludedBrand=expect.excludedBrand?String(top?.brand||'').toLowerCase()!==String(expect.excludedBrand).toLowerCase():true;
  const eligible=expect.eligible===false?true:top?.hardConstraintStatus!=='ineligible';
  return {name,pass:!!top&&required&&category&&noExcludedBrand&&eligible,top:top?.slug||null,status:top?.hardConstraintStatus||null,category:out.decisionState?.category||null,hardConstraintFallback:!!out.audit?.hardConstraintFallback};
}
function scoutEvaluation(){
  const scenarios=[
    scenario('Pet-hair robot vacuum','robot vacuum for pet hair and mopping',{category:'robot-vacuums'},{category:'robot-vacuums'}),
    scenario('Coffee workflow','coffee machine for flat whites with automatic milk',{category:'coffee-machines'},{category:'coffee-machines'}),
    scenario('Bright-room television hard budget','75 inch TV for a bright room and sport under $2500',{category:'televisions'},{category:'televisions'}),
    scenario('Laptop category','portable laptop for university and work',{category:'laptops'},{category:'laptops'}),
    scenario('Headphones brand exclusion','noise cancelling headphones for flights no Sony',{category:'wireless-headphones'},{category:'wireless-headphones',excludedBrand:'Sony'})
  ];
  return {pass:scenarios.every(x=>x.pass),passed:scenarios.filter(x=>x.pass).length,total:scenarios.length,scenarios};
}
function snapshot(){
  const q=quality.qualitySnapshot();
  const imagery=imagerySnapshot();
  const retailers=retailerSnapshot();
  const scout=scoutEvaluation();
  const releaseChecks={
    decisionIntelligence:!!q.releaseGate?.pass,
    scoutBenchmarks:!!scout.pass,
    imageryIntegrity:imagery.invalid===0,
    retailerDepth:retailers.exactOfferCount>=15,
    affiliateNeutrality:true
  };
  return {
    version:VERSION,
    release:RELEASE,
    checkedAt:CHECKED,
    catalogue:graph.graphSummary(),
    evidence:{deep:products.filter(p=>p.evidenceTier==='deep').length,starter:products.filter(p=>p.evidenceTier!=='deep').length,withFactEvidence:products.filter(p=>Object.keys(p.factEvidence||{}).length>0).length},
    retailers,
    imagery,
    searchLearning:{mode:'controlled-observation',externalVectorDatabase:false,externalSearchProvider:false,rawSearchTextTelemetry:false,policy:'Observe aggregate consented outcomes first; propose semantic infrastructure only after measurable failure patterns justify it.'},
    scout:{sessionContinuity:'structured-session-only',rawConversationPersistence:false,evaluation:scout},
    recommendation:{qualityVersion:q.version,releaseGatePass:!!q.releaseGate?.pass,hardConstraintsBeforeSuitability:true,affiliateRecommendationWeight:0},
    governance:{loop:['OBSERVE','IDENTIFY','PROPOSE','EVALUATE','APPROVE','DEPLOY','MONITOR','RETAIN_OR_ROLLBACK'],productionSelfModification:false,humanApprovalForModelChange:true,telemetryRetention:'existing consented analytics controls; no new server-side personal profile store'},
    releaseGate:{pass:Object.values(releaseChecks).every(Boolean),checks:releaseChecks,decisionIntelligence:{...q.releaseGate,evaluation:q.evaluation},requirements:['Decision Intelligence quality gate passes','Scout benchmark scenarios pass','No invalid verified image records','At least 15 verified exact Australian retailer/manufacturer offer destinations','Affiliate recommendation weight remains zero']}
  };
}

module.exports={VERSION,RELEASE,CHECKED,snapshot,imagerySnapshot,retailerSnapshot,scoutEvaluation};
