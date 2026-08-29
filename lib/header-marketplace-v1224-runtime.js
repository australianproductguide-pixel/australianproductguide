'use strict';

// APG Header Marketplace Mobile Order v122.4
// Screenshot-led refinement on 29 Aug 2026. The mobile masthead now follows the familiar
// marketplace hierarchy requested by the owner: menu at far left, full APG identity next,
// and My APG account at far right. The masthead search remains removed on mobile and the
// existing quick navigation remains below. Desktop presentation, recommendation logic,
// evidence, retailer pathways and affiliate scoring are inherited unchanged from v122.3.
const previous=require('./header-marketplace-v1223-runtime');

const VERSION='122.4';
const CSS_PATH='/assets/header-marketplace-v1224.css';

function reorderMasthead(html){
  const source=String(html||'');
  const start=source.search(/<header\b[^>]*class=["'][^"']*\bsite-header\b[^"']*["'][^>]*>/i);
  if(start<0)return source;
  const close=source.indexOf('</header>',start);
  if(close<0)return source;
  const end=close+'</header>'.length;
  let header=source.slice(start,end);
  const menuMatch=header.match(/<button\b[^>]*class=(["'])[^"']*\bmobile-toggle\b[^"']*\1[^>]*>[\s\S]*?<\/button>/i);
  const brandMatch=header.match(/<a\b[^>]*class=(["'])[^"']*\bbrand\b[^"']*\1[^>]*>[\s\S]*?<\/a>/i);
  const accountMatch=header.match(/<a\b[^>]*\bdata-apg-mobile-account-v122\b[^>]*>[\s\S]*?<\/a>/i);
  if(!menuMatch||!brandMatch||!accountMatch)return source;

  // Match DOM/focus order to the visible mobile hierarchy instead of relying on CSS order alone.
  header=header.replace(menuMatch[0],'');
  const refreshedBrand=header.match(/<a\b[^>]*class=(["'])[^"']*\bbrand\b[^"']*\1[^>]*>[\s\S]*?<\/a>/i);
  if(!refreshedBrand)return source;
  header=header.replace(refreshedBrand[0],menuMatch[0]+refreshedBrand[0]);
  header=header.replace(/<div\b([^>]*class=["'][^"']*\bmasthead\b[^"']*["'][^>]*)>/i,(match,attrs)=>{
    if(/\bdata-apg-mobile-masthead-order=/.test(match))return match;
    return `<div${attrs} data-apg-mobile-masthead-order="menu-brand-account">`;
  });
  return source.slice(0,start)+header+source.slice(end);
}

function injectAssets(html){
  let out=reorderMasthead(html);
  if(!out.includes('name="apg-header-marketplace-mobile-order"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-mobile-order" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Mobile Order v122.4 */
@media(max-width:920px){
  /* Familiar marketplace hierarchy: menu | Australian Product Guide | account. */
  .site-header .masthead{
    grid-template-columns:44px minmax(0,1fr) 44px!important;
    grid-template-areas:"menu brand account"!important;
    column-gap:8px!important;
  }
  .site-header .masthead>.mobile-toggle{
    grid-area:menu!important;
    grid-column:1!important;
    grid-row:1!important;
    justify-self:start!important;
  }
  .site-header .masthead>.brand{
    grid-area:brand!important;
    grid-column:2!important;
    grid-row:1!important;
    justify-self:start!important;
    min-width:0!important;
    width:100%!important;
  }
  .site-header .masthead>.apg-mobile-account-v122{
    grid-area:account!important;
    grid-column:3!important;
    grid-row:1!important;
    justify-self:end!important;
  }

  /* v122.3 remains authoritative for removing the duplicate mobile masthead search. */
  .site-header .masthead>.header-search{
    display:none!important;
    pointer-events:none!important;
  }
}

@media(max-width:390px){
  .site-header .masthead{
    grid-template-columns:42px minmax(0,1fr) 42px!important;
    column-gap:7px!important;
  }
}

@media(prefers-reduced-motion:reduce){.site-header *{scroll-behavior:auto!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Mobile-Order','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.4 requires downstream handler');
  const baseDownstream=previous.wrap(downstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=injectAssets(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-Marketplace-Mobile-Order','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_MOBILE_ORDER_VERSION:VERSION,
    HEADER_MARKETPLACE_MOBILE_ORDER_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION:previous.VERSION
  });
  return handler;
}

module.exports={
  VERSION,CSS_PATH,CSS,reorderMasthead,injectAssets,wrap,
  HEADER_MARKETPLACE_MOBILE_ORDER_VERSION:VERSION,
  HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION:previous.VERSION
};
