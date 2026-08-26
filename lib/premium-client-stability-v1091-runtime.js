'use strict';

// APG Premium Client Stability v109.1
// Fail-closed compatibility guard for the v107 progressive-enhancement client.
// Premium v107 owns the idempotent Scout ARIA implementation directly. This layer
// verifies that safe client, serves the effective premium assets and provides a narrow
// HTML backstop so Scout remains present across complete and chunked SSR responses.
const premiumExperience=require('./premium-experience-v107-runtime');

const VERSION='109.1';
const SCOUT_GLOBAL_SURFACE_VERSION='111.0';
const SCOUT_GLOBAL_CSS_PATH='/assets/scout-global-surface-v111.css';
const SCOUT_GLOBAL_JS_PATH='/assets/scout-global-surface-v111.js';
const UNSAFE="function syncScoutAria(){const launcher=qs('#apgAssistantLauncher'),panel=qs('#apgAssistantPanel');if(!launcher||!panel)return;panel.setAttribute('aria-hidden',String(panel.hidden));launcher.setAttribute('aria-expanded',String(!panel.hidden))}";
const SAFE="function setAria(el,name,value){const next=String(value);if(el.getAttribute(name)!==next)el.setAttribute(name,next)}";

const clientJs=premiumExperience.clientJs;
if(typeof clientJs!=='string'||!clientJs.includes(SAFE)){
  throw new Error('premium client stability v109.1 could not verify idempotent v107 Scout ARIA writes');
}
if(clientJs.includes(UNSAFE)){
  throw new Error('premium client stability v109.1 detected the superseded non-idempotent Scout ARIA sync');
}
if(!clientJs.includes("attributeFilter:['hidden']")||/attributeFilter:\[[^\]]*aria-expanded/.test(clientJs)){
  throw new Error('premium client stability v109.1 detected a self-observing Scout ARIA mutation path');
}

// v110 fallback rules are retained inside the existing premium asset for compatibility.
// v111 additionally ships a dedicated, cache-distinct stylesheet injected LAST in <head>.
// The stronger ID-based rules deliberately do not depend on route/body feature attributes,
// so a valid Scout shell cannot be visually suppressed just because a page family differs.
const scoutGlobalSurfaceCss=String.raw`
/* APG Scout Global Surface v110.0 compatibility fallback. */
body[data-apg-premium-v107="true"] .apg-assistant-launcher{
  left:auto!important;
  right:max(20px,env(safe-area-inset-right))!important;
  display:flex!important;
}
body[data-apg-premium-v107="true"] .apg-assistant-panel{
  left:auto!important;
  right:max(20px,env(safe-area-inset-right))!important;
}
@media(max-width:760px){
  body[data-apg-premium-v107="true"] .apg-assistant-launcher{
    left:auto!important;
    right:max(var(--apg-premium-gutter),env(safe-area-inset-right))!important;
    display:flex!important;
  }
  body[data-apg-premium-v107="true"] .apg-assistant-panel{
    inset:0!important;
    width:100vw!important;
    height:100dvh!important;
    max-width:none!important;
    max-height:none!important;
  }
}
@media(max-width:380px){
  body[data-apg-premium-v107="true"] .apg-assistant-launcher{
    left:auto!important;
    right:max(var(--apg-premium-gutter),env(safe-area-inset-right))!important;
  }
}

/* APG Scout Global Surface v111.0 — visible and clickable on every document route. */
html body:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
  position:fixed!important;
  left:auto!important;
  right:max(20px,env(safe-area-inset-right))!important;
  bottom:max(20px,env(safe-area-inset-bottom))!important;
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
  z-index:980!important;
}
html body #apgAssistantPanel.apg-assistant-panel{
  position:fixed!important;
  left:auto!important;
  right:max(20px,env(safe-area-inset-right))!important;
  z-index:1050!important;
}
html body #apgAssistantPanel.apg-assistant-panel:not([hidden]){
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
}
html body #apgAssistantPanel.apg-assistant-panel[hidden]{display:none!important}
html body.apg-compare-tray-active:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
  bottom:calc(92px + env(safe-area-inset-bottom))!important;
}
@media(max-width:760px){
  html body:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
    left:auto!important;
    right:max(18px,env(safe-area-inset-right))!important;
    bottom:max(14px,env(safe-area-inset-bottom))!important;
    display:flex!important;
    visibility:visible!important;
    opacity:1!important;
    pointer-events:auto!important;
  }
  html body.apg-compare-tray-active:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
    bottom:calc(88px + env(safe-area-inset-bottom))!important;
  }
  html body #apgAssistantPanel.apg-assistant-panel:not([hidden]){
    inset:0!important;
    width:100vw!important;
    height:100dvh!important;
    max-width:none!important;
    max-height:none!important;
  }
}
@media(max-width:380px){
  html body:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
    right:max(16px,env(safe-area-inset-right))!important;
  }
}
`;
const effectiveCss=`${premiumExperience.css}\n${scoutGlobalSurfaceCss}`;

