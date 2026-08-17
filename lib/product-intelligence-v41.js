const base=require('./product-intelligence-v4');
const {products,categories}=require('../data');
const {DEPTH_VERSION,TARGET_CATEGORIES}=require('../data/catalogue-v41-depth');

function product(slug){return products.find(p=>p.slug===slug)||null;}
function currentOffer(o){
  if(!o||!o.checkedAt)return false;
  const due=String(o.reviewDue||'');
  const today=new Date().toISOString().slice(0,10);
  return !due||due>=today;
}
function offerView(o){return {retailer:o.retailer||null,url:o.url||null,price:Number(o.price)>0?Number(o.price):null,currency:o.currency||'AUD',availability:o.availability||'unknown',checkedAt:o.checkedAt||null,reviewDue:o.reviewDue||null,exactModel:!!o.exactModel,affiliate:!!o.affiliate,sourceType:o.sourceType||null,freshness:currentOffer(o)?'current-check':'stale-or-unverified',note:o.note||null};}
function knowledgeNode(slug){
  const node=base.knowledgeNode(slug),p=product(slug);if(!node||!p)return node;
  const offers=(p.offers||[]).map(offerView);
  return {...node,depthVersion:DEPTH_VERSION,attributes:{...node.attributes,normalised:p.decisionAttributes||{}},factEvidence:p.factEvidence||{},commerce:{role:'retailer evidence only; excluded from suitability scoring',commercialRecommendationWeight:0,offers}};
}
function targetDepth(slug){
  const ps=categories[slug]?.products||[];
  const facts=ps.reduce((n,p)=>n+Object.keys(p.factEvidence||{}).length,0);
  const offers=ps.flatMap(p=>p.offers||[]);
  return {products:ps.length,withStructuredSpecs:ps.filter(p=>(p.specs||[]).length).length,withFactEvidence:ps.filter(p=>Object.keys(p.factEvidence||{}).length).length,verifiedFacts:facts,withMaintainedPrice:ps.filter(p=>Number(p.price)>0).length,withRetailerOffers:ps.filter(p=>(p.offers||[]).length).length,currentRetailerOffers:offers.filter(currentOffer).length};
}
function categoryNode(slug){
  const node=base.categoryNode(slug);if(!node)return node;
  return {...node,depthVersion:DEPTH_VERSION,depth:TARGET_CATEGORIES.includes(slug)?targetDepth(slug):null};
}
function graphSummary(){
  const summary=base.graphSummary();
  const facts=products.reduce((n,p)=>n+Object.keys(p.factEvidence||{}).length,0);
  const offers=products.flatMap(p=>p.offers||[]);
  return {...summary,depthVersion:DEPTH_VERSION,withFactEvidence:products.filter(p=>Object.keys(p.factEvidence||{}).length).length,verifiedFactCount:facts,withRetailerOffers:products.filter(p=>(p.offers||[]).length).length,currentRetailerOfferCount:offers.filter(currentOffer).length,targetCategoryDepth:Object.fromEntries(TARGET_CATEGORIES.map(slug=>[slug,targetDepth(slug)]))};
}
module.exports={...base,knowledgeNode,categoryNode,graphSummary,currentOffer,targetDepth};