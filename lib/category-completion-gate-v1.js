'use strict';

// APG Category Completion Gate v1.
// A category is decision-grade only when every required consumer-decision control is
// independently certified. Schema presence, one successful benchmark or catalogue size
// can never promote a category by themselves.
const action4=require('./action4-final-v981');
const searchDepth=require('../data/search-opportunity-depth-v104');
const {categories}=require('../data');

const VERSION='category-completion-gate-v1';
const PRIORITY_CATEGORIES=Object.freeze([
  'coffee-machines','robot-vacuums','wireless-headphones','televisions',
  'laptops','smartphones','washing-machines','air-fryers'
]);
const REQUIRED_GATES=Object.freeze([
  'candidateCoverage','identity','decisionEvidence','schema','search','recommendationLogic',
  'compare','retailer','imagery','guideContent','mobileAccessibility','analytics','qa'
]);
const PASS='PASS',PARTIAL='PARTIAL',NOT_YET_CERTIFIED='NOT_YET_CERTIFIED';

const BENCHMARK_CATEGORIES=new Set(['coffee-machines','robot-vacuums','wireless-headphones','televisions','laptops']);
const SEARCH_DEPTH_CATEGORIES=new Set(Object.keys(searchDepth.categoryDepth||{}));

function action4Snapshot(){return action4.action4FinalSnapshot();}
function evidenceRow(snapshot,slug){return (snapshot.evidenceDepth&&snapshot.evidenceDepth.categories||[]).find(row=>row.category===slug)||null;}
function gateRow(slug,snapshot=action4Snapshot()){
  const category=categories[slug]||null,row=evidenceRow(snapshot,slug),productCount=category&&category.products?category.products.length:0,strong=Number(row&&row.strong)||0;
  const schemaPass=!!(row&&(row.requiredCriteria||[]).length>0);
  const evidenceStatus=productCount>0&&strong===productCount?PASS:strong>0?PARTIAL:NOT_YET_CERTIFIED;
  const gates={
    candidateCoverage:NOT_YET_CERTIFIED,
    identity:NOT_YET_CERTIFIED,
    decisionEvidence:evidenceStatus,
    schema:schemaPass?PASS:NOT_YET_CERTIFIED,
    search:SEARCH_DEPTH_CATEGORIES.has(slug)?PARTIAL:NOT_YET_CERTIFIED,
    recommendationLogic:BENCHMARK_CATEGORIES.has(slug)?PARTIAL:NOT_YET_CERTIFIED,
    compare:NOT_YET_CERTIFIED,
    retailer:NOT_YET_CERTIFIED,
    imagery:NOT_YET_CERTIFIED,
    guideContent:SEARCH_DEPTH_CATEGORIES.has(slug)?PARTIAL:NOT_YET_CERTIFIED,
    mobileAccessibility:NOT_YET_CERTIFIED,
    analytics:NOT_YET_CERTIFIED,
    qa:NOT_YET_CERTIFIED
  };
  const blockers=REQUIRED_GATES.filter(key=>gates[key]!==PASS);
  return {
    category:slug,
    label:category&&category.label||slug,
    productCount,
    strongEvidenceProducts:strong,
    strongEvidencePct:productCount?Number((strong*100/productCount).toFixed(1)):0,
    gates,
    blockers,
    overall:blockers.length?'NOT_DECISION_GRADE':'DECISION_GRADE',
    publicMaturityClaimAllowed:blockers.length===0,
    demandStatus:snapshot.perCategoryDemand&&snapshot.perCategoryDemand.status||'NOT_YET_MEASURED',
    policy:'All required gates must be PASS. PARTIAL never rolls up to DECISION_GRADE.'
  };
}
function snapshot(){
  const source=action4Snapshot(),rows=PRIORITY_CATEGORIES.map(slug=>gateRow(slug,source)),certified=rows.filter(row=>row.overall==='DECISION_GRADE');
  return {
    version:VERSION,
    priorityCategories:PRIORITY_CATEGORIES,
    requiredGates:REQUIRED_GATES,
    rows,
    summary:{priorityCategoryCount:rows.length,decisionGradeCount:certified.length,notDecisionGradeCount:rows.length-certified.length},
    governance:{depthBeforeBreadth:true,shallowCatalogueExpansionPaused:true,partialDoesNotPass:true,publicDecisionGradeClaimRequiresAllGates:true,commercialRecommendationWeight:0},
    source:{action4Version:source.version||null,evidenceDepthStandard:source.evidenceDepthStandardVersion||source.evidenceDepth&&source.evidenceDepth.standard||null,categorySchemaVersion:source.categoryDecisionSchemaVersion||null,searchDepthVersion:searchDepth.VERSION||null}
  };
}

module.exports={VERSION,PRIORITY_CATEGORIES,REQUIRED_GATES,PASS,PARTIAL,NOT_YET_CERTIFIED,gateRow,snapshot};
