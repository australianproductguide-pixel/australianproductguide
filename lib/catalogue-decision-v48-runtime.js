'use strict';

// v48 broadens soft decision relevance across the whole maintained catalogue.
// Hard constraints remain owned by v4/v47. Generic catalogue signals are derived
// only from maintained product tags/category priorities and never become facts.
const v47=require('./consumer-decision-v47');
const engine=v47.install();
const catalogue=require('./catalogue-intelligence-v48');
const {categories}=require('../data');

const VERSION='catalogue-decision-v48';
const original={rankDecision:engine.rankDecision,publicDecision:engine.publicDecision};
const erank={eligible:2,unverified:1,ineligible:0};
let installed=false;
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const human=s=>String(s||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];
function phrasePresent(query,signal){
  const q=` ${norm(query)} `,s=norm(signal);if(!s||s.length<3)return false;
  if(q.includes(` ${s} `))return true;
  const words=s.split(' ').filter(x=>x.length>=3);return words.length>1&&words.every(x=>q.includes(` ${x} `));
}
function genericSignals(query,intent){
  const slug=intent?.categorySlug||intent?.decisionState?.category;if(!slug||!categories[slug])return [];
  const c=categories[slug],existing=new Set([...(intent.positiveTags||[]),...(intent.requiredTags||[]),...(intent.excludedTags||[])]);
  const candidates=uniq([...(c.priorities||[]),...c.products.flatMap(p=>p.tags||[])]);
  return candidates.filter(tag=>!existing.has(tag)&&phrasePresent(query,tag)).slice(0,10);
}
function rankDecision(q='',opts={}){
  const out=original.rankDecision(q,opts),signals=genericSignals(q,out.intent),ranked=(out.ranked||[]).map(r=>{
    const tags=new Set(r.p.tags||[]),matched=signals.filter(s=>tags.has(s));
    if(!matched.length)return {...r,catalogueSignalsMatched:[]};
    const copy={...r,reasons:[...(r.reasons||[])],gaps:[...(r.gaps||[])],catalogueSignalsMatched:matched};
    copy.score=(Number(copy.score)||0)+matched.length*6;
    for(const signal of matched)copy.reasons.push(`Maintained catalogue classification aligns with ${human(signal)}`);
    copy.reasons=uniq(copy.reasons);
    return copy;
  });
  ranked.sort((a,b)=>(erank[b.eligibility]??-1)-(erank[a.eligibility]??-1)||(Number(b.score)||0)-(Number(a.score)||0)||String(a.p.name||'').localeCompare(String(b.p.name||'')));
  ranked.forEach((r,i)=>{r.matchLabel=r.eligibility==='ineligible'?'Constraint conflict':r.eligibility==='unverified'?'Needs verification':i===0?'Strong fit':i<3?'Good fit':'Alternative';});
  return {...out,ranked,catalogueIntelligence:{version:VERSION,genericSignals:signals,signalPolicy:'Soft relevance only. Maintained catalogue classifications never satisfy a hard requirement without the underlying v4/v47 verification path.'}};
}
function publicDecision(q='',opts={}){
  const baseline=original.publicDecision(q,opts),x=rankDecision(q,opts),viable=x.ranked.filter(r=>r.eligibility!=='ineligible'),display=(viable.length?viable:x.ranked).slice(0,5),top=display[0],alt=display[1],changes=[];
  if(alt&&alt.p.price&&top?.p.price&&Number(alt.p.price)<Number(top.p.price))changes.push(`If lower spend became the main priority, ${alt.p.brand} ${alt.p.name} becomes more compelling.`);
  if(top?.eligibility==='unverified')changes.push('The answer may change when the unverified hard constraint is checked against a current exact product or retailer source.');
  if(!changes.length)changes.push('A new hard requirement or materially different top priority could change the leading fit.');
  const results=display.map(r=>{
    const criteria=v47.criterionTrace(r,x.intent),criterionCoverage=v47.criterionCoverage(criteria),profile=catalogue.profileFor(r.p);
    return {slug:r.p.slug,brand:r.p.brand,name:r.p.name,category:r.p.categoryLabel,evidenceTier:r.p.evidenceTier||'starter',freshnessStatus:r.p.freshnessStatus||null,match:r.matchLabel,confidence:r.confidence,hardConstraintStatus:r.eligibility,pareto:!!r.pareto,reasons:(r.reasons||[]).slice(0,6),gaps:(r.gaps||[]).slice(0,5),conflicts:r.conflicts||[],hardFailures:r.hardFailures||[],verificationNeeds:r.verificationNeeds||[],criteria,criterionCoverage,tradeoff:r.p.watch||null,priceBasis:r.p.price||null,url:`/products/${r.p.slug}/`,catalogueIntelligence:{version:VERSION,evidenceLevel:profile?.evidence.level||null,verifiedFactCount:profile?.evidence.verifiedFactCount||0,structuredSpecCount:profile?.evidence.structuredSpecCount||0,classificationSignalsMatched:r.catalogueSignalsMatched||[],currentExactAustralianDestinations:profile?.commerce.currentExactAustralianDestinationCount||0,productPhotographyStatus:profile?.imagery.status||null,commercialRecommendationWeight:0}};
  });
  const payload={...baseline,consumerIntelligenceVersion:v47.VERSION,catalogueIntelligenceVersion:VERSION,basis:'Maintained APG data, explicit hard constraints, user-weighted preferences, category decision signals and clearly-labelled catalogue classification context',commercialRecommendationWeight:0,decisionState:x.intent.decisionState,interpretation:{...baseline.interpretation,catalogueSignals:x.catalogueIntelligence.genericSignals},recommendation:top?{whyItWon:(top.reasons||[]).slice(0,6),whatHeldItBack:[...(top.conflicts||[]),...(top.gaps||[]),...(top.verificationNeeds||[])].slice(0,5),whatAlmostWon:alt?{slug:alt.p.slug,brand:alt.p.brand,name:alt.p.name,why:(alt.reasons||[]).slice(0,4),tradeoff:alt.p.watch||null}:null,whenTheAnswerWouldChange:changes}:null,audit:{...baseline.audit,candidateCount:x.ranked.length,eligibleCount:x.counts.eligible,unverifiedCount:x.counts.unverified,ineligibleCount:x.counts.ineligible,hardConstraintFallback:x.hardConstraintFallback,topCriterionCoverage:results[0]?.criterionCoverage||null,catalogueSignalCount:x.catalogueIntelligence.genericSignals.length},results,note:'Fit is not a review score. Hard constraints are not silently traded away. Missing proof is marked unverified. Catalogue classifications can improve soft relevance but do not become verified facts. Retailer participation, affiliate status and imagery contribute zero suitability points.'};
  payload.learningSignals={...v47.learningSignals(payload),catalogueIntelligenceVersion:VERSION,rawQueryPersisted:false,productionSelfModification:false};
  return payload;
}
function install(){
  if(installed)return engine;
  engine.rankDecision=rankDecision;engine.publicDecision=publicDecision;engine.CATALOGUE_INTELLIGENCE_VERSION=VERSION;installed=true;return engine;
}
install();
module.exports={VERSION,install,rankDecision,publicDecision,genericSignals,original,engine};