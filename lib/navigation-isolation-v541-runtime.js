'use strict';

// P0 native-navigation isolation v54.1.
// Search and the comparison tray must have exactly one navigation owner.
// Native anchors remain authoritative; this layer only blocks later legacy
// click handlers from scheduling a second navigation for the same click.
const downstream=require('./p0-interaction-runtime-v53');

const NAV_ASSET_PATH='/assets/navigation-isolation-v541.js';
const NAV_VERSION='54.1';
const NAV_PATCH='navigation-p0-2026-08-21-native-link-isolation-r1';

const navClientJs=String.raw`
;(()=>{
if(window.__APG_NAVIGATION_ISOLATION_V541__)return;
window.__APG_NAVIGATION_ISOLATION_V541__='${NAV_PATCH}';
function plainPrimary(event){return event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey}
function targetAnchor(event){return event.target instanceof Element?event.target.closest('a[href]'):null}
function sameOrigin(anchor){try{const u=new URL(anchor.href,location.href);return u.origin===location.origin?u:null}catch{return null}}
function isSearchProduct(anchor,url){return location.pathname==='/search/'&&!!anchor.closest('main#main')&&/^\/products\/[^/]+\/$/.test(url.pathname)}
function isReadyCompareTray(anchor,url){if(!anchor.matches('a[data-compare-link]')||url.pathname!=='/compare/custom/')return false;const products=(url.searchParams.get('products')||'').split(',').map(x=>x.trim()).filter(Boolean);return products.length>=2}
window.addEventListener('click',event=>{
 if(!plainPrimary(event))return;
 const anchor=targetAnchor(event);if(!anchor||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
 const url=sameOrigin(anchor);if(!url)return;
 let mode='';
 if(isSearchProduct(anchor,url))mode='search-product';
 else if(isReadyCompareTray(anchor,url))mode='compare-tray';
 if(!mode)return;
 // Deliberately do not preventDefault(): the browser performs one native anchor
 // navigation. stopImmediatePropagation prevents legacy fallbacks/mutators from
 // becoming a second navigation owner for the same consumer action.
 event.stopImmediatePropagation();
 if(document.body)document.body.dataset.apgNativeNavigation=mode;
},true);
})();
`;

function sendAsset(req,res){
 res.statusCode=200;
 res.setHeader('Content-Type','application/javascript; charset=utf-8');
 res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-APG-Navigation-Isolation',NAV_PATCH);
 return res.end(req.method==='HEAD'?'':navClientJs);
}
function injectNavigation(html){
 let out=String(html||'');if(out.includes(NAV_ASSET_PATH))return out;
 const tag=`<script src="${NAV_ASSET_PATH}?v=${NAV_VERSION}" defer></script>`;
 const searchMarker='<script src="/assets/search-reliability-v52.js';
 if(out.includes(searchMarker))return out.replace(searchMarker,tag+searchMarker);
 const appMarker='<script src="/assets/app.js';
 if(out.includes(appMarker))return out.replace(appMarker,tag+appMarker);
 if(out.includes('</head>'))return out.replace('</head>',tag+'</head>');
 return out;
}
function handler(req,res){
 let url;try{url=new URL(req.url,'https://australianproductguide.au')}catch{url=new URL('https://australianproductguide.au/')}
 if(url.pathname===NAV_ASSET_PATH)return sendAsset(req,res);
 const end=res.end.bind(res);
 res.end=(body,...args)=>{
  const type=String(res.getHeader('Content-Type')||'').toLowerCase();
  if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html')){
   const next=injectNavigation(body);if(next!==body){body=next;res.removeHeader('Content-Length')}
   res.setHeader('X-APG-Navigation-Isolation',NAV_PATCH);
  }
  return end(body,...args);
 };
 return downstream(req,res);
}

Object.assign(handler,downstream,{NAV_ASSET_PATH,NAV_VERSION,NAV_PATCH,navClientJs,injectNavigation});
module.exports=handler;
