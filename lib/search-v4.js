const base=require('./search-base');
const {categories,products:catalogue}=require('../data');
const decision=require('./decision-engine-v4');
const VERSION='search-ranking-v4';
const strict=s=>!!(s?.budget?.hard||(s?.hardConstraints?.requiredTags||[]).length||(s?.hardConstraints?.excludedTags||[]).length||(s?.hardConstraints?.excludedBrands||[]).length||(s?.numericConstraints||[]).some(x=>x.hard));
const words=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9][a-z0-9-]*/g)||[];
const compact=s=>words(s).join('');
const stop=new Set(['the','and','for','with','from','that','this','good','best','buy','product','products','compare','versus','under','over','around','about','something','thing','want','need']);
const brands=[...new Set(catalogue.map(p=>p.brand).filter(Boolean))];
function exactBrand(q){const x=compact(q);return brands.find(brand=>compact(brand)===x)||null;}
function lexicalIdentity(q,items=[]){
  const tokens=words(q).filter(t=>t.length>=3&&!stop.has(t)&&!/^\d+$/.test(t));
  if(!tokens.length)return false;
  return (items||[]).slice(0,12).some(p=>{const h=words([p.brand,p.name,p.model].filter(Boolean).join(' ')).join(' ');return tokens.some(t=>h.includes(t));});
}
function structuredIntent(state){return !!(state?.category||state?.budget||state?.brandPreference||(state?.hardConstraints?.requiredTags||[]).length||(state?.hardConstraints?.excludedTags||[]).length||(state?.hardConstraints?.excludedBrands||[]).length||(state?.softPreferences||[]).length||(state?.softExclusions||[]).length||(state?.numericConstraints||[]).length);}
function searchSite(q=''){
  const old=base.searchSite(q),run=decision.rankDecision(q),state=run.intent.decisionState,bySlug=new Map(run.ranked.map((r,i)=>[r.p.slug,{...r,rank:i}])),category=run.intent.categorySlug,brandExact=exactBrand(q);
  let products=[...(old.products||[])].filter(p=>!category||p.category===category).sort((a,b)=>(bySlug.get(a.slug)?.rank??999)-(bySlug.get(b.slug)?.rank??999));
  // A bare brand is a discovery filter, not permission to fill recommendation slots
  // with unrelated brands. Keep the result set within the exact maintained brand.
  if(brandExact&&!category)products=catalogue.filter(p=>p.brand===brandExact).sort((a,b)=>(a.evidenceTier==='deep'?0:1)-(b.evidenceTier==='deep'?0:1)||a.name.localeCompare(b.name));
  const isStrict=strict(state),viable=run.ranked.filter(r=>r.eligibility!=='ineligible');
  if(isStrict)products=products.filter(p=>bySlug.get(p.slug)?.eligibility!=='ineligible');
  if(category&&!products.length&&viable.length)products=viable.slice(0,12).map(r=>r.p);
  // A direct comparison is only decision-useful when both resolved products are
  // genuinely like-for-like. Brand-only queries can otherwise make the lexical
  // matcher pick arbitrary products from unrelated categories (for example earbuds
  // versus a monitor). Exact/model comparisons within one category remain intact.
  const directCompare=old.directCompare?.a?.category&&old.directCompare?.a?.category===old.directCompare?.b?.category?old.directCompare:null;
  const recognised=!String(q||'').trim()||structuredIntent(state)||(old.categories||[]).length>0||lexicalIdentity(q,old.products)||!!directCompare;
  let zeroResult=null,closestProducts=[];
  if(!recognised){
    products=[];
    zeroResult={reason:'unrecognised-query',message:'APG could not confidently match this query to a maintained product, brand or category. Try a product type, brand/model, budget or use case rather than showing unrelated catalogue items.'};
  }
  else if(isStrict&&!viable.length){closestProducts=run.ranked.slice(0,5).map(r=>r.p);products=[];zeroResult={reason:'hard-constraint-no-match',message:'No maintained product can currently be verified against every hard constraint. APG keeps the closest candidates separate rather than presenting a conflict as a match.'};}
  else if(!products.length)zeroResult={reason:'no-exact-product-match',message:'No strong maintained product match is available for this query yet.'};
  const comparisons=recognised?(old.comparisons||[]).filter(x=>!category||x.category===category):[],cats=recognised?(category&&categories[category]?[categories[category]]:(old.categories||[])):[];
  const interpretation=[...(old.interpretation||[]),...(state?.hardConstraints?.requiredTags||[]).map(x=>`Must have ${decision.human(x)}`),...(state?.hardConstraints?.excludedBrands||[]).map(x=>`No ${x}`),...(state?.numericConstraints||[]).map(x=>`${x.hard?'Required':'Target'} ${x.value}${x.unit==='in'?' inches':' '+x.unit}`)];
  if(brandExact)interpretation.push(`Brand discovery: ${brandExact}`);
  if(zeroResult)interpretation.push(zeroResult.message);
  return {...old,version:VERSION,decisionState:state,queryUnderstanding:{category,brand:brandExact,hardConstraints:isStrict,required:state?.hardConstraints?.requiredTags||[],excludedBrands:state?.hardConstraints?.excludedBrands||[],budget:state?.budget||null,numeric:state?.numericConstraints||[]},interpretation,products:products.slice(0,18),categories:cats,comparisons,directCompare:recognised?directCompare:null,zeroResult,closestProducts};
}
module.exports={VERSION,searchSite,searchIndex:base.searchIndex,matchProduct:base.matchProduct,norm:base.norm,extractTags:base.extractTags,extractBudget:base.extractBudget,categoryFromQuery:base.categoryFromQuery,unsupportedCategoryFromQuery:base.unsupportedCategoryFromQuery,exactBrand};
