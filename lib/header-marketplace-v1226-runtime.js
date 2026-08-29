'use strict';

// APG Header Marketplace Mobile Left Lock-up v122.6
// Screenshot-led micro-refinement on 29 Aug 2026. v122.5 established the correct semantic
// order and priority-first supermenu, but the full APG lock-up still read too centrally on a
// real iPhone. This presentation-only layer gives the top row deterministic edge geometry:
// hamburger at the left inset, APG lock-up immediately after its touch target, account at the
// right inset. Decision logic, evidence, retailer pathways and commercial weighting are untouched.
const previous=require('./header-marketplace-v1225-runtime');

const VERSION='122.6';
const CSS_PATH='/assets/header-marketplace-v1226.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace-mobile-left-lockup"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-mobile-left-lockup" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Mobile Left Lock-up v122.6 */
@media(max-width:920px){
  /* Deterministic physical geometry. Do not let inherited grid/flex distribution visually
     re-centre the brand: menu target ends at 52px, brand starts four pixels later. */
  .site-header .masthead{
    position:relative!important;
    grid-template-columns:44px minmax(0,1fr) 44px!important;
    grid-template-areas:"menu brand account"!important;
    column-gap:0!important;
    padding-left:8px!important;
    padding-right:10px!important;
  }
  .site-header .masthead>.mobile-toggle{
    grid-area:menu!important;grid-column:1!important;
    position:absolute!important;left:8px!important;right:auto!important;top:50%!important;bottom:auto!important;
    margin:0!important;transform:translateY(-50%)!important;
  }
  .site-header .masthead>.brand{
    grid-area:brand!important;grid-column:2!important;
    position:absolute!important;left:56px!important;right:auto!important;top:50%!important;bottom:auto!important;
    width:auto!important;max-width:calc(100% - 126px)!important;min-width:0!important;height:44px!important;
    margin:0!important;padding:0!important;transform:translateY(-50%)!important;
    align-items:center!important;justify-content:flex-start!important;text-align:left!important;overflow:visible!important;
  }
  .site-header .masthead>.brand>.apg-brand-v32-lockup{
    display:flex!important;align-items:center!important;justify-content:flex-start!important;
    width:max-content!important;max-width:100%!important;min-width:0!important;
    margin:0!important;padding:0!important;transform:none!important;position:static!important;
  }
  .site-header .masthead>.brand .apg-brand-v32-mark,
  .site-header .masthead>.brand .apg-brand-v32-type{
    margin-left:0!important;transform:none!important;
  }
  .site-header .masthead>.apg-mobile-account-v122{
    grid-area:account!important;grid-column:3!important;
    position:absolute!important;left:auto!important;right:10px!important;top:50%!important;bottom:auto!important;
    margin:0!important;transform:translateY(-50%)!important;
  }
}

@media(max-width:390px){
  .site-header .masthead{grid-template-columns:42px minmax(0,1fr) 42px!important;padding-left:7px!important;padding-right:8px!important}
  .site-header .masthead>.mobile-toggle{left:7px!important}
  .site-header .masthead>.brand{left:53px!important;max-width:calc(100% - 111px)!important;height:42px!important}
  .site-header .masthead>.apg-mobile-account-v122{right:8px!important}
}

@media(prefers-reduced-motion:reduce){
  .site-header .masthead>.mobile-toggle,
  .site-header .masthead>.brand,
  .site-header .masthead>.apg-mobile-account-v122{transition:none!important}
}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Mobile-Left-Lockup','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.6 requires downstream handler');
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
      res.setHeader('X-APG-Header-Marketplace-Mobile-Left-Lockup','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:VERSION,
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:previous.VERSION
  });
  return handler;
}

module.exports={
  VERSION,CSS_PATH,CSS,injectAssets,wrap,
  HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:VERSION,
  HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:previous.VERSION
};
