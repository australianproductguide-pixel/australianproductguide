;(()=>{
'use strict';
const KEY='apg_scout_context_v27';
const device=()=>innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop';
const bucket=n=>n<=0?'0':n===1?'1':n<=3?'2-3':n<=10?'4-10':'11+';
function ga(name,params={}){
  if(!window.__apgGaLoaded||typeof window.gtag!=='function')return;
  window.gtag('event',name,{...params,device_class:device()});
}
function safeContext(data){
  const s=data?.decisionState||{};
  const hard=s.hardConstraints||{};
  return {
    version:1,
    savedAt:Date.now(),
    category:s.category||data?.interpretation?.categorySlug||null,
    budget:s.budget?.amount||null,
    hard:{
      requiredTags:Array.isArray(hard.requiredTags)?hard.requiredTags.slice(0,8):[],
      excludedTags:Array.isArray(hard.excludedTags)?hard.excludedTags.slice(0,8):[],
      excludedBrands:Array.isArray(hard.excludedBrands)?hard.excludedBrands.slice(0,6):[],
      numericConstraints:Array.isArray(s.numericConstraints)?s.numericConstraints.slice(0,6).map(x=>({mode:x.mode,value:x.value,unit:x.unit})):[]
    },
    soft:Array.isArray(s.softPreferences)?s.softPreferences.slice(0,8).map(x=>({tag:x.tag,priority:x.priority})):[],
    brandPreference:s.brandPreference||null,
    topSlugs:Array.isArray(data?.results)?data.results.slice(0,3).map(x=>x.slug).filter(Boolean):[]
  };
}
function writeContext(data){
  try{sessionStorage.setItem(KEY,JSON.stringify(safeContext(data)));}catch{}
}
function readContext(){
  try{
    const x=JSON.parse(sessionStorage.getItem(KEY)||'null');
    if(!x||Date.now()-Number(x.savedAt||0)>8*60*60*1000)return null;
    return x;
  }catch{return null;}
}
function clearContext(){try{sessionStorage.removeItem(KEY);}catch{}}
function words(x){return String(x||'').replace(/-/g,' ');}
function contextQuery(x){
  const out=[];
  if(x.budget)out.push('maximum budget $'+x.budget);
  for(const t of x.hard?.requiredTags||[])out.push('must have '+words(t));
  for(const t of x.hard?.excludedTags||[])out.push('without '+words(t));
  for(const b of x.hard?.excludedBrands||[])out.push('no '+b);
  for(const c of x.hard?.numericConstraints||[]){
    const lead=c.mode==='min'?'at least ':c.mode==='max'?'at most ':c.mode==='exact'?'exactly ':'around ';
    out.push(lead+c.value+(c.unit==='in'?' inches':' '+(c.unit||'')));
  }
  for(const p of x.soft||[])out.push((p.priority==='highest'?'top priority ':p.priority==='high'?'priority ':'')+words(p.tag));
  if(x.brandPreference)out.push('prefer '+x.brandPreference);
  return out.join(' ')||'continue with my previous priorities';
}
function injectScoutContinuation(){
  const x=readContext(),body=document.getElementById('apgAssistantBody');
  if(!x||!body||body.querySelector('[data-v27-continue]')||!body.querySelector('.scout-start'))return;
  const card=document.createElement('div');
  card.className='apg-v27-scout-continuity';
  card.setAttribute('data-v27-continue','true');
  const label=x.category?words(x.category):'last shopping brief';
  card.innerHTML='<button type="button" data-scout-q="'+contextQuery(x).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"'+(x.category?' data-scout-category="'+String(x.category).replace(/"/g,'&quot;')+'"':'')+'><span>Continue this session</span><strong>'+label.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</strong><small>Scout remembers only structured buying priorities in this browser tab — not your raw conversation.</small></button><button type="button" class="apg-v27-forget" data-v27-forget>Forget session context</button>';
  body.querySelector('.scout-start').before(card);
}
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const res=await nativeFetch(input,init);
  try{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/api/decision')&&res.ok){
      const clone=res.clone();
      clone.json().then(data=>{
        writeContext(data);
        const count=Array.isArray(data?.results)?data.results.length:0;
        ga('apg_scout_outcome',{category:data?.decisionState?.category||'unknown',result_bucket:bucket(count),hard_constraint_fallback:data?.audit?.hardConstraintFallback?'yes':'no',confidence_band:data?.recommendation?.confidence?.label||'unknown'});
      }).catch(()=>{});
    }
  }catch{}
  return res;
};
function searchOutcome(){
  if(location.pathname!=='/search/'||!new URLSearchParams(location.search).get('q'))return;
  const category=(document.querySelector('.search-interpretation .pill.good')?.textContent||'unknown').trim().toLowerCase().replace(/\s+/g,'-');
  const match=[...document.querySelectorAll('.search-groups h2')].map(x=>x.textContent).join(' ').match(/(\d+)\s+relevant maintained products/i);
  const n=match?Number(match[1]):0;
  ga('apg_search_outcome',{category,result_bucket:bucket(n),zero_result:n===0?'yes':'no',research_view_present:document.querySelector('[data-rv-root]')?'yes':'no'});
}
document.addEventListener('click',e=>{
  if(e.target.closest('[data-scout-reset]')||e.target.closest('[data-v27-forget]')){
    clearContext();
    e.target.closest('[data-v27-continue]')?.remove();
  }
  if(e.target.closest('[data-compare-product]'))ga('apg_compare_select',{source_page:document.body?.dataset?.v26Page||'unknown'});
  const retailer=e.target.closest('.apg-exact-offers-v42 a');
  if(retailer){
    const card=retailer.closest('article');
    const name=(card?.querySelector('strong')?.textContent||retailer.textContent||'retailer').trim().slice(0,60);
    ga('apg_retailer_click',{retailer:name,link_mode:'verified_exact',affiliate:'no'});
  }
  if(e.target.closest('[data-v26-scout-open],#apgAssistantLauncher'))setTimeout(injectScoutContinuation,30);
},{capture:true});
const observer=new MutationObserver(injectScoutContinuation);
const scoutBody=document.getElementById('apgAssistantBody');
if(scoutBody)observer.observe(scoutBody,{childList:true,subtree:true});
window.addEventListener('DOMContentLoaded',()=>{searchOutcome();injectScoutContinuation();});
document.documentElement.dataset.observabilityV27='true';
})();
