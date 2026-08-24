'use strict';

const downstream=require('./action4-closure-v97');
const closure=require('../data/action4-closure-v97');
const {products,categories}=require('../data');
const VERSION='97.1';
const ORIGIN='https://australianproductguide.au';

// v96 deliberately removed commerce mappings from unresolved identities. A newly
// resolved product identity does not automatically prove an old retailer/Amazon URL.
// Keep those commerce destinations in revalidation state until exact AU offers are
// separately re-established.
const retailerRevalidationSlugs=new Set([
  'meross-mini-smart-wi-fi-plug',
  'therabody-theragun-mini',
  'therabody-theragun-prime',
  'braun-beard-trimmer-series-7-bt7420',
  'remington-style-series-b5-beard-trimmer',
  'waterpik-cordless-advanced-water-flosser',
  'oral-b-aquacare-4-water-flosser',
  'anker-solix-c300',
  'audio-technica-atr2100x-usb'
]);
for(const product of products){
  if(retailerRevalidationSlugs.has(product.slug))product.entityRetailerRevalidationRequired=true;
}

function evidenceFor(product,key){
  const manual=product.decisionEvidence&&product.decisionEvidence[key];
  if(manual&&manual.value&&manual.value!=='unknown')return true;
  const schema=closure.categorySchemas[product.category];
  const criterion=schema&&schema.criteria.find(c=>c.key===key);
  if(!criterion)return false;
  if(key==='university')return !!(product.factEvidence?.portableSignal&&(product.factEvidence?.batteryHours||product.factEvidence?.spec_battery));
  if(key==='travel')return !!(product.factEvidence?.spec_anc&&product.factEvidence?.spec_battery);
  if(key==='beginner')return !!(product.factEvidence?.workflow||product.factEvidence?.learningCurve);
  if(key==='memory')return !!(product.factEvidence?.memoryGB||product.factEvidence?.spec_memory||product.factEvidence?.memory);
  if(key==='storage')return !!(product.factEvidence?.storageGB||product.factEvidence?.spec_storage||product.factEvidence?.storage);
  if(key==='battery')return !!(product.factEvidence?.batteryHours||product.factEvidence?.spec_battery||product.factEvidence?.battery);
  if(key==='portable')return !!(product.factEvidence?.portableSignal||product.factEvidence?.spec_weight||product.factEvidence?.weightKg);
  return (criterion.factKeys||[]).some(f=>product.factEvidence&&product.factEvidence[f]);
}

function depthSummary(){
  const categoriesOut=[];let total=0,strong=0;
  for(const [slug,schema] of Object.entries(closure.categorySchemas)){
    const rows=categories[slug]?.products||[],required=schema.strongDepthRequired||[];
    let categoryStrong=0;const productRows=[];
    for(const product of rows){
      const verified=required.filter(key=>evidenceFor(product,key));
      const isStrong=required.length>0&&verified.length===required.length;
      if(isStrong)categoryStrong++;
      productRows.push({slug:product.slug,verifiedRequired:verified.length,required:required.length,coveragePct:required.length?Math.round(verified.length/required.length*100):100,strong:isStrong,missing:required.filter(key=>!verified.includes(key))});
    }
    total+=rows.length;strong+=categoryStrong;
    categoriesOut.push({category:slug,products:rows.length,strong:categoryStrong,below:rows.length-categoryStrong,strongPct:rows.length?Math.round(categoryStrong/rows.length*1000)/10:0,requiredCriteria:required,productRows});
  }
  return {standard:closure.DEPTH_STANDARD_VERSION,scope:'first-wave category-specific recount',products:total,strong,below:total-strong,strongPct:total?Math.round(strong/total*1000)/10:0,categories:categoriesOut,legacyGlobalCatalogueCount:products.length,globalAllCategoryV2Status:'NOT_YET_DEFINED_FOR_NON_MIGRATED_CATEGORIES'};
}

const parityCategory={
  laptopUniversity:'laptops',robotPetHardFloor:'robot-vacuums',headphoneComfort:'wireless-headphones',headphoneAnc:'wireless-headphones',televisionBrightSport:'televisions',coffeeBeginner:'coffee-machines'
};
function paritySnapshot(){
  const scenarios=Object.entries(closure.benchmarkScenarios).map(([name,query])=>{
    const category=parityCategory[name]||null;
    const result=downstream.action41PublicDecision(query,category?{category}:{});
    const top=result.results?.[0]||null;
    return {name,query,category,winner:top?.slug||null,coverage:result.audit?.topCriterionCoverage||null,traceHash:(top?.criteria||[]).map(c=>`${c.kind}:${c.criterion||c.key}:${c.scoreContribution||0}:${c.evidenceStatus||c.status}`).join('|')};
  });
  return {sharedEngineObject:true,decisionLab:'engine.publicDecision',scout:'scout-concierge-v5-core -> shared decision object',comparison:'scout comparison/decision surfaces -> shared decision object',scenarioCategoryBinding:'explicit benchmark category context',scenarios};
}

function snapshot(){
  const base=downstream.action41Snapshot();
  return {...base,version:VERSION,evidenceDepth:depthSummary(),parity:paritySnapshot(),commerceRevalidation:{policy:'resolved identity does not automatically revalidate legacy retailer/Amazon destination',requiredSlugs:[...retailerRevalidationSlugs].sort(),requiredCount:retailerRevalidationSlugs.size}};
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Action4-Closure','v'+VERSION);
  if(path==='/api/intelligence/action4-closure'){
    res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));
  }
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION41_CLOSURE_VERSION:VERSION,action41Snapshot:snapshot,action41DepthSummary:depthSummary,action41ParitySnapshot:paritySnapshot});
module.exports=handler;
