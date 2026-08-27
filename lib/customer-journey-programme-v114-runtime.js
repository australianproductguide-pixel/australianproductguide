'use strict';

// APG Customer Journey Programme v114.0
// Consumer-truth, category-quality, retrieval recovery, decision filtering and
// continuity layer. This module is deliberately downstream of the canonical catalogue,
// decision engine and retailer/evidence controls. It does not create product facts,
// change recommendation scoring or promote a category to Decision Grade.
const {categories,products}=require('../data');
const {esc,productVisual,pill}=require('./ui');
const {imageStatus}=require('../data/image-provenance');
const categoryGate=require('./category-completion-gate-v1');
const action4=require('./action4-final-v981');
const premiumMobile=require('./premium-mobile-decision-commerce-v112-runtime');

const VERSION='114.0';
const ORIGIN='https://australianproductguide.au';
const JS_PATH='/assets/customer-journey-programme-v114.js';
const PRODUCT_BY_SLUG=new Map(products.map(product=>[product.slug,product]));
const CATEGORY_BY_SLUG=new Map(Object.values(categories).map(category=>[category.slug,category]));
const PRIORITY_SET=new Set(categoryGate.PRIORITY_CATEGORIES);
let cachedEvidence=null;
let cachedRegister=null;

const normalise=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
const human=value=>String(value||'').replace(/-/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
const pct=(n,d)=>d?Number((n*100/d).toFixed(1)):0;
const arr=value=>Array.isArray(value)?value.filter(Boolean):[];
function requestUrl(req){try{return new URL(req&&req.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}}
function json(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return res.end(JSON.stringify(payload));}
function evidenceSnapshot(){if(!cachedEvidence)cachedEvidence=action4.action4FinalSnapshot().evidenceDepth;return cachedEvidence;}
function evidenceMap(){
  const map=new Map();
  for(const row of evidenceSnapshot().categories||[])for(const product of row.productRows||[])map.set(product.slug,{category:row.category,strong:!!product.strong,coveragePct:Number(product.coveragePct)||0,missing:arr(product.missing)});
  return map;
}
function retailerSummary(product){
  const best=premiumMobile.strongestRetailer(product),state=best.state||{rank:0,key:'unknown',label:'Retailer pathway'};
  return {rank:Number(state.rank)||0,key:state.key||'unknown',label:state.label||'Retailer pathway',identityVerified:Number(state.rank)>=3,exact:Number(state.rank)>=5};
}
function maturity(category,gateRow){
  if(gateRow&&gateRow.overall==='DECISION_GRADE')return {key:'DECISION_GRADE',label:'Decision Grade',detail:'All formal APG category-completion gates are certified.'};
  if(gateRow){
    const passed=categoryGate.REQUIRED_GATES.filter(key=>gateRow.gates[key]===categoryGate.PASS).length;
    return {key:'DECISION_GRADE_IN_PROGRESS',label:'Decision-grade certification in progress',detail:`${passed} of ${categoryGate.REQUIRED_GATES.length} formal gates are fully certified. Partial gates do not count as complete.`};
  }
  const tier=normalise(category&&category.evidenceTier);
  if(tier.includes('deep'))return {key:'DEEP_MAINTAINED',label:'Deep maintained research',detail:'This category has deeper maintained research, but formal Decision Grade certification has not been completed.'};
  if(tier.includes('starter'))return {key:'STARTER_EVIDENCE',label:'Starter evidence',detail:'Product identity, freshness and retailer pathways are maintained while deeper decision evidence continues to expand.'};
  return {key:'MAINTAINED_EVIDENCE',label:'Maintained evidence',detail:'This category is maintained, but formal Decision Grade certification has not been completed.'};
}
function categoryQualityRow(category,evidenceBySlug,gateBySlug){
  const rows=arr(category.products),count=rows.length,gateRow=gateBySlug.get(category.slug)||null;
  const strong=rows.filter(product=>evidenceBySlug.get(product.slug)&&evidenceBySlug.get(product.slug).strong).length;
  const verifiedImages=rows.filter(product=>imageStatus(product).productPhotography).length;
  const retailer=rows.map(retailerSummary);
  const exact=retailer.filter(row=>row.exact).length,identityVerified=retailer.filter(row=>row.identityVerified).length,searchFallback=retailer.filter(row=>row.key==='fallback').length;
  const status=maturity(category,gateRow);
  return {
    slug:category.slug,label:category.label,maturity:status.key,maturityLabel:status.label,maturityDetail:status.detail,
    formalDecisionGrade:!!(gateRow&&gateRow.overall==='DECISION_GRADE'),priorityCategory:PRIORITY_SET.has(category.slug),
    productCount:count,brandCount:new Set(rows.map(product=>normalise(product.brand)).filter(Boolean)).size,
    decisionFactors:arr(category.factors).length,priorityDimensions:arr(category.priorities).length,comparisonLimit:Number(category.comparisonLimit)||null,
    strongEvidence:{count:strong,total:count,pct:pct(strong,count)},
    verifiedProductPhotography:{count:verifiedImages,total:count,pct:pct(verifiedImages,count)},
    retailerIdentity:{exactCount:exact,identityVerifiedCount:identityVerified,searchFallbackCount:searchFallback,total:count,exactPct:pct(exact,count),identityVerifiedPct:pct(identityVerified,count)},
    formalGate:gateRow?{overall:gateRow.overall,passed:categoryGate.REQUIRED_GATES.filter(key=>gateRow.gates[key]===categoryGate.PASS).length,total:categoryGate.REQUIRED_GATES.length,gates:gateRow.gates,blockers:gateRow.blockers}:null,
    backlogs:{
      evidence:rows.filter(product=>!(evidenceBySlug.get(product.slug)&&evidenceBySlug.get(product.slug).strong)).map(product=>product.slug),
      imagery:rows.filter(product=>!imageStatus(product).productPhotography).map(product=>product.slug),
      retailerIdentity:rows.filter(product=>!retailerSummary(product).identityVerified).map(product=>product.slug)
    }
  };
}
function categoryQualityRegister(){
  if(cachedRegister)return cachedRegister;
  const evidenceBySlug=evidenceMap(),gateSnapshot=categoryGate.snapshot(),gateBySlug=new Map(gateSnapshot.rows.map(row=>[row.category,row]));
  const rows=Object.values(categories).map(category=>categoryQualityRow(category,evidenceBySlug,gateBySlug)).sort((a,b)=>a.label.localeCompare(b.label));
  const strong=rows.reduce((sum,row)=>sum+row.strongEvidence.count,0),verifiedImages=rows.reduce((sum,row)=>sum+row.verifiedProductPhotography.count,0),exact=rows.reduce((sum,row)=>sum+row.retailerIdentity.exactCount,0),identityVerified=rows.reduce((sum,row)=>sum+row.retailerIdentity.identityVerifiedCount,0);
  cachedRegister={
    version:VERSION,scope:'canonical GitHub catalogue + formal APG category gate',policy:{formalDecisionGradeRequiresAllGates:true,partialNeverPasses:true,retailerCommissionRecommendationWeight:0,unverifiedEvidenceIsNotPromoted:true,unverifiedImageryIsNotFabricated:true,retailerIdentityIsNotGuessed:true},
    summary:{categories:rows.length,products:products.length,priorityCategories:gateSnapshot.summary.priorityCategoryCount,decisionGradeCategories:gateSnapshot.summary.decisionGradeCount,strongEvidenceProducts:strong,strongEvidencePct:pct(strong,products.length),verifiedProductPhotography:verifiedImages,verifiedProductPhotographyPct:pct(verifiedImages,products.length),exactRetailerIdentityProducts:exact,identityVerifiedRetailerProducts:identityVerified},
    priorityProgramme:gateSnapshot,
    rows
  };
  return cachedRegister;
}
function categoryRow(slug){return categoryQualityRegister().rows.find(row=>row.slug===slug)||null;}

function distance(a,b){
  const left=normalise(a),right=normalise(b);if(left===right)return 0;if(!left)return right.length;if(!right)return left.length;
  const prev=Array.from({length:right.length+1},(_,i)=>i),curr=new Array(right.length+1);
  for(let i=1;i<=left.length;i++){
    curr[0]=i;
    for(let j=1;j<=right.length;j++)curr[j]=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+(left[i-1]===right[j-1]?0:1));
    for(let j=0;j<=right.length;j++)prev[j]=curr[j];
  }
  return prev[right.length];
}
function allowedDistance(query){const length=normalise(query).replace(/\s/g,'').length;return length<5?0:length<8?1:2;}
function suggestionDictionary(){
  const out=[];
  for(const category of Object.values(categories)){
    const base={label:category.label,query:category.label,type:'category',href:`/categories/${encodeURIComponent(category.slug)}/`};
    out.push({...base,searchText:category.label});
    for(const alias of arr(category.aliases))out.push({...base,searchText:alias});
  }
  const brands=[...new Set(products.map(product=>product.brand).filter(Boolean))];
  for(const brand of brands)out.push({label:brand,query:brand,type:'brand',href:`/search/?q=${encodeURIComponent(brand)}`,searchText:brand});
  for(const product of products){const label=`${product.brand} ${product.name}`.replace(/\s+/g,' ').trim();out.push({label,query:label,type:'product',href:`/products/${encodeURIComponent(product.slug)}/`,searchText:label});}
  return out;
}
const SUGGESTIONS=suggestionDictionary();
function searchSuggestions(query,limit=7){
  const q=normalise(query);if(q.length<2)return [];
  const qTokens=q.split(' ').filter(Boolean),maxDistance=allowedDistance(q),bestByHref=new Map();
  for(const item of SUGGESTIONS){
    const candidate=normalise(item.searchText),candidateTokens=candidate.split(' ').filter(Boolean);let score=0,matchType='';
    if(candidate===q){score=100;matchType='exact';}
    else if(candidate.startsWith(q)){score=92;matchType='prefix';}
    else if(candidate.includes(q)){score=84;matchType='contains';}
    else if(qTokens.length&&qTokens.every(token=>candidateTokens.some(word=>word.startsWith(token)))){score=80;matchType='token-prefix';}
    else if(maxDistance>0){
      const fullDistance=distance(q,candidate);
      const tokenDistance=qTokens.length===1?Math.min(...candidateTokens.map(word=>distance(q,word))):999;
      const d=Math.min(fullDistance,tokenDistance);
      if(d<=maxDistance){score=68-d*4;matchType='typo';}
    }
    if(!score)continue;
    if(item.type==='category')score+=3;else if(item.type==='product')score+=1;
    const next={label:item.label,query:item.query,type:item.type,href:item.href,matchType,score};
    const current=bestByHref.get(item.href);if(!current||next.score>current.score)bestByHref.set(item.href,next);
  }
  return [...bestByHref.values()].sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label)).slice(0,Math.max(1,Math.min(Number(limit)||7,10))).map(({score,...item})=>item);
}

