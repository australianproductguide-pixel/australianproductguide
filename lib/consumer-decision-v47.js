'use strict';

// Consumer Decision Intelligence v47 extends the maintained v4 engine without
// replacing its hard-constraint policy. It adds transparent criterion traces,
// soft target-budget / preferred-brand tie-breaks and privacy-safe learning
// signals. Retailer participation, affiliate status and imagery remain zero-
// weight inputs to suitability.
const engine=require('./decision-engine-v4');

const VERSION='consumer-decision-v47';
const LEARNING_SCHEMA_VERSION='decision-learning-signal-v1';
const erank={eligible:2,unverified:1,ineligible:0};
const original={rankDecision:engine.rankDecision,publicDecision:engine.publicDecision};
let installed=false;

const uniq=xs=>[...new Set((xs||[]).filter(Boolean))];
const money=n=>Number(n)>0?`A$${Number(n).toLocaleString('en-AU')}`:null;
const human=x=>typeof engine.human==='function'?engine.human(x):String(x||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const includes=(rows,text)=>(rows||[]).some(row=>String(row||'').toLowerCase().includes(String(text||'').toLowerCase()));

function confidence(r,intent,margin){
  let points=0;
  if(r.p.evidenceTier==='deep')points+=2;
  if(r.p.freshnessStatus==='reviewed-this-month')points++;
  if(intent.decisionState?.category)points++;
  if((intent.softPreferences||[]).length+(intent.requiredTags||[]).length+(intent.numericConstraints||[]).length>1)points++;
  if(r.eligibility==='unverified')points-=2;
  if(r.eligibility==='ineligible')points-=4;
  if(margin>12)points++;
  return points>=5?{level:'high',label:'High confidence'}:points>=3?{level:'moderate',label:'Moderate confidence'}:{level:'limited',label:'Limited evidence'};
}

function refreshPareto(ranked,intent){
  const pool=ranked.filter(r=>r.eligibility!=='ineligible').slice(0,12);
  for(const r of ranked)r.pareto=false;
  const metric=r=>[
    Number(r.score)||0,
    r.p.evidenceTier==='deep'?1:.5,
    Number(r.p.price)>0&&intent.budget?Math.max(0,1-Number(r.p.price)/(intent.budget*1.4)):.5
  ];
  for(const r of pool){
    const m=metric(r);
    r.pareto=!pool.some(o=>o!==r&&metric(o).every((v,i)=>v>=m[i])&&metric(o).some((v,i)=>v>m[i]));
  }
}

function applySoftDecisionSignals(r,intent){
  const price=Number(r.p.price),target=Number(intent.budget);
  if(target>0&&!intent.budgetHard&&price>0){
    const ratio=price/target;
    if(ratio<=1){
      r.score+=(ratio>=.75?7:3);
      r.reasons.push(`Known maintained price basis is at or below your ${money(target)} target budget`);
    }else if(ratio<=1.1){
      r.score+=4;
      r.reasons.push(`Known maintained price basis is close to your ${money(target)} target budget`);
    }else if(ratio<=1.25){
      r.gaps.push(`Known maintained price basis is above your ${money(target)} target budget, but the target is not a hard ceiling`);
    }else{
      r.score-=6;
      r.gaps.push(`Known maintained price basis is materially above your ${money(target)} target budget`);
    }
  }else if(target>0&&!intent.budgetHard&&!(price>0)){
    r.verificationNeeds.push('Current exact price is not maintained, so fit against your target budget needs retailer verification');
  }

  const preferred=String(intent.decisionState?.brandPreference||intent.brandPreference||intent.brand||'').trim();
  if(preferred&&String(r.p.brand||'').toLowerCase()===preferred.toLowerCase()){
    r.score+=6;
    r.reasons.push(`Matches your stated ${preferred} brand preference`);
  }

  r.reasons=uniq(r.reasons);
  r.gaps=uniq(r.gaps);
  r.conflicts=uniq(r.conflicts);
  r.hardFailures=uniq(r.hardFailures);
  r.verificationNeeds=uniq(r.verificationNeeds);
  return r;
}

function rankDecision(q='',opts={}){
  const out=original.rankDecision(q,opts);
  const intent=out.intent||{};
  const ranked=(out.ranked||[]).map(r=>applySoftDecisionSignals({...r,reasons:[...(r.reasons||[])],gaps:[...(r.gaps||[])],conflicts:[...(r.conflicts||[])],hardFailures:[...(r.hardFailures||[])],verificationNeeds:[...(r.verificationNeeds||[])]},intent));
  ranked.sort((a,b)=>(erank[b.eligibility]??-1)-(erank[a.eligibility]??-1)||(Number(b.score)||0)-(Number(a.score)||0)||String(a.p.name||'').localeCompare(String(b.p.name||'')));
  refreshPareto(ranked,intent);
  ranked.forEach((r,i)=>{
    const margin=i===0&&ranked[1]?(Number(r.score)||0)-(Number(ranked[1].score)||0):0;
    r.confidence=confidence(r,intent,margin);
    r.matchLabel=r.eligibility==='ineligible'?'Constraint conflict':r.eligibility==='unverified'?'Needs verification':i===0?'Strong fit':i<3?'Good fit':'Alternative';
  });
  return {...out,ranked};
}

function criterionTrace(r,intent){
  const trace=[];
  const add=(kind,key,label,requested,observed,status,note)=>trace.push({kind,key,label,requested:requested??null,observed:observed??null,status,note:note||null});
  const price=Number(r.p.price)>0?Number(r.p.price):null;

  if(intent.budget){
    if(intent.budgetHard){
      const status=price==null?'unverified':price<=Number(intent.budget)?'met':'conflict';
      add('hard','budget-ceiling','Maximum budget',money(intent.budget),price?money(price):'Exact current price not maintained',status,status==='unverified'?'Budget compliance requires a current exact price check.':null);
    }else{
      const status=price==null?'unverified':price<=Number(intent.budget)*1.1?'aligned':'gap';
      add('soft','target-budget','Target budget',money(intent.budget),price?money(price):'Exact current price not maintained',status,status==='gap'?'The target is a preference, not a hard ceiling.':null);
    }
  }

  for(const tag of intent.requiredTags||[]){
    const label=human(tag),status=includes(r.reasons,`Supports required ${label.toLowerCase()}`)?'met':includes(r.hardFailures,label)||includes(r.verificationNeeds,`Required ${label.toLowerCase()}`)?'unverified':'unverified';
    add('hard',`required:${tag}`,`Must have ${label}`,'Required',null,status,status==='unverified'?'Maintained evidence does not yet verify this must-have.':null);
  }
  for(const tag of intent.hardExcludedTags||[]){
    const label=human(tag),status=includes(r.conflicts,label)||includes(r.hardFailures,label)?'conflict':'met';
    add('hard',`excluded:${tag}`,`Must not have ${label}`,'Excluded',null,status,status==='conflict'?'The product conflicts with an explicit exclusion.':null);
  }
  for(const brand of intent.excludedBrands||[]){
    const status=String(r.p.brand||'').toLowerCase()===String(brand).toLowerCase()?'conflict':'met';
    add('hard',`excluded-brand:${String(brand).toLowerCase()}`,`Exclude ${brand}`,'Excluded',r.p.brand||null,status,null);
  }
  for(const c of intent.numericConstraints||[]){
    const label=human(c.label||c.key),hard=!!c.hard;
    let status='unverified';
    if(includes(r.hardFailures,c.label||c.key))status='conflict';
    else if(includes(r.reasons,c.label||c.key))status=hard?'met':'aligned';
    else if(includes(r.gaps,c.label||c.key))status='gap';
    add(hard?'hard':'soft',`numeric:${c.key}`,label,`${c.mode} ${c.value}${c.unit==='in'?' in':c.unit?` ${c.unit}`:''}`,null,status,null);
  }
  for(const pref of intent.softPreferences||[]){
    const label=human(pref.tag),status=includes(r.reasons,`${label} aligns`)?'aligned':'gap';
    add('soft',`preference:${pref.tag}`,label,pref.priority||'normal',null,status,null);
  }
  for(const tag of intent.softExclusions||[]){
    const label=human(tag),status=includes(r.conflicts,label)?'conflict':'aligned';
    add('soft',`avoid:${tag}`,`Avoid ${label}`,'Prefer to avoid',null,status,null);
  }
  const preferred=String(intent.decisionState?.brandPreference||intent.brandPreference||intent.brand||'').trim();
  if(preferred){
    const status=String(r.p.brand||'').toLowerCase()===preferred.toLowerCase()?'aligned':'gap';
    add('soft','brand-preference','Preferred brand',preferred,r.p.brand||null,status,null);
  }
  return trace;
}

function criterionCoverage(trace){
  const hard=trace.filter(x=>x.kind==='hard'),soft=trace.filter(x=>x.kind==='soft');
  const verified=trace.filter(x=>x.status!=='unverified').length;
  return {
    requested:trace.length,
    verified,
    coveragePct:trace.length?Math.round(verified/trace.length*100):100,
    hardRequested:hard.length,
    hardMet:hard.filter(x=>x.status==='met').length,
    hardConflicts:hard.filter(x=>x.status==='conflict').length,
    hardUnverified:hard.filter(x=>x.status==='unverified').length,
    softRequested:soft.length,
    softAligned:soft.filter(x=>x.status==='aligned').length,
    softGaps:soft.filter(x=>x.status==='gap'||x.status==='conflict').length
  };
}

function learningSignals(payload){
  const top=payload.results?.[0]||null,coverage=top?.criterionCoverage||null;
  return {
    schemaVersion:LEARNING_SCHEMA_VERSION,
    category:payload.decisionState?.category||null,
    outcome:payload.audit?.hardConstraintFallback?'hard-constraint-fallback':top?'ranked-shortlist':'no-maintained-result',
    resultCount:(payload.results||[]).length,
    topConfidence:top?.confidence?.level||null,
    criterionCoverageBucket:coverage?coverage.coveragePct>=90?'high':coverage.coveragePct>=60?'medium':'low':null,
    verificationNeededCount:(payload.results||[]).reduce((n,row)=>n+(row.verificationNeeds||[]).length,0),
    rawQueryPersisted:false,
    productionSelfModification:false,
    policy:'Aggregate outcome signals may inform human-reviewed evaluation; raw shopping queries are not embedded in this signal.'
  };
}

function publicDecision(q='',opts={}){
  const x=rankDecision(q,opts),viable=x.ranked.filter(r=>r.eligibility!=='ineligible'),display=(viable.length?viable:x.ranked).slice(0,5),top=display[0],alt=display[1],changes=[];
  if(alt&&alt.p.price&&top?.p.price&&alt.p.price<top.p.price)changes.push(`If lower spend became the main priority, ${alt.p.brand} ${alt.p.name} becomes more compelling.`);
  if(top?.eligibility==='unverified')changes.push('The answer may change when the unverified hard constraint is checked against a current exact product or retailer source.');
  if(!changes.length)changes.push('A new hard requirement or materially different top priority could change the leading fit.');
  const results=display.map(r=>{
    const criteria=criterionTrace(r,x.intent),coverage=criterionCoverage(criteria);
    return {slug:r.p.slug,brand:r.p.brand,name:r.p.name,category:r.p.categoryLabel,evidenceTier:r.p.evidenceTier||'starter',freshnessStatus:r.p.freshnessStatus||null,match:r.matchLabel,confidence:r.confidence,hardConstraintStatus:r.eligibility,pareto:r.pareto,reasons:r.reasons.slice(0,5),gaps:r.gaps.slice(0,4),conflicts:r.conflicts,hardFailures:r.hardFailures,verificationNeeds:r.verificationNeeds,criteria,criterionCoverage:coverage,tradeoff:r.p.watch||null,priceBasis:r.p.price||null,url:`/products/${r.p.slug}/`};
  });
  const payload={
    version:engine.ENGINE_VERSION,
    consumerIntelligenceVersion:VERSION,
    policyVersion:engine.POLICY_VERSION,
    stateSchemaVersion:engine.STATE_SCHEMA_VERSION,
    searchRankingVersion:engine.SEARCH_RANKING_VERSION,
    basis:'Maintained APG data, explicit hard constraints, user-weighted preferences, soft target-budget context and category decision signals',
    commercialRecommendationWeight:0,
    decisionState:x.intent.decisionState,
    interpretation:{category:x.intent.category?.label||null,brand:x.intent.brand||null,budget:x.intent.budget,budgetHard:x.intent.budgetHard,priorities:x.intent.positiveTags,required:x.intent.requiredTags,avoid:x.intent.excludedTags,signals:[...(x.intent.requiredTags||[]),...(x.intent.positiveTags||[])]},
    recommendation:top?{whyItWon:top.reasons.slice(0,5),whatHeldItBack:[...top.conflicts,...top.gaps,...top.verificationNeeds].slice(0,5),whatAlmostWon:alt?{slug:alt.p.slug,brand:alt.p.brand,name:alt.p.name,why:alt.reasons.slice(0,4),tradeoff:alt.p.watch||null}:null,whenTheAnswerWouldChange:changes}:null,
    paretoOptions:display.filter(r=>r.pareto).map(r=>({slug:r.p.slug,brand:r.p.brand,name:r.p.name,angle:r.p.watch||'Legitimate trade-off on the current decision frontier'})),
    audit:{candidateCount:x.ranked.length,eligibleCount:x.counts.eligible,unverifiedCount:x.counts.unverified,ineligibleCount:x.counts.ineligible,hardConstraintFallback:x.hardConstraintFallback,topCriterionCoverage:results[0]?.criterionCoverage||null},
    results,
    note:'Fit is not a review score. Hard constraints are not silently traded away. Missing proof is marked unverified rather than guessed. Retailer participation, affiliate status and imagery contribute zero suitability points.'
  };
  payload.learningSignals=learningSignals(payload);
  return payload;
}

function install(){
  if(installed)return engine;
  engine.rankDecision=rankDecision;
  engine.publicDecision=publicDecision;
  engine.CONSUMER_INTELLIGENCE_VERSION=VERSION;
  installed=true;
  return engine;
}

module.exports={VERSION,LEARNING_SCHEMA_VERSION,rankDecision,publicDecision,criterionTrace,criterionCoverage,learningSignals,install,original};
