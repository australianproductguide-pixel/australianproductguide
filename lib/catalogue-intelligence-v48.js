'use strict';

// Catalogue Intelligence v48 gives every maintained APG product the same
// decision/evidence/commerce/imagery contract. It deliberately does NOT turn
// starter classification data into manufacturer-verified facts.
const {products,categories}=require('../data');
const images=require('../data/product-images');
const amazon=require('../data/retailers-v6');

const VERSION='catalogue-intelligence-v48';
const PROFILE_SCHEMA='apg-product-intelligence-profile-v1';
const COMMERCIAL_RECOMMENDATION_WEIGHT=0;
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));

const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];
const clean=s=>String(s||'').trim();
const human=s=>clean(s).replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
function currentOffer(o){
  if(!o||o.exactModel!==true||!o.url||!o.retailer)return false;
  const due=clean(o.reviewDue),today=new Date().toISOString().slice(0,10);
  return !due||due>=today;
}
function structuredSpecs(p){
  const out={};
  for(const row of p.specs||[]){
    if(!Array.isArray(row)||row.length<2)continue;
    const key=clean(row[0]).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    if(key)out[key]=String(row[1]);
  }
  return out;
}
function evidenceLevel(p){
  const facts=Object.keys(p.factEvidence||{}).length,specs=(p.specs||[]).length;
  if(facts>0)return 'fact-verified';
  if(specs>0&&p.source)return 'structured-maintained';
  return 'classification-maintained';
}
function evidenceConfidence(p){
  const level=evidenceLevel(p);
  if(level==='fact-verified'&&p.freshnessStatus==='reviewed-this-month')return 'high';
  if(level==='fact-verified'||level==='structured-maintained')return 'moderate';
  return 'limited';
}
function exactOffers(p){return (p.offers||[]).filter(x=>x&&x.exactModel===true&&x.url&&x.retailer);}
function imageState(p){
  const record=images.imageFor(p),errors=record?images.validationErrors(p,record):[];
  if(record?.imageStatus==='verified'&&record.imageVerified&&errors.length===0)return {status:'verified-authorised-photography',verified:true,rightsVerified:true,sourceType:record.imageSourceType||null,checkedAt:record.imageVerifiedAt||null};
  if(amazon.direct?.[p.slug])return {status:'awaiting-approved-image-delivery',verified:false,rightsVerified:false,sourceType:null,checkedAt:p.lastImageVerification||null};
  return {status:'authorised-exact-product-source-needed',verified:false,rightsVerified:false,sourceType:null,checkedAt:p.lastImageVerification||null};
}
function profileFor(input){
  const p=typeof input==='string'?PRODUCT_BY_SLUG.get(input):input;
  if(!p)return null;
  const c=categories[p.category]||{},facts=p.factEvidence||{},offers=exactOffers(p),current=offers.filter(currentOffer),photo=imageState(p);
  const tags=uniq(p.tags||[]),priorities=uniq(c.priorities||[]),matchedPriorities=priorities.filter(x=>tags.includes(x));
  const specs=structuredSpecs(p),level=evidenceLevel(p),gaps=[];
  if(!Object.keys(facts).length)gaps.push('No fact-level evidence map yet');
  if(!Object.keys(specs).length)gaps.push('No structured specification set yet');
  if(!current.length)gaps.push('No current exact-model Australian retailer destination yet');
  if(!photo.verified)gaps.push('Genuine product photography awaiting an authorised exact-product source');
  const profile={
    schemaVersion:PROFILE_SCHEMA,
    intelligenceVersion:VERSION,
    identity:{id:p.id||p.productId||p.slug,slug:p.slug,brand:p.brand,name:p.name,model:p.model||null,category:p.category,categoryLabel:p.categoryLabel||c.label||p.category},
    decision:{
      categoryFactors:uniq(c.factors||[]),
      categoryPriorities:priorities,
      maintainedClassificationSignals:tags,
      matchedCategoryPriorities:matchedPriorities,
      structuredAttributes:{...(p.decisionAttributes||{})},
      signalBasis:'Maintained APG catalogue classification unless separately backed by factEvidence.',
      commercialRecommendationWeight:COMMERCIAL_RECOMMENDATION_WEIGHT
    },
    evidence:{
      level,tier:p.evidenceTier||'starter',confidence:evidenceConfidence(p),testingStatus:p.testingStatus||'Desk-researched / maintained catalogue record',
      source:p.source||null,sourceType:p.sourceType||null,structuredSpecCount:Object.keys(specs).length,structuredSpecifications:specs,
      verifiedFactCount:Object.keys(facts).length,verifiedFacts:facts,lastSourceVerification:p.lastSourceVerification||null,lastSubstantiveReview:p.lastSubstantiveReview||p.lastReviewed||null,nextReviewDue:p.nextReviewDue||null,
      gaps,
      policy:'Classification and specification context can inform discovery; only separately maintained factEvidence is represented as fact-level verification.'
    },
    commerce:{
      exactAustralianDestinationCount:offers.length,currentExactAustralianDestinationCount:current.length,
      retailers:uniq(current.map(x=>x.retailer)),lastRetailerCheck:p.lastRetailerCheck||null,lastPriceCheck:p.lastPriceCheck||null,
      priceBasis:Number(p.price)>0?Number(p.price):null,priceStatus:Number(p.price)>0?'maintained-price-basis':'live-price-not-maintained',
      commercialRecommendationWeight:COMMERCIAL_RECOMMENDATION_WEIGHT,
      policy:'Retailer participation, affiliate status, price-feed availability and commission contribute zero suitability points.'
    },
    imagery:photo,
    completeness:{contractComplete:true,contractFields:['identity','decision','evidence','commerce','imagery'],evidenceDepthIndependentOfContract:true}
  };
  return profile;
}
function categorySummary(slug){
  const rows=categories[slug]?.products||[],profiles=rows.map(profileFor).filter(Boolean);
  return {
    slug,label:categories[slug]?.label||slug,products:rows.length,profiles:profiles.length,contractCoveragePct:rows.length?Math.round(profiles.length/rows.length*1000)/10:100,
    factVerified:profiles.filter(x=>x.evidence.level==='fact-verified').length,structuredMaintained:profiles.filter(x=>x.evidence.level==='structured-maintained').length,classificationMaintained:profiles.filter(x=>x.evidence.level==='classification-maintained').length,
    withCurrentExactRetailer:profiles.filter(x=>x.commerce.currentExactAustralianDestinationCount>0).length,withVerifiedPhotography:profiles.filter(x=>x.imagery.verified).length
  };
}
function summary(){
  const profiles=products.map(profileFor).filter(Boolean),cats=Object.keys(categories).map(categorySummary);
  return {
    version:VERSION,schemaVersion:PROFILE_SCHEMA,
    catalogue:{products:products.length,categories:Object.keys(categories).length,profiles:profiles.length,contractCoveragePct:products.length?Math.round(profiles.length/products.length*1000)/10:100},
    evidence:{factVerified:profiles.filter(x=>x.evidence.level==='fact-verified').length,structuredMaintained:profiles.filter(x=>x.evidence.level==='structured-maintained').length,classificationMaintained:profiles.filter(x=>x.evidence.level==='classification-maintained').length},
    commerce:{productsWithCurrentExactAustralianDestination:profiles.filter(x=>x.commerce.currentExactAustralianDestinationCount>0).length,exactAustralianDestinationCount:profiles.reduce((n,x)=>n+x.commerce.exactAustralianDestinationCount,0),commercialRecommendationWeight:0},
    imagery:{productsWithVerifiedPhotography:profiles.filter(x=>x.imagery.verified).length,productsAwaitingAuthorisedPhotography:profiles.filter(x=>!x.imagery.verified).length},
    categories:cats,
    governance:{uniformContract:true,equalEvidenceClaim:false,productionSelfModification:false,commercialRecommendationWeight:0}
  };
}

module.exports={VERSION,PROFILE_SCHEMA,COMMERCIAL_RECOMMENDATION_WEIGHT,profileFor,categorySummary,summary,currentOffer,evidenceLevel};