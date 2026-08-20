'use strict';

// APG Interaction Runtime v55
//
// Current reliability contract:
// - Search, Decision Lab, product/result navigation and Compare destinations are
//   server-rendered and use native browser GET/link navigation.
// - JavaScript is reserved for genuine in-page state/interactions (compare/save,
//   search suggestions, menus, account/privacy controls and Scout conversation).
// - Historical client-side navigation/recovery layers remain in Git history and
//   on the server side where required for compatibility, but are not executed in
//   the consumer browser.
const downstream=require('./p0-interaction-runtime-v53');

const INTERACTION_VERSION='55.0';
const INTERACTION_MODE='ssr-native-v55';
const INTERACTION_PATCH='interaction-runtime-2026-08-21-ssr-native-r1';

// These layers are superseded in the browser by SSR + native navigation. Two
// older presentation helpers are also retired: consumer-v13 targets the former
// Search card DOM, while semantic-v13 installs a whole-body MutationObserver even
// though current SSR already emits category-correct visuals.
const RETIRED_BROWSER_ASSETS=[
  '/assets/navigation-isolation-v541.js',
  '/assets/search-reliability-v52.js',
  '/assets/decision-lab-resilience-v50.js',
  '/assets/decision-lab-resilience-v506.js',
  '/assets/interaction-reliability-v37.js',
  '/assets/consumer-v13.js',
  '/assets/semantic-v13.js'
];

function escapeRegex(value){return String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function stripScriptAsset(html,path){
  const escaped=escapeRegex(path);
  const pattern=new RegExp(`<script\\b[^>]*\\bsrc=["']${escaped}(?:\\?[^"']*)?["'][^>]*>\\s*<\\/script>`,'gi');
  return String(html||'').replace(pattern,'');
}
function addDiagnostics(html){
  let out=String(html||'');
  if(!out.includes('name="apg-interaction-mode"')){
    const meta=`<meta name="apg-interaction-mode" content="${INTERACTION_MODE}">`;
    out=out.includes('</head>')?out.replace('</head>',meta+'</head>'):meta+out;
  }
  if(/<body\b/i.test(out)&&!out.includes('data-apg-interaction-runtime=')){
    out=out.replace(/<body\b/i,`<body data-apg-interaction-runtime="${INTERACTION_MODE}"`);
  }
  return out;
}
function reconcileHtml(html){
  let out=String(html||'');
  for(const path of RETIRED_BROWSER_ASSETS)out=stripScriptAsset(out,path);
  return addDiagnostics(out);
}

function handler(req,res){
  res.setHeader('X-APG-Interaction-Runtime',INTERACTION_MODE);
  res.setHeader('X-APG-Interaction-Patch',INTERACTION_PATCH);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
      const next=reconcileHtml(body);
      if(next!==body){body=next;res.removeHeader('Content-Length');}
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  INTERACTION_VERSION,
  INTERACTION_MODE,
  INTERACTION_PATCH,
  RETIRED_BROWSER_ASSETS,
  escapeRegex,
  stripScriptAsset,
  reconcileHtml,
  addDiagnostics
});

module.exports=handler;
