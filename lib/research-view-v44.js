// APG Research View v44 — exact/model-intent relevance hardening.
// Keeps broad Search discovery broad, but prevents a model-specific Research View
// from presenting products in unrelated categories as recommendation alternatives.
// The underlying catalogue, evidence and affiliate-neutral ranking remain authoritative.
const upstream=require('./research-view-v43');
const {products,categories}=require('../data');
const {searchSite}=require('./search');

const VERSION='research-view-v44';
const bySlug=new Map(products.map(p=>[p.slug,p]));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n)>0?`A$${Number(n).toLocaleString('en-AU')}`:null;
const unique=a=>[...new Set((a||[]).filter(Boolean))];
const compact=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const urlOf=value=>{try{return value instanceof URL?value:new URL(String(value||'/'),'https://australianproductguide.au')}catch{return new URL('https://australianproductguide.au/')}};
const brandByCompact=new Map(unique(products.map(p=>p.brand)).map(brand=>[compact(brand),brand]));

function exactOffers(p){return (p?.offers||[]).filter(o=>o&&o.exactModel===true&&o.url&&o.retailer);}
function fallbackResult(p,label='Comparable maintained product'){
  return {slug:p.slug,brand:p.brand,name:p.name,url:`/products/${p.slug}/`,category:p.categoryLabel||categories[p.category]?.label||null,match:label,confidence:{level:p.evidenceTier==='deep'?'moderate':'limited',label:p.evidenceTier==='deep'?'Maintained evidence':'Limited evidence'},status:'starting-point',priceBasis:Number(p.price)>0?Number(p.price):null,reasons:(p.highlights||[]).slice(0,3),gaps:[],verificationNeeds:[],tradeoff:p.watch||null,evidenceTier:p.evidenceTier||'starter',freshnessStatus:p.freshnessStatus||null,summary:p.summary||null};
}
function sourceView(r){
  const p=bySlug.get(r.slug);if(!p)return null;
  const offers=exactOffers(p);
  return {slug:p.slug,product:`${p.brand} ${p.name}`,apgUrl:`/products/${p.slug}/`,source:p.source||null,sourceLabel:p.source?`${p.brand} official product information`:'APG maintained product record',sourceType:p.sourceType||null,lastSourceVerification:p.lastSourceVerification||null,lastRetailerCheck:p.lastRetailerCheck||null,freshnessStatus:p.freshnessStatus||null,exactRetailerOffers:offers.length,offers:offers.slice(0,3).map(o=>({retailer:o.retailer,url:o.url,price:Number(o.price)>0?Number(o.price):null,availability:o.availability||null,checkedAt:o.checkedAt||null}))};
}
function modelTokens(raw){
  return (String(raw||'').toLowerCase().match(/[a-z0-9][a-z0-9-]*/g)||[])
    .filter(t=>/[a-z]/.test(t)&&/\d/.test(t)&&compact(t).length>=3);
}
function isModelIntent(raw,anchor){
  if(!anchor)return false;
  const q=compact(raw),name=compact(anchor.name),branded=compact(`${anchor.brand} ${anchor.name}`),identity=compact(`${anchor.brand}${anchor.name}`);
  if(q&&(q===name||q===branded))return true;
  return modelTokens(raw).some(token=>identity.includes(compact(token)));
}
function modelAnchor(raw,search){
  const anchor=search?.products?.[0]||null;
  return isModelIntent(raw,anchor)?anchor:null;
}
function coherentResults(raw,payload){
  const search=searchSite(raw),anchor=modelAnchor(raw,search);
  if(!anchor||!anchor.category)return {anchor:null,results:payload.results||[]};
  const existing=new Map((payload.results||[]).map(r=>[r.slug,r]));
  const ordered=[],seen=new Set();
  const add=(p,label)=>{
    if(!p||p.category!==anchor.category||seen.has(p.slug))return;
    seen.add(p.slug);
    ordered.push(existing.get(p.slug)||fallbackResult(p,label));
  };
  add(anchor,'Exact/model match');
  for(const p of search.products||[])add(p,'Same-category maintained result');
  // If lexical model search does not yield enough like-for-like options, use the
  // maintained catalogue order only within the anchored category. This avoids a
  // same-brand product in another category becoming a comparison candidate.
  for(const p of products)if(ordered.length<5)add(p,'Same-category maintained alternative');
  return {anchor,results:ordered.slice(0,5)};
}
function brandOnlyComparison(raw){
  const parts=String(raw||'').trim().split(/\s+(?:vs\.?|versus)\s+/i);
  if(parts.length!==2)return null;
  const a=brandByCompact.get(compact(parts[0])),b=brandByCompact.get(compact(parts[1]));
  if(!a||!b||a===b)return null;
  const aCategories=new Set(products.filter(p=>p.brand===a).map(p=>p.category));
  const shared=[...new Set(products.filter(p=>p.brand===b&&aCategories.has(p.category)).map(p=>p.category))]
    .filter(slug=>categories[slug])
    .sort((x,y)=>String(categories[x].label).localeCompare(String(categories[y].label)));
  return {a,b,shared};
}
function brandComparisonPayload(raw,payload,comparison){
  const {a,b,shared}=comparison;
  const followUps=shared.slice(0,4).map(slug=>({label:`Compare ${a} vs ${b} ${categories[slug].label}`,query:`${a} vs ${b} ${categories[slug].label}`}));
  return {
    ...payload,
    version:VERSION,
    query:String(raw||'').trim(),
    mode:'comparison-needs-category',
    commercialRecommendationWeight:0,
    decisionState:payload?.decisionState?{...payload.decisionState,category:null,brandPreference:null}:null,
    signals:[a,b,'Choose a shared product category'],
    headline:`Choose a category to compare ${a} with ${b}`,
    answer:`${a} and ${b} span multiple maintained APG product categories. APG will not compare unrelated products just because the brands match your query. Choose a shared category below, or search the two exact models you want to compare.`,
    confidenceLabel:'Needs one more detail',
    comparison:null,
    results:[],
    compareSlugs:[],
    sources:[],
    whatCouldChange:['Naming a shared product category or the two exact models turns this into a like-for-like comparison.'],
    followUps,
    note:'APG only constructs direct comparisons between maintained products in the same category.'
  };
}
function noMatchPayload(raw,payload){
  return {
    ...payload,
    version:VERSION,
    query:String(raw||'').trim(),
    mode:'no-match',
    commercialRecommendationWeight:0,
    signals:['No confident product or category match'],
    headline:'No strong maintained match yet',
    answer:`APG could not confidently match “${String(raw||'').trim()}” to a maintained product, brand or category. Rather than show unrelated catalogue items, try a product type, brand or model, budget, use case or deal-breaker.`,
    confidenceLabel:'No confident match',
    comparison:null,
    results:[],
    compareSlugs:[],
    sources:[],
    whatCouldChange:['A recognisable product type, brand/model or shopping need will give APG enough context to search the maintained catalogue.'],
    followUps:[{label:'Browse all product categories',url:'/categories/'},{label:'Use Decision Lab instead',url:'/decision-lab/'}],
    note:'APG does not fill a zero-result query with unrelated products.'
  };
}
function researchPayload(raw=''){
  const payload=upstream.researchPayload(raw),search=raw?searchSite(raw):null;
  const brandCompare=brandOnlyComparison(raw);
  if(brandCompare)return brandComparisonPayload(raw,payload,brandCompare);
  if(search?.zeroResult?.reason==='unrecognised-query')return noMatchPayload(raw,payload);
  if(!raw||payload?.mode==='empty'||payload?.mode==='comparison')return payload;
  const scoped=coherentResults(raw,payload);
  if(!scoped.anchor)return payload;
  const results=scoped.results,anchor=scoped.anchor,label=anchor.categoryLabel||categories[anchor.category]?.label||'the same category';
  if(!results.length)return payload;
  return {
    ...payload,
    version:VERSION,
    modelScoped:true,
    modelScope:{anchorSlug:anchor.slug,category:anchor.category,categoryLabel:label},
    headline:`Matched product: ${anchor.brand} ${anchor.name}`,
    answer:`APG matched “${String(raw).trim()}” to ${anchor.brand} ${anchor.name}. The alternatives below are kept within ${String(label).toLowerCase()} so the comparison remains like-for-like. Check the maintained product evidence and current retailer details before purchase.`,
    confidenceLabel:'Model-matched research',
    signals:unique([label,...(payload.signals||[])]).slice(0,9),
    results,
    sources:results.slice(0,3).map(sourceView).filter(Boolean),
    compareSlugs:results.slice(0,3).map(r=>r.slug)
  };
}
function renderResult(r,i){
  const why=(r.reasons||[]).slice(0,2).map(x=>`<li>${esc(x)}</li>`).join('');
  const verify=(r.verificationNeeds||[])[0]||(r.gaps||[])[0]||'';
  return `<article class="apg-rv-card-v43${i===0?' is-lead':''}"><div class="apg-rv-card-top-v43"><span>${i===0?'Best current fit':i===1?'Strong alternative':'Another option'}</span><b>${esc(r.confidence?.label||r.match||'Maintained result')}</b></div><p class="apg-rv-brand-v43">${esc(r.brand)}</p><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3>${r.priceBasis?`<strong class="apg-rv-price-v43">${esc(money(r.priceBasis))} <small>APG price context</small></strong>`:'<span class="apg-rv-price-v43 is-check">Check current retailer price</span>'}${why?`<ul>${why}</ul>`:''}${verify?`<p class="apg-rv-verify-v43"><strong>Verify:</strong> ${esc(verify)}</p>`:''}<a class="apg-rv-open-v43" href="${esc(r.url)}">Inspect product evidence →</a></article>`;
}
function renderSource(s,i){
  const external=s.source?`<a href="${esc(s.source)}" target="_blank" rel="noopener">Official source ↗</a>`:'';
  const freshness=[s.lastSourceVerification?`source checked ${s.lastSourceVerification}`:'',s.lastRetailerCheck?`retailers checked ${s.lastRetailerCheck}`:'',s.exactRetailerOffers?`${s.exactRetailerOffers} exact retailer path${s.exactRetailerOffers===1?'':'s'}`:''].filter(Boolean).join(' · ');
  return `<li><span class="apg-rv-source-num-v43">${i+1}</span><div><strong>${esc(s.product)}</strong><small>${esc(s.sourceLabel)}${freshness?` · ${esc(freshness)}`:''}</small><div><a href="${esc(s.apgUrl)}">APG evidence</a>${external}</div></div></li>`;
}
function renderResearch(p){
  const resultCards=(p.results||[]).slice(0,3).map(renderResult).join('');
  const signals=(p.signals||[]).map(x=>`<span>${esc(x)}</span>`).join('');
  const changes=(p.whatCouldChange||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  const sources=(p.sources||[]).map(renderSource).join('');
  const follow=(p.followUps||[]).map(x=>x.url?`<a href="${esc(x.url)}">${esc(x.label)} <span>→</span></a>`:`<button type="button" data-rv-refine="${esc(x.query)}">${esc(x.label)} <span>→</span></button>`).join('');
  const compare=p.compareSlugs?.length>1?`<button class="apg-rv-compare-v43" type="button" data-rv-compare="${esc(p.compareSlugs.join(','))}">Compare top ${Math.min(3,p.compareSlugs.length)} side by side</button>`:'';
  const comparison=p.comparison?`<a class="apg-rv-comparison-v43" href="${esc(p.comparison.url)}">Open the prepared ${esc(p.comparison.a.name)} vs ${esc(p.comparison.b.name)} comparison →</a>`:'';
  const allLink=['no-match','comparison-needs-category'].includes(p.mode)?'':'<a class="apg-rv-all-v43" href="#all-results-v43">See all matching results ↓</a>';
  return `<section class="apg-rv-v43" data-rv-root data-rv-query="${esc(p.query)}" aria-labelledby="apgRvTitleV43"><div class="wrap"><header class="apg-rv-head-v43"><div><span class="apg-rv-kicker-v43"><i aria-hidden="true">✦</i> APG Research View</span><h2 id="apgRvTitleV43">${esc(p.headline)}</h2></div><div class="apg-rv-engine-v43"><strong>APG Decision Intelligence</strong><small>Maintained evidence · transparent reasoning · commercial weight ${p.commercialRecommendationWeight}</small></div></header><div class="apg-rv-layout-v43"><article class="apg-rv-answer-v43"><div class="apg-rv-confidence-v43"><span>${esc(p.confidenceLabel)}</span><a href="#apgRvSourcesV43">Sources</a></div><p class="apg-rv-answer-copy-v43">${esc(p.answer)}</p>${comparison}<div class="apg-rv-products-v43">${resultCards}</div>${compare}<div class="apg-rv-follow-v43"><div><strong>Go deeper</strong><span>Refine the same question without starting over.</span></div><div class="apg-rv-follow-chips-v43">${follow}</div><form action="/search/" method="get" data-rv-follow-form><label class="sr-only" for="apgRvFollowV43">Ask a follow-up</label><input id="apgRvFollowV43" name="follow" type="text" autocomplete="off" placeholder="Ask a follow-up, e.g. ‘what if I spend A$500 more?’"><button type="submit">Ask follow-up</button></form></div></article><aside class="apg-rv-brief-v43"><span class="apg-rv-side-label-v43">What APG understood</span>${signals?`<div class="apg-rv-signals-v43">${signals}</div>`:'<p>Add a budget, priorities or deal-breakers for a sharper result.</p>'}${changes?`<div class="apg-rv-change-v43"><strong>What could change the answer</strong><ul>${changes}</ul></div>`:''}<details id="apgRvSourcesV43" class="apg-rv-sources-v43" open><summary>Sources & verification</summary>${sources?`<ol>${sources}</ol>`:'<p>No product-level source set is available for this query yet.</p>'}<p>APG does not invent missing evidence. Retailer availability and commission never increase recommendation rank.</p></details>${allLink}</aside></div></div></section>`;
}
function searchTransform(html,pathOrUrl){
  const url=urlOf(pathOrUrl);
  if(url.pathname!=='/search/')return String(html||'');
  const out=upstream.searchTransform(String(html||''),url),q=(url.searchParams.get('q')||'').trim();
  if(!q)return out;
  const payload=researchPayload(q),mustReplace=payload?.modelScoped||['comparison-needs-category','no-match'].includes(payload?.mode);
  if(!mustReplace)return out;
  const block=renderResearch(payload),pattern=/<section class="apg-rv-v43"[\s\S]*?<\/section>/;
  if(pattern.test(out))return out.replace(pattern,block);
  const hero=/<section class="search-hero">[\s\S]*?<\/section>/;
  return hero.test(out)?out.replace(hero,m=>m+block):out;
}
function transform(html,pathOrUrl){
  const url=urlOf(pathOrUrl),base=upstream.transform?upstream.transform(String(html||''),url):String(html||'');
  return searchTransform(base,url);
}
function sendJson(req,res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':JSON.stringify(data));}

module.exports=(req,res)=>{
  const url=urlOf(req.url),path=url.pathname;
  if(path==='/api/search/research'||path==='/api/search/research/'){
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return sendJson(req,res,405,{error:'Method not allowed'});}
    return sendJson(req,res,200,researchPayload(url.searchParams.get('q')||''));
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=searchTransform(body,url);return end(body,...args);};
  return upstream(req,res);
};
module.exports.VERSION=VERSION;
module.exports.transform=transform;
module.exports.searchTransform=searchTransform;
module.exports.researchPayload=researchPayload;
module.exports.modelTokens=modelTokens;
module.exports.isModelIntent=isModelIntent;
module.exports.modelAnchor=modelAnchor;
module.exports.coherentResults=coherentResults;
module.exports.brandOnlyComparison=brandOnlyComparison;
