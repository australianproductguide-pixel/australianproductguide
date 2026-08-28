'use strict';

// APG catalogue coverage v117.
// One derived operational view over the canonical catalogue. This is NOT another catalogue or
// recommendation engine. It joins maintained product identity/evidence with the existing commerce,
// Amazon, eBay, Australian-retailer and imagery controls so APG can measure the owner-directed
// whole-catalogue certification programme product by product without duplicating source truth.
const {products,categories}=require('../data');
const amazon=require('../data/amazon-au-mappings-v33');
const amazonExceptions=require('../data/amazon-mapping-exceptions-v106');
const ebay=require('../data/ebay-epn-interim-v1');
const retailers=require('../data/retailers-v6');
const commerce=require('../data/commerce-eligibility-v114');
const sourceProvenance=require('../data/product-source-provenance-v117');
const {imageStatus}=require('../data/image-provenance');

const VERSION='117.0';
const CHECKED_AT='2026-08-29';
const ENDPOINT='/api/intelligence/catalogue-coverage';
const ORIGIN='https://australianproductguide.au';
const RECALL_SLUG='anker-power-bank-20000mah-22-5w';
const arr=value=>Array.isArray(value)?value.filter(Boolean):[];
const objectCount=value=>value&&typeof value==='object'&&!Array.isArray(value)?Object.keys(value).length:0;
const pct=(n,d)=>d?Number((n*100/d).toFixed(2)):0;

