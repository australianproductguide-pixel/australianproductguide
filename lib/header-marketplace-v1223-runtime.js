'use strict';

// APG Header Marketplace Mobile Condensed v122.3
// Screenshot-led mobile refinement on 29 Aug 2026. The masthead search is redundant on
// small screens because the primary page search is immediately available in the shopper
// journey. This presentation-only layer removes that duplicate masthead search and gives
// the remaining APG identity, account and menu controls a deliberate single-row layout.
// Desktop search, recommendation logic, evidence, retailer pathways and affiliate scoring
// are inherited unchanged from v122.2.
const previous=require('./header-marketplace-v1222-runtime');

const VERSION='122.3';
const CSS_PATH='/assets/header-marketplace-v1223.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace-mobile-condensed"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-mobile-condensed" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Mobile Condensed v122.3 */
@media(max-width:920px){
  /* One compact identity/action row only: APG | account | menu. */
  .site-header .masthead{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) 44px 44px!important;
    grid-template-rows:52px!important;
    grid-template-areas:"brand account menu"!important;
    align-items:center!important;
    column-gap:8px!important;
    row-gap:0!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    min-height:0!important;
    height:auto!important;
    margin:0!important;
    padding:7px 12px 8px!important;
    overflow:visible!important
  }

  .site-header .masthead>.brand{
    grid-area:brand!important;
    grid-column:1!important;
    grid-row:1!important;
    justify-self:start!important;
    align-self:center!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    height:44px!important;
  }

  .site-header .masthead>.apg-mobile-account-v122{
    grid-area:account!important;
    grid-column:2!important;
    grid-row:1!important;
    justify-self:center!important;
    align-self:center!important;
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    height:44px!important;
    min-height:44px!important;
    max-height:44px!important;
  }

  .site-header .masthead>.mobile-toggle{
    grid-area:menu!important;
    grid-column:3!important;
    grid-row:1!important;
    justify-self:center!important;
    align-self:center!important;
    width:44px!important;
    min-width:44px!important;
    max-width:44px!important;
    height:44px!important;
    min-height:44px!important;
    max-height:44px!important;
  }

  /* The mobile masthead search is intentionally removed. Search remains available in the
     page journey and inside the navigation drawer; desktop masthead search is untouched. */
  .site-header .masthead>.header-search{
    display:none!important;
    visibility:hidden!important;
    opacity:0!important;
    position:absolute!important;
    width:0!important;
    min-width:0!important;
    max-width:0!important;
    height:0!important;
    min-height:0!important;
    max-height:0!important;
    margin:0!important;
    padding:0!important;
    overflow:hidden!important;
    pointer-events:none!important
  }

  /* Keep the existing marketplace quick navigation as the second visible header band. */
  .site-header .primary-nav{
    margin:0!important;
  }
  .site-header .primary-nav .nav-inner{
    height:47px!important;
    min-height:47px!important;
  }
}

@media(max-width:390px){
  .site-header .masthead{
    grid-template-columns:minmax(0,1fr) 42px 42px!important;
    grid-template-rows:50px!important;
    padding:6px 10px 7px!important;
    column-gap:7px!important
  }
  .site-header .masthead>.apg-mobile-account-v122,
  .site-header .masthead>.mobile-toggle{
    width:42px!important;
    min-width:42px!important;
    max-width:42px!important;
    height:42px!important;
    min-height:42px!important;
    max-height:42px!important
  }
}

@media(prefers-reduced-motion:reduce){.site-header *{scroll-behavior:auto!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Mobile-Condensed','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.3 requires downstream handler');
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
      res.setHeader('X-APG-Header-Marketplace-Mobile-Condensed','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION:VERSION,
    HEADER_MARKETPLACE_MOBILE_CONDENSED_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION:previous.VERSION
  });
  return handler;
}

module.exports={
  VERSION,CSS_PATH,CSS,injectAssets,wrap,
  HEADER_MARKETPLACE_MOBILE_CONDENSED_VERSION:VERSION,
  HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION:previous.VERSION
};
