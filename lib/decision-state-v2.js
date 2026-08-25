'use strict';

// Canonical APG Decision State v2.
// This is a structured decision contract, not another recommendation engine.
// It preserves the consumer's explicit situation, hard constraints, priorities,
// shortlist and evidence gaps so APG surfaces do not need to reinterpret prose
// every time the same decision moves between Search, Scout, Decision Lab or Compare.
const {products,categories}=require('../data');

const VERSION='decision-state-v2';
const PRODUCT_SLUGS=new Set(products.map(p=>p.slug));
const PRIORITY_WEIGHT=Object.freeze({highest:1.8,high:1.4,normal:1,low:.35});

const clean=(value,max=240)=>String(value??'').trim().replace(/[<>]/g,'').slice(0,max);
const uniq=values=>[...new Set((values||[]).filter(Boolean))];
const cleanList=(values,max=16,itemMax=80)=>uniq((Array.isArray(values)?values:[]).map(v=>clean(v,itemMax)).filter(Boolean)).slice(0,max);
const finite=value=>Number.isFinite(Number(value))?Number(value):null;

function cleanObject(raw,max=24){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
  const out={};
  for(const [key,value] of Object.entries(raw).slice(0,max)){
    const k=clean(key,80);if(!k)continue;
    if(typeof value==='boolean')out[k]=value;
    else if(typeof value==='number'&&Number.isFinite(value))out[k]=value;
    else if(typeof value==='string')out[k]=clean(value,240);
  }
  return out;
}
function normaliseBudget(raw,hard={}){
  const source=raw&&typeof raw==='object'?raw:{};
  const amount=finite(source.amount),maxAmount=finite(source.maxAmount??hard.budgetCeiling),minAmount=finite(source.minAmount),targetAmount=finite(source.targetAmount);
  const selected=amount>0?amount:targetAmount>0?targetAmount:maxAmount>0?maxAmount:null;
  if(!(selected>0)&&!(maxAmount>0)&&!(minAmount>0))return null;
  const mode=['target','ceiling','range'].includes(source.mode)?source.mode:(maxAmount>0?'ceiling':'target');
  return {
    amount:selected,
    currency:'AUD',
    mode,
    hard:source.hard===true||Number(hard.budgetCeiling)>0,
    maxAmount:maxAmount>0?maxAmount:(source.hard===true&&selected>0?selected:null),
    minAmount:minAmount>0?minAmount:null,
    targetAmount:targetAmount>0?targetAmount:(mode==='target'&&selected>0?selected:null)
  };
}
function normalisePreferences(values=[]){
  const byTag=new Map();
  for(const item of Array.isArray(values)?values:[]){
    const tag=clean(item&&item.tag,80);if(!tag)continue;
    const priority=['highest','high','normal','low'].includes(item&&item.priority)?item.priority:'normal';
    const explicit=finite(item&&item.weight),weight=explicit>0&&explicit<=3?explicit:PRIORITY_WEIGHT[priority];
    byTag.set(tag,{tag,priority,weight});
  }
  return [...byTag.values()].slice(0,16);
}
function normaliseNumeric(values=[]){
  return (Array.isArray(values)?values:[]).slice(0,12).map(item=>{
    const key=clean(item&&item.key,80),value=finite(item&&item.value);if(!key||value===null)return null;
    return {key,label:clean(item&&item.label,100)||key.replace(/-/g,' '),value,unit:clean(item&&item.unit,24),mode:['min','max','exact','target'].includes(item&&item.mode)?item.mode:'target',hard:!!(item&&item.hard)};
  }).filter(Boolean);
}
function normaliseRecommendation(raw){
  if(!raw||typeof raw!=='object')return null;
  const winner=clean(raw.winnerSlug||raw.productSlug,180),alts=cleanList(raw.alternativeSlugs||raw.alternatives,5,180).filter(x=>PRODUCT_SLUGS.has(x));
  const winnerSlug=PRODUCT_SLUGS.has(winner)?winner:null;
  const confidence=clean(raw.confidence&&typeof raw.confidence==='object'?raw.confidence.level:raw.confidence,40)||null;
  if(!winnerSlug&&!alts.length&&!confidence)return null;
  return {winnerSlug,alternativeSlugs:alts,confidence};
}
function normaliseState(raw={},opts={}){
  const source=raw&&typeof raw==='object'?raw:{};
  const hard=source.hardConstraints&&typeof source.hardConstraints==='object'?source.hardConstraints:{};
  const requestedCategory=clean(opts.category||source.category,180),category=categories[requestedCategory]?requestedCategory:null;
  const priorities=normalisePreferences(source.priorities||[]),soft=normalisePreferences(source.softPreferences||[]),mergedPrefs=normalisePreferences([...priorities,...soft]);
  const budget=normaliseBudget(source.budget,hard);
  const candidateUniverse=cleanList(source.candidateUniverse,60,180).filter(x=>PRODUCT_SLUGS.has(x));
  const shortlist=cleanList(source.shortlist,5,180).filter(x=>PRODUCT_SLUGS.has(x));
  const comparisons=cleanList(source.comparisons||source.comparisonProductSlugs,4,180).filter(x=>PRODUCT_SLUGS.has(x));
  const requiredBrands=cleanList(hard.requiredBrands||source.requiredBrands,6,80),excludedBrands=cleanList(hard.excludedBrands,12,80);
  const state={
    schemaVersion:VERSION,
    category,
    unresolvedCategory:category?null:clean(source.unresolvedCategory,180)||null,
    situation:clean(source.situation,300)||null,
    intendedUse:clean(source.intendedUse,300)||null,
    budget,
    hardConstraints:{
      budgetCeiling:budget&&budget.hard&&budget.maxAmount>0?budget.maxAmount:Number(hard.budgetCeiling)>0?Number(hard.budgetCeiling):null,
      requiredTags:cleanList(hard.requiredTags,16,80),
      excludedTags:cleanList(hard.excludedTags,16,80),
      excludedBrands,
      requiredBrands
    },
    priorities:mergedPrefs.filter(x=>x.priority==='highest'||x.priority==='high'),
    softPreferences:mergedPrefs,
    softExclusions:cleanList(source.softExclusions,16,80),
    numericConstraints:normaliseNumeric(source.numericConstraints),
    categoryIntent:cleanObject(source.categoryIntent),
    preferences:cleanObject(source.preferences),
    brandPreference:clean(source.brandPreference,80)||null,
    candidateUniverse,
    evidenceGaps:cleanList(source.evidenceGaps,20,240),
    shortlist,
    comparisons,
    recommendation:normaliseRecommendation(source.recommendation),
    confidence:clean(source.confidence&&typeof source.confidence==='object'?source.confidence.level:source.confidence,40)||null,
    retailerIntent:{
      readyToBuy:!!(source.retailerIntent&&source.retailerIntent.readyToBuy),
      preferredRetailers:cleanList(source.retailerIntent&&source.retailerIntent.preferredRetailers,8,80)
    }
  };
  return state;
}
function intentFromState(raw={},opts={}){
  const state=normaliseState(raw,opts),category=state.category?categories[state.category]:null,budget=state.budget;
  const soft=normalisePreferences(state.softPreferences),required=state.hardConstraints.requiredTags,hardExcluded=state.hardConstraints.excludedTags;
  return {
    category,
    categorySlug:state.category,
    structured:{...state.categoryIntent},
    brand:state.brandPreference,
    brandPreference:state.brandPreference,
    budget:budget&&budget.amount>0?budget.amount:null,
    budgetHard:!!(budget&&budget.hard),
    budgetMode:budget&&budget.mode||null,
    positiveTags:uniq([...required,...soft.map(x=>x.tag)]),
    excludedTags:uniq([...hardExcluded,...state.softExclusions]),
    requiredTags:required,
    hardExcludedTags:hardExcluded,
    excludedBrands:state.hardConstraints.excludedBrands,
    requiredBrands:state.hardConstraints.requiredBrands,
    numericConstraints:state.numericConstraints,
    softPreferences:soft,
    softExclusions:state.softExclusions,
    decisionState:state,
    inputMode:'structured-state'
  };
}

module.exports={VERSION,PRIORITY_WEIGHT,normaliseState,intentFromState};
