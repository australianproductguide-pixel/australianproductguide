// APG Research View v43.
// Google AI Mode-inspired search synthesis, implemented with APG's own maintained
// evidence and deterministic Decision Intelligence. No external LLM is called here.
const app=require('./priority-commerce-depth-v42');
const {products,categories}=require('../data');
const {searchSite}=require('./search');
const decision=require('./decision-engine-v4');

const CSS='/assets/research-view-v43.css?v=43';
const JS='/assets/research-view-v43.js?v=43';
const bySlug=new Map(products.map(p=>[p.slug,p]));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Number(n)>0?`A$${Number(n).toLocaleString('en-AU')}`:null;
const human=v=>String(v||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const urlOf=value=>{try{return value instanceof URL?value:new URL(String(value||'/'),'https://australianproductguide.au')}catch{return new URL('https://australianproductguide.au/')}};
const pathnameOf=value=>urlOf(value).pathname;
const unique=a=>[...new Set((a||[]).filter(Boolean))];
const softSentence=s=>{const x=String(s||'').trim();return x?x.charAt(0).toLowerCase()+x.slice(1).replace(/[.]$/,''):'';};

function exactOffers(p){return (p?.offers||[]).filter(o=>o&&o.exactModel===true&&o.url&&o.retailer);}
function stateSignals(state){
  const out=[];
  if(state?.category&&categories[state.category])out.push(categories[state.category].label);
  if(state?.budget?.amount)out.push(`${state.budget.hard?'Up to':'Around'} ${money(state.budget.amount)}`);
  for(const x of state?.hardConstraints?.requiredTags||[])out.push(`Must have ${human(x)}`);
  for(const x of state?.hardConstraints?.excludedBrands||[])out.push(`No ${x}`);
  for(const x of state?.hardConstraints?.excludedTags||[])out.push(`Without ${human(x)}`);
  for(const x of state?.softPreferences||[])out.push(`${human(x.tag)}${x.priority==='highest'?' matters most':x.priority==='high'?' is a priority':''}`);
  for(const x of state?.numericConstraints||[])out.push(`${x.hard?'Required':'Target'} ${x.value}${x.unit==='in'?' inches':` ${x.unit}`}`);
  return unique(out).slice(0,9);
}
function hasDecisionContext(state){
  return !!(state?.category&&(state?.budget?.amount||(state?.hardConstraints?.requiredTags||[]).length||(state?.hardConstraints?.excludedBrands||[]).length||(state?.hardConstraints?.excludedTags||[]).length||(state?.softPreferences||[]).length||(state?.numericConstraints||[]).length));
}
function resultView(r){
  const p=bySlug.get(r.slug);
  if(!p)return null;
  return {slug:p.slug,brand:p.brand,name:p.name,url:`/products/${p.slug}/`,category:p.categoryLabel||categories[p.category]?.label||r.category||null,match:r.match||null,confidence:r.confidence||null,status:r.hardConstraintStatus||null,priceBasis:Number(r.priceBasis||p.price)>0?Number(r.priceBasis||p.price):null,reasons:unique(r.reasons).slice(0,4),gaps:unique(r.gaps).slice(0,3),verificationNeeds:unique(r.verificationNeeds).slice(0,3),tradeoff:r.tradeoff||p.watch||null,evidenceTier:p.evidenceTier||'starter',freshnessStatus:p.freshnessStatus||null,summary:p.summary||null};
}
function productFallback(p,label='Relevant maintained product'){
  return {slug:p.slug,brand:p.brand,name:p.name,url:`/products/${p.slug}/`,category:p.categoryLabel||categories[p.category]?.label||null,match:label,confidence:{level:p.evidenceTier==='deep'?'moderate':'limited',label:p.evidenceTier==='deep'?'Maintained evidence':'Limited evidence'},status:'starting-point',priceBasis:Number(p.price)>0?Number(p.price):null,reasons:(p.highlights||[]).slice(0,3),gaps:[],verificationNeeds:[],tradeoff:p.watch||null,evidenceTier:p.evidenceTier||'starter',freshnessStatus:p.freshnessStatus||null,summary:p.summary||null};
}
function sourceView(r){
  const p=bySlug.get(r.slug);if(!p)return null;
  const offers=exactOffers(p);
  return {slug:p.slug,product:`${p.brand} ${p.name}`,apgUrl:`/products/${p.slug}/`,source:p.source||null,sourceLabel:p.source?`${p.brand} official product information`:'APG maintained product record',sourceType:p.sourceType||null,lastSourceVerification:p.lastSourceVerification||null,lastRetailerCheck:p.lastRetailerCheck||null,freshnessStatus:p.freshnessStatus||null,exactRetailerOffers:offers.length,offers:offers.slice(0,3).map(o=>({retailer:o.retailer,url:o.url,price:Number(o.price)>0?Number(o.price):null,availability:o.availability||null,checkedAt:o.checkedAt||null}))};
}
function followUps(q,payload){
  const state=payload.decisionState||{},category=state.category,top=payload.results?.[0],base=String(q||'').trim(),out=[];
  if(state?.budget?.amount)out.push({label:'Show better value',query:`${base} value is my highest priority`});
  else out.push({label:'Add a budget',query:`${base} under $1000`});
  if((state?.softPreferences||[]).length)out.push({label:'What if my priorities change?',query:`${base} show alternatives with different trade offs`});
  else out.push({label:'Make the fit more specific',query:`${base} prioritise reliability and value`});
  if(top)out.push({label:'What am I giving up?',query:`${base} explain the most important compromise`});
  if(category)out.push({label:`Open ${categories[category]?.label||human(category)} Decision Lab`,url:`/decision-lab/?q=${encodeURIComponent(base)}&category=${encodeURIComponent(category)}`});
  return out.slice(0,4);
}
function directComparePayload(q,s,d){
  const a=s.directCompare.a,b=s.directCompare.b;
  return {version:'research-view-v43',generationMethod:'evidence-grounded deterministic synthesis',query:q,mode:'comparison',commercialRecommendationWeight:0,decisionState:d.decisionState||null,signals:stateSignals(d.decisionState),headline:`Compare ${a.name} with ${b.name}`,answer:'APG found a maintained head-to-head for these products. Use the prepared comparison to inspect the differences, trade-offs and evidence before choosing.',confidenceLabel:'Prepared APG comparison',comparison:{url:s.directCompare.url,a:{slug:a.slug,brand:a.brand,name:a.name},b:{slug:b.slug,brand:b.brand,name:b.name}},results:[productFallback(a,'Comparison candidate'),productFallback(b,'Comparison candidate')],whatCouldChange:['Your preferred use case, budget or deal-breaker can change which side of the comparison fits better.'],sources:[sourceView({slug:a.slug}),sourceView({slug:b.slug})].filter(Boolean),note:'Retailer relationships and affiliate commission do not improve recommendation order.'};
}
function researchPayload(raw=''){
  const q=String(raw||'').trim();
  if(!q)return {version:'research-view-v43',generationMethod:'evidence-grounded deterministic synthesis',query:'',mode:'empty',commercialRecommendationWeight:0,headline:'Ask APG a complete buying question',answer:'Include the product type, budget, priorities and deal-breakers. APG will turn that into a maintained-evidence research view rather than a generic keyword list.',results:[],signals:[],sources:[],whatCouldChange:[]};
  const s=searchSite(q),d=decision.publicDecision(q),state=d.decisionState||{};
  if(s.directCompare)return directComparePayload(q,s,d);
  const rich=hasDecisionContext(state),strictNoMatch=s.zeroResult?.reason==='hard-constraint-no-match'||d.audit?.hardConstraintFallback===true;
  let results=(d.results||[]).map(resultView).filter(Boolean);
  if(!rich&&s.products?.length){const existing=new Map(results.map(x=>[x.slug,x]));results=s.products.slice(0,5).map(p=>existing.get(p.slug)||productFallback(p));}
  results=results.slice(0,5);
  const best=results[0]||null,reasons=best?.reasons||[];
  let headline,answer,confidenceLabel;
  if(strictNoMatch){headline='No clean verified match yet';answer=s.zeroResult?.message||'APG cannot currently verify every hard requirement against one maintained product. Closest candidates remain clearly separated instead of silently relaxing your constraints.';confidenceLabel='Constraint-safe result';}
  else if(best&&rich){headline=`Best current fit: ${best.brand} ${best.name}`;const why=reasons.slice(0,3).map(softSentence).filter(Boolean).join('; ');answer=`For this brief, ${best.brand} ${best.name} is the strongest maintained fit${why?` because it ${why}`:''}. ${best.tradeoff?`The main thing to keep in mind is: ${best.tradeoff}`:'Check the product evidence and current retailer details before purchase.'}`;confidenceLabel=best.confidence?.label||'Evidence-based fit';}
  else if(best){headline='A stronger starting point for your research';answer=`APG found maintained results for “${q}”, but the brief is still broad. ${best.brand} ${best.name} is a useful starting point; add a budget, use case, priority or deal-breaker to turn this into a more decisive recommendation.`;confidenceLabel='More context recommended';}
  else {headline='APG needs a little more to work with';answer=s.zeroResult?.message||'No strong maintained product match is available for this query yet. Try a product type, model, brand, budget or use case.';confidenceLabel='Coverage limited';}
  const payload={version:'research-view-v43',generationMethod:'evidence-grounded deterministic synthesis',engineVersion:d.version||null,policyVersion:d.policyVersion||null,query:q,mode:strictNoMatch?'constraint-no-match':rich?'decision':'discovery',commercialRecommendationWeight:Number(d.commercialRecommendationWeight??0),decisionState:state,signals:stateSignals(state),headline,answer,confidenceLabel,results,whatCouldChange:unique(d.recommendation?.whenTheAnswerWouldChange||[]).slice(0,3),sources:results.slice(0,3).map(sourceView).filter(Boolean),audit:d.audit||null,note:d.note||'Fit is not a review score. Missing proof is marked unverified rather than guessed.'};
  payload.followUps=followUps(q,payload);
  payload.compareSlugs=results.slice(0,3).map(x=>x.slug);
  return payload;
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
  if(p.mode==='empty')return `<section class="apg-rv-intro-v43"><div class="wrap"><div class="apg-rv-intro-grid-v43"><div><span class="apg-rv-kicker-v43">APG Research View</span><h2>Ask the whole buying question.</h2><p>Instead of reducing your need to keywords, describe the situation in one go. APG can interpret category, budget, priorities and deal-breakers and keep the evidence visible.</p></div><div class="apg-rv-example-grid-v43"><a href="/search/?q=${encodeURIComponent('75-inch TV under $2500 for a bright room, sport and Netflix')}">75-inch TV under A$2,500 for a bright room, sport and Netflix <span>→</span></a><a href="/search/?q=${encodeURIComponent('quiet washing machine for a family, at least 9kg, under $1600')}">Quiet family washing machine, at least 9 kg, under A$1,600 <span>→</span></a><a href="/search/?q=${encodeURIComponent('phone with a great camera and battery, Android preferred, under $1500')}">Android phone with a great camera and battery under A$1,500 <span>→</span></a></div></div></div></section>`;
  const resultCards=(p.results||[]).slice(0,3).map(renderResult).join('');
  const signals=(p.signals||[]).map(x=>`<span>${esc(x)}</span>`).join('');
  const changes=(p.whatCouldChange||[]).map(x=>`<li>${esc(x)}</li>`).join('');
  const sources=(p.sources||[]).map(renderSource).join('');
  const follow=(p.followUps||[]).map(x=>x.url?`<a href="${esc(x.url)}">${esc(x.label)} <span>→</span></a>`:`<button type="button" data-rv-refine="${esc(x.query)}">${esc(x.label)} <span>→</span></button>`).join('');
  const compare=p.compareSlugs?.length>1?`<button class="apg-rv-compare-v43" type="button" data-rv-compare="${esc(p.compareSlugs.join(','))}">Compare top ${Math.min(3,p.compareSlugs.length)} side by side</button>`:'';
  const comparison=p.comparison?`<a class="apg-rv-comparison-v43" href="${esc(p.comparison.url)}">Open the prepared ${esc(p.comparison.a.name)} vs ${esc(p.comparison.b.name)} comparison →</a>`:'';
  return `<section class="apg-rv-v43" data-rv-root data-rv-query="${esc(p.query)}" aria-labelledby="apgRvTitleV43"><div class="wrap"><header class="apg-rv-head-v43"><div><span class="apg-rv-kicker-v43"><i aria-hidden="true">✦</i> APG Research View</span><h2 id="apgRvTitleV43">${esc(p.headline)}</h2></div><div class="apg-rv-engine-v43"><strong>APG Decision Intelligence</strong><small>Maintained evidence · transparent reasoning · commercial weight ${p.commercialRecommendationWeight}</small></div></header><div class="apg-rv-layout-v43"><article class="apg-rv-answer-v43"><div class="apg-rv-confidence-v43"><span>${esc(p.confidenceLabel)}</span><a href="#apgRvSourcesV43">Sources</a></div><p class="apg-rv-answer-copy-v43">${esc(p.answer)}</p>${comparison}<div class="apg-rv-products-v43">${resultCards}</div>${compare}<div class="apg-rv-follow-v43"><div><strong>Go deeper</strong><span>Refine the same question without starting over.</span></div><div class="apg-rv-follow-chips-v43">${follow}</div><form action="/search/" method="get" data-rv-follow-form><label class="sr-only" for="apgRvFollowV43">Ask a follow-up</label><input id="apgRvFollowV43" name="follow" type="text" autocomplete="off" placeholder="Ask a follow-up, e.g. ‘what if I spend A$500 more?’"><button type="submit">Ask follow-up</button></form></div></article><aside class="apg-rv-brief-v43"><span class="apg-rv-side-label-v43">What APG understood</span>${signals?`<div class="apg-rv-signals-v43">${signals}</div>`:'<p>Add a budget, priorities or deal-breakers for a sharper result.</p>'}${changes?`<div class="apg-rv-change-v43"><strong>What could change the answer</strong><ul>${changes}</ul></div>`:''}<details id="apgRvSourcesV43" class="apg-rv-sources-v43" open><summary>Sources & verification</summary>${sources?`<ol>${sources}</ol>`:'<p>No product-level source set is available for this query yet.</p>'}<p>APG does not invent missing evidence. Retailer availability and commission never increase recommendation rank.</p></details><a class="apg-rv-all-v43" href="#all-results-v43">See all matching results ↓</a></aside></div></div></section>`;
}
function searchTransform(html,pathOrUrl){
  const url=urlOf(pathOrUrl),path=url.pathname;if(path!=='/search/')return String(html||'');
  let out=String(html||''),q=(url.searchParams.get('q')||'').trim();
  if(!out.includes(CSS))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS}"></head>`);
  out=out.replace('<p class="kicker">Product comparison search</p><h1>What are you trying to buy?</h1>','<p class="kicker">APG Research Search</p><h1>Ask what you should actually buy.</h1>');
  out=out.replace('Search by product, model, brand, use case or budget. Australian Product Guide translates the query into the current maintained catalogue.','Describe the product, budget, priorities and deal-breakers in natural language. APG turns the brief into an explainable, source-linked research view and keeps the full results underneath.');
  const payload=researchPayload(q),block=renderResearch(payload),hero=/<section class="search-hero">[\s\S]*?<\/section>/;
  if(hero.test(out)&&!out.includes('data-rv-root'))out=out.replace(hero,m=>m+block);
  if(q&&!out.includes('id="all-results-v43"'))out=out.replace('<div class="search-groups">','<div class="search-groups" id="all-results-v43">');
  if(!out.includes(JS))out=out.replace('</body>',`<script src="${JS}" defer></script></body>`);
  return out;
}
function transform(html,pathOrUrl){const url=urlOf(pathOrUrl);return searchTransform(app.transform?app.transform(String(html||''),url):String(html||''),url);}
function sendJson(req,res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('X-Content-Type-Options','nosniff');return res.end(req.method==='HEAD'?'':JSON.stringify(data));}

module.exports=(req,res)=>{
  const url=urlOf(req.url),path=url.pathname;
  if(path==='/api/search/research'||path==='/api/search/research/'){
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return sendJson(req,res,405,{error:'Method not allowed'});}
    return sendJson(req,res,200,researchPayload(url.searchParams.get('q')||''));
  }
  const end=res.end.bind(res);
  res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=searchTransform(body,url);return end(body,...args);};
  return app(req,res);
};
module.exports.transform=transform;
module.exports.searchTransform=searchTransform;
module.exports.researchPayload=researchPayload;
module.exports.stateSignals=stateSignals;