function renderAlternativePick(product){
  return `<article class="feature-card pick-card" data-apg114-deduped-pick="${esc(product.slug)}">${productVisual(product)}<p class="eyebrow">Alternative starting point</p><h3><a href="/products/${esc(product.slug)}/">${esc(product.name)}</a></h3><p>A distinct maintained option to broaden the shortlist; inspect the trade-offs before buying.</p><div class="pills">${arr(product.tags).slice(0,3).map(tag=>pill(human(tag))).join('')}</div><a class="text-link" href="/products/${esc(product.slug)}/">See why it fits →</a></article>`;
}
function dedupeDecisionShortcuts(html,category){
  const pattern=/<article class="feature-card pick-card"[\s\S]*?<\/article>/g,blocks=[...String(html).matchAll(pattern)];if(blocks.length<2)return html;
  const slugs=blocks.map(match=>{const m=match[0].match(/href="\/products\/([^/]+)\//);return m&&m[1]||null;}),reserved=new Set(slugs.filter(Boolean)),seen=new Set(),candidates=arr(category.products).filter(product=>!reserved.has(product.slug));let candidateIndex=0,index=0;
  return String(html).replace(pattern,block=>{
    const slug=slugs[index++];if(!slug||!seen.has(slug)){if(slug)seen.add(slug);return block;}
    const candidate=candidates[candidateIndex++];if(!candidate)return '';
    seen.add(candidate.slug);return renderAlternativePick(candidate);
  });
}
function maturityCopy(row){
  if(!row)return 'This is a maintained category. Formal Decision Grade certification has not been completed.';
  if(row.formalDecisionGrade)return 'This category has completed APG formal Decision Grade certification.';
  if(row.maturity==='STARTER_EVIDENCE')return 'This is a maintained starter-evidence category. Exact retailer destinations are not yet verified for every maintained product.';
  if(row.maturity==='DECISION_GRADE_IN_PROGRESS')return 'Formal Decision Grade certification is still in progress for this category. Exact retailer destinations are not yet verified for every maintained product.';
  return `${row.maturityLabel} is maintained for this category, but formal Decision Grade certification has not been completed. Exact retailer destinations are not yet verified for every maintained product.`;
}
function fixMaturityLanguage(html,row){
  return String(html).replace(/This category is decision-ready, but APG has not yet verified an exact retailer destination for every maintained product\./gi,maturityCopy(row));
}
function qualityPanel(row){
  if(!row)return '';
  const gate=row.formalGate?`<li><strong>${row.formalGate.passed}/${row.formalGate.total}</strong><span>formal completion gates fully passed</span></li>`:'';
  return `<aside class="apg114-quality" data-apg114-category-quality="${esc(row.maturity)}" aria-label="Category quality status"><div><p class="kicker">Category quality</p><h2>${esc(row.maturityLabel)}</h2><p>${esc(row.maturityDetail)}</p></div><ul>${gate}<li><strong>${row.strongEvidence.count}/${row.productCount}</strong><span>products at strong decision-evidence depth</span></li><li><strong>${row.verifiedProductPhotography.count}/${row.productCount}</strong><span>verified product photography</span></li><li><strong>${row.retailerIdentity.identityVerifiedCount}/${row.productCount}</strong><span>products with verified retailer identity/listing</span></li></ul><a href="/methodology/" class="text-link">How APG certifies categories →</a></aside>`;
}
function injectQualityPanel(html,row){
  const panel=qualityPanel(row);if(!panel||String(html).includes('data-apg114-category-quality'))return html;
  const pattern=/(<section class="category-hero[\s\S]*?<\/section>(?:<aside class="apg112-depth-banner"[\s\S]*?<\/aside>)?)/i;
  return String(html).replace(pattern,`$1${panel}`);
}
function productMatchesFilters(product,evidenceBySlug,u){
  const evidence=u.searchParams.get('evidence')||'',retailer=u.searchParams.get('retailer')||'',imagery=u.searchParams.get('imagery')||'';
  if(evidence==='strong'&&!(evidenceBySlug.get(product.slug)&&evidenceBySlug.get(product.slug).strong))return false;
  const retailerState=retailerSummary(product);
  if(retailer==='identity'&&!retailerState.identityVerified)return false;
  if(retailer==='exact'&&!retailerState.exact)return false;
  if(imagery==='verified'&&!imageStatus(product).productPhotography)return false;
  return true;
}
function filterControl(id,name,label,options,value){return `<div class="apg114-filter"><label for="${id}">${esc(label)}</label><select id="${id}" name="${name}">${options.map(([key,text])=>`<option value="${esc(key)}"${key===value?' selected':''}>${esc(text)}</option>`).join('')}</select></div>`;}
function enhanceCategoryFilters(html,category,row,u){
  let out=String(html);if(!out.includes('<form class="filter-bar"'))return out;
  const evidenceBySlug=evidenceMap(),evidence=u.searchParams.get('evidence')||'',retailer=u.searchParams.get('retailer')||'',imagery=u.searchParams.get('imagery')||'';
  const controls=`<fieldset class="apg114-filter-set"><legend>Evidence and purchase confidence</legend>${filterControl('apg114-evidence','evidence','Evidence',[['','All evidence levels'],['strong',`Strong decision evidence (${row.strongEvidence.count})`]],evidence)}${filterControl('apg114-retailer','retailer','Retailer identity',[['','All retailer pathways'],['identity',`Verified identity/listing (${row.retailerIdentity.identityVerifiedCount})`],['exact',`Exact verified identity (${row.retailerIdentity.exactCount})`]],retailer)}${filterControl('apg114-imagery','imagery','Product imagery',[['','All imagery states'],['verified',`Verified product photo (${row.verifiedProductPhotography.count})`]],imagery)}</fieldset>`;
  out=out.replace('<button class="button compact" type="submit">Apply</button></form>',`${controls}<button class="button compact" type="submit">Apply filters</button></form>`);
  const active=Boolean(evidence||retailer||imagery),pattern=/<article class="product-card apg112-product-card"[^>]*data-apg112-product-card="([^"]+)"[^>]*>[\s\S]*?<\/article>/g;
  let available=0,shown=0;
  out=out.replace(pattern,(block,slug)=>{const product=PRODUCT_BY_SLUG.get(slug);if(!product||product.category!==category.slug)return block;available++;if(!active||productMatchesFilters(product,evidenceBySlug,u)){shown++;return block;}return '';});
  const summary=`<div class="apg114-filter-summary" role="status" aria-live="polite"><strong>${shown}</strong> of <strong>${available}</strong> products match the current catalogue filters.${active?` <a href="/categories/${esc(category.slug)}/">Clear all filters</a>`:''}</div>${active&&shown===0?`<div class="zero-state apg114-filter-empty"><h3>No products match every selected confidence filter</h3><p>Remove one filter to broaden the maintained shortlist. APG does not manufacture evidence or retailer certainty to fill an empty result.</p><a class="button secondary" href="/categories/${esc(category.slug)}/">Clear all filters</a></div>`:''}`;
  return out.replace('</form>',`</form>${summary}`);
}
function serverSearchRecovery(html,u){
  const query=(u.searchParams.get('q')||'').trim();if(!query||!String(html).includes('No strong maintained match yet'))return {html,zero:false};
  const suggestions=searchSuggestions(query,4),correction=suggestions.find(item=>item.matchType==='typo')||suggestions[0];let out=String(html);
  if(correction&&!out.includes('data-apg114-search-recovery')){
    const block=`<aside class="apg114-search-recovery" data-apg114-search-recovery="true"><p class="kicker">Search recovery</p><strong>Did you mean <a href="/search/?q=${encodeURIComponent(correction.query)}">${esc(correction.label)}</a>?</strong><p>APG is suggesting a maintained catalogue term; it has not silently changed your query.</p></aside>`;
    out=out.replace(/(<div class="zero-state">)/,`${block}$1`);
  }
  return {html:out,zero:true};
}
function compareContinuity(html,path,u){
  const context=premiumMobile.pageContext(path,u);if(!context.isCompare||context.compared.length<2||String(html).includes('data-apg114-continuity'))return html;
  const category=context.categorySlug||context.compared[0].category,slugs=context.compared.map(product=>product.slug).slice(0,4),names=context.compared.map(product=>`${product.brand} ${product.name}`),href=`/decision-lab/?category=${encodeURIComponent(category||'')}&products=${encodeURIComponent(slugs.join(','))}&from=compare`;
  const block=`<aside class="apg114-continuity" data-apg114-continuity="compare"><div><p class="kicker">Keep your decision context</p><strong>Take this shortlist into Decision Lab</strong><p>${esc(names.join(' · '))}</p><small>The carried shortlist is reference context only. It does not add recommendation points or bypass your explicit answers.</small></div><a class="button secondary" data-apg114-continuity-link="compare-to-decision-lab" href="${href}">Continue in Decision Lab</a></aside>`;
  const toolbar=/(<aside class="apg112-compare-toolbar"[\s\S]*?<\/aside>)/;return String(html).match(toolbar)?String(html).replace(toolbar,`$1${block}`):String(html).replace('</main>',`${block}</main>`);
}
function decisionLabContext(html,u){
  if(String(html).includes('data-apg114-continuity="decision-lab"'))return html;
  const slugs=(u.searchParams.get('products')||'').split(',').map(value=>value.trim()).filter(value=>PRODUCT_BY_SLUG.has(value)).slice(0,4),category=u.searchParams.get('category')||'';
  if(slugs.length<2)return html;
  const matched=slugs.map(slug=>PRODUCT_BY_SLUG.get(slug)),safeCategory=CATEGORY_BY_SLUG.has(category)?category:matched[0].category,names=matched.map(product=>`${product.brand} ${product.name}`),compareHref=`/compare/custom/?products=${encodeURIComponent(slugs.join(','))}`;
  const block=`<aside class="apg114-continuity" data-apg114-continuity="decision-lab"><div><p class="kicker">Comparison context carried in</p><strong>${esc(names.join(' · '))}</strong><p>Keep these products in view while you answer. The carried shortlist does not alter recommendation scoring.</p></div><a class="button secondary" data-apg114-continuity-link="decision-lab-to-compare" href="${compareHref}">Return to comparison</a></aside>`;
  let out=String(html).replace(/(<main\b[^>]*>)/i,`$1${block}`);
  out=out.replace(/<body\b([^>]*)>/i,(tag,attrs)=>{
    let next=tag;if(!/data-apg112-category=/i.test(next))next=next.replace(/>$/,` data-apg112-category="${esc(safeCategory)}">`);if(!/data-apg112-compare-products=/i.test(next))next=next.replace(/>$/,` data-apg112-compare-products="${esc(slugs.join(','))}">`);return next;
  });
  return out;
}
function accessibilityCss(){return `<style data-apg114-style="v${VERSION}">
.apg114-quality,.apg114-continuity,.apg114-search-recovery{margin:20px auto;padding:18px;border:1px solid var(--line,#d8e0ea);border-radius:18px;background:var(--surface,#fff);max-width:1200px}.apg114-quality ul{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;list-style:none;padding:0;margin:14px 0}.apg114-quality li{padding:12px;border-radius:12px;background:var(--soft,#f4f7fb)}.apg114-quality li strong,.apg114-quality li span{display:block}.apg114-filter-set{display:flex;gap:10px;flex-wrap:wrap;border:0;padding:0;margin:0}.apg114-filter-set legend{width:100%;font-weight:700}.apg114-filter-set .apg114-filter{min-width:180px;flex:1}.apg114-filter-summary{margin:12px 0 18px}.apg114-continuity{display:flex;gap:16px;justify-content:space-between;align-items:center}.apg114-continuity small{display:block;margin-top:6px}.apg114-search-recovery{max-width:none}.search-suggestions[data-apg114-open="true"]{display:block;max-height:min(420px,60vh);overflow:auto}.search-suggestions [role="option"]{display:block;min-height:44px;padding:10px 12px;text-decoration:none}.search-suggestions [role="option"][aria-selected="true"]{outline:2px solid currentColor;outline-offset:-2px}.apg114-filter select,.apg114-filter-set select,.apg114-continuity .button,.apg114-search-recovery a{min-height:44px}.apg114-filter-empty{margin:12px 0 18px}.apg114-quality a:focus-visible,.apg114-continuity a:focus-visible,.apg114-search-recovery a:focus-visible,.search-suggestions [role="option"]:focus-visible,.apg114-filter select:focus-visible{outline:3px solid currentColor;outline-offset:3px}
@media(max-width:760px){.apg114-quality ul{grid-template-columns:1fr 1fr}.apg114-filter-set{display:grid;grid-template-columns:1fr;width:100%}.apg114-continuity{align-items:stretch;flex-direction:column}.apg114-continuity .button{width:100%;text-align:center}.search-suggestions{max-width:calc(100vw - 24px)}}
@media(prefers-reduced-motion:reduce){.apg114-quality *,.apg114-continuity *,.search-suggestions *{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
</style>`;}
function injectAssets(html){let out=String(html);if(!out.includes('data-apg114-style='))out=out.replace('</head>',`${accessibilityCss()}</head>`);if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);return out;}
function markBody(html,{zero=false}={}){return String(html).replace(/<body\b([^>]*)>/i,(tag,attrs)=>{if(/data-apg-customer-journey=/i.test(tag))return tag;return tag.replace(/>$/,` data-apg-customer-journey="v${VERSION}"${zero?' data-apg114-search-zero="true"':''}>`);});}
function transformHtml(html,path,u){
  let out=String(html||'');if(!out||out.includes(`data-apg-customer-journey="v${VERSION}"`))return out;let zero=false;
  const categoryMatch=path.match(/^\/categories\/([^/]+)\/$/);
  if(categoryMatch&&categories[categoryMatch[1]]){
    const category=categories[categoryMatch[1]],row=categoryRow(category.slug);out=fixMaturityLanguage(out,row);out=dedupeDecisionShortcuts(out,category);out=injectQualityPanel(out,row);out=enhanceCategoryFilters(out,category,row,u);
  }
  if(path==='/search/'){const recovered=serverSearchRecovery(out,u);out=recovered.html;zero=recovered.zero;}
  if(path.startsWith('/compare/'))out=compareContinuity(out,path,u);
  if(path==='/decision-lab/')out=decisionLabContext(out,u);
  out=markBody(out,{zero});out=injectAssets(out);return out;
}
function sendSearchSuggestions(req,res,u){if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'method_not_allowed'});const query=(u.searchParams.get('q')||'').slice(0,160),items=searchSuggestions(query,7),payload={version:VERSION,queryLength:query.trim().length,count:items.length,items};return req.method==='HEAD'?json(res,200,{...payload,items:[]}):json(res,200,payload);}
function sendCategoryQuality(req,res){if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'method_not_allowed'});const payload=categoryQualityRegister();return req.method==='HEAD'?json(res,200,{version:payload.version,summary:payload.summary}):json(res,200,payload);}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('customer journey programme requires downstream handler');
  function handler(req,res){
    const u=requestUrl(req),path=u.pathname;
    if(path==='/api/search-suggest')return sendSearchSuggestions(req,res,u);
    if(path==='/api/intelligence/category-quality')return sendCategoryQuality(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase(),textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transformHtml(source,path,u);if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Customer-Journey-Programme','v'+VERSION);return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{CUSTOMER_JOURNEY_PROGRAMME_VERSION:VERSION,CATEGORY_QUALITY_REGISTER_VERSION:VERSION,SEARCH_SUGGEST_VERSION:VERSION,categoryQualityRegister,searchSuggestions,transformCustomerJourneyV114:transformHtml});return handler;
}

module.exports={VERSION,JS_PATH,PRODUCT_BY_SLUG,categoryQualityRegister,categoryRow,searchSuggestions,distance,allowedDistance,dedupeDecisionShortcuts,fixMaturityLanguage,enhanceCategoryFilters,compareContinuity,decisionLabContext,transformHtml,wrap};
