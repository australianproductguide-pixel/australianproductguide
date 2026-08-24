'use strict';

const downstream=require('./action4-decision-evidence-v96');
const closure=require('../data/action4-closure-v97');
const {products,categories}=require('../data');
const catalogueDecision=require('./catalogue-decision-v48-runtime');
const engine=catalogueDecision.engine;

const VERSION='97.0';
const ORIGIN='https://australianproductguide.au';
const baseRank=engine.rankDecision;
const basePublic=engine.publicDecision;
const productBySlug=new Map(products.map(p=>[p.slug,p]));
const categoryNouns=closure.categoryNouns;
const priorityRank={highest:4,high:3,normal:2,low:1};
const eligibilityRank={eligible:2,unverified:1,ineligible:0};

function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function source(row){return row&&row.source?{url:row.source,title:row.sourceType||'Maintained evidence',type:row.sourceType||'maintained-evidence',verifiedAt:row.verifiedAt||closure.VERIFIED_AT,applicability:row.applicability||null}:null;}
function isCategoryNoun(category,tag){const value=norm(tag);return (categoryNouns[category]||[]).some(noun=>norm(noun)===value);}

function applyClosureEvidence(){
  for(const row of closure.entityOverrides){
    const product=productBySlug.get(row.slug);if(!product)continue;
    product.entityStatus=row.status;
    product.recommendationEligibility=row.eligibility;
    product.entityIssueType=row.issueType;
    product.entityResolution=row.resolution;
    product.entityVerifiedAt=closure.VERIFIED_AT;
    product.entityStatusVersion=closure.VERSION;
    product.entityStatusNote=row.note||null;
    product.entityRegion=row.region||null;
    product.entityGeneration=row.generation||null;
    product.entityAuthoritativeSource=row.authoritativeSource||null;
    product.entityAuthoritativeSourceType=row.sourceType||null;
    if(row.correctedName)product.name=row.correctedName;
    if(row.correctedModel)product.model=row.correctedModel;
    if(row.eligibility===closure.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE){
      product.entityRetailerRevalidationRequired=true;
      product.retailers=(product.retailers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
      product.offers=(product.offers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
      product.amazonMappingSuppressedByAction4=true;
    }else{
      product.entityRetailerRevalidationRequired=false;
      if(product.amazonMappingSuppressedByAction4)product.amazonMappingSuppressedByAction4=false;
    }
  }
  for(const [slug,price] of Object.entries(closure.priceEvidence)){
    const product=productBySlug.get(slug);if(!product)continue;
    product.price=price.price;
    product.priceCurrency=price.currency;
    product.priceEvidence=price;
    product.lastPriceCheck=price.verifiedAt;
  }
  for(const [slug,facts] of Object.entries(closure.factEvidenceAdditions)){
    const product=productBySlug.get(slug);if(!product)continue;
    product.factEvidence={...(product.factEvidence||{}),...facts};
  }
  for(const [slug,evidence] of Object.entries(closure.decisionEvidenceAdditions)){
    const product=productBySlug.get(slug);if(!product)continue;
    product.decisionEvidence={...(product.decisionEvidence||{}),...evidence};
    product.decisionEvidenceVersion=closure.SCHEMA_VERSION;
  }
  for(const [slug,schema] of Object.entries(closure.categorySchemas)){
    const category=categories[slug];if(!category)continue;
    category.decisionSchemaVersion=closure.SCHEMA_VERSION;
    category.decisionCriteria=schema.criteria.map(c=>c.key);
    for(const product of category.products||[])product.decisionSchemaVersion=closure.SCHEMA_VERSION;
  }
}
applyClosureEvidence();

function traceKey(trace){return norm(trace&&trace.criterion||trace&&trace.key||trace&&trace.label);}
function canonicaliseRow(row,category){
  const copy={...row,reasons:[...(row.reasons||[])],gaps:[...(row.gaps||[])],verificationNeeds:[...(row.verificationNeeds||[])]};
  const traces=[],seen=new Map();
  let score=Number(copy.score)||0;
  for(const trace of copy.action4Trace||[]){
    if(isCategoryNoun(category,trace.criterion)||isCategoryNoun(category,trace.label)){
      score-=Number(trace.scoreContribution||0);continue;
    }
    const key=traceKey(trace);
    if(!key){traces.push(trace);continue;}
    if(!seen.has(key)){seen.set(key,trace);traces.push(trace);continue;}
    const existing=seen.get(key),p1=priorityRank[existing.requested]||2,p2=priorityRank[trace.requested]||2;
    if(p2>p1){
      score-=Number(existing.scoreContribution||0);
      const index=traces.indexOf(existing);if(index>=0)traces[index]=trace;
      seen.set(key,trace);
    }else score-=Number(trace.scoreContribution||0);
  }
  copy.score=Math.round(score*10)/10;
  copy.action4Trace=traces;
  return copy;
}
function canonicalIntent(intent,category){
  const seen=new Set(),soft=[];
  for(const pref of intent.softPreferences||[]){
    if(isCategoryNoun(category,pref.tag)||isCategoryNoun(category,pref.label))continue;
    const schema=closure.categorySchemas[category];
    const criterion=schema&&schema.criteria.find(c=>c.usedByEngine&&(norm(c.key)===norm(pref.tag)||(c.aliases||[]).some(a=>norm(a)===norm(pref.tag))));
    const key=criterion?criterion.key:norm(pref.tag);
    if(seen.has(key))continue;seen.add(key);soft.push(criterion?{...pref,tag:criterion.key,label:criterion.label}:{...pref});
  }
  const positive=uniq([...(intent.positiveTags||[])].filter(tag=>!isCategoryNoun(category,tag)).map(tag=>{
    const schema=closure.categorySchemas[category];const criterion=schema&&schema.criteria.find(c=>c.usedByEngine&&(norm(c.key)===norm(tag)||(c.aliases||[]).some(a=>norm(a)===norm(tag))));return criterion?criterion.key:tag;
  }));
  const decisionState={...(intent.decisionState||{}),softPreferences:soft.map(p=>({tag:p.tag,label:p.label,priority:p.priority||'normal',weight:Number(p.weight)||1}))};
  return {...intent,softPreferences:soft,positiveTags:positive,decisionState};
}
function rankDecision(q='',opts={}){
  const base=baseRank(q,opts),category=base.intent?.categorySlug||base.intent?.decisionState?.category||opts.category||null,intent=canonicalIntent(base.intent||{},category);
  const ranked=(base.ranked||[]).map(row=>canonicaliseRow(row,category));
  ranked.sort((a,b)=>(eligibilityRank[b.eligibility]??-1)-(eligibilityRank[a.eligibility]??-1)||(Number(b.score)||0)-(Number(a.score)||0)||String(a.p.name||'').localeCompare(String(b.p.name||'')));
  ranked.forEach((row,index)=>{row.matchLabel=row.eligibility==='ineligible'?'Not a current primary recommendation':row.eligibility==='unverified'?'Needs verification':index===0?'Strong fit':index<3?'Good fit':'Alternative';});
  const counts={eligible:ranked.filter(r=>r.eligibility==='eligible').length,unverified:ranked.filter(r=>r.eligibility==='unverified').length,ineligible:ranked.filter(r=>r.eligibility==='ineligible').length};
  return {...base,intent,ranked,counts,hardConstraintFallback:counts.eligible===0&&counts.unverified>0,action41:{version:VERSION,intentHygiene:true}};
}

function coverage(criteria){
  const considered=(criteria||[]).filter(c=>c.kind==='hard'||c.kind==='decision'),verified=considered.filter(c=>c.evidenceStatus?c.evidenceStatus==='VERIFIED':c.status!=='unverified');
  return {requested:considered.length,verified:verified.length,coveragePct:considered.length?Math.round(verified.length/considered.length*100):100,hardRequested:considered.filter(c=>c.kind==='hard').length,hardMet:considered.filter(c=>c.kind==='hard'&&c.status==='met').length,hardConflicts:considered.filter(c=>c.kind==='hard'&&c.status==='conflict').length,hardUnverified:considered.filter(c=>c.kind==='hard'&&c.status==='unverified').length,softRequested:considered.filter(c=>c.kind==='decision').length,softAligned:considered.filter(c=>c.kind==='decision'&&(c.status==='aligned'||c.status==='documented-neutral')).length,softGaps:considered.filter(c=>c.kind==='decision'&&c.status==='gap').length,softUnverified:considered.filter(c=>c.kind==='decision'&&c.status==='unverified').length,verifiedCriterionRequested:considered.length,verifiedCriterionCoveragePct:considered.length?Math.round(verified.length/considered.length*100):null,coveragePolicy:'Action 4.1 counts each canonical hard/decision criterion once. Category nouns and duplicate aliases contribute zero and are removed from the consumer trace.'};
}
function publicDecision(q='',opts={}){
  const base=basePublic(q,opts),rank=rankDecision(q,opts),baseBySlug=new Map((base.results||[]).map(r=>[r.slug,r])),display=(rank.ranked.filter(r=>r.eligibility!=='ineligible').length?rank.ranked.filter(r=>r.eligibility!=='ineligible'):rank.ranked).slice(0,5);
  const results=display.map(r=>{
    const old=baseBySlug.get(r.p.slug)||{},hard=(old.criteria||[]).filter(c=>c.kind==='hard'),criteria=[...hard,...(r.action4Trace||[])],criterionCoverage=coverage(criteria);
    return {...old,slug:r.p.slug,brand:r.p.brand,name:r.p.name,match:r.matchLabel,hardConstraintStatus:r.eligibility,reasons:r.reasons.slice(0,7),gaps:r.gaps.slice(0,6),verificationNeeds:r.verificationNeeds.slice(0,6),criteria,criterionCoverage,entityStatus:r.p.entityStatus,recommendationEligibility:r.p.recommendationEligibility,decisionSchemaVersion:r.p.decisionSchemaVersion||closure.SCHEMA_VERSION,priceBasis:r.p.priceEvidence||r.p.price||null,url:`/products/${r.p.slug}/`};
  });
  const top=display[0],alt=display[1],topResult=results[0];
  const changes=[];
  if(alt&&top&&alt.p.price&&top.p.price&&Number(alt.p.price)<Number(top.p.price))changes.push(`If lower spend became the main priority, ${alt.p.brand} ${alt.p.name} becomes more compelling.`);
  if(topResult?.verificationNeeds?.length)changes.push('The answer may change when currently unknown decision-critical evidence is verified.');
  if(!changes.length)changes.push('A new hard requirement or materially different documented priority could change the leading fit.');
  const recommendation=top?{whyItWon:top.reasons.slice(0,6),whatHeldItBack:[...(top.conflicts||[]),...(top.gaps||[]),...(top.verificationNeeds||[])].slice(0,6),whatAlmostWon:alt?{slug:alt.p.slug,brand:alt.p.brand,name:alt.p.name,why:alt.reasons.slice(0,4),tradeoff:alt.p.watch||null}:null,whenTheAnswerWouldChange:changes}:null;
  return {...base,action4Version:'96.0',action41Version:VERSION,categoryDecisionSchemaVersion:closure.SCHEMA_VERSION,evidenceDepthStandardVersion:closure.DEPTH_STANDARD_VERSION,decisionState:rank.intent.decisionState,recommendation,results,audit:{...(base.audit||{}),candidateCount:rank.ranked.length,eligibleCount:rank.counts.eligible,unverifiedCount:rank.counts.unverified,ineligibleCount:rank.counts.ineligible,hardConstraintFallback:rank.hardConstraintFallback,topCriterionCoverage:topResult?.criterionCoverage||null,criterionTraceParity:true,intentAliasCanonicalised:true,categoryNounsExcluded:true},note:'Action 4.1: each canonical preference is scored once, category nouns are not preferences, exact Australian product identity remains fail-closed when unresolved, and the same shared engine trace feeds Decision Lab, Scout and comparison.'};
}
engine.rankDecision=rankDecision;
engine.publicDecision=publicDecision;
engine.ACTION41_CLOSURE_VERSION=VERSION;
engine.CATEGORY_DECISION_SCHEMA_VERSION=closure.SCHEMA_VERSION;

function entitySummary(){
  const baseRows=closure.entityCorrections.map(row=>({...row})),overrides=new Map(closure.entityOverrides.map(row=>[row.slug,row]));
  const rows=baseRows.map(row=>overrides.has(row.slug)?{...row,...overrides.get(row.slug)}:row);
  const reviewed=rows.length,resolved=rows.filter(r=>/^RESOLVED/.test(String(r.resolution||''))).length,open=reviewed-resolved,excluded=rows.filter(r=>r.eligibility===closure.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE).length;
  return {reviewed,resolved,open,excluded,rows};
}
function evidenceFor(product,key){
  const manual=product.decisionEvidence&&product.decisionEvidence[key];if(manual&&manual.value&&manual.value!=='unknown')return true;
  const schema=closure.categorySchemas[product.category],criterion=schema&&schema.criteria.find(c=>c.key===key);if(!criterion)return false;
  if(key==='university')return !!(product.factEvidence?.portableSignal&&(product.factEvidence?.batteryHours||product.factEvidence?.spec_battery));
  if(key==='travel')return !!(product.factEvidence?.spec_anc&&product.factEvidence?.spec_battery);
  if(key==='beginner')return !!(product.factEvidence?.workflow||product.factEvidence?.learningCurve);
  return (criterion.factKeys||[]).some(f=>product.factEvidence&&product.factEvidence[f]);
}
function depthSummary(){
  const categoriesOut=[];let total=0,strong=0;
  for(const [slug,schema] of Object.entries(closure.categorySchemas)){
    const rows=categories[slug]?.products||[],required=schema.strongDepthRequired||[];
    let categoryStrong=0;const productRows=[];
    for(const product of rows){const verified=required.filter(key=>evidenceFor(product,key)),pct=required.length?Math.round(verified.length/required.length*100):100,isStrong=required.length>0&&verified.length===required.length;if(isStrong)categoryStrong++;productRows.push({slug:product.slug,verifiedRequired:verified.length,required:required.length,coveragePct:pct,strong:isStrong,missing:required.filter(key=>!verified.includes(key))});}
    total+=rows.length;strong+=categoryStrong;categoriesOut.push({category:slug,products:rows.length,strong:categoryStrong,below:rows.length-categoryStrong,strongPct:rows.length?Math.round(categoryStrong/rows.length*1000)/10:0,requiredCriteria:required,productRows});
  }
  return {standard:closure.DEPTH_STANDARD_VERSION,scope:'first-wave category-specific recount',products:total,strong,below:total-strong,strongPct:total?Math.round(strong/total*1000)/10:0,categories:categoriesOut,legacyGlobalCatalogueCount:products.length,globalAllCategoryV2Status:'NOT_YET_DEFINED_FOR_NON_MIGRATED_CATEGORIES'};
}
function paritySnapshot(){
  const scenarios=Object.entries(closure.benchmarkScenarios).map(([name,query])=>{
    const parsed=engine.interpretQuery?engine.interpretQuery(query):null,category=parsed?.categorySlug||null,result=publicDecision(query,category?{category}:{});return {name,query,category,winner:result.results?.[0]?.slug||null,coverage:result.audit?.topCriterionCoverage||null,traceHash:(result.results?.[0]?.criteria||[]).map(c=>`${c.kind}:${c.criterion||c.key}:${c.scoreContribution||0}:${c.evidenceStatus||c.status}`).join('|')};
  });
  return {sharedEngineObject:true,decisionLab:'engine.publicDecision',scout:'scout-concierge-v5-core -> shared decision object',comparison:'scout comparison/decision surfaces -> shared decision object',scenarios};
}
function snapshot(){return {version:VERSION,verifiedAt:closure.VERIFIED_AT,catalogue:{products:products.length,categories:Object.keys(categories).length},schemaVersion:closure.SCHEMA_VERSION,evidenceDepthStandardVersion:closure.DEPTH_STANDARD_VERSION,entityIntegrity:entitySummary(),evidenceDepth:depthSummary(),intentHygiene:{aliasCanonicalisation:true,categoryNounsExcluded:true},parity:paritySnapshot(),governance:{deskResearchOnly:true,unknownIsNotPoorOrAverage:true,commercialRecommendationWeight:0,unresolvedEntityPolicy:'fail-closed'}};}

function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Action4-Closure','v'+VERSION);
  if(path==='/api/intelligence/action4-closure'){
    res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));
  }
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION41_CLOSURE_VERSION:VERSION,ACTION41_SCHEMA_VERSION:closure.SCHEMA_VERSION,ACTION41_DEPTH_VERSION:closure.DEPTH_STANDARD_VERSION,action41Snapshot:snapshot,action41RankDecision:rankDecision,action41PublicDecision:publicDecision,action41DepthSummary:depthSummary,action41EntitySummary:entitySummary,action41ParitySnapshot:paritySnapshot});
module.exports=handler;
