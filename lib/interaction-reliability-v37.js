'use strict';

// APG v37 interaction reliability.
// Native SSR links and GET forms remain authoritative. This layer only provides a
// bounded recovery path when another client script silently cancels a core journey,
// plus narrow Search geometry, Scout timeout and compare-state self-healing guards.
const upstream=require('./entity-discovery-v1');

const ASSET_PATH='/assets/interaction-reliability-v37.js';
const CSS_PATH='/assets/interaction-reliability-v37.css';
const VERSION='37';

const css=String.raw`
/* APG v37 core interaction geometry.
   Autocomplete remains a normal anchored dropdown on narrow screens. Legacy visual
   layers must never turn it into a viewport overlay that covers the Search button. */
@media(max-width:760px){
  body form[data-search-shell]{position:relative!important;overflow:visible!important;isolation:isolate!important}
  body form[data-search-shell] .search-suggestions{
    position:absolute!important;
    inset:auto 0 auto 0!important;
    top:calc(100% + 8px)!important;
    left:0!important;
    right:0!important;
    bottom:auto!important;
    width:auto!important;
    height:auto!important;
    max-width:100%!important;
    max-height:min(340px,46vh)!important;
    margin:0!important;
    transform:none!important;
    overflow-x:hidden!important;
    overflow-y:auto!important;
    overscroll-behavior:contain!important;
    z-index:260!important;
  }
  body form[data-search-shell] .search-suggestions[hidden]{display:none!important}
  body form[data-search-shell] button[type="submit"]{position:relative!important;z-index:2!important}
}
`;

