'use strict';

// APG Premium Client Stability v109.1
// Fail-closed compatibility guard for the v107 progressive-enhancement client.
// Premium v107 now owns the idempotent Scout ARIA implementation directly. This layer
// verifies that the served client cannot reintroduce the former MutationObserver feedback
// loop, then serves that exact safe asset without rewriting product, decision or UI logic.
const premiumExperience=require('./premium-experience-v107-runtime');

const VERSION='109.1';
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
