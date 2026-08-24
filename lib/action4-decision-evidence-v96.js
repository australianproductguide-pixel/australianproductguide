'use strict';

const downstream=require('./legacy-account-sync-mobile-alignment-v95');
const action4=require('../data/action4-decision-evidence-v96');
const {products,categories}=require('../data');
const catalogueDecision=require('./catalogue-decision-v48-runtime');
const engine=catalogueDecision.engine;

const VERSION='96.0';
const ORIGIN='https://australianproductguide.au';
const originalRank=engine.rankDecision;
const originalPublic=engine.publicDecision;
const productBySlug=new Map(products.map(product=>[product.slug,product]));
const schemaByCategory=action4.categorySchemas;
const scale=action4.CONTROLLED_SCALE;
const erank={eligible:2,unverified:1,ineligible:0};

function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function human(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function phrasePresent(query,phrase){const q=` ${norm(query)} `,p=norm(phrase);return !!p&&q.includes(` ${p} `);}
function numeric(value){const m=String(value??'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):null;}
function fact(product,key){return product&&product.factEvidence&&product.factEvidence[key]||null;}
function sourceRef(row){return row&&row.source?{url:row.source,title:row.label||row.sourceType||'Maintained exact-product evidence',type:row.sourceType||'maintained-evidence',verifiedAt:row.verifiedAt||null,applicability:row.applicability||null}:null;}
function knownEvidence(value){return value!==undefined&&value!==null&&value!=='unknown';}
function controlled(value,confidence='high',sources=[],note=null,currentness='CURRENT_VERIFIED'){
  const v=String(value||'unknown').toLowerCase();
  return {value:Object.prototype.hasOwnProperty.call(scale,v)?v:'unknown',confidence:confidence||'unknown',evidenceStatus:v==='unknown'?'UNKNOWN':'VERIFIED',currentness,sources:(sources||[]).filter(Boolean),note:note||null};
}
function factControlled(row,value,confidence){return controlled(value,confidence||row?.confidence||'high',[sourceRef(row)],row?.note||null,row?'CURRENT_VERIFIED':'UNVERIFIED');}
function unknown(note='Reliable decision-critical evidence is not yet sufficient for this criterion.'){return controlled('unknown','unknown',[],note,'UNVERIFIED');}

function applyEntityControls(){
  for(const product of products){
    if(!product.entityStatus)product.entityStatus=action4.ENTITY_STATUS.CURRENT;
    if(!product.recommendationEligibility)product.recommendationEligibility=action4.RECOMMENDATION_ELIGIBILITY.CURRENT_RECOMMENDABLE;
    product.entityStatusVersion=action4.VERSION;
  }
  for(const row of action4.entityCorrections){
    const product=productBySlug.get(row.correctedSlug||row.slug);
    if(!product)continue;
    product.entityStatus=row.status;
    product.recommendationEligibility=row.eligibility;
    product.entityIssueType=row.issueType;
    product.entityResolution=row.resolution;
    product.entityVerifiedAt=action4.VERIFIED_AT;
    if(row.note)product.entityStatusNote=row.note;
    if(row.correctedSlug)product.entityCorrectedFrom=row.slug;
    if(row.eligibility===action4.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE){
      product.entityRetailerRevalidationRequired=true;
      product.retailers=(product.retailers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
      product.offers=(product.offers||[]).filter(r=>!/amazon/i.test(String(r&&r.retailer||''))&&!/amazon\.com\.au/i.test(String(r&&r.url||'')));
      product.amazonMappingSuppressedByAction4=true;
    }
  }
  for(const [slug,rows] of Object.entries(action4.independentDecisionEvidence)){
    const product=productBySlug.get(slug);if(!product)continue;
    product.decisionEvidence={...(product.decisionEvidence||{}),...rows};
    product.decisionEvidenceVersion=action4.SCHEMA_VERSION;
  }
  for(const [slug,schema] of Object.entries(schemaByCategory)){
    const category=categories[slug];if(!category)continue;
    category.decisionSchemaVersion=action4.SCHEMA_VERSION;
    category.decisionCriteria=schema.criteria.map(c=>c.key);
    for(const product of category.products||[]){product.decisionSchemaVersion=action4.SCHEMA_VERSION;}
  }
}
applyEntityControls();

function schemaFor(categorySlug){return schemaByCategory[categorySlug]||null;}
function criterionForTag(schema,tag){
  const t=norm(tag);
  return schema&&schema.criteria.find(c=>c.usedByEngine&&(norm(c.key)===t||(c.aliases||[]).some(alias=>norm(alias)===t)))||null;
}
function addCustomPreferences(q,intent,schema){
  if(!schema)return intent;
  const prefs=[...(intent.softPreferences||[])],present=new Set(prefs.map(p=>norm(p.tag)));
  for(const criterion of schema.criteria.filter(c=>c.usedByEngine)){
    if((criterion.aliases||[]).some(alias=>phrasePresent(q,alias))&&!present.has(norm(criterion.key))&&!prefs.some(p=>criterionForTag(schema,p.tag)?.key===criterion.key)){
      prefs.push({tag:criterion.key,label:criterion.label,priority:'normal',weight:1,action4Derived:true});
      present.add(norm(criterion.key));
    }
  }
  const state={...(intent.decisionState||{}),softPreferences:prefs.map(p=>({tag:p.tag,label:p.label||human(p.tag),priority:p.priority||'normal',weight:Number(p.weight)||1}))};
  return {...intent,softPreferences:prefs,positiveTags:uniq([...(intent.positiveTags||[]),...prefs.map(p=>p.tag)]),decisionState:state};
}
function primaryFact(product,keys){for(const key of keys||[]){const row=fact(product,key);if(row)return row;}return null;}
function manualEvidence(product,key){const row=product&&product.decisionEvidence&&product.decisionEvidence[key];if(!row)return null;return {value:row.value||'unknown',confidence:row.confidence||'unknown',evidenceStatus:row.value&&row.value!=='unknown'?'VERIFIED':'UNKNOWN',currentness:row.currentness||'UNVERIFIED',sources:row.sources||[],note:row.note||null,market:row.market||null};}

function travelEvidence(product){
  const anc=primaryFact(product,['spec_anc']);
  const battery=primaryFact(product,['spec_battery']);
  const weight=primaryFact(product,['spec_weight']);
  const wired=primaryFact(product,['spec_audio_cable']);
  const ancYes=anc&&/yes|active|anc/i.test(String(anc.value));
  const hours=numeric(battery&&battery.value);
  const weightNumber=numeric(weight&&weight.value);
  const weightG=weightNumber==null?null:(/kg/i.test(String(weight.value))?weightNumber*1000:weightNumber);
  const inputs=[anc,battery,weight,wired].filter(Boolean);
  if(!anc||hours==null)return unknown('Travel suitability requires maintained ANC and battery evidence; missing inputs are not imputed.');
  let value='average';
  if(ancYes&&hours>=20&&(wired||weightG!=null&&weightG<=300))value='strong';
  if(ancYes&&hours>=30&&wired&&weightG!=null&&weightG<=280)value='excellent';
  if(!ancYes||hours<15)value='limited';
  return controlled(value,inputs.every(x=>x.confidence==='high')?'high':'medium',inputs.map(sourceRef),'APG rule-derived travel suitability from exact maintained facts; this is an interpretation, not a hands-on test.');
}
function coffeeEvidence(product,key){
  const workflow=primaryFact(product,['workflow']);
  const learning=primaryFact(product,['learningCurve']);
  const milk=primaryFact(product,['milkSystem']);
  const cold=primaryFact(product,['coldCoffee']);
  const width=primaryFact(product,['widthMm']),depth=primaryFact(product,['depthMm']);
  const text=norm(`${workflow?.value||''} ${learning?.value||''}`);
  if(key==='beginner'){
    if(!workflow&&!learning)return unknown();
    const v=/one touch|automatic|guided|assisted|easy|low/.test(text)?'strong':/manual|hands on|technique|high/.test(text)?'limited':'average';
    return controlled(v,'high',[sourceRef(workflow),sourceRef(learning)],'Rule-derived from documented workflow and learning-curve fields.');
  }
  if(key==='hands-on'){
    if(!workflow)return unknown();
    const v=/manual|hands on|barista|control/.test(text)?'strong':/one touch|automatic/.test(text)?'limited':'average';
    return controlled(v,'high',[sourceRef(workflow)],'Rule-derived from documented workflow.');
  }
  if(key==='milk'){
    if(!milk)return unknown();
    const t=norm(milk.value);const v=/automatic|auto|integrated|steam|wand|froth/.test(t)?'strong':'average';
    return controlled(v,milk.confidence||'high',[sourceRef(milk)],'Milk workflow signal reflects documented capability, not an unsupported quality score.');
  }
  if(key==='cold'){
    if(!cold)return unknown();return factControlled(cold,cold.value===true||/yes|true/i.test(String(cold.value))?'strong':'limited');
  }
  if(key==='compact'){
    const w=numeric(width&&width.value),d=numeric(depth&&depth.value);if(w==null||d==null)return unknown();
    return controlled(w<=300&&d<=450?'strong':w<=400&&d<=500?'average':'limited','high',[sourceRef(width),sourceRef(depth)],'Rule-derived footprint signal from exact dimensions.');
  }
  return null;
}
function genericFactEvidence(product,criterion){
  const row=primaryFact(product,criterion.factKeys);if(!row)return null;
  const v=row.value;
  if(typeof v==='boolean')return factControlled(row,v?'strong':'limited');
  if(/true|yes/i.test(String(v)))return factControlled(row,'strong');
  if(/false|no/i.test(String(v)))return factControlled(row,'limited');
  const num=numeric(v);
  if(criterion.key==='high-refresh'&&num!=null)return factControlled(row,num>=120?'strong':num>=100?'average':'limited');
  if(criterion.key==='portable')return factControlled(row,'strong');
  if(['pet-hair','obstacle-avoidance','mopping','dock-automation','bright-room','sport','gaming','streaming'].includes(criterion.key))return factControlled(row,'strong');
  return null;
}
function universityEvidence(product){
  const portable=primaryFact(product,['portableSignal']);
  const battery=primaryFact(product,['batteryHours','spec_battery']);
  if(!portable||!battery)return unknown('University fit requires both portability and battery evidence in the maintained record.');
  const hours=numeric(battery.value),isPortable=portable.value===true||/yes|true/i.test(String(portable.value));
  return controlled(isPortable&&hours!=null&&hours>=10?'strong':isPortable?'average':'limited','medium',[sourceRef(portable),sourceRef(battery)],'Rule-derived university fit; workload-specific performance still requires separate evidence.');
}
function resolveEvidence(product,criterion){
  const manual=manualEvidence(product,criterion.key);if(manual)return manual;
  if(product.category==='wireless-headphones'&&criterion.key==='travel')return travelEvidence(product);
  if(product.category==='coffee-machines')return coffeeEvidence(product,criterion.key)||unknown();
  if(product.category==='laptops'&&criterion.key==='university')return universityEvidence(product);
  const generic=genericFactEvidence(product,criterion);if(generic)return generic;
  return unknown();
}
function contributionFor(evidence,weight){
  if(!evidence||evidence.evidenceStatus!=='VERIFIED'||!knownEvidence(evidence.value))return {normalisedScore:null,scoreContribution:0,rankingEffect:'neutral-unknown'};
  const score=scale[String(evidence.value).toLowerCase()];if(score==null)return {normalisedScore:null,scoreContribution:0,rankingEffect:'neutral-unscored'};
  const contribution=Math.round((score-.5)*20*(Number(weight)||1)*10)/10;
  return {normalisedScore:score,scoreContribution:contribution,rankingEffect:contribution>0?'positive':contribution<0?'negative':'neutral'};
}
function removeLegacyPreferenceScoring(row,pref){
  const label=human(pref.tag),aligned=`${label} aligns with your stated priority`,gap=`${label} is not a documented fit signal`;
  const hadAligned=(row.reasons||[]).some(x=>String(x).toLowerCase()===aligned.toLowerCase());
  if(hadAligned)row.score=(Number(row.score)||0)-10*(Number(pref.weight)||1);
  row.reasons=(row.reasons||[]).filter(x=>String(x).toLowerCase()!==aligned.toLowerCase());
  row.gaps=(row.gaps||[]).filter(x=>String(x).toLowerCase()!==gap.toLowerCase());
}
function removeClassificationScoring(row){
  const matched=row.catalogueSignalsMatched||[];
  if(matched.length)row.score=(Number(row.score)||0)-matched.length*6;
  row.reasons=(row.reasons||[]).filter(x=>!/^Maintained catalogue classification aligns with /i.test(String(x)));
}
function traceFor(product,criterion,pref){
  const evidence=resolveEvidence(product,criterion),weight=Number(pref.weight)||1,score=contributionFor(evidence,weight),label=criterion.label;
  const status=evidence.evidenceStatus!=='VERIFIED'?'unverified':score.scoreContribution>0?'aligned':score.scoreContribution<0?'gap':'documented-neutral';
  return {kind:'decision',key:`decision:${criterion.key}`,criterion:criterion.key,label,requested:pref.priority||'normal',userWeight:weight,productValue:evidence.value||'unknown',observed:evidence.value||'unknown',status,evidenceStatus:evidence.evidenceStatus,evidenceConfidence:evidence.confidence||'unknown',currentness:evidence.currentness||'UNVERIFIED',normalisedScore:score.normalisedScore,scoreContribution:score.scoreContribution,rankingEffect:score.rankingEffect,explanationEligible:evidence.evidenceStatus==='VERIFIED',evidenceRefs:(evidence.sources||[]).slice(0,4),note:evidence.note||null};
}
function unscoredTrace(pref){return {kind:'decision',key:`decision:${pref.tag}`,criterion:pref.tag,label:pref.label||human(pref.tag),requested:pref.priority||'normal',userWeight:Number(pref.weight)||1,productValue:'unknown',observed:'unknown',status:'unverified',evidenceStatus:'NO_SCHEMA_PATH',evidenceConfidence:'unknown',currentness:'UNVERIFIED',normalisedScore:null,scoreContribution:0,rankingEffect:'neutral-unscored',explanationEligible:false,evidenceRefs:[],note:'This preference has no approved category-schema scoring pathway in Action 4 and therefore contributes zero rather than being guessed from tags.'};}
function explainTrace(row,trace){
  const lower=trace.label.toLowerCase();
  if(trace.status==='aligned')row.reasons.push(`${trace.label} is supported by documented decision evidence for this model`);
  else if(trace.status==='gap')row.gaps.push(`Documented ${lower} evidence is less aligned with this priority`);
  else if(trace.status==='unverified')row.verificationNeeds.push(`Evidence for ${lower} is currently insufficient to score this criterion`);
}
function enforceEntityEligibility(row){
  const state=row.p.recommendationEligibility;
  if([action4.RECOMMENDATION_ELIGIBILITY.SUPERSEDED_NOT_PRIMARY,action4.RECOMMENDATION_ELIGIBILITY.HISTORICAL,action4.RECOMMENDATION_ELIGIBILITY.ENTITY_UNVERIFIED_EXCLUDE].includes(state)){
    row.eligibility='ineligible';
    const label=row.p.entityStatus||'non-current';
    row.hardFailures=uniq([...(row.hardFailures||[]),`Product entity status ${label} is not eligible for a primary current recommendation`]);
  }
}
function rankDecision(q='',opts={}){
  const base=originalRank(q,opts),schema=schemaFor(base.intent?.categorySlug||base.intent?.decisionState?.category||opts.category),intent=addCustomPreferences(q,base.intent||{},schema);
  const ranked=(base.ranked||[]).map(original=>{
    const row={...original,reasons:[...(original.reasons||[])],gaps:[...(original.gaps||[])],conflicts:[...(original.conflicts||[])],hardFailures:[...(original.hardFailures||[])],verificationNeeds:[...(original.verificationNeeds||[])]};
    const traces=[];
    if(schema){
      removeClassificationScoring(row);
      for(const pref of intent.softPreferences||[]){
        removeLegacyPreferenceScoring(row,pref);
        const criterion=criterionForTag(schema,pref.tag),trace=criterion?traceFor(row.p,criterion,pref):unscoredTrace(pref);
        traces.push(trace);row.score=(Number(row.score)||0)+Number(trace.scoreContribution||0);explainTrace(row,trace);
      }
    }
    enforceEntityEligibility(row);
    row.reasons=uniq(row.reasons);row.gaps=uniq(row.gaps);row.verificationNeeds=uniq(row.verificationNeeds);row.action4Trace=traces;
    return row;
  });
  ranked.sort((a,b)=>(erank[b.eligibility]??-1)-(erank[a.eligibility]??-1)||(Number(b.score)||0)-(Number(a.score)||0)||String(a.p.name||'').localeCompare(String(b.p.name||'')));
  ranked.forEach((row,index)=>{row.matchLabel=row.eligibility==='ineligible'?'Not a current primary recommendation':row.eligibility==='unverified'?'Needs verification':index===0?'Strong fit':index<3?'Good fit':'Alternative';});
  const counts={eligible:ranked.filter(r=>r.eligibility==='eligible').length,unverified:ranked.filter(r=>r.eligibility==='unverified').length,ineligible:ranked.filter(r=>r.eligibility==='ineligible').length};
  return {...base,intent,ranked,counts,hardConstraintFallback:counts.eligible===0&&counts.unverified>0,action4:{version:VERSION,schemaVersion:action4.SCHEMA_VERSION,categorySchema:schema?.label||null}};
}
function verifiedCriterion(row){
  if(row.kind==='classification')return false;
  if(row.evidenceStatus)return row.evidenceStatus==='VERIFIED';
  return !['unverified'].includes(row.status);
}
function criterionCoverage(criteria){
  const decision=criteria.filter(x=>x.kind==='decision'),hard=criteria.filter(x=>x.kind==='hard'),classification=criteria.filter(x=>x.kind==='classification');
  const requested=decision.length+hard.length,verified=[...decision,...hard].filter(verifiedCriterion).length;
  return {requested,verified,coveragePct:requested?Math.round(verified/requested*100):100,hardRequested:hard.length,hardMet:hard.filter(x=>x.status==='met').length,hardConflicts:hard.filter(x=>x.status==='conflict').length,hardUnverified:hard.filter(x=>x.status==='unverified').length,softRequested:decision.length,softAligned:decision.filter(x=>x.status==='aligned'||x.status==='documented-neutral').length,softGaps:decision.filter(x=>x.status==='gap').length,softUnverified:decision.filter(x=>x.status==='unverified').length,verifiedCriterionRequested:requested,verifiedCriterionCoveragePct:requested?Math.round(verified/requested*100):null,classificationRequested:classification.length,classificationAligned:classification.filter(x=>x.status==='classification-aligned').length,classificationGaps:classification.filter(x=>x.status==='classification-gap').length,classificationContextPct:classification.length?Math.round(classification.filter(x=>x.status==='classification-aligned').length/classification.length*100):100,coveragePolicy:'Action 4 coverage counts only evidenced hard/decision criteria. Unknown, schema-less and classification-only context never counts as verified evidence.'};
}
function confidenceFor(row,coverage){
  if(row.eligibility==='ineligible')return {level:'limited',label:'Not current-recommendation eligible'};
  if(coverage.requested&&coverage.coveragePct>=80&&row.p.evidenceTier==='deep')return {level:'high',label:'High evidence confidence'};
  if(!coverage.requested||coverage.coveragePct>=50)return {level:'moderate',label:'Moderate evidence confidence'};
  return {level:'limited',label:'Limited evidence'};
}
function publicDecision(q='',opts={}){
  const baseline=originalPublic(q,opts),x=rankDecision(q,opts),viable=x.ranked.filter(r=>r.eligibility!=='ineligible'),display=(viable.length?viable:x.ranked).slice(0,5),baselineBySlug=new Map((baseline.results||[]).map(r=>[r.slug,r]));
  const results=display.map(r=>{
    const old=baselineBySlug.get(r.p.slug)||{};
    const baselineCriteria=(old.criteria||[]).filter(c=>c.kind==='hard'||c.kind==='classification');
    const criteria=[...baselineCriteria,...(r.action4Trace||[])];
    const coverage=criterionCoverage(criteria),confidence=confidenceFor(r,coverage);
    return {...old,slug:r.p.slug,brand:r.p.brand,name:r.p.name,category:r.p.categoryLabel,evidenceTier:r.p.evidenceTier||'starter',freshnessStatus:r.p.freshnessStatus||null,match:r.matchLabel,confidence,hardConstraintStatus:r.eligibility,reasons:r.reasons.slice(0,7),gaps:r.gaps.slice(0,6),conflicts:r.conflicts||[],hardFailures:r.hardFailures||[],verificationNeeds:r.verificationNeeds||[],criteria,criterionCoverage:coverage,entityStatus:r.p.entityStatus,recommendationEligibility:r.p.recommendationEligibility,decisionSchemaVersion:r.p.decisionSchemaVersion||null,url:`/products/${r.p.slug}/`};
  });
  const topRank=display[0],alt=display[1],topResult=results[0],changes=[];
  if(alt&&topRank&&alt.p.price&&topRank.p.price&&Number(alt.p.price)<Number(topRank.p.price))changes.push(`If lower spend became the main priority, ${alt.p.brand} ${alt.p.name} becomes more compelling.`);
  if(topResult?.verificationNeeds?.length)changes.push('The answer may change when currently unknown decision-critical evidence is verified.');
  if(!changes.length)changes.push('A new hard requirement or materially different documented priority could change the leading fit.');
  const recommendation=topRank?{whyItWon:topRank.reasons.slice(0,6),whatHeldItBack:[...(topRank.conflicts||[]),...(topRank.gaps||[]),...(topRank.verificationNeeds||[])].slice(0,6),whatAlmostWon:alt?{slug:alt.p.slug,brand:alt.p.brand,name:alt.p.name,why:alt.reasons.slice(0,4),tradeoff:alt.p.watch||null}:null,whenTheAnswerWouldChange:changes}:null;
  return {...baseline,version:engine.ENGINE_VERSION||baseline.version,action4Version:VERSION,categoryDecisionSchemaVersion:action4.SCHEMA_VERSION,evidenceDepthStandardVersion:action4.DEPTH_STANDARD_VERSION,basis:'Maintained exact product evidence → category decision schema → normalised criterion → score contribution → explanation. Unknown evidence contributes zero; retailer/affiliate participation contributes zero.',commercialRecommendationWeight:0,decisionState:x.intent.decisionState,recommendation,results,audit:{...(baseline.audit||{}),candidateCount:x.ranked.length,eligibleCount:x.counts.eligible,unverifiedCount:x.counts.unverified,ineligibleCount:x.counts.ineligible,hardConstraintFallback:x.hardConstraintFallback,topCriterionCoverage:topResult?.criterionCoverage||null,criterionTraceParity:true},note:'Action 4: classification tags cannot masquerade as verified decision evidence in migrated categories. Unknown stays unknown, non-current/ambiguous entities fail closed for primary recommendations, and explanations are generated from the same criterion trace that changes rank.'};
}
engine.rankDecision=rankDecision;
engine.publicDecision=publicDecision;
engine.ACTION4_DECISION_EVIDENCE_VERSION=VERSION;
engine.CATEGORY_DECISION_SCHEMA_VERSION=action4.SCHEMA_VERSION;

function entitySummary(){
  const reviewed=action4.entityCorrections.length,resolved=action4.entityCorrections.filter(r=>/^RESOLVED/.test(r.resolution)).length,open=reviewed-resolved;
  const byStatus={};for(const row of action4.entityCorrections)byStatus[row.status]=(byStatus[row.status]||0)+1;
  return {reviewed,resolved,open,byStatus,corrections:action4.entityCorrections};
}
function schemaSummary(){return Object.entries(schemaByCategory).map(([slug,schema])=>({category:slug,label:schema.label,criteria:schema.criteria.length,engineCriteria:schema.criteria.filter(c=>c.usedByEngine).map(c=>c.key),strongDepthRequired:schema.strongDepthRequired}));}
function evidenceSummary(){
  const rows=[];for(const [slug,criteria] of Object.entries(action4.independentDecisionEvidence))for(const [criterion,row] of Object.entries(criteria))rows.push({product:slug,criterion,value:row.value,confidence:row.confidence,verifiedAt:row.verifiedAt,sourceCount:(row.sources||[]).length,market:row.market});
  return {independentDecisionRecords:rows.length,rows};
}
function snapshot(){return {version:VERSION,verifiedAt:action4.VERIFIED_AT,catalogue:{products:products.length,categories:Object.keys(categories).length},schemaVersion:action4.SCHEMA_VERSION,evidenceDepthStandardVersion:action4.DEPTH_STANDARD_VERSION,entityIntegrity:entitySummary(),categorySchemas:schemaSummary(),evidence:evidenceSummary(),priority:action4.demandPriorityPolicy,governance:{deskResearchOnly:true,unknownIsNotPoorOrAverage:true,commercialRecommendationWeight:0,unverifiedEntityRecommendationPolicy:'fail-closed',retailerMappingSuppression:'Amazon mappings are suppressed for entity-unverified exclusions until exact identity is revalidated.'}};}
function productForPath(path){const match=String(path||'').match(/^\/products\/([^/]+)\/$/);return match?productBySlug.get(match[1])||null:null;}
function lifecycleBanner(product){
  if(!product||product.entityStatus===action4.ENTITY_STATUS.CURRENT)return '';
  const status=human(String(product.entityStatus||'').toLowerCase()),note=product.entityStatusNote||'APG retains this page for transparent historical/search value, but the entity is not eligible for a normal current recommendation until its identity/currentness is resolved.';
  return `<aside class="apg-currentness-v96" role="status" aria-label="Product currentness"><strong>${status}</strong><span>${String(note).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</span></aside>`;
}
function patchProductHtml(html,product){
  const banner=lifecycleBanner(product);if(!banner)return html;
  let out=String(html||'');
  const css='<style>.apg-currentness-v96{max-width:1180px;margin:18px auto;padding:14px 18px;border:1px solid #bfd2ea;border-radius:14px;background:#f5f9ff;color:#16324f;display:flex;gap:10px;align-items:flex-start}.apg-currentness-v96 strong{white-space:nowrap}.apg-currentness-v96 span{line-height:1.45}@media(max-width:700px){.apg-currentness-v96{margin:14px 16px;display:block}.apg-currentness-v96 strong{display:block;margin-bottom:5px}}</style>';
  if(!out.includes('.apg-currentness-v96'))out=out.replace('</head>',css+'</head>');
  return out.replace(/(<main\b[^>]*>)/i,'$1'+banner);
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,ORIGIN).pathname}catch{}
  res.setHeader('X-APG-Action4-Decision-Evidence','v'+VERSION);
  if(path==='/api/intelligence/action4'){
    res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify(snapshot()));
  }
  const product=productForPath(path),end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(product&&req.method!=='HEAD'&&res.statusCode===200&&type.startsWith('text/html')&&(typeof body==='string'||Buffer.isBuffer(body))){
      const wasBuffer=Buffer.isBuffer(body),text=wasBuffer?body.toString('utf8'):body,next=patchProductHtml(text,product);
      if(next!==text){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{ACTION4_DECISION_EVIDENCE_VERSION:VERSION,ACTION4_SCHEMA_VERSION:action4.SCHEMA_VERSION,ACTION4_DEPTH_STANDARD_VERSION:action4.DEPTH_STANDARD_VERSION,action4Snapshot:snapshot,action4RankDecision:rankDecision,action4PublicDecision:publicDecision,action4ResolveEvidence:resolveEvidence,action4CriterionCoverage:criterionCoverage});
module.exports=handler;
