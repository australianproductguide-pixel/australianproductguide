'use strict';

// APG Premium Client Stability v109.1
// Narrow compatibility layer for the v107 progressive-enhancement client. The v107
// MutationObserver watches aria-expanded; writing the same aria-expanded value from its
// own callback can retrigger the observer indefinitely. That can starve browser lifecycle
// and interaction work even though the SSR document is already usable. Keep the existing
// v107 presentation code and replace only that non-idempotent sync function.
const premiumExperience=require('./premium-experience-v107-runtime');

const VERSION='109.1';
const UNSAFE="function syncScoutAria(){const launcher=qs('#apgAssistantLauncher'),panel=qs('#apgAssistantPanel');if(!launcher||!panel)return;panel.setAttribute('aria-hidden',String(panel.hidden));launcher.setAttribute('aria-expanded',String(!panel.hidden))}";
const SAFE="function syncScoutAria(){const launcher=qs('#apgAssistantLauncher'),panel=qs('#apgAssistantPanel');if(!launcher||!panel)return;const hidden=String(panel.hidden),expanded=String(!panel.hidden);if(panel.getAttribute('aria-hidden')!==hidden)panel.setAttribute('aria-hidden',hidden);if(launcher.getAttribute('aria-expanded')!==expanded)launcher.setAttribute('aria-expanded',expanded)}";

if(typeof premiumExperience.clientJs!=='string'||!premiumExperience.clientJs.includes(UNSAFE)){
  throw new Error('premium client stability v109.1 could not verify the exact v107 Scout ARIA source');
}
const clientJs=premiumExperience.clientJs.replace(UNSAFE,SAFE);
if(clientJs===premiumExperience.clientJs||clientJs.includes(UNSAFE)){
  throw new Error('premium client stability v109.1 failed to apply the idempotent Scout ARIA patch');
}

function send(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','application/javascript; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Premium-Experience','v'+premiumExperience.VERSION);
  res.setHeader('X-APG-Premium-Client-Stability','v'+VERSION);
  return res.end(req.method==='HEAD'?'':clientJs);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('premium client stability requires downstream handler');
  function handler(req,res){
    let pathname='/';
    try{pathname=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(pathname===premiumExperience.JS_PATH)return send(req,res);
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    PREMIUM_CLIENT_STABILITY_VERSION:VERSION,
    PREMIUM_CLIENT_STABILITY_PATH:premiumExperience.JS_PATH,
    premiumClientStabilityJs:clientJs
  });
  return handler;
}

module.exports={VERSION,UNSAFE,SAFE,clientJs,wrap};
