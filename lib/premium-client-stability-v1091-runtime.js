'use strict';

// APG Premium Client Stability v109.1
// Fail-closed compatibility guard for the v107 progressive-enhancement client.
// Premium v107 owns the idempotent Scout ARIA implementation directly. This layer
// verifies that safe client, serves the effective premium assets and provides a narrow
// HTML backstop so Scout remains present across complete and chunked SSR responses.
const premiumExperience=require('./premium-experience-v107-runtime');

const VERSION='109.1';
const SCOUT_GLOBAL_SURFACE_VERSION='110.0';
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

// Owner-approved Scout placement correction. Keep the v107 mobile/full-screen interaction
// model, but make the launcher and desktop panel consistently right-aligned on every page.
// This is appended after v107 CSS so it deliberately supersedes the historical left rule.
const scoutGlobalSurfaceCss=String.raw`
/* APG Scout Global Surface v110.0 — right aligned, globally visible. */
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
`;
const effectiveCss=`${premiumExperience.css}\n${scoutGlobalSurfaceCss}`;

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
      const next=premiumExperience.inject(source);
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
    installHtmlBackstop(req,res);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    PREMIUM_CLIENT_STABILITY_VERSION:VERSION,
    PREMIUM_CLIENT_STABILITY_PATH:premiumExperience.JS_PATH,
    SCOUT_GLOBAL_SURFACE_VERSION,
    premiumClientStabilityJs:clientJs,
    premiumClientStabilityCss:effectiveCss,
    scoutGlobalSurfaceCss
  });
  return handler;
}

module.exports={VERSION,SCOUT_GLOBAL_SURFACE_VERSION,UNSAFE,SAFE,clientJs,effectiveCss,scoutGlobalSurfaceCss,installHtmlBackstop,wrap};