function validAmazonTag(url){
  if(!url)return false;try{const u=new URL(url);return u.hostname==='www.amazon.com.au'&&u.searchParams.get('tag')===amazon.TAG;}catch{return false;}
}
function validEbayTracking(url){
  if(!url)return false;try{const u=new URL(url);return u.hostname==='www.ebay.com.au'&&u.searchParams.get('campid')===ebay.CAMPAIGN_ID&&u.searchParams.get('mkrid')===ebay.MARKETPLACE_ROTATION_ID&&u.searchParams.get('siteid')===ebay.SITE_ID&&u.searchParams.get('toolid')===ebay.TOOL_ID&&u.searchParams.get('mkevt')==='1';}catch{return false;}
}
function amazonRecord(product){
  if(product.slug===RECALL_SLUG)return {matchStatus:'NO_SAFE_PATH_RECALL',asin:null,url:null,confidence:'HIGH',verifiedAt:'2026-08-24',recommendationWeight:0};
  return amazon.getAmazonAuRecord(product);
}
function amazonInvestigation(product,record){
  if(record.matchStatus==='NO_SAFE_PATH_RECALL')return {state:'SAFETY_SUPPRESSED',documented:true,nextReview:null};
  if(record.matchStatus==='EXACT_VERIFIED'||record.matchStatus==='VARIANT_VERIFIED')return {state:'VERIFIED_DIRECT_OR_VARIANT',documented:true,nextReview:null};
  const documented=amazonExceptions.DOCUMENTED[product.slug]||null;
  if(documented)return {state:'DOCUMENTED_SEARCH_FALLBACK_EXCEPTION',documented:true,nextReview:documented.nextReviewDate||null,reason:documented.reasonDirectUnavailable||null};
  return {state:'INVESTIGATION_REQUIRED',documented:false,nextReview:null,reason:'Individual Amazon Australia direct-mapping investigation has not yet been evidenced to the v106 completion standard.'};
}
function mergedRetailers(product){
  const seen=new Set();
  return retailers.orderRetailers([...arr(product.retailers),...arr(product.offers)].filter(row=>{
    const href=row&&(row.affiliateUrl||row.url||row.exactUrl);if(!href)return false;
    const key=`${row.retailer||''}|${href}`;if(seen.has(key))return false;seen.add(key);return true;
  }));
}
function isAmazon(row){return /amazon australia/i.test(String(row&&row.retailer||''));}
function isEbay(row){return /ebay australia/i.test(String(row&&row.retailer||''));}
function retailerRow(row){
  const href=row.affiliateUrl||row.url||row.exactUrl||null;
  return {
    retailer:row.retailer||null,
    pathwayType:retailers.classifyPathway(row),
    pathwayLabel:row.pathwayLabel||null,
    url:href,
    affiliate:Boolean(row.affiliate||String(row.kind||'').startsWith('affiliate')||/amazon|ebay/i.test(String(row.retailer||''))),
    recommendationWeight:0,
    verifiedAt:row.checkedAt||row.verifiedAt||row.verified||row.amazonVerifiedAt||null,
    exactModel:row.exactModel===true||retailers.classifyPathway(row)==='exact-product',
    availability:row.availability||null,
    note:row.note||null
  };
}
function lifecycleAndMarket(product){
  const entity=sourceProvenance.entityStateFor(product),exception=commerce.exceptionFor(product);
  const status=String(entity&&entity.status||product.entityStatus||product.lifecycle||'MAINTAINED').toUpperCase();
  const region=entity&&entity.region||null;
  let auRelevance='MAINTAINED_AU_CONTEXT_NOT_INDIVIDUALLY_CERTIFIED';
  if(exception&&exception.type==='SAFETY_SUPPRESSED')auRelevance='AU_SAFETY_SUPPRESSED';
  else if(exception&&exception.eligibility==='HISTORICAL')auRelevance='HISTORICAL_RECORD_NO_CURRENT_AU_COMMERCE';
  else if(exception&&exception.type==='ENTITY_MARKET_EXCLUDED')auRelevance='NON_AU_OR_CURRENT_MARKET_EXCLUDED';
  else if(region&&/(^|_)AU($|_)|AU_RETAIL|HISTORICAL_AU/.test(String(region).toUpperCase()))auRelevance='VERIFIED_AU_BINDING';
  return {status,region,auRelevance,entityReviewed:Boolean(entity),entityResolution:entity&&entity.resolution||null,commerceEligibility:exception?'SUPPRESSED':'ELIGIBLE',commerceException:exception||null};
}
function evidenceMetrics(product,source){
  const structuredSpecs=objectCount(product.specs)+objectCount(product.specifications)+objectCount(product.decisionAttributes);
  const factObjects=objectCount(product.factEvidence)+objectCount(product.evidenceMap)+objectCount(product.claims);
  const highlights=arr(product.highlights).length;
  const evidenceSources=source.candidateSourceCount;
  const tier=String(product.evidenceTier||product.evidenceDepth||'starter').toLowerCase();
  return {tier,structuredSpecs,factObjects,highlights,evidenceSources};
}
function provisionalGrade(product,source){
  const m=evidenceMetrics(product,source),firstParty=source.status==='VERIFIED_FIRST_PARTY_DOMAIN';
  let grade='E',basis='No first-party product source and no meaningful structured evidence are currently established in the canonical record.';
  if(firstParty&&/(deep|strong|fact)/.test(m.tier)&&(m.structuredSpecs>=5||m.factObjects>=5)){grade='A';basis='First-party source plus deep/strong maintained evidence and substantial structured decision/specification data.';}
  else if(firstParty&&(/(deep|strong|fact)/.test(m.tier)||m.structuredSpecs>=3||m.factObjects>=3)){grade='B';basis='First-party source plus strong or materially structured maintained evidence.';}
  else if(firstParty){grade='C';basis='First-party source provenance is established, but maintained product evidence is still partial/starter depth.';}
  else if(source.candidateSourceCount>0||m.structuredSpecs>0||m.factObjects>0||m.highlights>0){grade='D';basis='Some maintained evidence exists, but first-party product-source provenance and/or structured depth remain incomplete.';}
  return {grade,basis,standard:'PROVISIONAL_SOURCE_DERIVED_INFORMATION_QUALITY_V117',externallyCertified:false,metrics:m};
}
function freshness(product,source,rows,image){
  const values=[product.lastSubstantiveReview,product.lastReviewed,product.lastSourceVerification,product.lastRetailerCheck,source.firstPartySource&&source.firstPartySource.verifiedAt,...rows.map(r=>r.verifiedAt),image.reviewed].filter(Boolean);
  const parsed=values.map(value=>({value,ts:Date.parse(value)})).filter(x=>Number.isFinite(x.ts)).sort((a,b)=>b.ts-a.ts);
  return {lastVerified:parsed[0]&&parsed[0].value||null,productReview:product.lastSubstantiveReview||product.lastReviewed||null,sourceVerification:product.lastSourceVerification||source.firstPartySource&&source.firstPartySource.verifiedAt||null,retailerVerification:product.lastRetailerCheck||null,imageVerification:image.reviewed||null,nextReviewDue:product.nextReviewDue||null,freshnessStatus:product.freshnessStatus||'UNCLASSIFIED'};
}
function certification(product,{lifecycle,source,amazonInfo,ebayInfo,otherRows,image,grade}){
  if(lifecycle.commerceException&&lifecycle.commerceException.type==='SAFETY_SUPPRESSED')return {status:'EXCLUDED_SAFETY',certified:false,blockers:['PRODUCT_SAFETY_RECALL_NO_PURCHASE_PATH']};
  if(lifecycle.commerceException)return {status:'EXCLUDED_CURRENT_COMMERCE',certified:false,blockers:[lifecycle.commerceException.code||'ENTITY_MARKET_LIFECYCLE_EXCLUDED']};
  const blockers=[];
  if(source.status!=='VERIFIED_FIRST_PARTY_DOMAIN')blockers.push('FIRST_PARTY_PRODUCT_SOURCE_NOT_ESTABLISHED');
  if(amazonInfo.investigation.state==='INVESTIGATION_REQUIRED')blockers.push('AMAZON_PRODUCT_LEVEL_INVESTIGATION_REQUIRED');
  if(!ebayInfo||ebayInfo.pathwayType!=='exact-product')blockers.push('EBAY_LISTING_LEVEL_RESEARCH_NOT_CERTIFIED');
  if(!otherRows.length)blockers.push('OTHER_AU_RETAILER_INVESTIGATION_REQUIRED');
  else blockers.push('OTHER_AU_RETAILER_WHOLE_MARKET_CERTIFICATION_PENDING');
  if(!image.productPhotography)blockers.push('EXACT_PRODUCT_IMAGE_RIGHTS_NOT_VERIFIED');
  if(['D','E'].includes(grade.grade))blockers.push('PRODUCT_INFORMATION_DEPTH_BELOW_TARGET');
  return {status:blockers.length?'NOT_CERTIFIED':'CERTIFIED',certified:blockers.length===0,blockers};
}
function productRow(product){
  const lifecycle=lifecycleAndMarket(product),source=sourceProvenance.snapshot(product),amazonRaw=amazonRecord(product),amazonCheck=amazonInvestigation(product,amazonRaw);
  const ebayRaw=ebay.ebayRetailerFor(product),allRows=mergedRetailers(product),otherRows=allRows.filter(row=>!isAmazon(row)&&!isEbay(row)).map(retailerRow),image=imageStatus(product),grade=provisionalGrade(product,source);
  const amazonInfo={pathwayType:amazonRaw.matchStatus==='EXACT_VERIFIED'?'exact-product':amazonRaw.matchStatus==='VARIANT_VERIFIED'?'verified-variant':amazonRaw.matchStatus==='SEARCH_FALLBACK'?'product-search':amazonRaw.matchStatus==='NO_SAFE_PATH_RECALL'?'safety-suppressed':'uncontrolled',matchStatus:amazonRaw.matchStatus||null,asin:amazonRaw.asin||null,url:amazonRaw.url||null,affiliateTag:amazon.TAG,affiliateTagPresent:amazonRaw.url?validAmazonTag(amazonRaw.url):null,verifiedAt:amazonRaw.verifiedAt||null,confidence:amazonRaw.confidence||null,investigation:amazonCheck,recommendationWeight:0};
  const ebayInfo=ebayRaw?{pathwayType:ebayRaw.pathwayType||'product-search',url:ebayRaw.url,identityQuery:ebayRaw.identityQuery||null,exactModel:ebayRaw.exactModel===true,trackingValid:validEbayTracking(ebayRaw.url),campaignId:ebay.CAMPAIGN_ID,verifiedAt:ebayRaw.verifiedAt||ebayRaw.checkedAt||ebay.REVIEWED_AT||null,externalListingInvestigation:'NOT_LISTING_CERTIFIED',recommendationWeight:0}:null;
  const officialStore=otherRows.find(row=>/manufacturer|official/i.test(String(row.note||''))||/manufacturer/i.test(String(row.pathwayLabel||'')))||null;
  const certificationState=certification(product,{lifecycle,source,amazonInfo,ebayInfo,otherRows,image,grade});
  return {
    apgProductId:product.id||null,
    slug:product.slug,
    url:`${ORIGIN}/products/${product.slug}/`,
    category:product.category||null,
    categoryLabel:product.categoryLabel||null,
    brand:product.brand||null,
    productName:product.name||null,
    model:product.model||sourceProvenance.entityStateFor(product)?.correctedModel||null,
    lifecycle,
    officialEvidence:{status:source.status,officialDomain:source.officialDomain,source:source.firstPartySource,candidateSourceCount:source.candidateSourceCount},
    informationQuality:grade,
    amazon:amazonInfo,
    ebay:ebayInfo,
    officialStore,
    otherAustralianRetailers:otherRows,
    retailerPathways:allRows.map(retailerRow),
    imagery:{status:image.status,productPhotography:image.productPhotography,source:image.source,sourceType:image.sourceType,rights:image.rights,matchStatus:image.matchStatus,reviewed:image.reviewed,displayUrl:image.displayUrl||null},
    freshness:freshness(product,source,allRows.map(retailerRow),image),
    certification:certificationState
  };
}
function snapshot(){
  const rows=products.map(productRow),gradeDistribution={A:0,B:0,C:0,D:0,E:0};for(const row of rows)gradeDistribution[row.informationQuality.grade]++;
  const official=rows.filter(r=>r.officialEvidence.status==='VERIFIED_FIRST_PARTY_DOMAIN').length;
  const commerceEligible=rows.filter(r=>r.lifecycle.commerceEligibility==='ELIGIBLE').length;
  const entityExcluded=rows.filter(r=>r.lifecycle.commerceException&&r.lifecycle.commerceException.type==='ENTITY_MARKET_EXCLUDED').length;
  const safetyExcluded=rows.filter(r=>r.lifecycle.commerceException&&r.lifecycle.commerceException.type==='SAFETY_SUPPRESSED').length;
  const amazonExact=rows.filter(r=>r.amazon.matchStatus==='EXACT_VERIFIED').length,amazonVariant=rows.filter(r=>r.amazon.matchStatus==='VARIANT_VERIFIED').length,amazonFallback=rows.filter(r=>r.amazon.matchStatus==='SEARCH_FALLBACK').length;
  const ebaySearch=rows.filter(r=>r.ebay&&r.ebay.pathwayType==='product-search').length;
  const withOtherRetailers=rows.filter(r=>r.otherAustralianRetailers.length>0).length;
  const withExactOther=rows.filter(r=>r.otherAustralianRetailers.some(x=>x.pathwayType==='exact-product')).length;
  const verifiedImages=rows.filter(r=>r.imagery.productPhotography).length;
  const certified=rows.filter(r=>r.certification.certified).length;
  const blockerCounts={};for(const row of rows)for(const blocker of row.certification.blockers||[])blockerCounts[blocker]=(blockerCounts[blocker]||0)+1;
  return {
    version:VERSION,checkedAt:CHECKED_AT,status:certified===products.length?'CERTIFIED':'NOT_CERTIFIED',
    authority:'Derived from APG canonical product composition, Action 4 entity/lifecycle state, Action 5 Amazon controls, eBay EPN v1.2, maintained Australian retailer offers, source provenance and image-provenance controls. It is an operational view, not a second catalogue.',
    catalogue:{products:rows.length,categories:Object.keys(categories).length,brands:new Set(rows.map(r=>r.brand).filter(Boolean)).size,commerceEligible,entityMarketLifecycleExcluded:entityExcluded,safetyExcluded},
    evidence:{firstPartyProductSourceEstablished:official,firstPartySourcePct:pct(official,rows.length),provisionalGradeDistribution:gradeDistribution,gradeStandard:'PROVISIONAL_SOURCE_DERIVED_INFORMATION_QUALITY_V117',gradeWarning:'Grades measure maintained information/source depth only. They are not hands-on review scores and are not externally certified product-quality ratings.'},
    amazon:{exactVerified:amazonExact,verifiedVariant:amazonVariant,searchFallback:amazonFallback,safetySuppressed:rows.filter(r=>r.amazon.pathwayType==='safety-suppressed').length,productLevelInvestigationRequired:rows.filter(r=>r.amazon.investigation.state==='INVESTIGATION_REQUIRED').length},
    ebay:{modelSpecificProductSearch:ebaySearch,modelSpecificSearchPct:pct(ebaySearch,commerceEligible),exactListingsCertified:rows.filter(r=>r.ebay&&r.ebay.pathwayType==='exact-product').length,entityMarketLifecycleExcluded:entityExcluded,safetyExcluded,campaignId:ebay.CAMPAIGN_ID,listingLevelResearch:'INCOMPLETE'},
    otherAustralianRetailers:{productsWithAtLeastOnePathway:withOtherRetailers,productsWithExactPathway:withExactOther,coveragePct:pct(withOtherRetailers,rows.length),wholeMarketCertification:'INCOMPLETE'},
    imagery:{verifiedExactProductPhotography:verifiedImages,pendingOrIllustrative:rows.length-verifiedImages,verifiedPct:pct(verifiedImages,rows.length)},
    certification:{fullyCertifiedProducts:certified,fullyCertifiedPct:pct(certified,rows.length),status:certified===rows.length?'CERTIFIED':'NOT_CERTIFIED',blockerCounts,completionRule:'Every maintained in-scope product requires identity/AU relevance, first-party evidence or explicit exception, adequate information depth, traceable evidence, Amazon/eBay/other-retailer investigation, correct affiliate attribution, imagery provenance and current verification. Excluded historical/non-AU/safety records remain explicit rather than being forced into commerce.'},
    products:rows
  };
}

module.exports={VERSION,CHECKED_AT,ENDPOINT,ORIGIN,validAmazonTag,validEbayTracking,amazonRecord,amazonInvestigation,mergedRetailers,lifecycleAndMarket,evidenceMetrics,provisionalGrade,productRow,snapshot};
