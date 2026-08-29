'use strict';

// APG Header Marketplace Cleanup v122.1
// Final presentation-only ownership layer for the responsive header. It resolves
// legacy cascade conflicts observed on Production after v122 without changing
// product, evidence, recommendation, retailer or affiliate-ranking logic.
const headerMarketplace=require('./header-marketplace-v122-runtime');

const VERSION='122.1';
const CSS_PATH='/assets/header-marketplace-v1221.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace-cleanup"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-cleanup" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Cleanup v122.1 */
:root{--apg1221-navy:#0f1a2d;--apg1221-navy-2:#13243a;--apg1221-gold:#f3b83f;--apg1221-text:#101827}

/* Desktop ownership: no mobile menu leakage and a genuinely icon-only submit. */
.site-header .masthead>.mobile-toggle,
.site-header .mobile-toggle{display:none!important}
.site-header .header-search .global-search>svg{display:none!important}
.site-header .header-search .global-search>button[type="submit"]{
  width:48px!important;min-width:48px!important;max-width:48px!important;
  min-height:40px!important;height:40px!important;padding:0!important;
  position:relative!important;overflow:hidden!important;white-space:nowrap!important;
  font-size:0!important;line-height:0!important;text-indent:-9999px!important;
  color:transparent!important;background:var(--apg1221-gold)!important
}
.site-header .header-search .global-search>button[type="submit"]:before{
  content:""!important;display:block!important;position:absolute!important;
  width:14px!important;height:14px!important;border:2.4px solid var(--apg1221-text)!important;
  border-radius:50%!important;left:50%!important;top:50%!important;
  transform:translate(-60%,-60%)!important;box-sizing:border-box!important
}
.site-header .header-search .global-search>button[type="submit"]:after{
  content:""!important;display:block!important;position:absolute!important;
  width:8px!important;height:2.4px!important;background:var(--apg1221-text)!important;
  border-radius:3px!important;left:50%!important;top:50%!important;
  transform:translate(2px,5px) rotate(45deg)!important;transform-origin:left center!important
}
.site-header .header-search .apg-search-category{
  width:72px!important;min-width:72px!important;max-width:72px!important;
  padding:0 20px 0 10px!important;font-size:12px!important
}

@media(min-width:921px){
  .site-header .masthead{min-height:82px!important}
  .site-header .masthead>.mobile-toggle{display:none!important;width:0!important;height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}
}

@media(max-width:920px){
  .site-header{background:var(--apg1221-navy)!important;overflow:visible!important}
  .site-header .utility{display:none!important}
  .site-header .masthead{
    display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;
    grid-template-areas:"menu brand account" "search search search"!important;
    align-items:center!important;column-gap:10px!important;row-gap:10px!important;
    width:100%!important;max-width:none!important;min-height:0!important;height:auto!important;
    padding:10px 12px 11px!important;margin:0!important;background:var(--apg1221-navy)!important;
    overflow:visible!important
  }

  /* One top-row navigation trigger only. */
  .site-header .masthead>.mobile-toggle{
    grid-area:menu!important;display:grid!important;place-items:center!important;
    position:static!important;inset:auto!important;float:none!important;
    width:44px!important;min-width:44px!important;max-width:44px!important;
    height:44px!important;min-height:44px!important;margin:0!important;padding:0!important;
    border:0!important;border-radius:8px!important;background:transparent!important;color:#fff!important;
    overflow:visible!important
  }
  .site-header .masthead>.mobile-toggle>span{display:none!important}
  .site-header .masthead>.mobile-toggle svg{display:block!important;width:27px!important;height:27px!important;margin:0!important}

  /* One brand lock-up. Neutralise legacy generated mobile wordmarks/pseudo labels. */
  .site-header .masthead>.brand{
    grid-area:brand!important;display:flex!important;align-items:center!important;justify-self:start!important;
    position:static!important;inset:auto!important;float:none!important;
    width:auto!important;max-width:190px!important;min-width:0!important;height:auto!important;
    margin:0!important;padding:0!important;overflow:hidden!important;text-decoration:none!important
  }
  .site-header .masthead>.brand:before,.site-header .masthead>.brand:after{content:none!important;display:none!important}
  .site-header .masthead>.brand>.apg-brand-v32-lockup{
    display:flex!important;align-items:center!important;gap:7px!important;width:auto!important;max-width:100%!important;
    min-width:0!important;margin:0!important;padding:0!important;position:static!important
  }
  .site-header .masthead>.brand .apg-brand-v32-mark{
    display:flex!important;flex:0 0 30px!important;width:30px!important;min-width:30px!important;height:30px!important;
    margin:0!important;padding:0!important;position:static!important
  }
  .site-header .masthead>.brand .apg-brand-v32-symbol{display:block!important;width:30px!important;height:30px!important;margin:0!important}
  .site-header .masthead>.brand .apg-brand-v32-type{
    display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;
    width:auto!important;position:static!important;margin:0!important;padding:0!important;line-height:1.02!important
  }
  .site-header .masthead>.brand .apg-brand-v32-name,
  .site-header .masthead>.brand .apg-brand-v32-product{
    display:block!important;position:static!important;width:auto!important;max-width:145px!important;
    margin:0!important;padding:0!important;font-size:13.5px!important;line-height:1.02!important;
    letter-spacing:-.01em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important
  }
  .site-header .masthead>.brand .apg-brand-v32-product{color:#67a5ff!important}
  .site-header .masthead>.brand .apg-brand-v32-monogram{display:none!important}

  /* One compact account affordance. Legacy Log in / Join blocks do not share this row. */
  .site-header .masthead>.header-actions,
  .site-header .masthead>.apg-mobile-member-top-v20,
  .site-header .masthead>[data-apg-member-v20]{display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
  .site-header .masthead>.apg-mobile-account-v122{
    grid-area:account!important;display:inline-flex!important;align-items:center!important;justify-self:end!important;gap:5px!important;
    position:static!important;inset:auto!important;float:none!important;width:auto!important;max-width:92px!important;
    min-height:44px!important;margin:0!important;padding:0!important;color:#fff!important;background:transparent!important;
    border:0!important;text-decoration:none!important;font-size:12.5px!important;font-weight:800!important;white-space:nowrap!important
  }
  .site-header .masthead>.apg-mobile-account-v122:before,.site-header .masthead>.apg-mobile-account-v122:after{content:none!important;display:none!important}
  .site-header .masthead>.apg-mobile-account-v122 svg{display:block!important;flex:0 0 27px!important;width:27px!important;height:27px!important;margin:0!important;fill:none!important;stroke:#fff!important;stroke-width:1.8!important}

  /* The mobile search owns its own full row. */
  .site-header .masthead>.header-search{
    grid-area:search!important;display:block!important;visibility:visible!important;opacity:1!important;
    position:relative!important;inset:auto!important;float:none!important;width:100%!important;max-width:none!important;
    min-width:0!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important
  }
  .site-header .masthead>.header-search .global-search{
    display:grid!important;grid-template-columns:minmax(0,1fr) 54px!important;align-items:stretch!important;
    position:relative!important;width:100%!important;max-width:none!important;min-width:0!important;
    height:52px!important;min-height:52px!important;margin:0!important;padding:0!important;
    border:0!important;border-radius:10px!important;background:#fff!important;overflow:hidden!important;
    box-shadow:0 0 0 1px rgba(15,23,42,.08)!important
  }
  .site-header .masthead>.header-search .apg-search-category,
  .site-header .masthead>.header-search label[for="apgHeaderSearchCategory"],
  .site-header .masthead>.header-search .global-search>svg{display:none!important}
  .site-header .masthead>.header-search .global-search>input[type="search"]{
    grid-column:1!important;display:block!important;visibility:visible!important;opacity:1!important;
    position:static!important;width:100%!important;max-width:none!important;min-width:0!important;
    height:52px!important;min-height:52px!important;margin:0!important;padding:0 15px!important;
    border:0!important;border-radius:10px 0 0 10px!important;background:#fff!important;color:#162235!important;
    font-size:16px!important;line-height:1.2!important;font-weight:500!important;box-shadow:none!important
  }
  .site-header .masthead>.header-search .global-search>button[type="submit"]{
    grid-column:2!important;display:block!important;visibility:visible!important;opacity:1!important;
    position:relative!important;width:54px!important;min-width:54px!important;max-width:54px!important;
    height:52px!important;min-height:52px!important;margin:0!important;padding:0!important;
    border:0!important;border-radius:0!important;background:var(--apg1221-gold)!important;
    font-size:0!important;line-height:0!important;text-indent:-9999px!important;color:transparent!important;overflow:hidden!important
  }

  /* Compact scrollable marketplace nav; never overlap the masthead. */
  .site-header .primary-nav{
    display:block!important;position:relative!important;inset:auto!important;width:100%!important;height:auto!important;
    margin:0!important;padding:0!important;background:var(--apg1221-navy-2)!important;
    border-top:1px solid rgba(255,255,255,.1)!important;border-bottom:1px solid rgba(0,0,0,.16)!important;overflow:hidden!important
  }
  .site-header .primary-nav .nav-inner{
    display:flex!important;align-items:center!important;justify-content:flex-start!important;position:static!important;
    width:100%!important;max-width:none!important;height:47px!important;margin:0!important;padding:0 9px!important;
    gap:0!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;
    scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important
  }
  .site-header .primary-nav .nav-inner::-webkit-scrollbar{display:none!important}
  .site-header .primary-nav [data-apg-drawer-trigger],.site-header .primary-nav .apg-about-trust-menu{display:none!important}
  .site-header .primary-nav .nav-inner>a,
  .site-header .primary-nav .nav-inner>button:not([data-apg-drawer-trigger]){
    display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;
    position:static!important;min-height:47px!important;height:47px!important;margin:0!important;padding:0 12px!important;
    border:0!important;border-radius:0!important;background:transparent!important;color:#fff!important;
    font-size:13px!important;line-height:1!important;font-weight:720!important;text-decoration:none!important;white-space:nowrap!important
  }
  #mobileNav{display:none!important}
}

@media(max-width:420px){
  .site-header .masthead{grid-template-columns:42px minmax(0,1fr) auto!important;padding-inline:10px!important;column-gap:8px!important}
  .site-header .masthead>.brand{max-width:164px!important}
  .site-header .masthead>.brand .apg-brand-v32-mark,.site-header .masthead>.brand .apg-brand-v32-symbol{width:28px!important;min-width:28px!important;height:28px!important;flex-basis:28px!important}
  .site-header .masthead>.brand .apg-brand-v32-name,.site-header .masthead>.brand .apg-brand-v32-product{max-width:126px!important;font-size:12.5px!important}
  .site-header .masthead>.apg-mobile-account-v122{max-width:82px!important;font-size:11.5px!important;gap:4px!important}
  .site-header .masthead>.apg-mobile-account-v122 svg{width:25px!important;height:25px!important;flex-basis:25px!important}
}

@media(max-width:350px){
  .site-header .masthead>.apg-mobile-account-v122 span{display:none!important}
  .site-header .masthead>.apg-mobile-account-v122{max-width:44px!important;justify-content:center!important}
}

@media(prefers-reduced-motion:reduce){.site-header *{scroll-behavior:auto!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Cleanup','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.1 requires downstream handler');
  const baseDownstream=headerMarketplace.wrap(downstream);
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
      res.setHeader('X-APG-Header-Marketplace-Cleanup','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_CLEANUP_VERSION:VERSION,
    HEADER_MARKETPLACE_CLEANUP_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_VERSION:headerMarketplace.VERSION,
    HEADER_NAVIGATION_VERSION:headerMarketplace.HEADER_NAVIGATION_VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS,injectAssets,wrap};
