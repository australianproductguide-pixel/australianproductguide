'use strict';

// APG Header Marketplace Cleanup v122.2
// Mobile ownership correction prompted by exact Production screenshots on 29 Aug 2026.
// This layer removes all text footprint from the mobile account control, gives the APG
// lock-up the full centre column, forces the search into its own second row, and refines
// the desktop search end-cap. Presentation/navigation only: no recommendation, evidence,
// retailer, product or affiliate-scoring logic is changed.
const previous=require('./header-marketplace-v1221-runtime');

const VERSION='122.2';
const CSS_PATH='/assets/header-marketplace-v1222.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace-mobile-ownership"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-mobile-ownership" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Cleanup v122.2 */
:root{--apg1222-navy:#0f1a2d;--apg1222-navy-2:#13243a;--apg1222-gold-top:#ffc95f;--apg1222-gold-bottom:#f3b23a;--apg1222-ink:#101827}

/* Desktop: premium connected search end-cap, still APG rather than retailer branding. */
@media(min-width:921px){
  .site-header .header-search .global-search{overflow:hidden!important;border-radius:10px!important}
  .site-header .header-search .apg-search-category{width:70px!important;min-width:70px!important;max-width:70px!important;padding:0 19px 0 10px!important}
  .site-header .header-search .global-search>button[type="submit"]{
    display:block!important;position:relative!important;width:50px!important;min-width:50px!important;max-width:50px!important;
    height:40px!important;min-height:40px!important;margin:0!important;padding:0!important;
    border:0!important;border-left:1px solid rgba(168,112,12,.22)!important;border-radius:0 9px 9px 0!important;
    background:linear-gradient(180deg,var(--apg1222-gold-top),var(--apg1222-gold-bottom))!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.5),-1px 0 0 rgba(15,23,42,.04)!important;
    color:transparent!important;font-size:0!important;line-height:0!important;text-indent:-9999px!important;overflow:hidden!important
  }
  .site-header .header-search .global-search>button[type="submit"]:before{
    content:""!important;display:block!important;position:absolute!important;box-sizing:border-box!important;
    width:15px!important;height:15px!important;border:2.1px solid var(--apg1222-ink)!important;border-radius:50%!important;
    left:50%!important;top:50%!important;transform:translate(-61%,-61%)!important;background:transparent!important
  }
  .site-header .header-search .global-search>button[type="submit"]:after{
    content:""!important;display:block!important;position:absolute!important;width:7px!important;height:2.1px!important;
    left:50%!important;top:50%!important;background:var(--apg1222-ink)!important;border-radius:2px!important;
    transform:translate(2px,5px) rotate(45deg)!important;transform-origin:left center!important
  }
  .site-header .header-search .global-search>button[type="submit"]:hover{background:linear-gradient(180deg,#ffd16f,#efaa2f)!important}
  .site-header .header-search .global-search>button[type="submit"]:focus-visible{outline:2px solid #fff!important;outline-offset:-4px!important}
}

@media(max-width:920px){
  .site-header{background:var(--apg1222-navy)!important;overflow:visible!important}
  .site-header .utility{display:none!important}

  /* Hard ownership: exactly three fixed top-row roles and one independent search row. */
  .site-header .masthead{
    display:grid!important;
    grid-template-columns:44px minmax(0,1fr) 44px!important;
    grid-template-rows:48px 52px!important;
    grid-template-areas:"menu brand account" "search search search"!important;
    align-items:center!important;column-gap:8px!important;row-gap:10px!important;
    width:100%!important;max-width:none!important;min-width:0!important;min-height:0!important;height:auto!important;
    margin:0!important;padding:10px 12px 12px!important;background:var(--apg1222-navy)!important;overflow:visible!important
  }

  .site-header .masthead>.mobile-toggle{
    grid-area:menu!important;grid-column:1!important;grid-row:1!important;display:grid!important;place-items:center!important;
    position:static!important;inset:auto!important;float:none!important;width:44px!important;min-width:44px!important;max-width:44px!important;
    height:44px!important;min-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-radius:9px!important;
    background:transparent!important;color:#fff!important;overflow:visible!important
  }
  .site-header .masthead>.mobile-toggle>span{display:none!important}
  .site-header .masthead>.mobile-toggle svg{display:block!important;width:27px!important;height:27px!important;margin:0!important;stroke:currentColor!important}

  /* The APG lock-up owns the whole centre column and must never be clipped by account text. */
  .site-header .masthead>.brand{
    grid-area:brand!important;grid-column:2!important;grid-row:1!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;
    position:static!important;inset:auto!important;float:none!important;width:100%!important;max-width:none!important;min-width:0!important;height:44px!important;
    margin:0!important;padding:0!important;overflow:visible!important;text-decoration:none!important
  }
  .site-header .masthead>.brand:before,.site-header .masthead>.brand:after{content:none!important;display:none!important}
  .site-header .masthead>.brand>.apg-brand-v32-lockup{
    display:flex!important;align-items:center!important;gap:8px!important;width:auto!important;max-width:100%!important;min-width:0!important;
    margin:0!important;padding:0!important;position:static!important;overflow:visible!important
  }
  .site-header .masthead>.brand .apg-brand-v32-mark{
    display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 34px!important;
    width:34px!important;min-width:34px!important;height:34px!important;margin:0!important;padding:0!important;position:static!important
  }
  .site-header .masthead>.brand .apg-brand-v32-symbol{display:block!important;width:34px!important;height:34px!important;margin:0!important}
  .site-header .masthead>.brand .apg-brand-v32-type{
    display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;width:auto!important;max-width:none!important;
    margin:0!important;padding:0!important;position:static!important;line-height:1.02!important;overflow:visible!important
  }
  .site-header .masthead>.brand .apg-brand-v32-name,
  .site-header .masthead>.brand .apg-brand-v32-product{
    display:block!important;position:static!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;
    font-size:14px!important;line-height:1.02!important;letter-spacing:-.01em!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important
  }
  .site-header .masthead>.brand .apg-brand-v32-product{color:#67a5ff!important}
  .site-header .masthead>.brand .apg-brand-v32-monogram{display:none!important}

  /* Mobile account = icon only. Text and legacy pseudo labels have zero layout footprint. */
  .site-header .masthead>.header-actions,
  .site-header .masthead>.apg-mobile-member-top-v20,
  .site-header .masthead>[data-apg-member-v20]{display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
  .site-header .masthead>.apg-mobile-account-v122{
    grid-area:account!important;grid-column:3!important;grid-row:1!important;display:grid!important;place-items:center!important;justify-self:end!important;
    position:static!important;inset:auto!important;float:none!important;width:44px!important;min-width:44px!important;max-width:44px!important;
    height:44px!important;min-height:44px!important;max-height:44px!important;margin:0!important;padding:0!important;border:0!important;border-radius:9px!important;
    background:transparent!important;color:#fff!important;font-size:0!important;line-height:0!important;text-indent:-9999px!important;white-space:normal!important;overflow:visible!important;text-decoration:none!important
  }
  .site-header .masthead>.apg-mobile-account-v122>span{display:none!important;width:0!important;max-width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important}
  .site-header .masthead>.apg-mobile-account-v122:before,.site-header .masthead>.apg-mobile-account-v122:after{content:none!important;display:none!important}
  .site-header .masthead>.apg-mobile-account-v122 svg{
    display:block!important;position:static!important;flex:none!important;width:29px!important;height:29px!important;margin:0!important;padding:0!important;
    fill:none!important;stroke:#fff!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important;text-indent:0!important
  }

  /* Search is physically confined to row two and can never share the identity row. */
  .site-header .masthead>.header-search{
    grid-area:search!important;grid-column:1/-1!important;grid-row:2!important;display:block!important;visibility:visible!important;opacity:1!important;
    position:static!important;inset:auto!important;float:none!important;width:100%!important;max-width:none!important;min-width:0!important;height:52px!important;
    margin:0!important;padding:0!important;overflow:visible!important;align-self:stretch!important
  }
  .site-header .masthead>.header-search .global-search{
    display:grid!important;grid-template-columns:minmax(0,1fr) 56px!important;align-items:stretch!important;position:relative!important;
    width:100%!important;max-width:none!important;min-width:0!important;height:52px!important;min-height:52px!important;margin:0!important;padding:0!important;
    border:0!important;border-radius:10px!important;background:#fff!important;overflow:hidden!important;box-shadow:0 0 0 1px rgba(15,23,42,.12)!important
  }
  .site-header .masthead>.header-search .apg-search-category,
  .site-header .masthead>.header-search label[for="apgHeaderSearchCategory"],
  .site-header .masthead>.header-search .global-search>svg{display:none!important}
  .site-header .masthead>.header-search .global-search>input[type="search"]{
    grid-column:1!important;display:block!important;visibility:visible!important;opacity:1!important;position:static!important;
    width:100%!important;max-width:none!important;min-width:0!important;height:52px!important;min-height:52px!important;margin:0!important;padding:0 15px!important;
    border:0!important;border-radius:10px 0 0 10px!important;background:#fff!important;color:#162235!important;font-size:16px!important;line-height:1.2!important;font-weight:500!important;box-shadow:none!important
  }
  .site-header .masthead>.header-search .global-search>button[type="submit"]{
    grid-column:2!important;display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;
    width:56px!important;min-width:56px!important;max-width:56px!important;height:52px!important;min-height:52px!important;margin:0!important;padding:0!important;
    border:0!important;border-left:1px solid rgba(168,112,12,.22)!important;border-radius:0 10px 10px 0!important;
    background:linear-gradient(180deg,var(--apg1222-gold-top),var(--apg1222-gold-bottom))!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.5)!important;font-size:0!important;line-height:0!important;text-indent:-9999px!important;color:transparent!important;overflow:hidden!important
  }
  .site-header .masthead>.header-search .global-search>button[type="submit"]:before{
    width:16px!important;height:16px!important;border-width:2.2px!important;border-color:var(--apg1222-ink)!important;transform:translate(-61%,-61%)!important
  }
  .site-header .masthead>.header-search .global-search>button[type="submit"]:after{
    width:8px!important;height:2.2px!important;background:var(--apg1222-ink)!important;transform:translate(2px,6px) rotate(45deg)!important
  }
  .site-header .masthead>.header-search .search-suggestions{left:0!important;right:0!important;top:calc(100% + 6px)!important}

  .site-header .primary-nav{display:block!important;position:relative!important;inset:auto!important;width:100%!important;height:auto!important;margin:0!important;padding:0!important;background:var(--apg1222-navy-2)!important;overflow:hidden!important}
  .site-header .primary-nav .nav-inner{height:47px!important;min-height:47px!important}
  #mobileNav{display:none!important}
}

@media(max-width:390px){
  .site-header .masthead{grid-template-columns:42px minmax(0,1fr) 42px!important;padding-inline:10px!important;column-gap:7px!important}
  .site-header .masthead>.mobile-toggle,.site-header .masthead>.apg-mobile-account-v122{width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important}
  .site-header .masthead>.brand .apg-brand-v32-mark,.site-header .masthead>.brand .apg-brand-v32-symbol{width:31px!important;min-width:31px!important;height:31px!important;flex-basis:31px!important}
  .site-header .masthead>.brand .apg-brand-v32-name,.site-header .masthead>.brand .apg-brand-v32-product{font-size:13.25px!important}
  .site-header .masthead>.apg-mobile-account-v122 svg{width:27px!important;height:27px!important}
}

@media(max-width:340px){
  .site-header .masthead>.brand .apg-brand-v32-name,.site-header .masthead>.brand .apg-brand-v32-product{font-size:12px!important}
  .site-header .masthead>.brand>.apg-brand-v32-lockup{gap:6px!important}
}

@media(prefers-reduced-motion:reduce){.site-header *{scroll-behavior:auto!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Mobile-Ownership','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.2 requires downstream handler');
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
      res.setHeader('X-APG-Header-Marketplace-Mobile-Ownership','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_MOBILE_OWNERSHIP_VERSION:VERSION,
    HEADER_MARKETPLACE_MOBILE_OWNERSHIP_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_CLEANUP_VERSION:previous.VERSION,
    HEADER_MARKETPLACE_VERSION:previous.HEADER_MARKETPLACE_VERSION,
    HEADER_NAVIGATION_VERSION:previous.HEADER_NAVIGATION_VERSION
  });
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS,injectAssets,wrap};
