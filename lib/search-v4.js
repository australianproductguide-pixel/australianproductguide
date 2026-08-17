const base=require('./search');
const {categories}=require('../data');
const decision=require('./decision-engine-v4');
const VERSION='search-ranking-v4';
const strict=s=>!!(s?.budget?.hard||(s?.hardConstraints?.requiredTags||[]).length||(s?.hardConstraints?.excludedTags||[]).length||(s?.hardConstraints?.excludedBrands||[]).length||(s?.numericConstraints||[]).some(x=>x.hard));
function searchSite(q=''){
  const old=base.searchSite(q),run=decision.rankDecision(q),state=run.intent.decisionState,bySlug=new Map(run.ranked.map((r,i)=>[r.p.slug,{...r,rank:i}])),category=run.intent.categorySlug;
  let products=[...(old.products||[])].filter(p=>!category||p.category===category).sort((a,b)=>(bySlug.get(a.slug)?.rank??999)-(bySlug.get(b.slug)?.rank??999));
  const isStrict=strict(state),viable=run.ranked.filter(r=>r.eligibility!=='ineligible');
  if(isStrict)products=products.filter(p=>bySlug.get(p.slug)?.eligibility!=='ineligible');
  if(category&&!products.length&&viable.length)products=viable.slice(0,12).map(r=>r.p);
  let zeroResult=null,closestProducts=[];
  if(isStrict&&!viable.length){closestProducts=run.ranked.slice(0,5).map(r=>r.p);products=[];zeroResult={reason:'hard-constraint-no-match',message:'No maintained product can currently be verified against every hard constraint. APG keeps the closest candidates separate rather than presenting a conflict as a match.'};}
  else if(!products.length)zeroResult={reason:'no-exact-product-match',message:'No strong maintained product match is available for this query yet.'};
  const comparisons=(old.comparisons||[]).filter(x=>!category||x.category===category),cats=category&&categories[category]?[categories[category]]:(old.categories||[]);
  return {...old,version:VERSION,decisionState:state,queryUnderstanding:{category,hardConstraints:isStrict,required:state?.hardConstraints?.requiredTags||[],excludedBrands:state?.hardConstraints?.excludedBrands||[],budget:state?.budget||null,numeric:state?.numericConstraints||[]},interpretation:[...(old.interpretation||[]),...(state?.hardConstraints?.requiredTags||[]).map(x=>`Must have ${decision.human(x)}`),...(state?.hardConstraints?.excludedBrands||[]).map(x=>`No ${x}`),...(state?.numericConstraints||[]).map(x=>`${x.hard?'Required':'Target'} ${x.value}${x.unit==='in'?' inches':' '+x.unit}`)],products:products.slice(0,18),categories:cats,comparisons,zeroResult,closestProducts};
}
module.exports={VERSION,searchSite};
