const base=require('./intelligence-quality-v4');
const engine=require('./decision-engine-v4');
const graph=require('./product-intelligence-v41');
const {products}=require('../data');
const {DEPTH_VERSION,TARGET_CATEGORIES}=require('../data/catalogue-v41-depth');

const QUALITY_VERSION='intelligence-quality-v1.1';
function exact75Gate(){
  const q='TV must be exactly 75 inches for a bright living room, sport and Netflix under $2500';
  const d=engine.publicDecision(q,{category:'televisions'}),top=d.results?.[0]||null;
  const exact=products.filter(p=>p.category==='televisions'&&Number(p.decisionAttributes?.screenSizeInches)===75);
  const priced=exact.filter(p=>Number(p.price)>0&&Number(p.price)<=2500);
  const pass=!!top&&top.hardConstraintStatus==='eligible'&&Number(top.priceBasis)>0&&Number(top.priceBasis)<=2500&&/75/.test(String(top.name||''))&&exact.length>=4&&priced.length>=1;
  return {pass,query:q,top:top?.slug||null,status:top?.hardConstraintStatus||'none',priceBasis:top?.priceBasis||null,exact75Maintained:exact.length,exact75WithMaintainedPriceAtOrBelow2500:priced.length,limitation:pass?null:'No verified exact 75-inch maintained option satisfies the hard A$2,500 ceiling.'};
}
function depthGate(){
  const target=Object.fromEntries(TARGET_CATEGORIES.map(slug=>[slug,graph.targetDepth(slug)]));
  const categoriesPass=Object.values(target).every(x=>x.products>0&&x.withStructuredSpecs>0&&x.withFactEvidence>0&&x.verifiedFacts>0);
  const tv=target.televisions||{};
  return {pass:categoriesPass&&Number(tv.currentRetailerOffers||0)>=1,targetCategories:target,requirements:['Each v4.1 target category has structured specifications','Each v4.1 target category has fact-level evidence','Televisions expose at least one current exact-model retailer/manufacturer offer check']};
}
function qualitySnapshot(){
  const snapshot=base.qualitySnapshot(),exact75=exact75Gate(),depth=depthGate();
  const missingFactEvidence=products.filter(p=>!Object.keys(p.factEvidence||{}).length).length;
  return {...snapshot,version:QUALITY_VERSION,depthVersion:DEPTH_VERSION,catalogue:graph.graphSummary(),dataQuality:{...snapshot.dataQuality,missing:{...(snapshot.dataQuality?.missing||{}),factEvidence:missingFactEvidence}},evaluation:{...snapshot.evaluation,exact75TvUnder2500:exact75,evidenceDepth:depth},releaseGate:{...snapshot.releaseGate,pass:!!snapshot.releaseGate?.pass&&exact75.pass&&depth.pass,requirements:[...(snapshot.releaseGate?.requirements||[]),'An exact maintained 75-inch Australian TV can satisfy the benchmark A$2,500 hard ceiling','All v4.1 target categories expose structured specs and fact-level evidence']}};
}
module.exports={...base,QUALITY_VERSION,qualitySnapshot,exact75Gate,depthGate};