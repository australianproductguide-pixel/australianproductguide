'use strict';

// APG Consent-Safe Analytics Funnel v79.
// Adds a deliberately narrow decision/funnel event layer over the existing opt-in GA4
// implementation. No typed search terms, Decision Lab descriptions, Scout messages,
// account identifiers or URL query strings are sent by this layer.
const downstream=require('./footer-country-removal-v78');

const ANALYTICS_FUNNEL_VERSION='79.0';
const ASSET_PATH='/assets/analytics-funnel-v79.js';

const consentGuardJs=String.raw`
;(()=>{
'use strict';
if(window.__APG_ANALYTICS_CONSENT_GUARD_V79__)return;
window.__APG_ANALYTICS_CONSENT_GUARD_V79__='79.0';
window.__apgAnalyticsAllowed=false;

// The base Google bootstrap intentionally creates dataLayer/gtag before consent so it
// can send Consent Mode commands. Remove any accidental pre-consent event calls and
// then prevent future event/config calls from being queued until analytics is allowed.
try{
  if(Array.isArray(window.dataLayer))window.dataLayer=window.dataLayer.filter(entry=>!(entry&&entry[0]==='event'));
}catch{}

const baseGtag=typeof window.gtag==='function'?window.gtag:null;
if(baseGtag){
  window.gtag=function(){
    const args=Array.from(arguments),command=args[0],action=args[1],payload=args[2]||{};
    if(command==='consent'){
      if(action==='update'&&payload&&payload.analytics_storage==='granted'){
        window.__apgAnalyticsAllowed=true;
        const result=baseGtag.apply(this,args);
        try{window.dispatchEvent(new CustomEvent('apg-analytics-consent-granted'))}catch{}
        return result;
      }
      if((action==='update'||action==='default')&&payload&&payload.analytics_storage==='denied'){
        window.__apgAnalyticsAllowed=false;
        try{window.dispatchEvent(new CustomEvent('apg-analytics-consent-denied'))}catch{}
      }
      return baseGtag.apply(this,args);
    }
    if(!window.__apgAnalyticsAllowed)return false;
    return baseGtag.apply(this,args);
  };
}

window.apgTrackEvent=function(name,params){
  if(window.__apgAnalyticsAllowed!==true||typeof window.gtag!=='function')return false;
  if(!/^[a-z][a-z0-9_]{1,39}$/.test(String(name||'')))return false;
  try{window.gtag('event',String(name),params&&typeof params==='object'?params:{});return true}catch{return false}
};
})();
`;