const clientJs=String.raw`
;(()=>{
if(window.__APG_INTERACTION_RELIABILITY_V37__)return;
window.__APG_INTERACTION_RELIABILITY_V37__=true;
const NAV_DELAY=1100;
const BUSY_RESET_MS=10000;
const SCOUT_TIMEOUT_MS=15000;
const timers=new Set();
const clearTimer=id=>{clearTimeout(id);timers.delete(id)};
const clearTimers=()=>{for(const id of timers)clearTimeout(id);timers.clear()};
window.addEventListener('pagehide',clearTimers,{capture:true});
window.addEventListener('beforeunload',clearTimers,{capture:true});

function sameOriginTarget(raw){
 try{const u=new URL(raw,location.href);return u.origin===location.origin?u:null}catch{return null}
}
function scheduleNavigation(raw,delay=NAV_DELAY){
 const target=sameOriginTarget(raw);if(!target)return;
 const start=location.href;
 const id=setTimeout(()=>{
   timers.delete(id);
   if(location.href!==start||document.visibilityState==='hidden')return;
   location.assign(target.href);
 },delay);
 timers.add(id);
}
function getFormTarget(form){
 const target=sameOriginTarget(form.getAttribute('action')||location.href);if(!target)return null;
 if(String(form.method||'get').toLowerCase()!=='get')return null;
 target.search='';
 const params=new URLSearchParams();
 for(const [key,value] of new FormData(form).entries())if(typeof value==='string'&&value!=='')params.append(key,value);
 target.search=params.toString();
 return target;
}
function isCoreForm(form){return !!form&&(
 form.matches('form[data-search-shell]')||
 (location.pathname==='/decision-lab/'&&form.matches('form.decision-form[data-busy-form]'))
);}
function resetBusy(form){
 if(!form)return;form.removeAttribute('aria-busy');
 const button=form.querySelector('button[type="submit"]');
 if(button&&button.dataset.old)button.textContent=button.dataset.old;
}
function closeSearchSuggestions(form){
 if(!form?.matches('form[data-search-shell]'))return;
 const box=form.querySelector('[data-search-suggestions]');
 const input=form.querySelector('[data-site-search]');
 if(box)box.hidden=true;
 if(input)input.setAttribute('aria-expanded','false');
}
function guardCoreSubmit(event){
 const form=event.target instanceof HTMLFormElement?event.target:null;if(!isCoreForm(form))return;
 const target=getFormTarget(form);if(!target)return;
 closeSearchSuggestions(form);
 scheduleNavigation(target.href);
 const id=setTimeout(()=>{timers.delete(id);if(location.href===target.href||document.visibilityState==='hidden')return;resetBusy(form)},BUSY_RESET_MS);
 timers.add(id);
}
window.addEventListener('submit',guardCoreSubmit,true);

function isPlainPrimaryClick(event){return event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey;}
function guardCoreLink(event){
 if(!isPlainPrimaryClick(event))return;
 const a=event.target instanceof Element?event.target.closest('a'):null;if(!a)return;
 const target=sameOriginTarget(a.href);if(!target)return;
 const describe=a.matches('a.button[href^="/decision-lab/"]');
 const compare=a.matches('a[data-compare-link]');
 if(!describe&&!compare)return;
 if(a.target&&a.target!=='_self')return;
 scheduleNavigation(target.href);
}
window.addEventListener('click',guardCoreLink,true);

function readCompare(){try{const v=JSON.parse(localStorage.getItem('apgCompare')||'[]');return Array.isArray(v)?v.filter(Boolean).slice(0,4):[]}catch{return []}}
function writeCompare(list){try{localStorage.setItem('apgCompare',JSON.stringify(list.slice(0,4)))}catch{}}
function renderCompare(list){
 document.querySelectorAll('[data-compare-product]').forEach(btn=>{const on=list.includes(btn.dataset.compareProduct);btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));btn.textContent=on?'Selected':'Compare';});
 const tray=document.getElementById('compareTray');if(!tray)return;
 const count=tray.querySelector('[data-compare-count]');if(count)count.textContent=String(list.length);
 const link=tray.querySelector('[data-compare-link]');if(link)link.href=list.length?'/compare/custom/?products='+list.map(encodeURIComponent).join(','):'/compare/custom/';
 tray.hidden=list.length===0;
}
function guardCompareToggle(event){
 if(!isPlainPrimaryClick(event))return;
 const button=event.target instanceof Element?event.target.closest('[data-compare-product]'):null;if(!button)return;
 const slug=String(button.dataset.compareProduct||'').trim();if(!slug)return;
 const before=readCompare(),shouldAdd=!before.includes(slug);
 const id=setTimeout(()=>{
   timers.delete(id);
   const after=readCompare();
   const upstreamWorked=shouldAdd?after.includes(slug):!after.includes(slug);
   if(upstreamWorked){renderCompare(after);return;}
   let next=before.slice();
   if(shouldAdd){if(next.length>=4)next=next.slice(1);if(!next.includes(slug))next.push(slug);}else next=next.filter(x=>x!==slug);
   writeCompare(next);renderCompare(next);
 },90);
 timers.add(id);
}
window.addEventListener('click',guardCompareToggle,true);

const upstreamFetch=window.fetch.bind(window);
window.fetch=(input,init={})=>{
 let url=null;try{url=new URL(typeof input==='string'?input:input?.url,location.href)}catch{}
 if(!url||url.origin!==location.origin||url.pathname!=='/api/account/scout')return upstreamFetch(input,init);
 const controller=new AbortController();
 const incoming=init&&init.signal;
 if(incoming){if(incoming.aborted)controller.abort();else incoming.addEventListener('abort',()=>controller.abort(),{once:true});}
 const id=setTimeout(()=>controller.abort(),SCOUT_TIMEOUT_MS);timers.add(id);
 return upstreamFetch(input,{...init,signal:controller.signal}).finally(()=>clearTimer(id));
};

function restoreAfterHistory(){document.querySelectorAll('form[aria-busy="true"]').forEach(resetBusy);renderCompare(readCompare());}
window.addEventListener('pageshow',restoreAfterHistory);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>renderCompare(readCompare()),{once:true});else renderCompare(readCompare());
})();
`;

function sendAsset(req,res,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Interaction-Reliability','v37');
  return res.end(req.method==='HEAD'?'':body);
}
function inject(html){
  let out=String(html||'');
  if(!out.includes(CSS_PATH)&&out.includes('</head>'))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(ASSET_PATH)&&out.includes('</body>'))out=out.replace('</body>',`<script src="${ASSET_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function handler(req,res){
  let path='/';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===ASSET_PATH)return sendAsset(req,res,clientJs,'application/javascript; charset=utf-8');
  if(path===CSS_PATH)return sendAsset(req,res,css,'text/css; charset=utf-8');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return upstream(req,res);
}

Object.assign(handler,upstream,{ASSET_PATH,CSS_PATH,VERSION,css,clientJs,inject});
module.exports=handler;
