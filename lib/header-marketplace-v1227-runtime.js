'use strict';

// APG Header Marketplace Desktop Supermenu Repair v122.7
// Desktop-only presentation repair for the v122.5 progressive-disclosure drawer.
// v122.5 intentionally introduced new close/home/department elements but scoped their
// presentation rules to <=920px. Desktop therefore fell back to browser defaults, producing
// an oversized home SVG, an unstyled underlined home link and an unpositioned close control.
// This additive layer styles only >=921px and preserves the working v122.5/v122.6 mobile UI.
// Recommendation logic, evidence, retailer weighting and affiliate scoring are unchanged.
const previous=require('./header-marketplace-v1226-runtime');

const VERSION='122.7';
const CSS_PATH='/assets/header-marketplace-v1227.css';

function injectAssets(html){
  let out=String(html||'');
  if(!out.includes('name="apg-header-marketplace-desktop-supermenu"')){
    out=out.replace('</head>',`<meta name="apg-header-marketplace-desktop-supermenu" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

const CSS=String.raw`
/* APG Header Marketplace Desktop Supermenu Repair v122.7 */
@media(min-width:921px){
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"]{
    width:min(410px,32vw)!important;
    min-width:360px!important;
    max-width:430px!important;
    background:#fff!important;
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account{
    position:relative!important;
    flex:0 0 auto!important;
    background:linear-gradient(135deg,#0f1a2d,#14364a)!important;
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account>a{
    min-height:84px!important;
    padding:18px 66px 18px 20px!important;
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account strong{
    font-size:16px!important;
    line-height:1.2!important;
  }
  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-account small{
    margin-top:4px!important;
    font-size:12px!important;
    line-height:1.3!important;
  }
  .apg-drawer-close-v1225{
    position:absolute!important;
    z-index:4!important;
    top:18px!important;
    right:14px!important;
    display:grid!important;
    place-items:center!important;
    width:42px!important;
    height:42px!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-radius:10px!important;
    background:rgba(255,255,255,.08)!important;
    color:#fff!important;
    cursor:pointer!important;
  }
  .apg-drawer-close-v1225 svg{
    display:block!important;
    width:24px!important;
    height:24px!important;
    max-width:24px!important;
    max-height:24px!important;
    fill:none!important;
    stroke:currentColor!important;
    stroke-width:2!important;
    stroke-linecap:round!important;
  }
  .apg-drawer-close-v1225:hover{background:rgba(255,255,255,.15)!important}
  .apg-drawer-close-v1225:focus-visible{outline:3px solid #93c5fd!important;outline-offset:2px!important}

  .apg-all-drawer[data-apg-drawer-supermenu="v122.5"] .apg-drawer-scroll{
    flex:1 1 auto!important;
    min-height:0!important;
    overflow-y:auto!important;
    overflow-x:hidden!important;
    padding-bottom:28px!important;
  }
  .apg-drawer-home-v1225{
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-bottom:8px solid #eef1f3!important;
    background:#fff!important;
  }
  .apg-drawer-home-v1225>a{
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:16px!important;
    min-height:62px!important;
    padding:14px 20px!important;
    color:#111827!important;
    text-decoration:none!important;
    font-size:16px!important;
    line-height:1.25!important;
  }
  .apg-drawer-home-v1225>a strong{font-weight:820!important}
  .apg-drawer-home-v1225 svg{
    display:block!important;
    flex:0 0 25px!important;
    width:25px!important;
    height:25px!important;
    max-width:25px!important;
    max-height:25px!important;
    fill:none!important;
    stroke:#111827!important;
    stroke-width:1.9!important;
    stroke-linecap:round!important;
    stroke-linejoin:round!important;
  }
  .apg-drawer-home-v1225>a:hover,.apg-drawer-home-v1225>a:focus-visible{
    background:#f4f7fb!important;
    color:#174ea6!important;
    outline:0!important;
  }

  .apg-drawer-section-v1225{
    margin:0!important;
    padding:17px 0 10px!important;
    border-bottom:8px solid #eef1f3!important;
    background:#fff!important;
  }
  .apg-drawer-section-v1225 h3{
    margin:0!important;
    padding:0 20px 8px!important;
    color:#111827!important;
    font-size:17px!important;
    line-height:1.25!important;
    font-weight:850!important;
  }
  .apg-drawer-link-v1225{
    display:flex!important;
    width:100%!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:48px!important;
    margin:0!important;
    padding:10px 20px!important;
    border:0!important;
    background:#fff!important;
    color:#17212b!important;
    text-align:left!important;
    text-decoration:none!important;
    font:inherit!important;
    font-size:14px!important;
    line-height:1.25!important;
    cursor:pointer!important;
  }
  .apg-drawer-link-v1225>span:last-child{color:#64748b!important;font-size:21px!important}
  .apg-drawer-link-v1225.is-priority{font-weight:760!important}
  .apg-drawer-link-v1225:hover,.apg-drawer-link-v1225:focus-visible{
    background:#f4f7fb!important;
    color:#174ea6!important;
    outline:0!important;
  }

  .apg-drawer-department-v1225{
    margin:0!important;
    border:0!important;
    border-top:1px solid #e5e7eb!important;
    background:#fff!important;
  }
  .apg-drawer-department-v1225>summary{
    list-style:none!important;
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:52px!important;
    padding:11px 20px!important;
    color:#17212b!important;
    font-size:14px!important;
    font-weight:720!important;
    cursor:pointer!important;
  }
  .apg-drawer-department-v1225>summary::-webkit-details-marker{display:none!important}
  .apg-drawer-department-v1225>summary:focus-visible{outline:3px solid #93c5fd!important;outline-offset:-3px!important}
  .apg-drawer-chevron-v1225{font-size:21px!important;color:#64748b!important;transition:transform .16s ease!important}
  .apg-drawer-department-v1225[open]>summary .apg-drawer-chevron-v1225{transform:rotate(90deg)!important}
  .apg-drawer-department-v1225>div{padding:0 0 6px!important;background:#f8fafc!important}
  .apg-drawer-department-v1225>div .apg-drawer-link-v1225{
    min-height:44px!important;
    padding-left:30px!important;
    background:#f8fafc!important;
    font-size:13.5px!important;
  }
  .apg-drawer-all-categories-v1225{
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:54px!important;
    padding:12px 20px!important;
    border-top:1px solid #dbe2e8!important;
    background:#fff!important;
    color:#174ea6!important;
    text-decoration:none!important;
    font-size:14px!important;
    font-weight:800!important;
  }
  .apg-drawer-all-categories-v1225:hover,.apg-drawer-all-categories-v1225:focus-visible{background:#eef5ff!important;outline:0!important}
}

@media(prefers-reduced-motion:reduce){.apg-drawer-chevron-v1225{transition:none!important}}
`;

function sendAsset(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Header-Marketplace-Desktop-Supermenu','v'+VERSION);
  return res.end(req.method==='HEAD'?'':CSS);
}

function wrap(downstream){
  if(typeof downstream!=='function')throw new TypeError('Header Marketplace v122.7 requires downstream handler');
  const baseDownstream=previous.wrap(downstream);
  function handler(req,res){
    let path='/';
    try{path=new URL(req.url||'/','https://australianproductguide.au').pathname}catch{}
    if(path===CSS_PATH)return sendAsset(req,res);
    const end=res.end.bind(res);
    res.end=(body,...args)=>{
      const type=String(res.getHeader&&res.getHeader('Content-Type')||'').toLowerCase();
      const textual=typeof body==='string'||Buffer.isBuffer(body);
      if(req.method!=='HEAD'&&textual&&res.statusCode>=200&&res.statusCode<500&&type.startsWith('text/html')){
        const wasBuffer=Buffer.isBuffer(body),source=wasBuffer?body.toString('utf8'):body,next=injectAssets(source);
        if(next!==source){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
      }
      res.setHeader('X-APG-Header-Marketplace-Desktop-Supermenu','v'+VERSION);
      return end(body,...args);
    };
    return baseDownstream(req,res);
  }
  Object.assign(handler,baseDownstream,{
    HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION:VERSION,
    HEADER_MARKETPLACE_DESKTOP_SUPERMENU_CSS_PATH:CSS_PATH,
    HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:previous.VERSION,
    HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:previous.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION
  });
  return handler;
}

module.exports={
  VERSION,CSS_PATH,CSS,injectAssets,wrap,
  HEADER_MARKETPLACE_DESKTOP_SUPERMENU_VERSION:VERSION,
  HEADER_MARKETPLACE_MOBILE_LEFT_LOCKUP_VERSION:previous.VERSION,
  HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION:previous.HEADER_MARKETPLACE_MOBILE_SUPERMENU_VERSION
};
