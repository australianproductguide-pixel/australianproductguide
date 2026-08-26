const base=require('./product-intelligence-v4');
const {products,categories}=require('../data');
const {DEPTH_VERSION,TARGET_CATEGORIES}=require('../data/catalogue-v41-depth');
const retailerVerification=require('../data/retailer-verifications-v109');

function product(slug){return products.find(p=>p.slug===slug)||null;}
function resolvedOffer(o,slug){return retailerVerification.resolve(slug,o||{});}
function currentOffer(o,slug){
  const offer=resolvedOffer(o,slug);
  if(!offer||!offer.checkedAt)return false;
  const due=String(offer.reviewDue||'');
  const today=new Date().toISOString().slice(0,10);
  return !due||due>=today;
}
function offerView(o,slug){const offer=resolvedOffer(o,slug);return {retailer:offer.retailer||null,url:offer.url||null,price:Number(offer.price)>0?Number(offer.price):null,currency:offer.currency||'AUD',availability:offer.availability||'unknown',checkedAt:offer.checkedAt||null,reviewDue:offer.reviewDue||null,exactModel:!!offer.exactModel,affiliate:!!offer.affiliate,sourceType:offer.sourceType||null,freshness:currentOffer(offer,slug)?'current-check':'stale-or-unverified',note:offer.note||offer.priceScope||null,verificationBasis:offer.verificationBasis||null,retailerVerificationVersion:offer.retailerVerificationVersion||null};}
function knowledgeNode(slug){
  const node=base.knowledgeNode(slug),p=product(slug);if(!node||!p)return node;
  const offers=(p.offers||[]).map(o=>offerView(o,p.slug));
  return {...node,depthVersion:DEPTH_VERSION,attributes:{...node.attributes,normalised:p.decisionAttributes||{}},factEvidence:p.factEvidence||{},commerce:{role:'retailer evidence only; excluded from suitability scoring',commercialRecommendationWeight:0,offers}};
}
function targetDepth(slug){
  const ps=categories[slug]?.products||[];
  const facts=ps.reduce((n,p)=>n+Object.keys(p.factEvidence||{}).length,0);
  const offers=ps.flatMap(p=>(p.offers||[]).map(o=>({offer:o,slug:p.slug})));
  return {products:ps.length,withStructuredSpecs:ps.filter(p=>(p.specs||[]).length).length,withFactEvidence:ps.filter(p=>Object.keys(p.factEvidence||{}).length).length,verifiedFacts:facts,withMaintainedPrice:ps.filter(p=>Number(p.price)>0).length,withRetailerOffers:ps.filter(p=>(p.offers||[]).length).length,currentRetailerOffers:offers.filter(x=>currentOffer(x.offer,x.slug)).length};
}
function categoryNode(slug){
  const node=base.categoryNode(slug);if(!node)return node;
  return {...node,depthVersion:DEPTH_VERSION,depth:TARGET_CATEGORIES.includes(slug)?targetDepth(slug):null};
}
function graphSummary(){
  const summary=base.graphSummary();
  const facts=products.reduce((n,p)=>n+Object.keys(p.factEvidence||{}).length,0);
  const offers=products.flatMap(p=>(p.offers||[]).map(o=>({offer:o,slug:p.slug})));
  return {...summary,depthVersion:DEPTH_VERSION,withFactEvidence:products.filter(p=>Object.keys(p.factEvidence||{}).length).length,verifiedFactCount:facts,withRetailerOffers:products.filter(p=>(p.offers||[]).length).length,currentRetailerOfferCount:offers.filter(x=>currentOffer(x.offer,x.slug)).length,targetCategoryDepth:Object.fromEntries(TARGET_CATEGORIES.map(slug=>[slug,targetDepth(slug)])),retailerVerificationVersion:retailerVerification.VERSION};
}
module.exports={...base,knowledgeNode,categoryNode,graphSummary,currentOffer,targetDepth,offerView,retailerVerificationVersion:retailerVerification.VERSION};
