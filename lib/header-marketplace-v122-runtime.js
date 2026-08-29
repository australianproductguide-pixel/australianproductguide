'use strict';

// APG Header Marketplace Presentation v122.0
// Refines the existing v118 header into a denser desktop search treatment and an
// Amazon-style mobile information hierarchy without copying Amazon branding.
// Presentation/navigation only: no product, evidence, recommendation or retailer scoring.
const headerNavigation=require('./header-navigation-v118-runtime');

const VERSION='122.0';
const CSS_PATH='/assets/header-marketplace-v122.css';

function normaliseDrawerButton(tag){
  let out=String(tag||'')
    .replace(/\saria-controls=(['"])[\s\S]*?\1/gi,'')
    .replace(/\saria-expanded=(['"])[\s\S]*?\1/gi,'')
    .replace(/\sdata-mobile-toggle(?:=(['"])[\s\S]*?\1)?/gi,'');
  if(!/\bdata-apg-drawer-trigger\b/i.test(out))out=out.replace(/>$/,' data-apg-drawer-trigger>');
  return out.replace(/>$/,' aria-controls="apgAllDrawer" aria-expanded="false">');
}

function enhanceMobileMenu(html){
  return String(html||'').replace(/<button\b[^>]*class=(['"])[^'"]*\bmobile-toggle\b[^'"]*\1[^>]*>/i,tag=>normaliseDrawerButton(tag.replace(/aria-label=(['"])[\s\S]*?\1/i,'aria-label="Open all navigation"')));
}

function normaliseAllDrawerTriggers(html){
  return String(html||'').replace(/<button\b[^>]*\bdata-apg-drawer-trigger\b[^>]*>/gi,normaliseDrawerButton);
}

function injectMobileAccount(html){
  let out=String(html||'');
  if(out.includes('data-apg-mobile-account-v122'))return out;
  const account='<a class="apg-mobile-account-v122" data-apg-mobile-account-v122 href="/my-apg/" aria-label="Open My APG"><span>Your APG</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21c.8-5 3.3-7.5 7.5-7.5S18.7 16 19.5 21"></path></svg></a>';
  return out.replace(/(<a\b[^>]*class=(['"])[^'"]*\bbrand\b[^'"]*\2[^>]*>[\s\S]*?<\/a>)/i,'$1'+account);
}

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace"'))out=out.replace('</head>',`<meta name="apg-header-marketplace" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  return out;
}

function transform(html){
  let out=String(html||'');
  out=enhanceMobileMenu(out);
  out=normaliseAllDrawerTriggers(out);
  out=injectMobileAccount(out);
  out=injectAssets(out);
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Presentation v122.0 */
:root{--apg122-navy:#0f1a2d;--apg122-navy-2:#13243a;--apg122-gold:#f3b83f;--apg122-line:rgba(255,255,255,.12)}

/* Desktop: keep the category control useful, but stop it consuming the search field. */
.site-header .header-search .global-search{min-height:44px!important;border-radius:10px!important}
.site-header .header-search .apg-search-category{width:78px!important;min-width:78px!important;max-width:78px!important;min-height:40px!important;padding:0 21px 0 10px!important;font-size:12px!important;text-overflow:ellipsis!important;white-space:nowrap!important;overflow:hidden!important;background:#f7f8fa!important}
.site-header .header-search .global-search>input[type="search"]{min-height:40px!important;padding-inline:12px!important}
.site-header .header-search .global-search>button[type="submit"]{width:50px!important;min-width:50px!important;min-height:40px!important;padding:0!important;font-size:0!important;display:block!important;position:relative!important;background:var(--apg122-gold)!important;color:#101827!important}
.site-header .header-search .global-search>button[type="submit"]:before{content:""!important;position:absolute!important;width:13px!important;height:13px!important;border:2.4px solid currentColor!important;border-radius:50%!important;left:50%!important;top:50%!important;transform:translate(-61%,-61%)!important;box-sizing:border-box!important}
.site-header .header-search .global-search>button[type="submit"]:after{content:""!important;position:absolute!important;width:8px!important;height:2.4px!important;background:currentColor!important;border-radius:3px!important;left:50%!important;top:50%!important;transform:translate(2px,5px) rotate(45deg)!important;transform-origin:left center!important}
.site-header .header-search .global-search>button[type="submit"]:hover{background:#e7aa2c!important}
.apg-mobile-account-v122{display:none}

@media(max-width:920px){
  .site-header{background:var(--apg122-navy)!important}
  .site-header .utility{display:none!important}
  .site-header .masthead{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;grid-template-areas:"menu brand account" "search search search"!important;align-items:center!important;gap:10px 12px!important;max-width:none!important;width:100%!important;min-height:auto!important;padding:10px 14px 11px!important;background:var(--apg122-navy)!important}
  .site-header .brand{grid-area:brand!important;justify-self:start!important;min-width:0!important;margin:0!important}
  .site-header .brand .apg-brand-v32-lockup{display:inline-flex!important;align-items:center!important;gap:7px!important;min-width:0!important}
  .site-header .brand .apg-brand-v32-mark{display:inline-flex!important;width:31px!important;min-width:31px!important;height:31px!important;align-items:center!important;justify-content:center!important}
  .site-header .brand .apg-brand-v32-symbol{width:31px!important;height:31px!important}
  .site-header .brand .apg-brand-v32-type{display:flex!important;flex-direction:column!important;line-height:1.03!important;min-width:0!important}
  .site-header .brand .apg-brand-v32-name,.site-header .brand .apg-brand-v32-product{display:block!important;font-size:14px!important;line-height:1.03!important;white-space:nowrap!important}
  .site-header .brand .apg-brand-v32-product{color:#66a4ff!important}
  .site-header .brand .apg-brand-v32-monogram{display:none!important}
  .site-header .mobile-toggle{grid-area:menu!important;display:grid!important;place-items:center!important;width:44px!important;height:44px!important;min-width:44px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;color:#fff!important;border-radius:8px!important}
  .site-header .mobile-toggle>span{display:none!important}
  .site-header .mobile-toggle svg{display:block!important;width:27px!important;height:27px!important;stroke-width:2!important}
  .site-header .mobile-toggle:hover,.site-header .mobile-toggle:focus-visible{background:rgba(255,255,255,.08)!important}
  .site-header .header-actions,.site-header .apg-mobile-member-top-v20{display:none!important}
  .site-header .apg-mobile-account-v122{grid-area:account!important;display:inline-flex!important;align-items:center!important;gap:7px!important;min-height:44px!important;padding:0 2px 0 8px!important;color:#fff!important;text-decoration:none!important;font-size:13px!important;font-weight:800!important;white-space:nowrap!important}
  .site-header .apg-mobile-account-v122 svg{width:28px!important;height:28px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
  .site-header .header-search{grid-area:search!important;display:block!important;width:100%!important;min-width:0!important;margin:0!important}
  .site-header .header-search .global-search{display:grid!important;grid-template-columns:minmax(0,1fr) 54px!important;width:100%!important;min-height:52px!important;border:0!important;border-radius:10px!important;box-shadow:none!important;overflow:hidden!important;background:#fff!important}
  .site-header .header-search .global-search:focus-within{border:0!important;box-shadow:0 0 0 2px rgba(243,184,63,.85)!important}
  .site-header .header-search .apg-search-category,.site-header .header-search label[for="apgHeaderSearchCategory"]{display:none!important}
  .site-header .header-search .global-search>input[type="search"]{min-width:0!important;min-height:52px!important;height:52px!important;padding:0 15px!important;border:0!important;border-radius:10px 0 0 10px!important;font-size:16px!important;font-weight:500!important;background:#fff!important;color:#152234!important}
  .site-header .header-search .global-search>button[type="submit"]{width:54px!important;min-width:54px!important;height:52px!important;min-height:52px!important;border-radius:0!important;background:var(--apg122-gold)!important}
  .site-header .header-search .search-suggestions{left:0!important;right:0!important;top:calc(100% + 6px)!important}
  .site-header .primary-nav{display:block!important;width:100%!important;background:var(--apg122-navy-2)!important;border-top:1px solid var(--apg122-line)!important;border-bottom:1px solid rgba(0,0,0,.12)!important;overflow:hidden!important}
  .site-header .primary-nav .nav-inner{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:0!important;max-width:none!important;width:100%!important;padding:0 10px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important;white-space:nowrap!important;-webkit-overflow-scrolling:touch!important}
  .site-header .primary-nav .nav-inner::-webkit-scrollbar{display:none!important}
  .site-header .primary-nav [data-apg-drawer-trigger],.site-header .primary-nav .apg-about-trust-menu{display:none!important}
  .site-header .primary-nav .nav-inner>a,.site-header .primary-nav .nav-inner>button:not([data-apg-drawer-trigger]){display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:none!important;min-height:47px!important;padding:0 13px!important;margin:0!important;border:0!important;background:transparent!important;color:#fff!important;font-size:13px!important;font-weight:720!important;text-decoration:none!important;border-radius:0!important}
  .site-header .primary-nav .nav-inner>a:hover,.site-header .primary-nav .nav-inner>button:not([data-apg-drawer-trigger]):hover{background:rgba(255,255,255,.07)!important}
  #mobileNav{display:none!important}
  .apg-all-drawer{width:min(390px,92vw)!important}
}

@media(max-width:390px){
  .site-header .masthead{grid-template-columns:42px minmax(0,1fr) auto!important;padding-inline:10px!important;gap:8px!important}
  .site-header .brand .apg-brand-v32-mark,.site-header .brand .apg-brand-v32-symbol{width:28px!important;min-width:28px!important;height:28px!important}
  .site-header .brand .apg-brand-v32-name,.site-header .brand .apg-brand-v32-product{font-size:12.5px!important}
  .site-header .apg-mobile-account-v122 span{font-size:12px!important}
  .site-header .apg-mobile-account-v122 svg{width:26px!important;height:26px!important}
}

@media(prefers-reduced-motion:reduce){.site-header *{scroll-behavior:auto!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122 requires downstream handler');
  const baseDownstream=headerNavigation.wrap(downstream);
  function handler(req,res){
    let path='/';try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=transform(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-Marketplace','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{HEADER_MARKETPLACE_VERSION:VERSION,HEADER_MARKETPLACE_CSS_PATH:CSS_PATH,HEADER_NAVIGATION_VERSION:headerNavigation.VERSION});
  return handler;
}

module.exports={VERSION,CSS_PATH,CSS,transform,wrap};
