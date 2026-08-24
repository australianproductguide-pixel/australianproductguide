'use strict';

// Action 7 v101.5 closes the final Decision Lab explanation-parity defect without
// rebuilding Scout or introducing another recommendation engine. The underlying
// product/ranking truth remains Action 4 + Decision Engine v4. This outer layer
// reconciles legacy Decision Lab explanation fragments only when authoritative
// Action 4 evidence proves that the same criterion is documented.
const downstream=require('./action7-scout-decision-v1014');
const action4Runtime=require('./action4-decision-evidence-v96');
const action4=require('../data/action4-decision-evidence-v96');
const decision=require('./decision-engine-v4');
const {products}=require('../data');

const VERSION='101.5';
const ORIGIN='https://australianproductguide.au';
const PRODUCT_BY_SLUG=new Map(products.map(p=>[p.slug,p]));

function norm(value){return String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();}
function human(value){return String(value||'').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase());}
function uniq(values){return [...new Set((values||[]).filter(Boolean))];}
function escapeRegExp(value){return String(value||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function phrasePresent(query,phrase){const q=` ${norm(query)} `,p=norm(phrase);return !!p&&q.includes(` ${p} `);}

function requestDecisionContext(urlLike){
  let url;try{url=new URL(urlLike||'/',ORIGIN)}catch{url=new URL('/',ORIGIN)}
  const q=url.searchParams.get('q')||'';
  const interpreted=decision.interpretQuery(q);
  const category=url.searchParams.get('category')||interpreted.categorySlug||interpreted.decisionState?.category||null;
  const schema=action4.categorySchemas[category]||null;
  const requested=schema?schema.criteria.filter(c=>c.usedByEngine&&([c.key,c.label,...(c.aliases||[])].some(term=>phrasePresent(q,term)))):[];
  return {url,q,category,schema,requested};
}

function legacyGapPatterns(criterion){
  const labels=uniq([criterion.label,human(criterion.key),...(criterion.aliases||[]).filter(a=>norm(a)===norm(criterion.key))]);
  return labels.flatMap(label=>[
    `${label} is not a documented fit signal`,
    `${label} is not a documented match signal`
  ]);
}
function evidenceFor(product,criterion){
  try{return action4Runtime.action4ResolveEvidence(product,criterion)}catch{return null}
}
function verifiedEvidence(evidence){return !!evidence&&evidence.evidenceStatus==='VERIFIED'&&String(evidence.value||'unknown').toLowerCase()!=='unknown';}
function evidenceAlignment(evidence){const value=String(evidence&&evidence.value||'unknown').toLowerCase();if(['excellent','strong'].includes(value))return 'positive';if(value==='limited')return 'negative';return 'neutral';}

function reconcileResultObject(row,context){
  if(!row||!row.slug||!context.requested.length)return row;
  const product=PRODUCT_BY_SLUG.get(row.slug);if(!product)return row;
  row.reasons=[...(row.reasons||[])];row.gaps=[...(row.gaps||[])];
  for(const criterion of context.requested){
    const evidence=evidenceFor(product,criterion);if(!verifiedEvidence(evidence))continue;
    const bad=new Set(legacyGapPatterns(criterion).map(norm));
    row.gaps=row.gaps.filter(g=>!bad.has(norm(g)));
    const alignment=evidenceAlignment(evidence);
    const supported=`${criterion.label} is supported by documented decision evidence for this model`;
    const lessAligned=`Documented ${criterion.label.toLowerCase()} evidence is less aligned with this priority`;
    if(alignment==='positive'&&!row.reasons.some(r=>norm(r)===norm(supported)))row.reasons.push(supported);
    if(alignment==='negative'&&!row.gaps.some(g=>norm(g)===norm(lessAligned)))row.gaps.push(lessAligned);
  }
  row.reasons=uniq(row.reasons);row.gaps=uniq(row.gaps);
  return row;
}
function reconcileDecisionPayload(payload,urlLike){
  if(!payload||!Array.isArray(payload.results))return payload;
  const context=requestDecisionContext(urlLike);
  payload.results=payload.results.map(row=>reconcileResultObject({...row},context));
  return payload;
}

function removeLegacyGapHtml(block,criterion){
  let out=block;
  for(const phrase of legacyGapPatterns(criterion)){
    const re=new RegExp(`<li>${escapeRegExp(phrase)}</li>`,'gi');out=out.replace(re,'');
  }
  return out;
}
function addReasonHtml(block,text){
  if(norm(block).includes(norm(text)))return block;
  const marker='<div class="decision-reasons"><strong>Why it fits</strong><ul>';
  if(block.includes(marker))return block.replace(marker,marker+`<li>${text}</li>`);
  const anchor='<div class="decision-verification">';
  const insert=`<div class="decision-reasons"><strong>Why it fits</strong><ul><li>${text}</li></ul></div>`;
  return block.includes(anchor)?block.replace(anchor,insert+anchor):block.replace('<div class="decision-price">',insert+'<div class="decision-price">');
}
function addGapHtml(block,text){
  if(norm(block).includes(norm(text)))return block;
  const marker='<details class="decision-gaps"><summary>What is not confirmed as a match</summary><ul>';
  if(block.includes(marker))return block.replace(marker,marker+`<li>${text}</li>`);
  const anchor='<div class="decision-tradeoff">';
  const insert=`<details class="decision-gaps"><summary>What is not confirmed as a match</summary><ul><li>${text}</li></ul></details>`;
  return block.includes(anchor)?block.replace(anchor,insert+anchor):block;
}
function cleanEmptyGapHtml(block){return block.replace(/<details class="decision-gaps"><summary>What is not confirmed as a match<\/summary><ul>\s*<\/ul><\/details>/gi,'');}
function reconcileDecisionHtml(html,urlLike){
  if(typeof html!=='string'||!html.includes('decision-result'))return html;
  const context=requestDecisionContext(urlLike);if(!context.requested.length)return html;
  return html.replace(/<article class="decision-result[\s\S]*?<\/article>/g,article=>{
    const match=article.match(/\/products\/([^/]+)\//);if(!match)return article;
    const product=PRODUCT_BY_SLUG.get(match[1]);if(!product)return article;
    let out=article;
    for(const criterion of context.requested){
      const evidence=evidenceFor(product,criterion);if(!verifiedEvidence(evidence))continue;
      out=removeLegacyGapHtml(out,criterion);
      const alignment=evidenceAlignment(evidence);
      if(alignment==='positive')out=addReasonHtml(out,`${criterion.label} is supported by documented decision evidence for this model`);
      else if(alignment==='negative')out=addGapHtml(out,`Documented ${criterion.label.toLowerCase()} evidence is less aligned with this priority`);
    }
    return cleanEmptyGapHtml(out);
  });
}

function certificationSnapshot(){
  const base=downstream.certificationSnapshot?downstream.certificationSnapshot():{};
  return {...base,version:VERSION,closure:{decisionLabRenderedEvidenceParity:true,legacyContradictionSuppression:'verified-evidence-only',renderedOutputRegression:'action7-decision-lab-render-v1015',scoutPreserved:'scout-concierge-v5',decisionEnginePreserved:'decision-engine-v4',newRecurringPaidCostAUD:0}};
}
function handler(req,res){
  let url;try{url=new URL(req.url||'/',ORIGIN)}catch{url=new URL('/',ORIGIN)}
  const path=url.pathname;
  const originalSetHeader=res.setHeader?res.setHeader.bind(res):()=>{};
  const originalEnd=res.end?res.end.bind(res):()=>{};
  let contentType='';
  res.setHeader=function(name,value){
    if(String(name).toLowerCase()==='content-type')contentType=String(value||'');
    if(String(name).toLowerCase()==='x-apg-action7-scout-decision')return originalSetHeader(name,'v'+VERSION);
    return originalSetHeader(name,value);
  };
  originalSetHeader('X-APG-Action7-Scout-Decision','v'+VERSION);
  if(path==='/api/intelligence/action7'||path==='/api/intelligence/action7/'){
    res.statusCode=200;originalSetHeader('Content-Type','application/json; charset=utf-8');originalSetHeader('Cache-Control','no-store');return originalEnd(JSON.stringify(certificationSnapshot()));
  }
  res.end=function(body){
    let next=body;
    if(path==='/decision-lab/'&&typeof body==='string'){
      const looksJson=/application\/json/i.test(contentType)||/^\s*\{/.test(body);
      if(looksJson){try{next=JSON.stringify(reconcileDecisionPayload(JSON.parse(body),url.href))}catch{next=body}}
      else next=reconcileDecisionHtml(body,url.href);
    }
    return originalEnd(next);
  };
  return downstream(req,res);
}
Object.assign(handler,downstream,{ACTION7_VERSION:VERSION,action7ClosureVersion:VERSION,certificationSnapshot,reconcileDecisionPayload,reconcileDecisionHtml,requestDecisionContext});
module.exports=handler;
