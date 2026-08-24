'use strict';

const downstream=require('./action4-final-v98');
const {products}=require('../data');
const VERSION='98.1';
const SCHEMA_VERSION='category-decision-schema-v2.2';
const DEPTH_STANDARD_VERSION='evidence-depth-standard-v2.2';
const ORIGIN='https://australianproductguide.au';

const EXPECTED={
  laptopUniversity:'asus-zenbook-a14-ux3407',
  robotPetHardFloor:'eufy-robot-vacuum-omni-c28',
  headphoneComfort:'bose-quietcomfort-ultra-headphones',
  headphoneAnc:'bose-quietcomfort-ultra-headphones',
  televisionBrightSport:'hisense-75u6sau-75-inch-u6s-uled-miniled-tv',
  coffeeBeginner:'breville-barista-express-impress-bes876'
};

function gate(snapshot){
  const parityFailures=(snapshot.parity.scenarios||[]).filter(s=>!s.category||!s.winner||(EXPECTED[s.name]&&s.winner!==EXPECTED[s.name]));
  const checks={
    authoritativeSchemaSignal:snapshot.schemaVersion===SCHEMA_VERSION&&snapshot.categoryDecisionSchemaVersion===SCHEMA_VERSION&&snapshot.evidenceDepth.schemaVersion===SCHEMA_VERSION&&snapshot.evidenceDepthStandardVersion===DEPTH_STANDARD_VERSION&&snapshot.evidenceDepth.standard===DEPTH_STANDARD_VERSION,
    categorySchemasDefined:snapshot.evidenceDepth.categoryCount===90&&snapshot.evidenceDepth.schemaDefinedCategories===90,
    fullCatalogueRecount:snapshot.evidenceDepth.products===products.length&&products.length===482,
    entityRegisterResolved:snapshot.entityIntegrity.reviewed===24&&snapshot.entityIntegrity.resolved===24&&snapshot.entityIntegrity.open===0,
    commerceRevalidationComplete:snapshot.commerceRevalidation.reviewed===9&&snapshot.commerceRevalidation.pending===0,
    firstWaveParityNoRegression:parityFailures.length===0,
    perCategoryDemandNotFabricated:snapshot.perCategoryDemand.status==='NOT_YET_MEASURED'
  };
  const blockers=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
  return {
    status:blockers.length?'AMBER':'GREEN',checks,blockers,parityFailures,
    evidenceBacklogStatus:'ONGOING_MAINTENANCE',evidenceBacklogIsGateBlocker:false,
    reason:blockers.length?'One or more Action 4 closure controls failed.':'Action 4 control architecture, entity integrity, all-category Evidence Depth v2 definitions/recount, commerce revalidation and first-wave P1 parity are complete. Remaining below-strong product evidence stays visible as a maintained enrichment backlog; the closure does not claim every maintained product has strong evidence.'
  };
}
function snapshot(){
  const base=downstream.action4FinalSnapshot();
  const out={...base,version:VERSION,action4FinalVersion:VERSION,schemaVersion:SCHEMA_VERSION,categoryDecisionSchemaVersion:SCHEMA_VERSION,evidenceDepthStandardVersion:DEPTH_STANDARD_VERSION};
  out.action4Gate=gate(out);
  return out;
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  const originalSetHeader=res.setHeader.bind(res);
  res.setHeader=function(name,value){
    if(String(name).toLowerCase()==='x-apg-action4-closure')return originalSetHeader(name,'v'+VERSION);
    return originalSetHeader(name,value);
  };
  originalSetHeader('X-APG-Action4-Closure','v'+VERSION);
  if(path==='/api/intelligence/action4-closure'){
    res.statusCode=200;originalSetHeader('Content-Type','application/json; charset=utf-8');originalSetHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));
  }
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION4_FINAL_VERSION:VERSION,action4FinalSnapshot:snapshot,action4FinalGate:gate});
module.exports=handler;
