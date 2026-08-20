'use strict';

// Search resilience v52.
// Interactive Search never depends on a full document navigation. Search V4 is
// called directly for a small JSON contract, then rendered into a deliberately
// isolated result surface. Direct/deep-link Search remains SSR for crawlability.
const downstream=require('./decision-lab-resilience-v50-runtime');
const {searchSite}=require('./search');

const ASSET_PATH='/assets/search-resilience-v52.js';
const VERSION='52.0';
const PATCH='search-p0-2026-08-20-isolated-json-r3';
const SEARCH_VERSION='search-ranking-v4';
const JSON_HEADER='x-apg-search-json';

function clean(value,max=240){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function productJson(p){return {slug:p.slug,name:p.name,brand:p.brand,categoryLabel:p.categoryLabel||'',summary:p.summary||'',price:Number(p.price)||0,url:`/products/${encodeURIComponent(p.slug)}/`}}
function categoryJson(c){return {slug:c.slug,label:c.label,description:c.description||'',count:Array.isArray(c.products)?c.products.length:0,url:`/categories/${encodeURIComponent(c.slug)}/`}}
function comparisonJson(x){return {label:`${x.a?.name||''} vs ${x.b?.name||''}`.trim(),a:x.a?.name||'',b:x.b?.name||'',category:x.category||'',url:x.path||''}}
function searchJson(query){
 const q=clean(query),r=searchSite(q);
 return {
  version:r.version||SEARCH_VERSION,
  q,
  interpretation:Array.isArray(r.interpretation)?r.interpretation.slice(0,12).map(x=>clean(x,320)):[],
  products:(r.products||[]).slice(0,18).map(productJson),
  closestProducts:(r.closestProducts||[]).slice(0,5).map(productJson),
  categories:(r.categories||[]).slice(0,6).map(categoryJson),
  comparisons:(r.comparisons||[]).slice(0,6).map(comparisonJson),
  directCompare:r.directCompare?{a:r.directCompare.a?.name||'',b:r.directCompare.b?.name||'',url:r.directCompare.url||''}:null,
  zeroResult:r.zeroResult?{reason:clean(r.zeroResult.reason,80),message:clean(r.zeroResult.message,420)}:null,
  coverageGap:r.coverageGap?clean(r.coverageGap,120):null,
  commercialRecommendationWeight:0
 };
}

const clientJs=String.raw`
;(()=>{
if(window.__APG_SEARCH_RESILIENCE_V52__)return;
window.__APG_SEARCH_RESILIENCE_V52__='${PATCH}';
const SEARCH_KEY='apgRecentSearches',DEADLINE_MS=10000,SLOW_MS=3500;
let activeController=null,deadlineTimer=0,slowTimer=0,serial=0;
const clean=v=>String(v??'').trim().replace(/\s+/g,' ').slice(0,240);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>Number(v)>0?'A$'+Number(v).toLocaleString('en-AU'):'';
function recentValue(entry){if(typeof entry==='string')return clean(entry);if(!entry||typeof entry!=='object')return '';return clean(entry.q||entry.query||entry.value||entry.label||'')}
function readRecent(){let raw=[];try{const v=JSON.parse(localStorage.getItem(SEARCH_KEY)||'[]');if(Array.isArray(v))raw=v}catch{}const out=[],seen=new Set();for(const entry of raw){const q=recentValue(entry);if(!q||/^\[object Object\]$/i.test(q))continue;const k=q.toLowerCase();if(seen.has(k))continue;seen.add(k);out.push(q)}return out.slice(0,10)}
function writeRecent(rows){try{localStorage.setItem(SEARCH_KEY,JSON.stringify(rows.slice(0,10)))}catch{}}
function rememberSearch(value){const q=clean(value);if(!q||/^\[object Object\]$/i.test(q))return;writeRecent([q,...readRecent().filter(x=>x.toLowerCase()!==q.toLowerCase())])}
function migrateRecentSearches(){writeRecent(readRecent())}
function isSearchForm(form){return !!form&&form.matches('form[data-search-shell]')}
function inputOf(form){return form?.querySelector('[data-site-search],input[name="q"]')||null}
function buttonOf(form){return form?.querySelector('button[type="submit"],input[type="submit"]')||null}
function statusOf(form){let s=form?.querySelector('[data-search-submit-status]');if(s)return s;if(!form)return null;s=document.createElement('span');s.dataset.searchSubmitStatus='';s.className='apg-search52-status';s.setAttribute('role','status');s.setAttribute('aria-live','polite');form.appendChild(s);return s}
function setStatus(form,text,error=false){const s=statusOf(form);if(!s)return;s.textContent=text||'';s.dataset.error=error?'true':'false'}
function closeSuggestions(form){const box=form?.querySelector('[data-search-suggestions]'),input=inputOf(form);if(box){box.hidden=true;box.innerHTML=''}if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}}
function setState(state){if(document.body)document.body.dataset.apgSearchV52State=state}
function setBusy(form){if(!form)return;form.dataset.apgSearchV52Busy='true';form.setAttribute('aria-busy','true');const b=buttonOf(form);if(b){if(!b.dataset.apgSearchV52Label)b.dataset.apgSearchV52Label=b.tagName==='INPUT'?b.value:b.textContent;b.disabled=true;b.setAttribute('aria-busy','true');if(b.tagName==='INPUT')b.value='Searching…';else b.textContent='Searching…'}closeSuggestions(form);setStatus(form,'Searching maintained APG product data…');setState('loading')}
function resetBusy(form){if(!form)return;delete form.dataset.apgSearchV52Busy;form.removeAttribute('aria-busy');const b=buttonOf(form);if(b){b.disabled=false;b.removeAttribute('aria-busy');const label=b.dataset.apgSearchV52Label||'Search';if(b.tagName==='INPUT')b.value=label;else b.textContent=label}}
function clearTimers(){if(deadlineTimer)clearTimeout(deadlineTimer);if(slowTimer)clearTimeout(slowTimer);deadlineTimer=slowTimer=0}
function targetForQuery(query){const u=new URL('/search/',location.origin);u.searchParams.set('q',clean(query));return u}
function queryFromTarget(target){return clean(target?.searchParams?.get('q')||'')}
function formHtml(q){return '<form class="apg-search52-form" role="search" data-search-shell action="/search/" method="get"><label for="apgSearch52Input">Search APG</label><div class="apg-search52-input-row"><input id="apgSearch52Input" data-site-search name="q" value="'+esc(q)+'" autocomplete="off"><button type="submit">Search</button></div><span class="apg-search52-status" data-search-submit-status role="status" aria-live="polite"></span></form>'}
function productHtml(p){const price=money(p.price);return '<article class="apg-search52-product"><p>'+esc(p.brand)+(p.categoryLabel?' · '+esc(p.categoryLabel):'')+'</p><h2><a href="'+esc(p.url)+'">'+esc(p.name)+'</a></h2>'+(p.summary?'<div>'+esc(p.summary)+'</div>':'')+(price?'<strong>'+price+' maintained price basis</strong>':'')+'</article>'}
function categoryHtml(c){return '<a class="apg-search52-category" href="'+esc(c.url)+'"><strong>'+esc(c.label)+'</strong>'+(c.description?'<span>'+esc(c.description)+'</span>':'')+'</a>'}
function comparisonHtml(c){return '<a class="apg-search52-comparison" href="'+esc(c.url)+'"><strong>'+esc(c.label)+'</strong><span>Open comparison</span></a>'}
function renderOutcome(payload,target,push){
 if(!payload||payload.version!=='${SEARCH_VERSION}'||payload.commercialRecommendationWeight!==0||!Array.isArray(payload.products)||!Array.isArray(payload.categories)||!Array.isArray(payload.comparisons))throw new Error('invalid_search_payload');
 const main=document.querySelector('main#main');if(!main)throw new Error('missing_search_main');
 const q=queryFromTarget(target),root=document.createElement('div');root.className='apg-search52-root';root.dataset.searchV52Outcome='';
 const interpretation=(payload.interpretation||[]).slice(0,10).map(x=>'<span>'+esc(x)+'</span>').join('');
 const direct=payload.directCompare?.url?'<section class="apg-search52-block"><p class="apg-search52-kicker">Comparison detected</p><h2>'+esc(payload.directCompare.a)+' vs '+esc(payload.directCompare.b)+'</h2><a href="'+esc(payload.directCompare.url)+'">Open comparison</a></section>':'';
 const products=(payload.products||[]).map(productHtml).join('');
 const closest=(!products&&(payload.closestProducts||[]).length)?'<section class="apg-search52-block"><p class="apg-search52-kicker">Closest maintained candidates</p><div class="apg-search52-products">'+payload.closestProducts.map(productHtml).join('')+'</div></section>':'';
 const categories=(payload.categories||[]).length?'<section class="apg-search52-block"><p class="apg-search52-kicker">Relevant categories</p><div class="apg-search52-links">'+payload.categories.map(categoryHtml).join('')+'</div></section>':'';
 const comparisons=(payload.comparisons||[]).length?'<section class="apg-search52-block"><p class="apg-search52-kicker">Useful comparisons</p><div class="apg-search52-links">'+payload.comparisons.map(comparisonHtml).join('')+'</div></section>':'';
 const zero=!products?'<section class="apg-search52-zero" role="status"><h2>No strong maintained match yet</h2><p>'+esc(payload.zeroResult?.message||'APG could not confidently match this query to maintained product data. Try a category, brand, model or use case.')+'</p><div><a href="/categories/">Browse categories</a> · <a href="/brands/">Browse brands</a> · <a href="/coverage/">See coverage</a></div></section>':'';
 root.innerHTML='<section class="apg-search52-hero"><p class="apg-search52-kicker">Product comparison search</p><h1>Search results for “'+esc(q)+'”</h1><p>APG matches your query only against maintained product data. Commercial relationships contribute zero recommendation points.</p>'+formHtml(q)+(interpretation?'<div class="apg-search52-interpretation">'+interpretation+'</div>':'')+'</section>'+direct+(products?'<section class="apg-search52-block"><p class="apg-search52-kicker">Maintained products</p><div class="apg-search52-products">'+products+'</div></section>':'')+zero+closest+categories+comparisons;
 main.replaceChildren(root);
 const relative=target.pathname+target.search;if(push&&relative!==location.pathname+location.search)history.pushState({apgSearchV52:true},'',relative);else if(!push&&relative!==location.pathname+location.search)history.replaceState(history.state,'',relative);
 document.title=q+' | Search | Australian Product Guide';setState(products?'success':'no-results');document.dispatchEvent(new CustomEvent('apg:search-rendered',{detail:{url:relative,patch:'${PATCH}',state:products?'success':'no-results'}}));
}
async function fetchOutcome(target,{form=null,push=true}={}){
 const request=++serial;if(activeController)activeController.abort();const controller=new AbortController();activeController=controller;let expired=false;clearTimers();
 deadlineTimer=setTimeout(()=>{expired=true;controller.abort()},DEADLINE_MS);if(form)slowTimer=setTimeout(()=>{if(request===serial&&form.isConnected)setStatus(form,'This search is taking longer than usual. It will stop automatically if it cannot complete.')},SLOW_MS);
 try{const response=await fetch(target.href,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','X-APG-Search-JSON':'1'},signal:controller.signal});if(!response.ok)throw new Error('search_http_'+response.status);const payload=await response.json();if(request!==serial)return false;if(form?.isConnected){resetBusy(form);setStatus(form,'')}renderOutcome(payload,target,push);return true}catch(error){if(expired){const e=new Error('search_deadline_exceeded');e.name='APGSearchTimeout';throw e}throw error}finally{if(request===serial){clearTimers();activeController=null}}
}
async function runSearch(target,form,push=true){const q=queryFromTarget(target);if(!q){resetBusy(form);setStatus(form,'Enter what you want to search for.',true);setState('validation');return}if(form?.dataset.apgSearchV52Busy==='true'){setStatus(form,'That search is already loading.');return}rememberSearch(q);if(form){const input=inputOf(form);if(input)input.value=q;setBusy(form)}try{await fetchOutcome(target,{form,push})}catch(error){if(!form?.isConnected)return;resetBusy(form);const timedOut=error?.name==='APGSearchTimeout'||error?.name==='AbortError';setState(timedOut?'timeout':'error');setStatus(form,timedOut?'Search could not complete in time. Your query is still here — please try again.':'Search could not complete just now. Your query is still here — please try again.',true)}}
function captureSubmit(event){const form=event.target instanceof HTMLFormElement?event.target:null;if(!isSearchForm(form))return;event.preventDefault();event.stopImmediatePropagation();runSearch(targetForQuery(inputOf(form)?.value||''),form,true)}
function plainPrimary(event){return event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey}
function recentSearchAnchor(event){if(!plainPrimary(event))return null;const a=event.target instanceof Element?event.target.closest('a[href]'):null;if(!a)return null;const box=a.closest('[data-search-suggestions],.apg-recent-option,[data-apg-recent-group],[data-search-recent],.apg-history-search');if(!box)return null;let target;try{target=new URL(a.href,location.href)}catch{return null}if(target.origin!==location.origin||target.pathname!=='/search/'||!queryFromTarget(target))return null;return {a,target}}
function captureRecentClick(event){const hit=recentSearchAnchor(event);if(!hit)return;event.preventDefault();event.stopImmediatePropagation();const form=hit.a.closest('form[data-search-shell]')||document.querySelector('form[data-search-shell]');runSearch(hit.target,form,true)}
function moveVisibleSuggestion(event,input,step){const form=input.closest('form[data-search-shell]'),box=form?.querySelector('[data-search-suggestions]');if(!box||box.hidden)return false;const all=[...box.querySelectorAll('a.suggest-item[href]')].filter(a=>!a.closest('[hidden]'));if(!all.length)return false;const current=input.getAttribute('aria-activedescendant'),at=all.findIndex(a=>a.id===current),next=at<0?(step>0?0:all.length-1):(at+step+all.length)%all.length;all.forEach((a,i)=>a.classList.toggle('active',i===next));input.setAttribute('aria-activedescendant',all[next].id);event.preventDefault();event.stopImmediatePropagation();return true}
function captureKeyboard(event){if(event.isComposing)return;const input=event.target instanceof Element?event.target.closest('[data-site-search]'):null;if(!input)return;if(event.key==='ArrowDown'){moveVisibleSuggestion(event,input,1);return}if(event.key==='ArrowUp'){moveVisibleSuggestion(event,input,-1);return}if(event.key!=='Enter')return;const id=input.getAttribute('aria-activedescendant');if(!id)return;const active=document.getElementById(id);if(!active?.matches('a[href]'))return;let target;try{target=new URL(active.href,location.href)}catch{return}if(target.origin!==location.origin||target.pathname!=='/search/'||!queryFromTarget(target))return;event.preventDefault();event.stopImmediatePropagation();runSearch(target,input.closest('form[data-search-shell]'),true)}
function preserveMobileRecentOpen(event){const show=event.target instanceof Element?event.target.closest('[data-apg-history-show]'):null;if(show)event.stopImmediatePropagation()}
window.addEventListener('submit',captureSubmit,true);window.addEventListener('click',captureRecentClick,true);window.addEventListener('keydown',captureKeyboard,true);document.addEventListener('click',preserveMobileRecentOpen);
window.addEventListener('popstate',()=>{if(location.pathname!=='/search/'){location.reload();return}const q=clean(new URLSearchParams(location.search).get('q')||'');if(!q){location.reload();return}const target=new URL(location.href);setState('loading');fetchOutcome(target,{form:null,push:false}).catch(()=>location.reload())});
window.addEventListener('pagehide',()=>{if(activeController)activeController.abort();clearTimers()},{capture:true});
migrateRecentSearches();setState(location.pathname==='/search/'?'ready':'idle');
})();
`;

const css=String.raw`
.apg-search52-root{max-width:1180px;margin:0 auto;padding:42px 22px 70px}.apg-search52-hero{padding:28px 0 26px;border-bottom:1px solid #dce7e4}.apg-search52-kicker{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#315463}.apg-search52-hero h1{margin:8px 0 12px;font-size:clamp(30px,4vw,48px);line-height:1.05}.apg-search52-form{max-width:760px;margin:20px 0 12px}.apg-search52-form>label{display:block;font-weight:800;margin-bottom:7px}.apg-search52-input-row{display:flex;gap:8px}.apg-search52-input-row input{flex:1;min-width:0;padding:13px 14px;border:1px solid #b9cbc7;border-radius:11px;font:inherit}.apg-search52-input-row button{padding:12px 18px;border:0;border-radius:11px;background:#0b645f;color:#fff;font:inherit;font-weight:800}.apg-search52-input-row button[disabled]{opacity:.65}.apg-search52-status{display:block;min-height:20px;margin-top:7px;font-size:13px}.apg-search52-status[data-error="true"]{font-weight:700}.apg-search52-interpretation{display:flex;flex-wrap:wrap;gap:7px;margin-top:14px}.apg-search52-interpretation span{padding:6px 9px;border-radius:999px;background:#edf6f4;font-size:12px}.apg-search52-block{padding:28px 0;border-bottom:1px solid #e4ecea}.apg-search52-products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.apg-search52-product{padding:18px;border:1px solid #dce7e4;border-radius:14px;background:#fff}.apg-search52-product p{margin:0 0 6px;font-size:12px;color:#536d75}.apg-search52-product h2{font-size:19px;line-height:1.2;margin:0 0 10px}.apg-search52-product div{font-size:14px;line-height:1.5;margin-bottom:12px}.apg-search52-product strong{font-size:13px}.apg-search52-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.apg-search52-category,.apg-search52-comparison{display:flex;flex-direction:column;gap:5px;padding:14px 16px;border:1px solid #dce7e4;border-radius:12px;text-decoration:none}.apg-search52-zero{padding:28px 0}.apg-search52-zero h2{margin:0 0 8px}.apg-search52-zero p{max-width:760px}@media(max-width:800px){.apg-search52-products{grid-template-columns:1fr}.apg-search52-links{grid-template-columns:1fr}.apg-search52-input-row{flex-direction:column}.apg-search52-input-row button{width:100%}}
`;
function sendAsset(req,res,body,type){res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Search-Resilience',PATCH);return res.end(req.method==='HEAD'?'':body)}
function sendSearchJson(req,res,url){try{const payload=searchJson(url.searchParams.get('q')||'');res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex');res.setHeader('X-APG-Search-Resilience',PATCH);res.setHeader('X-APG-Search-Mode','isolated-json-v52');return res.end(req.method==='HEAD'?'':JSON.stringify(payload))}catch(error){console.error('search_json_error',{name:error?.name||'Error',message:String(error?.message||error).slice(0,300)});res.statusCode=500;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.end(JSON.stringify({error:'search_unavailable',version:SEARCH_VERSION}))}}
function inject(html){let out=String(html||'');const cssTag=`<link rel="stylesheet" href="${ASSET_PATH}.css?v=${VERSION}">`,jsTag=`<script src="${ASSET_PATH}?v=${VERSION}" defer></script>`,app='<script src="/assets/app.js';if(!out.includes(ASSET_PATH+'.css')&&out.includes('</head>'))out=out.replace('</head>',cssTag+'</head>');if(!out.includes(ASSET_PATH)){if(out.includes(app))out=out.replace(app,jsTag+app);else if(out.includes('</head>'))out=out.replace('</head>',jsTag+'</head>')}return out}
function handler(req,res){let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}if(url.pathname===ASSET_PATH)return sendAsset(req,res,clientJs,'application/javascript; charset=utf-8');if(url.pathname===ASSET_PATH+'.css')return sendAsset(req,res,css,'text/css; charset=utf-8');if(url.pathname==='/search/'&&String(req.headers?.[JSON_HEADER]||'')==='1')return sendSearchJson(req,res,url);if(url.pathname==='/search/')res.setHeader('X-APG-Search-Resilience',PATCH);const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length')}}return end(body,...args)};return downstream(req,res)}
Object.assign(handler,downstream,{ASSET_PATH,VERSION,PATCH,SEARCH_VERSION,JSON_HEADER,clientJs,css,inject,sendSearchJson,searchJson});
module.exports=handler;
