'use strict';

// APG Homepage Situation Overlay v70.1.
// Presentation-only correction for the governed category imagery introduced in v70.
// P0 transport containment (1 Sep 2026): the Home route is currently failing only in
// Production serverless execution while sibling routes remain healthy. Keep the visual
// transform source-controlled and the CSS endpoint available, but do not intercept
// res.end while the Home-only response chain is being bisected. This is reversible and
// does not change recommendation logic, retailer logic, eBay evidence or image matching.
const downstream=require('./premium-search-mobile-v761');

const HOMEPAGE_SITUATION_OVERLAY_VERSION='70.1';
const RUNTIME_STATE='P0_DISABLED_RESPONSE_INTERCEPTION';
const CSS_PATH='/assets/homepage-situation-overlay-v701.css';

const css=`
/* APG Homepage Situation Overlay v70.1 — left anchored, collision free */
body[data-platform-page="/"] .apg-v12-card .apg-v12-art{
  position:relative!important;
  overflow:hidden!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v12-icon{
  position:absolute!important;
  left:16px!important;
  right:auto!important;
  top:auto!important;
  bottom:14px!important;
  width:64px!important;
  height:64px!important;
  min-width:64px!important;
  min-height:64px!important;
  margin:0!important;
  transform:none!important;
  display:grid!important;
  place-items:center!important;
  z-index:3!important;
  box-sizing:border-box!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v12-icon svg{
  width:40px!important;
  height:40px!important;
}
body[data-platform-page="/"] .apg-v12-card .apg-v12-art>small{
  position:absolute!important;
  left:90px!important;
  right:auto!important;
  top:auto!important;
  bottom:46px!important;
  transform:translateY(50%)!important;
  margin:0!important;
  z-index:3!important;
  display:block!important;
  width:max-content!important;
  max-width:calc(100% - 106px)!important;
  box-sizing:border-box!important;
  white-space:normal!important;
  overflow-wrap:break-word!important;
  text-align:left!important;
  line-height:1.25!important;
}

/* Keep the overlay compact and comfortably inset on narrow iPhones. */
@media(max-width:600px){
  body[data-platform-page="/"] .apg-v12-card .apg-v12-icon{
    left:14px!important;
    bottom:14px!important;
    width:60px!important;
    height:60px!important;
    min-width:60px!important;
    min-height:60px!important;
    border-radius:18px!important;
  }
  body[data-platform-page="/"] .apg-v12-card .apg-v12-icon svg{
    width:36px!important;
    height:36px!important;
  }
  body[data-platform-page="/"] .apg-v12-card .apg-v12-art>small{
    left:84px!important;
    bottom:44px!important;
    max-width:calc(100% - 98px)!important;
    padding:7px 10px!important;
    font-size:.76rem!important;
  }
}

@media(max-width:370px){
  body[data-platform-page="/"] .apg-v12-card .apg-v12-icon{
    left:12px!important;
    bottom:12px!important;
    width:56px!important;
    height:56px!important;
    min-width:56px!important;
    min-height:56px!important;
  }
  body[data-platform-page="/"] .apg-v12-card .apg-v12-icon svg{
    width:34px!important;
    height:34px!important;
  }
  body[data-platform-page="/"] .apg-v12-card .apg-v12-art>small{
    left:76px!important;
    bottom:40px!important;
    max-width:calc(100% - 88px)!important;
    font-size:.72rem!important;
  }
}
`;

function sendCss(res,req){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':css);
}

function inject(html,path){
  const out=String(html||'');
  if(path!=='/'||!out.includes('apg-v12-situations'))return out;
  if(out.includes('name="apg-homepage-situation-overlay"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-homepage-situation-overlay" content="v${HOMEPAGE_SITUATION_OVERLAY_VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${HOMEPAGE_SITUATION_OVERLAY_VERSION}"></head>`
  );
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);

  if(path==='/'){
    res.setHeader('X-APG-Homepage-Situation-Overlay','v'+HOMEPAGE_SITUATION_OVERLAY_VERSION);
    res.setHeader('X-APG-Homepage-Situation-Overlay-Runtime',RUNTIME_STATE);
  }

  // P0 containment: preserve native downstream response transport. The pure inject()
  // transform remains exported for regression tests and a later renderer-integrated
  // reintroduction once Production Home availability is stable.
  return downstream(req,res);
}

Object.assign(handler,downstream,{HOMEPAGE_SITUATION_OVERLAY_VERSION,RUNTIME_STATE,CSS_PATH,css,inject});
module.exports=handler;
