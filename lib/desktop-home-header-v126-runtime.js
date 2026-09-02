'use strict';

// APG Desktop Home + Header Repair v126.2.
// Presentation/runtime integration only: removes the duplicate homepage hero search on desktop,
// repairs About & trust desktop interaction/clipping, and connects the desktop header
// typeahead to APG's existing shared /api/search-suggest service. Recommendation logic,
// evidence, retailer weighting and product eligibility are unchanged.
const VERSION='126.2';
const CSS_PATH='/assets/desktop-home-header-v126.css';
const JS_PATH='/assets/desktop-home-header-v126.js';

function injectAssets(html){
  let out=String(html||'');
  if(!out)return out;
  if(!out.includes('name="apg-desktop-home-header"')){
    out=out.replace('</head>',`<meta name="apg-desktop-home-header" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}

function transformHtml(html){
  let out=String(html||'');
  if(!out)return out;
  return injectAssets(out);
}

const css=String.raw`
/* APG Desktop Home + Header Repair v126.2 */
@media(min-width:981px){
  .apg-home-hero-copy-v9>.apg-home-search-v9{display:none!important}

  /* Header Navigation v118 sets overflow-x:auto later in the cascade. That clips the
     absolutely positioned About & trust popover. Desktop has enough room, so restore
     visible overflow only at the wide breakpoint where this menu is shown. */
  .site-header .primary-nav,
  .site-header .primary-nav .nav-inner{
    overflow:visible!important;
    overflow-x:visible!important;
    overflow-y:visible!important;
  }
  .site-header .primary-nav{position:relative!important;z-index:520!important}
  .site-header .primary-nav .nav-inner{position:relative!important;z-index:521!important}
  .site-header .apg-about-trust-menu{position:relative!important;z-index:540!important;overflow:visible!important}
  .site-header .apg-about-trust-popover{z-index:99999!important;visibility:visible;opacity:1;pointer-events:auto}
  .site-header .apg-about-trust-menu[open]>.apg-about-trust-popover{display:block!important}

  /* Desktop search needs to own a visible popover outside the rounded control. */
  .site-header .header-search{
    position:relative!important;
    z-index:610!important;
    overflow:visible!important;
  }
  .site-header .header-search .global-search{
    position:relative!important;
    z-index:611!important;
    overflow:visible!important;
  }
  /* The legacy local-index box remains in the DOM for older/mobile runtimes, but desktop
     v126 owns its own server-backed suggestion panel to prevent competing render/clear cycles. */
  .site-header .header-search [data-search-suggestions]{display:none!important}
  .site-header .header-search .apg-header-shared-suggestions-v126{
    box-sizing:border-box!important;
    position:absolute!important;
    top:calc(100% + 9px)!important;
    left:0!important;
    right:0!important;
    z-index:100000!important;
    display:block!important;
    max-height:min(430px,calc(100vh - 190px))!important;
    overflow:auto!important;
    margin:0!important;
    padding:7px!important;
    border:1px solid #dbe3ee!important;
    border-radius:13px!important;
    background:#fff!important;
    box-shadow:0 22px 54px rgba(15,23,42,.22),0 6px 18px rgba(15,23,42,.09)!important;
    color:#0f172a!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126[hidden]{display:none!important}
  .site-header .header-search .apg-header-shared-suggestions-v126>a{
    box-sizing:border-box!important;
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:18px!important;
    min-height:52px!important;
    padding:9px 12px!important;
    border:0!important;
    border-radius:9px!important;
    background:#fff!important;
    color:#334155!important;
    text-decoration:none!important;
    cursor:pointer!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126>a+a{margin-top:2px!important}
  .site-header .header-search .apg-header-shared-suggestions-v126>a:hover,
  .site-header .header-search .apg-header-shared-suggestions-v126>a.is-active{
    background:#eff6ff!important;
    color:#1d4ed8!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126 .apg-header-suggestion-copy-v126{
    display:flex!important;
    min-width:0!important;
    flex-direction:column!important;
    gap:3px!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126 strong{
    overflow:hidden!important;
    color:#0f172a!important;
    font-size:14px!important;
    font-weight:760!important;
    line-height:1.25!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126 small{
    color:#64748b!important;
    font-size:11.5px!important;
    font-weight:650!important;
    line-height:1.25!important;
    text-transform:capitalize!important;
  }
  .site-header .header-search .apg-header-shared-suggestions-v126 .apg-header-suggestion-arrow-v126{
    flex:0 0 auto!important;
    color:#2563eb!important;
    font-size:17px!important;
    font-weight:800!important;
  }

  /* Let the yellow submit control occupy the full visual height of the Amazon-style search
     field. Explicit colour ownership keeps the magnifier black at rest and white on hover. */
  .site-header .header-search .global-search>button[type="submit"]{
    position:relative!important;
    align-self:stretch!important;
    min-width:58px!important;
    min-height:48px!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    border-radius:0 9px 9px 0!important;
    color:#0f172a!important;
  }
  .site-header .header-search .global-search>button[type="submit"]:hover,
  .site-header .header-search .global-search>button[type="submit"]:focus-visible{
    color:#fff!important;
  }
  .site-header .header-search .global-search>button[type="submit"]:before{
    content:""!important;
    display:block!important;
    position:absolute!important;
    left:50%!important;
    top:50%!important;
    width:15px!important;
    height:15px!important;
    border:2.5px solid currentColor!important;
    border-radius:50%!important;
    background:transparent!important;
    opacity:1!important;
    transform:translate(-62%,-62%)!important;
    box-sizing:border-box!important;
  }
  .site-header .header-search .global-search>button[type="submit"]:after{
    content:""!important;
    display:block!important;
    position:absolute!important;
    left:calc(50% + 4px)!important;
    top:calc(50% + 5px)!important;
    width:8px!important;
    height:2.5px!important;
    border:0!important;
    border-radius:2px!important;
    background:currentColor!important;
    opacity:1!important;
    transform:rotate(45deg)!important;
    transform-origin:center!important;
  }
}
`;

const clientJs=String.raw`(()=>{
'use strict';
if(window.__APG_DESKTOP_HOME_HEADER_V126__)return;
window.__APG_DESKTOP_HOME_HEADER_V126__='${VERSION}';

const desktop=window.matchMedia('(min-width:981px)');
const hoverDesktop=window.matchMedia('(min-width:981px) and (hover:hover) and (pointer:fine)');

/* About & trust: keep native details semantics, but make desktop click and hover explicit.
   A short leave delay bridges the small visual gap between the summary and popover. */
const trust=document.querySelector('[data-apg-about-trust]');
const trustSummary=trust?.querySelector(':scope>summary');
let trustCloseTimer=0;
const clearTrustTimer=()=>{if(trustCloseTimer){clearTimeout(trustCloseTimer);trustCloseTimer=0}};
const openTrust=()=>{if(!trust||!desktop.matches)return;clearTrustTimer();trust.open=true};
const closeTrust=(delay=0)=>{
  if(!trust)return;
  clearTrustTimer();
  if(delay){trustCloseTimer=setTimeout(()=>{trust.open=false;trustCloseTimer=0},delay);return;}
  trust.open=false;
};
if(trust&&trustSummary){
  trustSummary.setAttribute('aria-haspopup','menu');
  trustSummary.addEventListener('click',event=>{
    if(!desktop.matches)return;
    event.preventDefault();
    event.stopPropagation();
    trust.open?closeTrust():openTrust();
  });
  trust.addEventListener('mouseenter',()=>{if(hoverDesktop.matches)openTrust()});
  trust.addEventListener('mouseleave',()=>{if(hoverDesktop.matches)closeTrust(140)});
  trust.querySelector('.apg-about-trust-popover')?.addEventListener('mouseenter',clearTrustTimer);
  document.addEventListener('click',event=>{if(trust.open&&!trust.contains(event.target))closeTrust()});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&trust.open){event.preventDefault();closeTrust();trustSummary.focus();}
  });
}

/* Desktop header autocomplete consumes the maintained server-side search service used by APG's
   broader journey layer, but owns a dedicated visual panel so legacy local-index handlers cannot
   clear or restyle the live results. */
const headerInput=document.querySelector('.header-search [data-site-search]');
const headerShell=headerInput?.closest('[data-search-shell]');
const legacyBox=headerShell?.querySelector('[data-search-suggestions]');
let headerBox=null;
let searchTimer=0;
let searchRequest=null;
let searchSeq=0;
let activeIndex=-1;

function ensureSharedBox(){
  if(!headerInput||!headerShell)return null;
  if(headerBox&&headerBox.isConnected)return headerBox;
  legacyBox?.setAttribute('data-apg-legacy-header-suggestions','true');
  headerBox=headerShell.querySelector('[data-apg-header-shared-suggestions]');
  if(!headerBox){
    headerBox=document.createElement('div');
    headerBox.id='apgHeaderSharedSuggestionsV126';
    headerBox.className='apg-header-shared-suggestions-v126';
    headerBox.setAttribute('data-apg-header-shared-suggestions','true');
    headerBox.setAttribute('role','listbox');
    headerBox.setAttribute('aria-label','Search suggestions');
    headerBox.hidden=true;
    headerShell.appendChild(headerBox);
  }
  headerInput.setAttribute('aria-controls',headerBox.id);
  return headerBox;
}
function sharedLinks(){return headerBox?Array.from(headerBox.querySelectorAll('a[role="option"]')):[]}
function setActive(index){
  const links=sharedLinks();
  if(!links.length){activeIndex=-1;headerInput?.removeAttribute('aria-activedescendant');return;}
  activeIndex=((index%links.length)+links.length)%links.length;
  links.forEach((link,i)=>{
    const on=i===activeIndex;
    link.classList.toggle('is-active',on);
    link.setAttribute('aria-selected',on?'true':'false');
  });
  headerInput?.setAttribute('aria-activedescendant',links[activeIndex].id);
}
function closeSharedSuggestions(){
  if(!headerInput)return;
  const box=ensureSharedBox();
  if(!box)return;
  box.hidden=true;
  box.innerHTML='';
  activeIndex=-1;
  headerInput.setAttribute('aria-expanded','false');
  headerInput.removeAttribute('aria-activedescendant');
}
function renderSharedSuggestions(items){
  if(!headerInput)return;
  const box=ensureSharedBox();
  if(!box)return;
  box.innerHTML='';
  activeIndex=-1;
  const list=Array.isArray(items)?items.slice(0,8):[];
  if(!list.length){closeSharedSuggestions();return;}
  list.forEach((item,index)=>{
    const href=(typeof item?.href==='string'&&item.href)||(typeof item?.url==='string'&&item.url)||('/search/?q='+encodeURIComponent(headerInput.value||''));
    const link=document.createElement('a');
    link.id=box.id+'-item-'+index;
    link.href=href;
    link.setAttribute('role','option');
    link.setAttribute('aria-selected','false');
    const copy=document.createElement('span');
    copy.className='apg-header-suggestion-copy-v126';
    const strong=document.createElement('strong');
    strong.textContent=String(item?.label||item?.name||'Result');
    const small=document.createElement('small');
    const type=String(item?.type||'result').replace(/-/g,' ');
    const meta=String(item?.meta||item?.matchType||'').trim();
    small.textContent=meta?type+' · '+meta:type;
    copy.append(strong,small);
    const arrow=document.createElement('span');
    arrow.className='apg-header-suggestion-arrow-v126';
    arrow.setAttribute('aria-hidden','true');
    arrow.textContent='→';
    link.append(copy,arrow);
    link.addEventListener('pointermove',()=>setActive(index),{passive:true});
    box.appendChild(link);
  });
  box.hidden=false;
  headerInput.setAttribute('aria-expanded','true');
  headerInput.removeAttribute('aria-activedescendant');
}
async function loadSharedSuggestions(){
  if(!headerInput||!desktop.matches)return;
  const query=String(headerInput.value||'').trim();
  const seq=++searchSeq;
  if(query.length<2){searchRequest?.abort();closeSharedSuggestions();return;}
  searchRequest?.abort();
  searchRequest=new AbortController();
  try{
    const response=await fetch('/api/search-suggest?q='+encodeURIComponent(query),{
      headers:{Accept:'application/json'},
      signal:searchRequest.signal,
      cache:'no-store'
    });
    if(!response.ok)throw new Error('search suggestion request failed');
    const payload=await response.json();
    if(seq!==searchSeq||String(headerInput.value||'').trim()!==query)return;
    renderSharedSuggestions(payload?.items||payload?.suggestions||[]);
  }catch(error){
    if(error?.name!=='AbortError'&&seq===searchSeq)closeSharedSuggestions();
  }
}
if(headerInput&&headerShell){
  ensureSharedBox();
  headerInput.dataset.apgSharedSearch='v${VERSION}';
  /* Capture at document level so older target-level local-index handlers do not compete with
     this desktop implementation. Our dedicated panel is rendered from the shared API only. */
  document.addEventListener('input',event=>{
    if(event.target!==headerInput||!desktop.matches)return;
    event.stopPropagation();
    clearTimeout(searchTimer);
    searchTimer=setTimeout(loadSharedSuggestions,100);
  },true);
  headerInput.addEventListener('keydown',event=>{
    if(!desktop.matches||!headerBox||headerBox.hidden)return;
    const links=sharedLinks();
    if(!links.length)return;
    if(event.key==='ArrowDown'){event.preventDefault();setActive(activeIndex+1);return;}
    if(event.key==='ArrowUp'){event.preventDefault();setActive(activeIndex<0?links.length-1:activeIndex-1);return;}
    if(event.key==='Enter'&&activeIndex>=0){
      event.preventDefault();
      const chosen=links[activeIndex];
      if(chosen)window.location.assign(chosen.href);
      return;
    }
    if(event.key==='Escape'){event.preventDefault();closeSharedSuggestions();}
  });
  headerInput.addEventListener('focus',()=>{
    if(desktop.matches&&String(headerInput.value||'').trim().length>=2)loadSharedSuggestions();
  });
  document.addEventListener('pointerdown',event=>{
    if(headerBox&&!headerBox.hidden&&!headerShell.contains(event.target))closeSharedSuggestions();
  },true);
  headerShell.addEventListener('submit',closeSharedSuggestions);
  desktop.addEventListener?.('change',()=>{if(!desktop.matches)closeSharedSuggestions()});
}
})();`;

function sendAsset(req,res,type,body){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Desktop-Home-Header','v'+VERSION);
  return res.end(req.method==='HEAD'?'':body);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('desktop home/header repair requires downstream handler');
  function handler(req,res){
    let pathname='/';
    try{pathname=new URL(req&&req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(pathname===CSS_PATH)return sendAsset(req,res,'text/css; charset=utf-8',css);
    if(pathname===JS_PATH)return sendAsset(req,res,'application/javascript; charset=utf-8',clientJs);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body);
        const source=wasBuffer?body.toString('utf8'):body;
        const next=transformHtml(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Desktop-Home-Header','v'+VERSION);
      return end(body,...args);
    };
    return downstream(req,res);
  }
  Object.assign(handler,downstream,{
    DESKTOP_HOME_HEADER_VERSION:VERSION,
    DESKTOP_HOME_HEADER_CSS_PATH:CSS_PATH,
    DESKTOP_HOME_HEADER_JS_PATH:JS_PATH
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,JS_PATH,injectAssets,transformHtml,css,clientJs,wrap};