const analyticsClientJs=String.raw`
;(()=>{
'use strict';
if(window.__APG_ANALYTICS_FUNNEL_V79__)return;
window.__APG_ANALYTICS_FUNNEL_V79__='79.0';

const track=(name,params={})=>{
  try{return typeof window.apgTrackEvent==='function'&&window.apgTrackEvent(name,params)===true}catch{return false}
};
const deviceBucket=()=>{
  try{if(matchMedia('(max-width:700px)').matches)return 'mobile';if(matchMedia('(max-width:1024px)').matches)return 'tablet'}catch{}
  return 'desktop';
};
const pageType=()=>{
  const p=location.pathname;
  if(/^\/products\//.test(p))return 'product';
  if(p==='/decision-lab/')return 'decision_lab';
  if(/^\/categories\/[^/]+\/finder\/$/.test(p))return 'finder';
  if(/^\/categories\//.test(p))return 'category';
  if(/^\/compare\//.test(p)||p==='/compare/')return 'comparison';
  if(p==='/search/')return 'search';
  if(p==='/')return 'home';
  return 'other';
};
const categoryFromPath=()=>{
  const m=location.pathname.match(/^\/categories\/([^/]+)(?:\/finder)?\/$/);
  return m?m[1]:(document.body?.dataset?.productCategory||'');
};
const surface=node=>{
  if(!node||typeof node.closest!=='function')return pageType();
  if(node.closest('#mobileNav'))return 'mobile_navigation';
  if(node.closest('.site-header'))return 'header';
  if(node.closest('[data-v506-results-host]'))return 'decision_lab_results';
  if(node.closest('.product-hero'))return 'product_hero';
  if(node.closest('.product-card'))return 'product_card';
  if(node.closest('#apgAssistantPanel'))return 'scout';
  return pageType();
};
const compareCount=()=>{
  try{const v=JSON.parse(localStorage.getItem('apgCompare')||'[]');return Array.isArray(v)?Math.min(4,v.length):0}catch{return 0}
};
const valueProvided=(form,names)=>{
  try{const data=new FormData(form);return names.some(name=>String(data.get(name)||'').trim().length>0)}catch{return false}
};

let initialTracked=false;
function trackInitialContext(){
  if(initialTracked||window.__apgAnalyticsAllowed!==true)return;
  const p=location.pathname,common={device_bucket:deviceBucket(),page_type:pageType()};
  let sent=false;
  const productSlug=document.body?.dataset?.productSlug||'';
  if(productSlug&&/^\/products\//.test(p))sent=track('product_view',Object.assign({},common,{product_slug:productSlug,category:document.body?.dataset?.productCategory||''}))||sent;
  if(p==='/decision-lab/')sent=track('decision_lab_view',common)||sent;
  if(/^\/categories\/[^/]+\/finder\/$/.test(p))sent=track('finder_view',Object.assign({},common,{category:categoryFromPath()}))||sent;
  if(/^\/compare\//.test(p)||p==='/compare/')sent=track('comparison_view',Object.assign({},common,{selection_count:compareCount()}))||sent;
  if(sent)initialTracked=true;
}

window.addEventListener('apg-analytics-consent-granted',trackInitialContext);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',trackInitialContext,{once:true});else queueMicrotask(trackInitialContext);

window.addEventListener('submit',event=>{
  const form=event.target instanceof HTMLFormElement?event.target:null;
  if(!form)return;
  if(form.matches('[data-search-shell]')){
    const input=form.querySelector('[data-site-search]');
    if(input&&String(input.value||'').trim())track('site_search',{surface:surface(form),page_type:pageType(),device_bucket:deviceBucket(),input_state:'provided'});
    return;
  }
  if(location.pathname==='/decision-lab/'&&form.matches('form.decision-form[data-busy-form]')){
    if(valueProvided(form,['q','category','budget','brand']))track('decision_lab_submitted',{surface:'decision_lab',page_type:'decision_lab',device_bucket:deviceBucket(),input_state:'provided'});
    return;
  }
  if(/^\/categories\/[^/]+\/finder\/$/.test(location.pathname)){
    track('finder_submitted',{surface:'finder',page_type:'finder',category:categoryFromPath(),device_bucket:deviceBucket()});
  }
},true);

window.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;
  if(!target)return;

  // Amazon/affiliate clicks are already measured by the governed affiliate listener.
  if(target.closest('a[data-affiliate-link]'))return;

  const compare=target.closest('[data-compare-product],[data-v506-compare]');
  if(compare){
    const slug=compare.dataset.compareProduct||compare.dataset.v506Compare||'';
    const wasSelected=compare.getAttribute('aria-pressed')==='true';
    const before=compareCount();
    if(!wasSelected&&before===0)track('comparison_started',{surface:surface(compare),product_slug:slug,category:document.body?.dataset?.productCategory||categoryFromPath(),selection_count:1,device_bucket:deviceBucket()});
    track(wasSelected?'comparison_product_removed':'comparison_product_added',{surface:surface(compare),product_slug:slug,category:document.body?.dataset?.productCategory||categoryFromPath(),selection_count:wasSelected?Math.max(0,before-1):Math.min(4,before+1),device_bucket:deviceBucket()});
    return;
  }

  const save=target.closest('[data-save-product],[data-v506-save]');
  if(save){
    const slug=save.dataset.saveProduct||save.dataset.v506Save||'';
    const wasSaved=save.getAttribute('aria-pressed')==='true';
    track(wasSaved?'product_unsaved':'product_saved',{surface:surface(save),product_slug:slug,category:document.body?.dataset?.productCategory||categoryFromPath(),device_bucket:deviceBucket()});
    return;
  }

  const compareOpen=target.closest('[data-compare-link]');
  if(compareOpen){
    track('comparison_opened',{surface:surface(compareOpen),selection_count:compareCount(),device_bucket:deviceBucket()});
    return;
  }

  const suggestion=target.closest('[data-search-suggestions] a');
  if(suggestion){
    track('site_search_suggestion',{surface:surface(suggestion),page_type:pageType(),device_bucket:deviceBucket()});
  }
},true);
})();
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=3600');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':analyticsClientJs);
}

function inject(html){
  const source=String(html||'');
  if(source.includes('data-apg-analytics-funnel="v79.0"')||source.includes(ASSET_PATH))return source;
  if(!source.includes('</head>'))return source;
  return source.replace('</head>',`<meta name="apg-analytics-funnel" content="v${ANALYTICS_FUNNEL_VERSION}"><script data-apg-analytics-consent-guard="v${ANALYTICS_FUNNEL_VERSION}">${consentGuardJs}</script><script src="${ASSET_PATH}?v=${ANALYTICS_FUNNEL_VERSION}" defer data-apg-analytics-funnel="v${ANALYTICS_FUNNEL_VERSION}"></script></head>`);
}

function transform(html,pathOrUrl){
  const base=downstream.transform?downstream.transform(String(html||''),pathOrUrl):String(html||'');
  return inject(base);
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===ASSET_PATH)return sendAsset(req,res);

  res.setHeader('X-APG-Analytics-Funnel','v'+ANALYTICS_FUNNEL_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=inject(original);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  ANALYTICS_FUNNEL_VERSION,
  ANALYTICS_FUNNEL_ASSET_PATH:ASSET_PATH,
  analyticsClientJs,
  consentGuardJs,
  injectAnalyticsFunnel:inject,
  transform
});
module.exports=handler;
