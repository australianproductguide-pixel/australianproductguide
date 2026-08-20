'use strict';

// Search reliability v51.1.
// Search forms and recent-search selections have one deterministic navigation
// owner. The controller runs before legacy search handlers, migrates historical
// storage to one string representation, owns visible-suggestion keyboard movement
// without synchronous scrolling and preserves mobile recent-history rendering.
const downstream=require('./decision-lab-resilience-v50-runtime');

const ASSET_PATH='/assets/search-reliability-v51.js';
const VERSION='51.1';
const PATCH='search-p0-2026-08-20-single-nav-r2';

const clientJs=String.raw`
;(()=>{
if(window.__APG_SEARCH_RELIABILITY_V51__)return;
window.__APG_SEARCH_RELIABILITY_V51__='${PATCH}';
const SEARCH_KEY='apgRecentSearches';
const BUSY_TIMEOUT_MS=10000;
let navigationSerial=0;
const clean=v=>String(v??'').trim().replace(/\s+/g,' ').slice(0,240);
function recentValue(entry){
 if(typeof entry==='string')return clean(entry);
 if(!entry||typeof entry!=='object')return '';
 return clean(entry.q||entry.query||entry.value||entry.label||'');
}
function readRecent(){
 let raw=[];try{const parsed=JSON.parse(localStorage.getItem(SEARCH_KEY)||'[]');if(Array.isArray(parsed))raw=parsed}catch{}
 const out=[],seen=new Set();for(const entry of raw){const q=recentValue(entry);if(!q||/^\[object Object\]$/i.test(q))continue;const key=q.toLowerCase();if(seen.has(key))continue;seen.add(key);out.push(q)}return out.slice(0,10);
}
function writeRecent(rows){try{localStorage.setItem(SEARCH_KEY,JSON.stringify(rows.slice(0,10)))}catch{}}
function rememberSearch(value){const q=clean(value);if(!q||/^\[object Object\]$/i.test(q))return;writeRecent([q,...readRecent().filter(x=>x.toLowerCase()!==q.toLowerCase())])}
function migrateRecentSearches(){const rows=readRecent();writeRecent(rows)}
function isSearchForm(form){return !!form&&form.matches('form[data-search-shell]')}
function inputOf(form){return form?.querySelector('[data-site-search],input[name="q"]')||null}
function buttonOf(form){return form?.querySelector('button[type="submit"],input[type="submit"]')||null}
function statusOf(form){let s=form?.querySelector('[data-search-submit-status]');if(s)return s;if(!form)return null;s=document.createElement('span');s.dataset.searchSubmitStatus='';s.className='search-submit-status sr-only';s.setAttribute('role','status');s.setAttribute('aria-live','polite');form.appendChild(s);return s}
function setStatus(form,text){const s=statusOf(form);if(s)s.textContent=text||''}
function closeSuggestions(form){const box=form?.querySelector('[data-search-suggestions]'),input=inputOf(form);if(box){box.hidden=true;box.removeAttribute('aria-busy')}if(input){input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant')}}
function setBusy(form){if(!form)return;form.dataset.apgSearchV51Busy='true';form.setAttribute('aria-busy','true');const b=buttonOf(form);if(b){if(!b.dataset.apgSearchV51Label)b.dataset.apgSearchV51Label=b.tagName==='INPUT'?b.value:b.textContent;b.disabled=true;b.setAttribute('aria-busy','true');if(b.tagName==='INPUT')b.value='Searching…';else b.textContent='Searching…'}setStatus(form,'Searching Australian Product Guide…');if(document.body)document.body.dataset.apgSearchV51State='loading'}
function resetBusy(form){if(!form)return;delete form.dataset.apgSearchV51Busy;form.removeAttribute('aria-busy');const b=buttonOf(form);if(b){b.disabled=false;b.removeAttribute('aria-busy');const label=b.dataset.apgSearchV51Label||'Search';if(b.tagName==='INPUT')b.value=label;else b.textContent=label}}
function targetForQuery(query){const target=new URL('/search/',location.origin);target.searchParams.set('q',clean(query));return target}
function queryFromTarget(target){return clean(target?.searchParams?.get('q')||'')}
function controlledNavigate(target,form,query){
 const q=queryFromTarget(target)||clean(query);if(!q){resetBusy(form);setStatus(form,'Enter what you want to search for.');return}
 if(form?.dataset.apgSearchV51Busy==='true'){setStatus(form,'That search is already loading.');return}
 const serial=++navigationSerial,start=location.href;
 rememberSearch(q);if(form){const input=inputOf(form);if(input)input.value=q;closeSuggestions(form);setBusy(form)}
 const timer=setTimeout(()=>{
   if(serial!==navigationSerial||document.visibilityState==='hidden'||location.href!==start)return;
   try{window.stop()}catch{}
   resetBusy(form);if(document.body)document.body.dataset.apgSearchV51State='timeout';setStatus(form,'Search did not finish loading. Your query is still here — please try again.');
 },BUSY_TIMEOUT_MS);
 try{location.assign(target.href)}catch{clearTimeout(timer);resetBusy(form);if(document.body)document.body.dataset.apgSearchV51State='error';setStatus(form,'Search could not open that result. Your query is still here — please try again.')}
}
function captureSubmit(event){const form=event.target instanceof HTMLFormElement?event.target:null;if(!isSearchForm(form))return;event.preventDefault();event.stopImmediatePropagation();const input=inputOf(form),q=clean(input?.value||'');controlledNavigate(targetForQuery(q),form,q)}
function plainPrimary(event){return event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey}
function recentSearchAnchor(event){if(!plainPrimary(event))return null;const a=event.target instanceof Element?event.target.closest('a[href]'):null;if(!a)return null;const box=a.closest('[data-search-suggestions],.apg-recent-option,[data-apg-recent-group],[data-search-recent],.apg-history-search');if(!box)return null;let target;try{target=new URL(a.href,location.href)}catch{return null}if(target.origin!==location.origin||target.pathname!=='/search/'||!queryFromTarget(target))return null;return {a,target}}
function captureRecentClick(event){const hit=recentSearchAnchor(event);if(!hit)return;event.preventDefault();event.stopImmediatePropagation();const form=hit.a.closest('form[data-search-shell]')||document.querySelector('form[data-search-shell]');controlledNavigate(hit.target,form,queryFromTarget(hit.target))}
function moveVisibleSuggestion(event,input,step){
 const form=input.closest('form[data-search-shell]'),box=form?.querySelector('[data-search-suggestions]');if(!box||box.hidden)return false;
 const all=[...box.querySelectorAll('a.suggest-item[href]')].filter(a=>!a.closest('[hidden]'));if(!all.length)return false;
 const current=input.getAttribute('aria-activedescendant'),at=all.findIndex(a=>a.id===current),next=at<0?(step>0?0:all.length-1):(at+step+all.length)%all.length;
 all.forEach((a,i)=>a.classList.toggle('active',i===next));input.setAttribute('aria-activedescendant',all[next].id);event.preventDefault();event.stopImmediatePropagation();return true;
}
function captureKeyboard(event){
 if(event.isComposing)return;const input=event.target instanceof Element?event.target.closest('[data-site-search]'):null;if(!input)return;
 if(event.key==='ArrowDown'){moveVisibleSuggestion(event,input,1);return}if(event.key==='ArrowUp'){moveVisibleSuggestion(event,input,-1);return}if(event.key!=='Enter')return;
 const id=input.getAttribute('aria-activedescendant');if(!id)return;const active=document.getElementById(id);if(!active?.matches('a[href]'))return;let target;try{target=new URL(active.href,location.href)}catch{return}if(target.origin!==location.origin||target.pathname!=='/search/'||!queryFromTarget(target))return;event.preventDefault();event.stopImmediatePropagation();controlledNavigate(target,input.closest('form[data-search-shell]'),queryFromTarget(target))
}
function preserveMobileRecentOpen(event){const show=event.target instanceof Element?event.target.closest('[data-apg-history-show]'):null;if(show)event.stopImmediatePropagation()}
function restore(){++navigationSerial;document.querySelectorAll('form[data-search-shell]').forEach(form=>{resetBusy(form);setStatus(form,'')});if(document.body)document.body.dataset.apgSearchV51State=location.pathname==='/search/'?'ready':'idle'}
migrateRecentSearches();
window.addEventListener('submit',captureSubmit,true);
window.addEventListener('click',captureRecentClick,true);
window.addEventListener('keydown',captureKeyboard,true);
document.addEventListener('click',preserveMobileRecentOpen);
window.addEventListener('pageshow',restore);
restore();
})();
`;

function sendAsset(req,res){res.statusCode=200;res.setHeader('Content-Type','application/javascript; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Search-Reliability',PATCH);return res.end(req.method==='HEAD'?'':clientJs)}
function inject(html){let out=String(html||'');if(out.includes(ASSET_PATH))return out;const tag=`<script src="${ASSET_PATH}?v=${VERSION}" defer></script>`,appMarker='<script src="/assets/app.js';if(out.includes(appMarker))return out.replace(appMarker,tag+appMarker);if(out.includes('</head>'))return out.replace('</head>',tag+'</head>');return out}
function handler(req,res){let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}if(url.pathname===ASSET_PATH)return sendAsset(req,res);if(url.pathname==='/search/')res.setHeader('X-APG-Search-Reliability',PATCH);const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader('Content-Type')||'').toLowerCase();if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length')}}return end(body,...args)};return downstream(req,res)}
Object.assign(handler,downstream,{ASSET_PATH,VERSION,PATCH,clientJs,inject});
module.exports=handler;
