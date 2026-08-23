'use strict';

// APG Premium Search Experience v76.
// Presentation-only refinement for every existing APG global search surface.
// Search v52 remains authoritative for query handling, ranking, JSON transport,
// history, autocomplete behaviour and analytics. This layer only changes CSS.
const downstream=require('./mobile-header-wordmark-v75');

const PREMIUM_SEARCH_VERSION='76.0';
const CSS_PATH='/assets/premium-search-v76.css';

const css=`
/* Australian Product Guide Premium Search Experience v76 */
:root{
  --apg-search-blue:#2563EB;
  --apg-search-blue-dark:#1D4ED8;
  --apg-search-navy:#0F172A;
  --apg-search-text:#334155;
  --apg-search-muted:#64748B;
  --apg-search-line:#CBD5E1;
  --apg-search-line-soft:#E2E8F0;
  --apg-search-soft:#F8FAFC;
  --apg-search-focus:rgba(37,99,235,.16);
  --apg-search-shadow:0 12px 30px rgba(15,23,42,.08),0 2px 8px rgba(15,23,42,.04);
  --apg-search-shadow-focus:0 0 0 4px var(--apg-search-focus),0 18px 42px rgba(15,23,42,.12);
}

/* One integrated control: outer shell owns the surface; input no longer draws a second box. */
body .global-search{
  box-sizing:border-box!important;
  position:relative!important;
  display:flex!important;
  align-items:center!important;
  gap:6px!important;
  min-width:0!important;
  padding:5px!important;
  border:1px solid var(--apg-search-line)!important;
  border-radius:16px!important;
  background:#fff!important;
  box-shadow:var(--apg-search-shadow)!important;
  transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease!important;
}
body .global-search:focus-within{
  border-color:var(--apg-search-blue)!important;
  box-shadow:var(--apg-search-shadow-focus)!important;
}
body .global-search>svg{
  width:21px!important;
  height:21px!important;
  margin:0 3px 0 10px!important;
  flex:0 0 21px!important;
  color:var(--apg-search-muted)!important;
  stroke:currentColor!important;
  transition:color .18s ease!important;
}
body .global-search:focus-within>svg{color:var(--apg-search-blue)!important}
body .global-search>input[type="search"],
body .global-search>input[data-site-search],
body .global-search>input[name="q"]{
  box-sizing:border-box!important;
  width:100%!important;
  min-width:0!important;
  min-height:48px!important;
  margin:0!important;
  padding:0 8px!important;
  border:0!important;
  border-radius:0!important;
  outline:0!important;
  background:transparent!important;
  box-shadow:none!important;
  color:var(--apg-search-navy)!important;
  font:inherit!important;
  font-size:16px!important;
  font-weight:620!important;
  letter-spacing:-.012em!important;
  appearance:none!important;
  -webkit-appearance:none!important;
}
body .global-search>input[type="search"]:focus,
body .global-search>input[data-site-search]:focus,
body .global-search>input[name="q"]:focus{
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
}
body .global-search>input::placeholder{
  color:#718096!important;
  opacity:1!important;
  font-weight:560!important;
}
body .global-search>button[type="submit"]{
  box-sizing:border-box!important;
  min-width:98px!important;
  min-height:48px!important;
  margin:0!important;
  padding:0 19px!important;
  flex:0 0 auto!important;
  border:1px solid var(--apg-search-blue)!important;
  border-radius:11px!important;
  background:var(--apg-search-blue)!important;
  color:#fff!important;
  box-shadow:inset 0 1px rgba(255,255,255,.16),0 5px 14px rgba(37,99,235,.18)!important;
  font-size:14px!important;
  font-weight:820!important;
  letter-spacing:-.012em!important;
  line-height:1!important;
  cursor:pointer!important;
  transition:background .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease!important;
}
body .global-search>button[type="submit"]:hover{
  background:var(--apg-search-blue-dark)!important;
  border-color:var(--apg-search-blue-dark)!important;
  box-shadow:inset 0 1px rgba(255,255,255,.12),0 7px 18px rgba(37,99,235,.22)!important;
  transform:translateY(-1px)!important;
}
body .global-search>button[type="submit"]:active{transform:translateY(0)!important}
body .global-search>button[type="submit"]:focus-visible{
  outline:3px solid rgba(37,99,235,.28)!important;
  outline-offset:2px!important;
}
body .global-search>button[type="submit"]:disabled{
  opacity:.72!important;
  cursor:wait!important;
  transform:none!important;
}

/* Homepage: the hero search is the flagship search expression. */
body .apg-home-search-v9{
  min-height:64px!important;
  max-width:760px!important;
  padding:6px!important;
  border-radius:18px!important;
  box-shadow:0 16px 38px rgba(15,23,42,.10),0 3px 10px rgba(15,23,42,.04)!important;
}
body .apg-home-search-v9:focus-within{
  box-shadow:0 0 0 4px rgba(37,99,235,.14),0 20px 48px rgba(15,23,42,.13)!important;
}
body .apg-home-search-v9>svg{
  width:22px!important;
  height:22px!important;
  flex-basis:22px!important;
  margin-left:13px!important;
}
body .apg-home-search-v9>input[type="search"]{min-height:50px!important;padding-inline:9px!important}
body .apg-home-search-v9>button[type="submit"]{
  min-width:108px!important;
  min-height:50px!important;
  border-radius:12px!important;
  font-size:14.5px!important;
}

/* Desktop masthead: compact, crisp and clearly legible against APG navy. */
body .site-header .header-search .global-search{
  min-height:50px!important;
  padding:4px!important;
  border-color:#CBD5E1!important;
  border-radius:14px!important;
  box-shadow:0 8px 24px rgba(0,0,0,.17)!important;
}
body .site-header .header-search .global-search:focus-within{
  border-color:#60A5FA!important;
  box-shadow:0 0 0 4px rgba(37,99,235,.22),0 12px 30px rgba(0,0,0,.20)!important;
}
body .site-header .header-search .global-search>input[type="search"]{
  min-height:40px!important;
  font-size:14px!important;
  font-weight:590!important;
}
body .site-header .header-search .global-search>svg{
  width:19px!important;
  height:19px!important;
  flex-basis:19px!important;
  margin-left:9px!important;
}
body .site-header .header-search .global-search>button[type="submit"]{
  min-width:82px!important;
  min-height:40px!important;
  padding-inline:15px!important;
  border-radius:10px!important;
  font-size:13px!important;
  box-shadow:none!important;
}

/* Search-results hero retains the same component language without becoming oversized. */
body .search-hero .global-search{
  max-width:780px!important;
  min-height:60px!important;
  margin-top:22px!important;
}
body .search-hero .global-search>button[type="submit"]{min-height:48px!important}

/* Autocomplete / recent suggestion popover: calm decision-search panel. */
body .global-search .search-suggestions,
body .search-suggestions{
  box-sizing:border-box!important;
  overflow:hidden!important;
  margin-top:9px!important;
  padding:8px!important;
  border:1px solid var(--apg-search-line-soft)!important;
  border-radius:15px!important;
  background:#fff!important;
  box-shadow:0 20px 50px rgba(15,23,42,.16),0 5px 16px rgba(15,23,42,.06)!important;
  color:var(--apg-search-navy)!important;
  z-index:260!important;
}
body .search-suggestions[hidden]{display:none!important}
body .search-suggestions .suggest-item,
body .search-suggestions>a,
body .search-suggestions>button,
body .search-suggestions>[role="option"]{
  box-sizing:border-box!important;
  min-height:46px!important;
  padding:10px 12px!important;
  border:0!important;
  border-radius:10px!important;
  background:#fff!important;
  color:var(--apg-search-text)!important;
  box-shadow:none!important;
  text-decoration:none!important;
  transition:background .14s ease,color .14s ease!important;
}
body .search-suggestions .suggest-item:hover,
body .search-suggestions .suggest-item.active,
body .search-suggestions>a:hover,
body .search-suggestions>[role="option"]:hover{
  background:#EFF6FF!important;
  color:#1E40AF!important;
}
body .search-suggestions strong{color:var(--apg-search-navy)!important}
body .search-suggestions small{color:var(--apg-search-muted)!important}
body .search-submit-status{
  position:absolute!important;
  top:calc(100% + 8px)!important;
  left:3px!important;
  z-index:255!important;
  max-width:min(520px,calc(100vw - 32px))!important;
  padding:7px 10px!important;
  border-radius:9px!important;
  background:#fff!important;
  color:var(--apg-search-muted)!important;
  box-shadow:0 8px 22px rgba(15,23,42,.10)!important;
  font-size:12px!important;
  font-weight:650!important;
}
body .search-submit-status:empty{display:none!important}
body .search-submit-status.is-error{color:#B42318!important}

/* Mobile menu: more usable input width and less button dominance. */
@media(max-width:920px){
  body .apg-mobile-v8 .apg-mobile-search{
    min-height:58px!important;
    margin:0 0 8px!important;
    padding:5px!important;
    border-radius:16px!important;
    background:#fff!important;
    box-shadow:0 10px 26px rgba(15,23,42,.08)!important;
  }
  body .apg-mobile-v8 .apg-mobile-search>input[type="search"]{
    min-height:46px!important;
    padding-inline:6px!important;
    font-size:16px!important;
  }
  body .apg-mobile-v8 .apg-mobile-search>svg{
    width:20px!important;
    height:20px!important;
    flex-basis:20px!important;
    margin-left:8px!important;
    margin-right:1px!important;
  }
  body .apg-mobile-v8 .apg-mobile-search>button[type="submit"]{
    min-width:96px!important;
    min-height:46px!important;
    padding-inline:15px!important;
    border-radius:11px!important;
    font-size:13.5px!important;
  }
}

@media(max-width:560px){
  body .apg-home-search-v9{
    min-height:60px!important;
    padding:5px!important;
    border-radius:16px!important;
    box-shadow:0 12px 30px rgba(15,23,42,.09)!important;
  }
  body .apg-home-search-v9>svg{
    width:20px!important;
    height:20px!important;
    flex-basis:20px!important;
    margin-left:8px!important;
    margin-right:0!important;
  }
  body .apg-home-search-v9>input[type="search"]{
    min-height:46px!important;
    padding-inline:5px!important;
    font-size:16px!important;
  }
  body .apg-home-search-v9>button[type="submit"]{
    min-width:96px!important;
    min-height:46px!important;
    padding-inline:14px!important;
    border-radius:11px!important;
    font-size:13.5px!important;
  }
  body .search-suggestions{border-radius:13px!important;padding:6px!important}
}

@media(max-width:370px){
  body .apg-home-search-v9>button[type="submit"],
  body .apg-mobile-v8 .apg-mobile-search>button[type="submit"]{
    min-width:86px!important;
    padding-inline:11px!important;
    font-size:13px!important;
  }
  body .apg-home-search-v9>input[type="search"],
  body .apg-mobile-v8 .apg-mobile-search>input[type="search"]{padding-inline:3px!important}
}

@media(prefers-reduced-motion:reduce){
  body .global-search,
  body .global-search>svg,
  body .global-search>button[type="submit"],
  body .search-suggestions *{transition:none!important}
}
`;

function sendCss(res,req){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

function inject(html){
  let out=String(html||'');
  if(out.includes('name="apg-premium-search"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-premium-search" content="v${PREMIUM_SEARCH_VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${PREMIUM_SEARCH_VERSION}"></head>`
  );
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);

  res.setHeader('X-APG-Premium-Search','v'+PREMIUM_SEARCH_VERSION);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=inject(original);
      if(next!==original){
        body=wasBuffer?Buffer.from(next,'utf8'):next;
        try{res.removeHeader('Content-Length')}catch{}
      }
    }
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{PREMIUM_SEARCH_VERSION,CSS_PATH,css,inject});
module.exports=handler;
