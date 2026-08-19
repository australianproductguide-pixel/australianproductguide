'use strict';

// APG v37 interaction reliability.
// Native SSR links and GET forms remain authoritative site-wide. Decision Lab uses
// a single managed navigation so a cancelled submit cannot strand the consumer or
// create a duplicate fallback request. Search remains native with bounded recovery.
const upstream=require('./entity-discovery-v1');
const {randomUUID}=require('crypto');

const ASSET_PATH='/assets/interaction-reliability-v37.js';
const CSS_PATH='/assets/interaction-reliability-v37.css';
const VERSION='37';
const DECISION_LAB_PATCH='decision-lab-p0-2026-08-20';
const DECISION_ENGINE_VERSION='decision-engine-v4';

const css=String.raw`
/* APG v37 core interaction geometry and CSP-safe utility styling. */
.apg-alternative-reason{display:block;margin-top:6px}
.decision-submit-status{display:block;margin-top:10px;font-size:.92rem;line-height:1.45;color:#334155}
.decision-submit-status:empty{display:none}
.decision-submit-status.is-error{padding:10px 12px;border:1px solid #e7c56c;border-radius:12px;background:#fff8e8;color:#553100}
.decision-server-recovery{margin:0 0 18px;padding:14px 16px;border:1px solid #e7c56c;border-radius:14px;background:#fff8e8;color:#3f2a00}
.decision-server-recovery strong{display:block;margin-bottom:4px}
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
window.__APG_DECISION_LAB_P0__='${DECISION_LAB_PATCH}';
const NAV_DELAY=1100;
const BUSY_RESET_MS=10000;
const DECISION_TIMEOUT_MS=12000;
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
function isDecisionForm(form){return !!form&&location.pathname==='/decision-lab/'&&form.matches('form.decision-form[data-busy-form]')}
function isCoreForm(form){return !!form&&(form.matches('form[data-search-shell]')||isDecisionForm(form));}
function submitButton(form){return form?.querySelector('button[type="submit"],input[type="submit"]')||null}
function decisionStatus(form){
 if(!isDecisionForm(form))return null;
 let status=form.querySelector('[data-decision-submit-status]');
 if(status)return status;
 status=document.createElement('span');status.className='decision-submit-status';status.dataset.decisionSubmitStatus='';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const actions=form.querySelector('.decision-form-actions')||form;actions.appendChild(status);return status;
}
function setDecisionStatus(form,message,error=false){const status=decisionStatus(form);if(!status)return;status.textContent=message||'';status.classList.toggle('is-error',!!error)}
function markDecisionBusy(form){
 const button=submitButton(form);form.setAttribute('aria-busy','true');
 if(button){if(!button.dataset.old)button.dataset.old=button.textContent||button.value||'Build my shortlist';button.setAttribute('aria-busy','true');button.disabled=true;if(button.tagName==='INPUT')button.value='Building shortlist…';else button.textContent='Building shortlist…';}
 setDecisionStatus(form,'Decision Engine v4 is matching your requirements against maintained APG product data.');
}
function resetBusy(form){
 if(!form)return;form.removeAttribute('aria-busy');delete form.dataset.apgDecisionSubmitting;
 const button=submitButton(form);
 if(button){button.removeAttribute('aria-busy');button.disabled=false;if(button.dataset.old){if(button.tagName==='INPUT')button.value=button.dataset.old;else button.textContent=button.dataset.old;}}
}
function sendDecisionEvent(name,form){
 if(!isDecisionForm(form))return;
 const data=new FormData(form),category=String(data.get('category')||'').slice(0,80);
 const payload={event:name,engine:'${DECISION_ENGINE_VERSION}',interactionPatch:'${DECISION_LAB_PATCH}',category,hasBudget:!!String(data.get('budget')||'').trim(),hasBrandPreference:!!String(data.get('brand')||'').trim(),viewport:innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop'};
 try{const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});if(navigator.sendBeacon&&navigator.sendBeacon('/api/decision-telemetry',blob))return;}catch{}
 try{fetch('/api/decision-telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
}
function beginDecisionNavigation(event,form,target){
 if(form.dataset.apgDecisionSubmitting==='true'){
   event.preventDefault();setDecisionStatus(form,'Your shortlist is already being built. Please keep this page open.');return;
 }
 event.preventDefault();form.dataset.apgDecisionSubmitting='true';
 const retrying=form.dataset.apgDecisionTimedOut==='true';delete form.dataset.apgDecisionTimedOut;
 queueMicrotask(()=>markDecisionBusy(form));
 sendDecisionEvent(retrying?'decision_lab_retry':'decision_lab_submitted',form);
 const navId=setTimeout(()=>{timers.delete(navId);if(document.visibilityState==='hidden')return;location.assign(target.href)},0);timers.add(navId);
 const timeoutId=setTimeout(()=>{
   timers.delete(timeoutId);if(document.visibilityState==='hidden'||!document.contains(form))return;
   try{window.stop()}catch{}
   resetBusy(form);form.dataset.apgDecisionTimedOut='true';
   setDecisionStatus(form,'We could not complete that recommendation just now. Your preferences are still here — please try again.',true);
   sendDecisionEvent('decision_lab_timeout',form);
 },DECISION_TIMEOUT_MS);timers.add(timeoutId);
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
 if(isDecisionForm(form)){beginDecisionNavigation(event,form,target);return;}
 scheduleNavigation(target.href);
 const id=setTimeout(()=>{timers.delete(id);if(document.visibilityState==='hidden')return;resetBusy(form)},BUSY_RESET_MS);
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

function restoreAfterHistory(){document.querySelectorAll('form[data-busy-form]').forEach(resetBusy);renderCompare(readCompare());}
function certifyDecisionResult(){
 if(location.pathname!=='/decision-lab/')return;const form=document.querySelector('form.decision-form[data-busy-form]');if(!form)return;
 const hasInput=!!String(document.body.dataset.decisionQuery||'').trim()||new URLSearchParams(location.search).has('category')||new URLSearchParams(location.search).has('budget')||new URLSearchParams(location.search).has('brand');
 if(!hasInput)return;
 if(document.querySelector('.decision-result'))sendDecisionEvent('decision_lab_success',form);else if(document.querySelector('.zero-state'))sendDecisionEvent('decision_lab_no_results',form);
}
function markDecisionStarted(){const form=document.querySelector('form.decision-form[data-busy-form]');if(!form)return;const first=()=>{sendDecisionEvent('decision_lab_started',form);form.removeEventListener('focusin',first)};form.addEventListener('focusin',first)}
window.addEventListener('pageshow',restoreAfterHistory);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{renderCompare(readCompare());markDecisionStarted();certifyDecisionResult()},{once:true});else{renderCompare(readCompare());markDecisionStarted();certifyDecisionResult()}
})();
`;

