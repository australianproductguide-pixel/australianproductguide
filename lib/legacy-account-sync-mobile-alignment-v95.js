'use strict';

// APG Legacy Account-Sync Mobile Alignment v95.0
//
// Screenshot-verified presentation correction for the older [data-account-panel]
// still rendered inside /my-apg/. The newer .apg-account-shell was corrected in v94,
// but this legacy panel uses different markup ([data-account-form] + .actions), so the
// v94 selectors could not affect its Email/Password layout.
//
// Presentation only: no authentication, Supabase, workspace-sync, privacy, analytics,
// recommendation, SEO or commerce behaviour is changed.
const downstream=require('./mobile-account-footer-polish-v94');

const VERSION='95.0';
const CSS_PATH='/assets/legacy-account-sync-mobile-alignment-v95.css';
const ORIGIN='https://australianproductguide.au';

const css=`
/* APG Legacy Account-Sync Mobile Alignment v95.0 */
@media (max-width:760px){
  /* The legacy optional-account card is a separate surface from .apg-account-shell.
     Give every field a deterministic full-width row, then keep the two account actions
     as an even two-column pair where the viewport has room. */
  body[data-platform-page="/my-apg/"] [data-account-panel],
  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-signed-out]{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] > .kicker,
  body[data-platform-page="/my-apg/"] [data-account-panel] > h2,
  body[data-platform-page="/my-apg/"] [data-account-panel] > p{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form]{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-auto-flow:row!important;
    align-items:stretch!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:16px!important;
    margin:20px 0 0!important;
    padding:0!important;
    position:static!important;
    inset:auto!important;
    transform:none!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > label{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-column:1 / -1!important;
    align-items:start!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:7px!important;
    margin:0!important;
    padding:0!important;
    position:static!important;
    inset:auto!important;
    float:none!important;
    transform:none!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > label > input[type="email"],
  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > label > input[type="password"],
  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > label > input[type="text"]{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    min-height:48px!important;
    height:auto!important;
    margin:0!important;
    padding-left:14px!important;
    padding-right:14px!important;
    position:static!important;
    inset:auto!important;
    float:none!important;
    transform:none!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > .actions{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    grid-column:1 / -1!important;
    align-items:stretch!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:10px!important;
    margin:2px 0 0!important;
    padding:0!important;
  }

  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > .actions > .button,
  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > .actions > button{
    display:flex!important;
    align-items:center!important;
    justify-content:center!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    text-align:center!important;
    white-space:normal!important;
  }
}

@media (max-width:360px){
  body[data-platform-page="/my-apg/"] [data-account-panel] [data-account-form] > .actions{
    grid-template-columns:minmax(0,1fr)!important;
  }
}
`;

function inject(html){
  let out=String(html||'');
  if(!out.includes('name="apg-legacy-account-sync-mobile-alignment"')){
    out=out.replace('</head>',`<meta name="apg-legacy-account-sync-mobile-alignment" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Legacy-Account-Sync-Mobile-Alignment','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===CSS_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendCss(req,res);

  res.setHeader('X-APG-Legacy-Account-Sync-Mobile-Alignment','v'+VERSION);
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
    res.setHeader('X-APG-Legacy-Account-Sync-Mobile-Alignment','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  LEGACY_ACCOUNT_SYNC_MOBILE_ALIGNMENT_VERSION:VERSION,
  LEGACY_ACCOUNT_SYNC_MOBILE_ALIGNMENT_CSS_PATH:CSS_PATH,
  legacyAccountSyncMobileAlignmentCss:css,
  injectLegacyAccountSyncMobileAlignment:inject
});

module.exports=handler;