// A one-way presentation integrity guard. It does not create Scout, route requests or
// touch decision state. It only repairs impossible closed-panel states after page restore.
const scoutGlobalSurfaceJs=String.raw`;(()=>{
'use strict';
const VERSION='111.0';
function reconcile(){
  const launcher=document.getElementById('apgAssistantLauncher');
  const panel=document.getElementById('apgAssistantPanel');
  if(!launcher||!panel)return;
  document.body.dataset.apgScoutGlobalSurface='v'+VERSION;
  if(panel.hidden){
    document.body.classList.remove('scout-v5-open');
    launcher.hidden=false;
    launcher.removeAttribute('hidden');
    if(launcher.getAttribute('aria-expanded')!=='false')launcher.setAttribute('aria-expanded','false');
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reconcile,{once:true});else reconcile();
window.addEventListener('pageshow',reconcile);
setTimeout(reconcile,250);
})();`;

function htmlResponse(req,res){
  const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
  return req.method!=='HEAD'&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html');
}
function chunkText(chunk,args=[]){
  if(Buffer.isBuffer(chunk))return chunk.toString(typeof args[0]==='string'?args[0]:'utf8');
  return typeof chunk==='string'?chunk:'';
}
function markGlobalSurface(res){
  res.setHeader('X-APG-Premium-Experience','v'+premiumExperience.VERSION);
  res.setHeader('X-APG-Premium-Client-Stability','v'+VERSION);
  res.setHeader('X-APG-Scout-Global-Surface','v'+SCOUT_GLOBAL_SURFACE_VERSION);
}
function injectGlobalSurface(html){
  let out=premiumExperience.inject(html);
  if(!out)return out;
  if(!out.includes(SCOUT_GLOBAL_CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${SCOUT_GLOBAL_CSS_PATH}?v=${SCOUT_GLOBAL_SURFACE_VERSION}"></head>`);
  if(!out.includes(SCOUT_GLOBAL_JS_PATH))out=out.replace('</body>',`<script src="${SCOUT_GLOBAL_JS_PATH}?v=${SCOUT_GLOBAL_SURFACE_VERSION}" defer></script></body>`);
  if(!/data-apg-scout-global-surface=/.test(out))out=out.replace(/<body\b([^>]*)>/i,`<body data-apg-scout-global-surface="v${SCOUT_GLOBAL_SURFACE_VERSION}"$1>`);
  return out;
}
function installHtmlBackstop(req,res){
  const originalEnd=res.end.bind(res);
  const originalWrite=typeof res.write==='function'?res.write.bind(res):null;
  const buffered=[];
  let buffering=false;

  if(originalWrite){
    res.write=(chunk,...args)=>{
      if(htmlResponse(req,res)&&(typeof chunk==='string'||Buffer.isBuffer(chunk))){
        buffering=true;
        buffered.push(chunkText(chunk,args));
        const callback=args.find(value=>typeof value==='function');
        if(callback)queueMicrotask(callback);
        return true;
      }
      return originalWrite(chunk,...args);
    };
  }

  res.end=(body,...args)=>{
    const textual=typeof body==='string'||Buffer.isBuffer(body);
    if(htmlResponse(req,res)&&(buffering||textual)){
      if(textual)buffered.push(chunkText(body,args));
      const source=buffered.join('');
      const next=injectGlobalSurface(source);
      try{res.removeHeader('Content-Length')}catch{}
      markGlobalSurface(res);
      return originalEnd(next,...args);
    }
    return originalEnd(body,...args);
  };
}

function sendAsset(req,res,type,body){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  markGlobalSurface(res);
  return res.end(req.method==='HEAD'?'':body);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('premium client stability requires downstream handler');
  function handler(req,res){
    let pathname='/';
    try{pathname=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(pathname===premiumExperience.JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
    if(pathname===premiumExperience.CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',effectiveCss);
    if(pathname===SCOUT_GLOBAL_CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',scoutGlobalSurfaceCss);
    if(pathname===SCOUT_GLOBAL_JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',scoutGlobalSurfaceJs);
    installHtmlBackstop(req,res);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    PREMIUM_CLIENT_STABILITY_VERSION:VERSION,
    PREMIUM_CLIENT_STABILITY_PATH:premiumExperience.JS_PATH,
    SCOUT_GLOBAL_SURFACE_VERSION,
    SCOUT_GLOBAL_CSS_PATH,
    SCOUT_GLOBAL_JS_PATH,
    premiumClientStabilityJs:clientJs,
    premiumClientStabilityCss:effectiveCss,
    scoutGlobalSurfaceCss,
    scoutGlobalSurfaceJs
  });
  return handler;
}

module.exports={VERSION,SCOUT_GLOBAL_SURFACE_VERSION,SCOUT_GLOBAL_CSS_PATH,SCOUT_GLOBAL_JS_PATH,UNSAFE,SAFE,clientJs,effectiveCss,scoutGlobalSurfaceCss,scoutGlobalSurfaceJs,injectGlobalSurface,installHtmlBackstop,wrap};