function sendAsset(req,res,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Interaction-Reliability','v37');
  res.setHeader('X-APG-Decision-Lab-Reliability',DECISION_LAB_PATCH);
  return res.end(req.method==='HEAD'?'':body);
}
function safeTelemetry(value,max=80){return String(value||'').replace(/[^a-zA-Z0-9._:-]/g,'').slice(0,max)}
function receiveDecisionTelemetry(req,res){
  let raw='';req.on('data',chunk=>{if(raw.length<4096)raw+=String(chunk)});
  req.on('end',()=>{
    let x={};try{x=JSON.parse(raw||'{}')}catch{}
    const allowed=new Set(['decision_lab_started','decision_lab_submitted','decision_lab_success','decision_lab_no_results','decision_lab_error','decision_lab_timeout','decision_lab_retry']);
    const event=allowed.has(x.event)?x.event:'decision_lab_error';
    const record={type:'apg_decision_lab',event,engine:DECISION_ENGINE_VERSION,interactionPatch:DECISION_LAB_PATCH,traceId:randomUUID(),category:safeTelemetry(x.category),hasBudget:!!x.hasBudget,hasBrandPreference:!!x.hasBrandPreference,viewport:['mobile','tablet','desktop'].includes(x.viewport)?x.viewport:'unknown',at:new Date().toISOString()};
    console.info(JSON.stringify(record));res.statusCode=204;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end();
  });
}
function decisionFailure(req,res,error,path){
  const traceId=randomUUID();
  console.error(JSON.stringify({type:'apg_decision_lab_error',engine:DECISION_ENGINE_VERSION,interactionPatch:DECISION_LAB_PATCH,traceId,path,errorClass:safeTelemetry(error?.name||'Error'),at:new Date().toISOString()}));
  if(res.headersSent)throw error;
  if(path==='/api/decision'){
    res.statusCode=500;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end(JSON.stringify({error:'temporary_service_failure',message:'We could not generate that shortlist just now. Please try again.',engine:DECISION_ENGINE_VERSION,traceId}));
  }
  const u=new URL(req.url,'https://australianproductguide.au'),params=new URLSearchParams();
  for(const key of ['q','category','budget','brand']){const value=u.searchParams.get(key);if(value)params.set(key,value)}
  params.set('decision_error','temporary');params.set('trace',traceId);
  res.statusCode=303;res.setHeader('Location','/decision-lab/?'+params.toString());res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');return res.end();
}
function makeCspSafe(html){
  return String(html||'').replace(/<span style="display:block;margin-top:6px">/g,'<span class="apg-alternative-reason">');
}
function injectDecisionFailure(html,url){
  if(!url||url.pathname!=='/decision-lab/'||url.searchParams.get('decision_error')!=='temporary')return html;
  const trace=safeTelemetry(url.searchParams.get('trace')||'',64);
  const notice=`<div class="decision-server-recovery" role="alert"><strong>Temporary recommendation service failure</strong><span>We could not generate your shortlist just now. Your selections have been kept, so you can try again immediately.${trace?' Reference '+trace+'.':''}</span></div>`;
  return String(html).replace('<form class="decision-form"',notice+'<form class="decision-form"');
}
function inject(html,url){
  let out=injectDecisionFailure(makeCspSafe(html),url);
  if(!out.includes(CSS_PATH)&&out.includes('</head>'))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(ASSET_PATH)&&out.includes('</body>'))out=out.replace('</body>',`<script src="${ASSET_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function handler(req,res){
  let url=new URL('https://australianproductguide.au/');try{url=new URL(req.url,'https://australianproductguide.au')}catch{}
  const path=url.pathname;
  if(path===ASSET_PATH)return sendAsset(req,res,clientJs,'application/javascript; charset=utf-8');
  if(path===CSS_PATH)return sendAsset(req,res,css,'text/css; charset=utf-8');
  if(path==='/api/decision-telemetry'&&req.method==='POST')return receiveDecisionTelemetry(req,res);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=inject(body,url);if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  try{return upstream(req,res)}catch(error){
    if(path==='/decision-lab/'||path==='/api/decision')return decisionFailure(req,res,error,path);
    throw error;
  }
}

Object.assign(handler,upstream,{ASSET_PATH,CSS_PATH,VERSION,DECISION_LAB_PATCH,DECISION_ENGINE_VERSION,css,clientJs,makeCspSafe,inject,injectDecisionFailure});
module.exports=handler;
