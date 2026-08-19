'use strict';

// Decision Lab resilience v50.
// Decision Lab owns one bounded same-origin submission controller. It fetches the
// authoritative SSR outcome first, validates that outcome, then commits it into
// the current document. Full-document navigation is not required for a result,
// so a navigation lifecycle edge case cannot strand the consumer in busy state.
const downstream=require('./catalogue-intelligence-v49-pass10-runtime');

const ASSET_PATH='/assets/decision-lab-resilience-v50.js';
const VERSION='50';
const PATCH='decision-lab-p0-2026-08-20-soft-nav';
const ENGINE='decision-engine-v4';

const clientJs=String.raw`
;(()=>{
if(window.__APG_DECISION_LAB_RESILIENCE_V50__)return;
window.__APG_DECISION_LAB_RESILIENCE_V50__='${PATCH}';
const DEADLINE_MS=10000;
const SLOW_MS=3500;
let activeController=null;
let deadlineTimer=0;
let slowTimer=0;
let requestSerial=0;

function isDecisionForm(form){return !!form&&location.pathname==='/decision-lab/'&&form.matches('form.decision-form[data-busy-form]')}
function buttonOf(form){return form?.querySelector('button[type="submit"],input[type="submit"]')||null}
function statusOf(form){
 if(!form)return null;
 let status=form.querySelector('[data-decision-submit-status]');
 if(status)return status;
 status=document.createElement('span');
 status.className='decision-submit-status';
 status.dataset.decisionSubmitStatus='';
 status.setAttribute('role','status');
 status.setAttribute('aria-live','polite');
 (form.querySelector('.decision-form-actions')||form).appendChild(status);
 return status;
}
function setStatus(form,message,error=false){const s=statusOf(form);if(!s)return;s.textContent=message||'';s.classList.toggle('is-error',!!error)}
function setBusy(form){
 form.dataset.apgDecisionV50Submitting='true';
 form.setAttribute('aria-busy','true');
 const button=buttonOf(form);
 if(button){
   if(!button.dataset.apgDecisionV50Label)button.dataset.apgDecisionV50Label=button.textContent||button.value||'Build my shortlist';
   button.disabled=true;button.setAttribute('aria-busy','true');
   if(button.tagName==='INPUT')button.value='Building shortlist…';else button.textContent='Building shortlist…';
 }
 setStatus(form,'Decision Engine v4 is matching your requirements against maintained APG product data.');
}
function resetBusy(form){
 if(!form)return;
 delete form.dataset.apgDecisionV50Submitting;
 form.removeAttribute('aria-busy');
 const button=buttonOf(form);
 if(button){
   button.disabled=false;button.removeAttribute('aria-busy');
   const label=button.dataset.apgDecisionV50Label||button.dataset.old||'Build my shortlist';
   if(button.tagName==='INPUT')button.value=label;else button.textContent=label;
 }
}
function clearRequestTimers(){if(deadlineTimer)clearTimeout(deadlineTimer);if(slowTimer)clearTimeout(slowTimer);deadlineTimer=0;slowTimer=0}
function safeTarget(form){
 const target=new URL('/decision-lab/',location.origin);
 const params=new URLSearchParams();
 for(const [key,value] of new FormData(form).entries()){
   if(typeof value!=='string')continue;
   const clean=value.trim();if(clean)params.append(key,clean);
 }
 target.search=params.toString();
 return target;
}
function hasDecisionInput(target){return ['q','category','budget','brand'].some(key=>String(target.searchParams.get(key)||'').trim())}
function sendEvent(name,form){
 const data=form?new FormData(form):new FormData();
 const payload={event:name,engine:'${ENGINE}',interactionPatch:'${PATCH}',category:String(data.get('category')||'').slice(0,80),hasBudget:!!String(data.get('budget')||'').trim(),hasBrandPreference:!!String(data.get('brand')||'').trim(),viewport:innerWidth<600?'mobile':innerWidth<1024?'tablet':'desktop'};
 try{const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});if(navigator.sendBeacon&&navigator.sendBeacon('/api/decision-telemetry',blob))return}catch{}
 try{fetch('/api/decision-telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{})}catch{}
}
function syncLocalActions(){
 let saved=[],compare=[];
 try{const v=JSON.parse(localStorage.getItem('apgSaved')||'[]');if(Array.isArray(v))saved=v}catch{}
 try{const v=JSON.parse(localStorage.getItem('apgCompare')||'[]');if(Array.isArray(v))compare=v.slice(0,4)}catch{}
 document.querySelectorAll('[data-save-product]').forEach(button=>{const on=saved.includes(button.dataset.saveProduct);button.classList.toggle('saved',on);button.setAttribute('aria-pressed',String(on));button.textContent=on?'♥':'♡';button.title=on?'Remove from saved products':'Save product on this device'});
 document.querySelectorAll('[data-compare-product]').forEach(button=>{const on=compare.includes(button.dataset.compareProduct);button.classList.toggle('selected',on);button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on));button.textContent=on?'Added':'Compare'});
 const tray=document.getElementById('compareTray');if(tray){const count=tray.querySelector('[data-compare-count]');if(count)count.textContent=String(compare.length);const link=tray.querySelector('[data-compare-link]');if(link){link.href=compare.length?'/compare/custom/?products='+compare.map(encodeURIComponent).join(','):'/compare/custom/';link.classList.toggle('disabled',compare.length<2);link.setAttribute('aria-disabled',String(compare.length<2))}tray.hidden=compare.length===0}
}
function copyBodyDecisionState(parsed){
 const source=parsed.body;if(!source)return;
 for(const key of ['decisionQuery','decisionUrl']){
   const attr='data-'+key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
   if(source.hasAttribute(attr))document.body.setAttribute(attr,source.getAttribute(attr));else document.body.removeAttribute(attr);
 }
}
function parseOutcome(html,allowBlank=false){
 const parsed=new DOMParser().parseFromString(html,'text/html');
 const main=parsed.querySelector('main#main');
 const form=main?.querySelector('form.decision-form[data-busy-form]');
 if(!main||!form)throw new Error('invalid_decision_document');
 const result=main.querySelector('.decision-result');
 const zero=main.querySelector('.zero-state');
 const recovery=main.querySelector('.decision-server-recovery');
 if(!allowBlank&&!result&&!zero&&!recovery)throw new Error('missing_decision_outcome');
 return {parsed,main,result,zero,recovery};
}
function focusOutcome(main){
 const target=main.querySelector('.decision-results .decision-result h2,.zero-state h2,.decision-server-recovery strong,.decision-summary h2');
 if(!target)return;
 target.setAttribute('tabindex','-1');
 try{target.focus({preventScroll:true})}catch{}
 target.scrollIntoView({block:'start',behavior:'smooth'});
}
function commitOutcome(outcome,finalUrl,push){
 const imported=document.importNode(outcome.main,true);
 const current=document.querySelector('main#main');if(!current)throw new Error('missing_current_main');
 current.replaceWith(imported);
 document.title=outcome.parsed.title||document.title;
 copyBodyDecisionState(outcome.parsed);
 const final=new URL(finalUrl,location.href);
 const relative=final.pathname+final.search+final.hash;
 if(push&&relative!==(location.pathname+location.search+location.hash))history.pushState({apgDecisionV50:true},'',relative);
 else if(!push&&relative!==(location.pathname+location.search+location.hash))history.replaceState(history.state,'',relative);
 syncLocalActions();
 document.dispatchEvent(new CustomEvent('apg:decision-rendered',{detail:{url:relative,patch:'${PATCH}'}}));
 if(outcome.result)sendEvent('decision_lab_success',imported.querySelector('form.decision-form[data-busy-form]'));
 else if(outcome.zero)sendEvent('decision_lab_no_results',imported.querySelector('form.decision-form[data-busy-form]'));
 else if(outcome.recovery)sendEvent('decision_lab_error',imported.querySelector('form.decision-form[data-busy-form]'));
 focusOutcome(imported);
}
async function fetchOutcome(target,{push=true,allowBlank=false,sourceForm=null}={}){
 const serial=++requestSerial;
 if(activeController)activeController.abort();
 const controller=new AbortController();activeController=controller;
 clearRequestTimers();
 deadlineTimer=setTimeout(()=>controller.abort('deadline'),DEADLINE_MS);
 if(sourceForm)slowTimer=setTimeout(()=>{if(serial===requestSerial&&document.contains(sourceForm))setStatus(sourceForm,'This is taking longer than usual. We will stop automatically if it cannot complete.')},SLOW_MS);
 try{
   const response=await fetch(target.href,{method:'GET',credentials:'same-origin',cache:'no-store',headers:{Accept:'text/html','X-APG-Decision-Soft-Navigation':'1'},signal:controller.signal});
   if(!response.ok)throw new Error('decision_http_'+response.status);
   const html=await response.text();
   if(serial!==requestSerial)return false;
   const outcome=parseOutcome(html,allowBlank);
   commitOutcome(outcome,response.url||target.href,push);
   return true;
 }finally{
   if(serial===requestSerial){clearRequestTimers();activeController=null}
 }
}
async function submitDecision(event,form){
 event.preventDefault();event.stopImmediatePropagation();
 if(form.dataset.apgDecisionV50Submitting==='true'){setStatus(form,'Your shortlist is already being built.');return}
 const target=safeTarget(form);
 if(!hasDecisionInput(target)){setStatus(form,'Describe what you want or choose at least one filter so Decision Lab has something to match.',true);resetBusy(form);return}
 const q=String(target.searchParams.get('q')||'');
 if(q.length>2000){setStatus(form,'That description is too long for a reliable shareable decision URL. Please shorten it to under 2,000 characters and try again.',true);resetBusy(form);return}
 setBusy(form);sendEvent(form.dataset.apgDecisionV50TimedOut==='true'?'decision_lab_retry':'decision_lab_submitted',form);delete form.dataset.apgDecisionV50TimedOut;
 try{
   await fetchOutcome(target,{push:true,allowBlank:false,sourceForm:form});
 }catch(error){
   if(!document.contains(form))return;
   resetBusy(form);
   const timedOut=error?.name==='AbortError'||String(error?.message||'').includes('aborted');
   if(timedOut){form.dataset.apgDecisionV50TimedOut='true';setStatus(form,'Decision Lab could not complete that request in time. Your description and filters are still here — please try again.',true);sendEvent('decision_lab_timeout',form)}
   else{setStatus(form,'Decision Lab could not complete that request just now. Your description and filters are still here — please try again.',true);sendEvent('decision_lab_error',form)}
 }
}
function captureSubmit(event){const form=event.target instanceof HTMLFormElement?event.target:null;if(!isDecisionForm(form))return;submitDecision(event,form)}
window.addEventListener('submit',captureSubmit,true);
window.addEventListener('pagehide',()=>{if(activeController)activeController.abort('pagehide');clearRequestTimers()},{capture:true});
window.addEventListener('popstate',()=>{
 if(location.pathname!=='/decision-lab/')return;
 const target=new URL(location.href);
 fetchOutcome(target,{push:false,allowBlank:!hasDecisionInput(target)}).catch(()=>location.reload());
});
document.addEventListener('click',event=>{
 const copy=event.target instanceof Element?event.target.closest('[data-copy-decision]'):null;if(!copy)return;
 const status=document.querySelector('[data-copy-status]');
 const value=location.href;
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(value).then(()=>{if(status)status.textContent='Decision link copied'}).catch(()=>{if(status)status.textContent='Copy the page address from your browser'});
});
syncLocalActions();
})();
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Decision-Lab-Resilience',PATCH);
  return res.end(req.method==='HEAD'?'':clientJs);
}
function inject(html){
  let out=String(html||'');
  if(out.includes(ASSET_PATH))return out;
  const tag=`<script src="${ASSET_PATH}?v=${VERSION}" defer></script>`;
  const appMarker='<script src="/assets/app.js';
  if(out.includes(appMarker))return out.replace(appMarker,tag+appMarker);
  if(out.includes('</head>'))return out.replace('</head>',tag+'</head>');
  return out;
}
function handler(req,res){
  let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}
  if(url.pathname===ASSET_PATH)return sendAsset(req,res);
  if(url.pathname==='/decision-lab/')res.setHeader('X-APG-Decision-Lab-Resilience',PATCH);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')&&url.pathname==='/decision-lab/'){
      const next=inject(body);if(next!==body){body=next;res.removeHeader('Content-Length')}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{ASSET_PATH,VERSION,PATCH,ENGINE,clientJs,inject});
module.exports=handler;
