'use strict';

const downstream=require('./action4-closure-v971');
const finalData=require('../data/action4-final-v98');
const {products,categories}=require('../data');

const VERSION=finalData.VERSION;
const ORIGIN='https://australianproductguide.au';
const FIRST_WAVE=new Set(['wireless-headphones','robot-vacuums','laptops','coffee-machines','televisions']);
const productBySlug=new Map(products.map(p=>[p.slug,p]));

function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function slugify(value){return norm(value).replace(/\s+/g,'-');}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function primitiveText(value){
  if(value===null||value===undefined)return '';
  if(['string','number','boolean'].includes(typeof value))return String(value);
  if(Array.isArray(value))return value.map(primitiveText).join(' ');
  if(typeof value==='object')return Object.entries(value).map(([k,v])=>`${k} ${primitiveText(v)}`).join(' ');
  return '';
}

function applyFinalEntityReconciliation(){
  for(const row of finalData.finalEntityOverrides){
    const product=productBySlug.get(row.slug);if(!product)continue;
    product.entityStatus=row.status;
    product.recommendationEligibility=row.eligibility;
    product.entityIssueType=row.issueType;
    product.entityResolution=row.resolution;
    product.entityVerifiedAt=finalData.VERIFIED_AT;
    product.entityStatusVersion=VERSION;
    product.entityStatusNote=row.note||null;
    product.entityRegion=row.region||null;
    product.entityAuthoritativeSource=row.authoritativeSource||null;
    product.entityAuthoritativeSourceType=row.sourceType||null;
    if(row.correctedName)product.name=row.correctedName;
    if(row.correctedModel)product.model=row.correctedModel;
    product.entityRetailerRevalidationRequired=false;
    product.amazonMappingSuppressedByAction4=true;
    product.retailers=(product.retailers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
    product.offers=(product.offers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
  }
}

function applyCommerceRevalidation(){
  for(const [slug,row] of Object.entries(finalData.commerceRevalidations)){
    const product=productBySlug.get(slug);if(!product)continue;
    product.entityRetailerRevalidationRequired=false;
    product.entityRetailerRevalidationStatus=row.status;
    product.entityRetailerRevalidatedAt=finalData.VERIFIED_AT;
    product.action4CommerceDestination=row.destination||null;
    product.action4CommerceDestinationAction=row.action;
    product.action4CommerceEvidence={source:row.source,sourceType:row.sourceType,exactIdentity:row.exactIdentity,note:row.note};
  }
}
applyFinalEntityReconciliation();
applyCommerceRevalidation();

// Evidence archetypes are deliberately broad enough to classify the category's own
// maintained buying factors, but they never create product facts. A factor is counted
// only when structured product evidence (specs/factEvidence/decisionEvidence) supports
// the relevant archetype or sufficiently specific factor terms.
const ARCHETYPES={
  battery:['battery','runtime','run time','charging','charge','power duration'],
  performance:['performance','suction','airflow','steam output','output','speed','extraction','cadence','torque','pressure','brightness','lumen','processing','processor','gpu','cpu','grind consistency','cleaning action','drying speed'],
  capacity:['capacity','tank','hopper','basket','volume','litre','liter','storage','load','paper input','bin'],
  size:['size','dimensions','dimension','width','height','depth','footprint','weight','portable','portability','compact','travel'],
  controls:['control','controls','setting','settings','mode','modes','adjustment','adjustable','temperature','speed control','precision','programme','program'],
  connectivity:['connectivity','wireless','wifi','wi fi','bluetooth','usb','hdmi','ethernet','mobile','app','ecosystem','platform','compatibility','compatible','device'],
  display:['display','screen','resolution','panel','refresh','hz','brightness','hdr'],
  audio:['audio','sound','anc','noise cancellation','noise cancelling','microphone','speaker','codec'],
  comfort:['comfort','ergonomic','ergonomics','fit','wear','seat','lumbar','armrest','support'],
  cleaning:['cleaning','maintenance','wash','washing','filter','refill','descale','descaling','retention','consumable','brush head','replacement'],
  automation:['automation','automatic','auto','dock','mapping','navigation','obstacle','sensor','smart'],
  durability:['durability','build','construction','material','materials','warranty','weather','ip rating','water resistance','waterproof'],
  workflow:['workflow','manual','guided','one touch','setup','installation','dosing','portafilter','scan','copy','duplex','paper handling'],
  quality:['quality','accuracy','consistency','precision','colour','color','image quality','video quality','call quality','tracking','sensor'],
  safety:['safety','pressure sensor','overheat','lock','child','hazard','protection'],
  floor:['floor','hard floor','carpet','pet hair','threshold'],
  network:['coverage','mesh','router','band','wifi','wi fi','ethernet','backhaul','throughput'],
  health:['hepa','filter','cadr','allergen','air quality','humidity','contaminant','certification'],
  cooking:['cooking','basket','zone','grill','steam','temperature','heat','programme','program'],
  grooming:['cutting','cut length','comb','blade','shave','shaving','trim','trimming','wet dry','hair type','styling'],
  fitness:['resistance','incline','speed','stride','weight capacity','workout','training','exercise'],
  camera:['camera','video','resolution','field of view','night vision','detection','recording'],
  power:['watt','power','capacity','wh','ac output','solar','inverter','port'],
  price:['price','budget','cost','value']
};
const STOP=new Set('and or the a an for to of with plus versus vs your by from in on at into than use needs need type types style styles system systems model product products whether amount'.split(' '));

function factorArchetypes(factor){
  const f=norm(factor),out=[];
  for(const [key,terms] of Object.entries(ARCHETYPES))if(terms.some(term=>f.includes(norm(term))))out.push(key);
  // Price/value is intentionally not an evidence-depth requirement: transient commerce
  // conditions do not determine whether APG understands what the product is and does.
  return uniq(out.filter(x=>x!=='price'));
}
function structuredCorpus(product){
  const specs=(product.specs||[]).map(row=>Array.isArray(row)?row.join(' '):primitiveText(row)).join(' ');
  return norm([specs,primitiveText(product.factEvidence||{}),primitiveText(product.decisionEvidence||{})].join(' '));
}
function sourceCount(product){
  const sources=[];
  if(product.source)sources.push(product.source);
  for(const row of product.evidenceSources||[])sources.push(row&&row.url||row);
  if(product.entityAuthoritativeSource)sources.push(product.entityAuthoritativeSource);
  return uniq(sources.map(String)).length;
}
function factorEvidence(product,factor){
  const corpus=structuredCorpus(product),archetypes=factorArchetypes(factor),matchedArchetypes=[];
  for(const key of archetypes){
    const terms=ARCHETYPES[key]||[];
    if(terms.some(term=>corpus.includes(norm(term))))matchedArchetypes.push(key);
  }
  const tokens=uniq(norm(factor).split(' ').filter(t=>t.length>=4&&!STOP.has(t)));
  const tokenHits=tokens.filter(t=>corpus.includes(t));
  // Compound factors are conservative: if APG's factor clearly spans multiple evidence
  // archetypes, at least two distinct archetypes must be represented. For simpler factors,
  // one archetype or two specific factor terms are sufficient.
  const archetypeRequired=archetypes.length>=2?Math.min(2,archetypes.length):(archetypes.length?1:0);
  const structured=corpus.length>0;
  const supported=structured&&sourceCount(product)>0&&(
    (archetypeRequired>0&&matchedArchetypes.length>=archetypeRequired) ||
    (archetypeRequired===0&&tokenHits.length>=Math.min(2,Math.max(1,tokens.length)))
  );
  return {supported,matchedArchetypes,tokenHits:tokenHits.slice(0,8),sourceCount:sourceCount(product)};
}

function genericCategorySchema(category){
  const factors=uniq((category.factors||[]).map(String).map(x=>x.trim()).filter(Boolean));
  return {
    category:category.slug,
    label:category.label,
    schemaVersion:finalData.SCHEMA_VERSION,
    source:'maintained category.factors',
    requirements:factors.map(factor=>({key:slugify(factor),label:factor,archetypes:factorArchetypes(factor)})),
    strongRule:'All maintained decision factors must have source-backed structured product evidence. Commerce/affiliate availability and generic classification tags contribute zero.'
  };
}

function censusNonFirstWaveCategory(category){
  const schema=genericCategorySchema(category),required=schema.requirements;
  let strong=0;const productRows=[];
  for(const product of category.products||[]){
    const checks=required.map(req=>({key:req.key,label:req.label,...factorEvidence(product,req.label)}));
    const supported=checks.filter(x=>x.supported).length;
    const isStrong=required.length>0&&supported===required.length;
    if(isStrong)strong++;
    productRows.push({slug:product.slug,supportedRequired:supported,required:required.length,coveragePct:required.length?Math.round(supported/required.length*100):0,strong:isStrong,missing:checks.filter(x=>!x.supported).map(x=>x.label)});
  }
  const count=(category.products||[]).length;
  return {category:category.slug,label:category.label,products:count,strong,below:count-strong,strongPct:count?Math.round(strong/count*1000)/10:0,requiredCriteria:required.map(x=>x.label),schema,productRows};
}

function fullEvidenceDepthCensus(){
  const first=downstream.action41DepthSummary();
  const firstByCategory=new Map((first.categories||[]).map(row=>[row.category,row]));
  const rows=[];
  for(const category of Object.values(categories)){
    if(FIRST_WAVE.has(category.slug)){
      const inherited=firstByCategory.get(category.slug);
      rows.push({...inherited,label:category.label,schema:{category:category.slug,label:category.label,schemaVersion:finalData.SCHEMA_VERSION,source:'explicit Action 4 first-wave category decision schema',requirements:(inherited?.requiredCriteria||[]).map(x=>({key:x,label:x})),strongRule:'Inherited explicit first-wave strong-depth rule.'}});
    }else rows.push(censusNonFirstWaveCategory(category));
  }
  rows.sort((a,b)=>a.category.localeCompare(b.category));
  const total=rows.reduce((n,r)=>n+r.products,0),strong=rows.reduce((n,r)=>n+r.strong,0);
  const factorGaps=new Map();
  for(const row of rows)for(const product of row.productRows||[])for(const factor of product.missing||[]){
    const key=`${row.category}::${factor}`,existing=factorGaps.get(key)||{category:row.category,label:row.label,factor,missingProducts:0};existing.missingProducts++;factorGaps.set(key,existing);
  }
  const priorityGapBacklog=[...factorGaps.values()].sort((a,b)=>b.missingProducts-a.missingProducts||a.category.localeCompare(b.category)).slice(0,40);
  return {
    standard:finalData.DEPTH_STANDARD_VERSION,
    schemaVersion:finalData.SCHEMA_VERSION,
    scope:'all maintained categories and products',
    categoryCount:rows.length,
    schemaDefinedCategories:rows.filter(r=>(r.requiredCriteria||[]).length>0).length,
    products:total,strong,below:total-strong,strongPct:total?Math.round(strong/total*1000)/10:0,
    firstWave:{products:first.products,strong:first.strong,below:first.below,strongPct:first.strongPct},
    methodology:'First-wave categories retain explicit v2.1 criteria. Remaining categories inherit their maintained APG buying factors as v2.2 evidence requirements. Strong requires source-backed structured evidence for every required factor. Classification tags, retailer availability, affiliate status and commission contribute zero.',
    categories:rows,
    priorityGapBacklog
  };
}

function finalEntitySummary(){
  const base=downstream.action41Snapshot().entityIntegrity;
  const overrides=new Map(finalData.finalEntityOverrides.map(x=>[x.slug,x]));
  const rows=(base.rows||[]).map(row=>overrides.has(row.slug)?{...row,...overrides.get(row.slug)}:row);
  const reviewed=rows.length,resolved=rows.filter(r=>/^RESOLVED/.test(String(r.resolution||''))).length;
  return {reviewed,resolved,open:reviewed-resolved,currentRecommendable:rows.filter(r=>r.eligibility==='CURRENT_RECOMMENDABLE'||r.eligibility==='CURRENT_NICHE').length,historicalOrExcluded:rows.filter(r=>r.eligibility==='HISTORICAL'||r.eligibility==='ENTITY_UNVERIFIED_EXCLUDE'||r.eligibility==='SUPERSEDED_NOT_PRIMARY').length,rows};
}
function commerceSummary(){
  const rows=Object.entries(finalData.commerceRevalidations).map(([slug,row])=>({slug,...row}));
  return {reviewed:rows.length,complete:rows.filter(r=>String(r.status).startsWith('REVALIDATED_')).length,pending:rows.filter(r=>!String(r.status).startsWith('REVALIDATED_')).length,exactDestinationCount:rows.filter(r=>!!r.destination&&/DESTINATION/.test(r.status)).length,noExactCurrentDestinationCount:rows.filter(r=>!r.destination).length,policy:'Revalidation can close with no direct destination when no safe current exact Australian offer is established. No ASIN or sibling model is guessed.',rows};
}
function paritySummary(){return downstream.action41ParitySnapshot();}
function closureGate(snapshot){
  const expectedWinners={laptopUniversity:'asus-zenbook-a14-ux3407',robotPetHardFloor:'eufy-robot-vacuum-omni-c28',headphoneComfort:'bose-quietcomfort-ultra-headphones',headphoneAnc:'bose-quietcomfort-ultra-headphones',televisionBrightSport:'hisense-75u6sau',coffeeBeginner:'breville-barista-express-impress-bes876'};
  const parityFailures=(snapshot.parity.scenarios||[]).filter(s=>!s.category||!s.winner||(expectedWinners[s.name]&&s.winner!==expectedWinners[s.name]));
  const checks={
    categorySchemasDefined:snapshot.evidenceDepth.categoryCount===90&&snapshot.evidenceDepth.schemaDefinedCategories===90,
    fullCatalogueRecount:snapshot.evidenceDepth.products===products.length&&products.length===482,
    entityRegisterResolved:snapshot.entityIntegrity.reviewed===24&&snapshot.entityIntegrity.resolved===24&&snapshot.entityIntegrity.open===0,
    commerceRevalidationComplete:snapshot.commerceRevalidation.reviewed===9&&snapshot.commerceRevalidation.pending===0,
    firstWaveParityNoRegression:parityFailures.length===0,
    perCategoryDemandNotFabricated:snapshot.perCategoryDemand.status==='NOT_YET_MEASURED'
  };
  const blockers=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key);
  return {status:blockers.length?'AMBER':'GREEN',checks,blockers,evidenceBacklogStatus:'ONGOING_MAINTENANCE',evidenceBacklogIsGateBlocker:false,reason:blockers.length?'One or more Action 4 closure controls failed.':'Action 4 control architecture, entity integrity, all-category Evidence Depth v2 definitions/recount, commerce revalidation and first-wave P1 parity are complete. Remaining below-strong evidence is an explicit maintained enrichment backlog rather than an unresolved control defect.'};
}

function snapshot(){
  const base=downstream.action41Snapshot();
  const out={...base,version:VERSION,categoryDecisionSchemaVersion:finalData.SCHEMA_VERSION,evidenceDepthStandardVersion:finalData.DEPTH_STANDARD_VERSION,entityIntegrity:finalEntitySummary(),commerceRevalidation:commerceSummary(),evidenceDepth:fullEvidenceDepthCensus(),parity:paritySummary(),perCategoryDemand:{status:'NOT_YET_MEASURED',reason:'Observed category-level decision/search/Scout/comparison volumes remain insufficient for defensible category demand ranking. No demand values are fabricated.'}};
  out.action4Gate=closureGate(out);
  return out;
}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  // Prevent lower compatibility layers from regressing the authoritative closure header.
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
Object.assign(handler,downstream,{ACTION4_FINAL_VERSION:VERSION,action4FinalSnapshot:snapshot,action4FullEvidenceDepthCensus:fullEvidenceDepthCensus,action4FinalEntitySummary:finalEntitySummary,action4CommerceSummary:commerceSummary});
module.exports=handler;
