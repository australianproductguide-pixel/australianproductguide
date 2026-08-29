'use strict';

// 29–30 Aug 2026 live-audit P1 presentation remediation.
// Coordinates APG fixed controls so Compare and Scout do not obscure shopper content,
// and repairs the All drawer's desktop geometry. Presentation only: no recommendation,
// evidence, retailer, affiliate, account or decision-state logic is changed.
const VERSION='121.0';
const CSS_PATH='/assets/audit-ui-safety-v121.css';
const JS_PATH='/assets/audit-ui-safety-v121.js';

const CSS=String.raw`
/* APG audit UI safety v121 */
:root{--apg-fixed-safe-bottom:0px;--apg-compare-safe-height:0px}
html body.apg-audit-compare-active{--apg-compare-safe-height:96px;--apg-fixed-safe-bottom:96px}
html body.apg-audit-compare-active:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
  bottom:calc(var(--apg-fixed-safe-bottom) + 18px + env(safe-area-inset-bottom))!important
}
html body.apg-audit-compare-active main#main{padding-bottom:calc(var(--apg-compare-safe-height) + 32px)!important}
html body.apg-audit-compare-page [data-apg-audit-compare-container]{display:none!important}
html body.apg-audit-account-active [data-apg-audit-compare-container]{display:none!important}
html body.apg-audit-account-active:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
  bottom:calc(18px + env(safe-area-inset-bottom))!important
}

/* Desktop All drawer: deliberately bounded instead of inheriting mobile/off-canvas width. */
@media(min-width:921px){
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"]{
    width:min(430px,calc(100vw - 48px))!important;
    max-width:430px!important;
    height:100dvh!important;
    max-height:100dvh!important;
    left:0!important;right:auto!important;top:0!important;bottom:0!important;
    border-radius:0!important;
    overflow:hidden!important;
    box-shadow:0 24px 64px rgba(15,23,42,.24)!important;
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-scroll{
    height:calc(100dvh - 88px)!important;max-height:calc(100dvh - 88px)!important;
    overflow-y:auto!important;overscroll-behavior:contain!important;padding-bottom:32px!important
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account{min-height:88px!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-section-v1225{padding-top:14px!important}
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-link-v1225{min-height:46px!important}
}

/* Comparison headings must wrap inside their own column instead of colliding. */
html body.apg-audit-compare-page main#main h1,
html body.apg-audit-compare-page main#main h2,
html body.apg-audit-compare-page main#main h3{
  overflow-wrap:anywhere;word-break:normal;hyphens:auto;min-width:0
}
html body.apg-audit-compare-page main#main :is(.compare-grid,.comparison-grid,[class*="compare-grid"],[class*="comparison-grid"])>*{min-width:0!important}

@media(max-width:920px){
  html body.apg-audit-compare-active{--apg-compare-safe-height:112px;--apg-fixed-safe-bottom:112px}
  html body.apg-audit-compare-active:not(.scout-v5-open) #apgAssistantLauncher.apg-assistant-launcher{
    bottom:calc(var(--apg-fixed-safe-bottom) + 12px + env(safe-area-inset-bottom))!important
  }
  html body.apg-audit-compare-active main#main{padding-bottom:calc(var(--apg-compare-safe-height) + 24px)!important}
}
@media(max-width:390px){html body.apg-audit-compare-active{--apg-compare-safe-height:124px;--apg-fixed-safe-bottom:124px}}
@media(prefers-reduced-motion:reduce){.apg-all-drawer,#apgAssistantLauncher{transition:none!important}}
`;

const JS=String.raw`
'use strict';(()=>{
 if(window.__APG_AUDIT_UI_SAFETY_V121__)return;window.__APG_AUDIT_UI_SAFETY_V121__='121.0';
 const body=document.body;if(!body)return;
 const path=location.pathname;
 const comparePage=path==='/compare/'||path==='/compare/custom/'||path.startsWith('/compare/');
 const accountActive=path==='/my-apg/'&&(new URLSearchParams(location.search).has('account')||!!document.querySelector('form[action*="account"],form[data-account-form],[data-apg-account-form]'));
 body.classList.toggle('apg-audit-compare-page',comparePage);
 body.classList.toggle('apg-audit-account-active',accountActive);
 function locateCompare(){
   const link=document.querySelector('a[data-compare-link]');
   if(!link){body.classList.remove('apg-audit-compare-active');return}
   let node=link;
   while(node&&node!==body){
     const style=getComputedStyle(node);
     if(style.position==='fixed'||style.position==='sticky')break;
     node=node.parentElement;
   }
   if(!node||node===body)node=link.closest('[data-compare-tray],.compare-tray,.comparison-tray,.compare-bar')||null;
   if(!node){body.classList.remove('apg-audit-compare-active');return}
   node.setAttribute('data-apg-audit-compare-container','v121');
   const visible=!node.hidden&&getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().height>0;
   body.classList.toggle('apg-audit-compare-active',visible&&!comparePage&&!accountActive);
 }
 locateCompare();
 new MutationObserver(locateCompare).observe(body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','style','href']});
 addEventListener('resize',locateCompare,{passive:true});
})();`;

function inject(html){
 let out=String(html||'');
 if(!out.includes('name="apg-audit-ui-safety"'))out=out.replace('</head>',`<meta name="apg-audit-ui-safety" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
 if(!out.includes(`src="${JS_PATH}`))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
 return out;
}
function sendAsset(req,res,path){
 const css=path===CSS_PATH;res.statusCode=200;res.setHeader('Content-Type',css?'text/css; charset=utf-8':'application/javascript; charset=utf-8');res.setHeader('Cache-Control','public, max-age=0, must-revalidate');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-APG-Audit-UI-Safety','v'+VERSION);return res.end(req.method==='HEAD'?'':css?CSS:JS);
}
function wrap(downstream){
 if(typeof downstream!=='function')throw new TypeError('Audit UI safety v121 requires downstream handler');
 function handler(req,res){
  let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH||path===JS_PATH)return sendAsset(req,res,path);
  const end=res.end.bind(res);res.end=(body,...args)=>{const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();const textual=typeof body==='string'||Buffer.isBuffer(body);if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=inject(source);if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}}res.setHeader('X-APG-Audit-UI-Safety','v'+VERSION);return end(body,...args)};
  return downstream(req,res);
 }
 Object.assign(handler,downstream,{VERSION,CSS_PATH,JS_PATH,CSS,JS,inject});return handler;
}
module.exports={VERSION,CSS_PATH,JS_PATH,CSS,JS,inject,wrap};