'use strict';

// APG Audit Search + Mobile Search v119.
// Narrow customer-journey remediation for the 29–30 Aug 2026 live audit.
// Search v52 / Search Ranking v4 remain authoritative for ranking, JSON transport,
// relevance and history. This wrapper only protects canonical autocomplete navigation
// from legacy click handlers and restores an immediately visible SSR mobile search form.
const VERSION='119.0';
const JS_PATH='/assets/audit-search-mobile-v119.js';
const CSS_PATH='/assets/audit-search-mobile-v119.css';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const MOBILE_FORM=`<form class="apg-audit-mobile-search-v119 global-search" action="/search/" method="get" role="search" data-search-shell data-apg-mobile-search-v119><label class="sr-only" for="apgAuditMobileSearchV119">Search Australian Product Guide</label><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg><input id="apgAuditMobileSearchV119" data-site-search name="q" type="search" placeholder="Search products, brands or needs" autocomplete="off" role="combobox" aria-haspopup="listbox" aria-autocomplete="list" aria-expanded="false"><button type="submit">Search</button></form>`;

const CSS=String.raw`
/* APG Audit Search + Mobile Search v119 */
.apg-audit-mobile-search-v119{display:none!important}
@media(max-width:920px){
  .site-header .apg-audit-mobile-search-v119{
    display:flex!important;
    width:calc(100% - 24px)!important;
    max-width:none!important;
    min-height:48px!important;
    margin:0 12px 10px!important;
    padding:4px!important;
    border:1px solid #CBD5E1!important;
    border-radius:13px!important;
    background:#fff!important;
    box-shadow:0 5px 16px rgba(15,23,42,.12)!important;
    position:relative!important;
    z-index:240!important;
  }
  .site-header .apg-audit-mobile-search-v119>svg{
    width:19px!important;height:19px!important;flex:0 0 19px!important;
    margin:0 4px 0 9px!important;color:#64748B!important
  }
  .site-header .apg-audit-mobile-search-v119>input[type="search"]{
    min-height:40px!important;min-width:0!important;width:100%!important;
    margin:0!important;padding:0 6px!important;border:0!important;outline:0!important;
    background:transparent!important;box-shadow:none!important;color:#0F172A!important;
    font:inherit!important;font-size:16px!important;font-weight:590!important
  }
  .site-header .apg-audit-mobile-search-v119>button[type="submit"]{
    min-width:72px!important;min-height:40px!important;margin:0!important;padding:0 12px!important;
    border:1px solid #2563EB!important;border-radius:9px!important;background:#2563EB!important;
    color:#fff!important;font:inherit!important;font-size:13px!important;font-weight:800!important
  }
  .site-header .apg-audit-mobile-search-v119:focus-within{
    border-color:#60A5FA!important;box-shadow:0 0 0 3px rgba(37,99,235,.18),0 7px 20px rgba(15,23,42,.14)!important
  }
}
@media(max-width:390px){
  .site-header .apg-audit-mobile-search-v119{width:calc(100% - 16px)!important;margin-left:8px!important;margin-right:8px!important}
  .site-header .apg-audit-mobile-search-v119>button[type="submit"]{min-width:64px!important;padding-inline:9px!important}
}
`;

const JS=String.raw`
;(()=>{
if(window.__APG_AUDIT_SEARCH_MOBILE_V119__)return;
window.__APG_AUDIT_SEARCH_MOBILE_V119__='${VERSION}';
const clean=v=>String(v??'').trim();
function productSuggestionAnchor(target){
  const el=target instanceof Element?target:null;
  const a=el?.closest('a[href]');
  if(!a||!a.closest('[data-search-suggestions],.search-suggestions,[role="listbox"]'))return null;
  let u;try{u=new URL(a.href,location.href)}catch{return null}
  if(u.origin!==location.origin||!/^\/products\/[^/]+\/$/.test(u.pathname))return null;
  return a;
}
function preserveNativeProductNavigation(event){
  const a=productSuggestionAnchor(event.target);if(!a)return;
  // Do not preventDefault: preserving the anchor default is the navigation mechanism.
  // Stop legacy autocomplete handlers from swallowing or rewriting the canonical product click.
  event.stopImmediatePropagation();
}
function activateProductFromKeyboard(event){
  if(event.isComposing||event.key!=='Enter')return;
  const input=event.target instanceof Element?event.target.closest('[data-site-search],input[name="q"]'):null;
  if(!input)return;
  const id=clean(input.getAttribute('aria-activedescendant')),a=id&&document.getElementById(id);
  if(!a||!productSuggestionAnchor(a))return;
  event.preventDefault();event.stopImmediatePropagation();a.click();
}
window.addEventListener('pointerdown',preserveNativeProductNavigation,true);
window.addEventListener('click',preserveNativeProductNavigation,true);
window.addEventListener('keydown',activateProductFromKeyboard,true);
})();
`;

function inject(html){
  let out=String(html||'');
  if(!out.includes('name="apg-audit-search-mobile"')){
    out=out.replace('</head>',`<meta name="apg-audit-search-mobile" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"><script src="${JS_PATH}?v=${VERSION}" defer></script></head>`);
  }
  if(!out.includes('data-apg-mobile-search-v119')){
    if(out.includes('</header>'))out=out.replace('</header>',`${MOBILE_FORM}</header>`);
    else out=out.replace('<main',`${MOBILE_FORM}<main`);
  }
  return out;
}
function sendAsset(req,res,path){
  const isJs=path===JS_PATH,body=isJs?JS:CSS;
  res.statusCode=200;
  res.setHeader('Content-Type',isJs?'application/javascript; charset=utf-8':'text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=31536000, immutable');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Audit-Search-Mobile','v'+VERSION);
  return res.end(req.method==='HEAD'?'':body);
}
function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Audit Search + Mobile v119 requires downstream handler');
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===JS_PATH||path===CSS_PATH)return sendAsset(req,res,path);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=inject(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Audit-Search-Mobile','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{AUDIT_SEARCH_MOBILE_VERSION:VERSION});
  return handler;
}

module.exports={VERSION,JS_PATH,CSS_PATH,JS,CSS,MOBILE_FORM,inject,wrap};
