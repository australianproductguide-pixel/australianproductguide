'use strict';

// APG Mobile Account + Footer Polish v94.0
//
// Final presentation-only correction above v93.1. The user-visible defects are
// constrained to mobile layout: footer cookie alignment, My APG account form flow,
// workspace heading alignment and the two workspace-level actions. Account/auth logic,
// consent semantics, storage, analytics, SEO, recommendations and commerce are untouched.
const downstream=require('./social-footer-polish-v93');

const VERSION='94.0';
const CSS_PATH='/assets/mobile-account-footer-polish-v94.css';
const ORIGIN='https://australianproductguide.au';

const css=`
/* APG Mobile Account + Footer Polish v94.0 */
@media (max-width:760px){
  /* Cookie preferences must start on the same 18px edge as the mobile footer wrap. */
  .apg-footer-v11 .apg-cookie-footer-wrap,
  .apg-footer-v11 + .apg-cookie-footer-wrap,
  .apg-cookie-footer-wrap{
    display:flex!important;
    align-items:center!important;
    justify-content:flex-start!important;
    box-sizing:border-box!important;
    width:100%!important;
    max-width:none!important;
    margin:0!important;
    padding:20px 18px calc(24px + env(safe-area-inset-bottom,0px))!important;
    text-align:left!important;
  }

  .apg-footer-v11 .apg-cookie-footer-button,
  .apg-cookie-footer-button{
    position:static!important;
    inset:auto!important;
    float:none!important;
    align-self:flex-start!important;
    margin:0!important;
    transform:none!important;
  }

  /* Optional account sync: one field per row, full usable card width. */
  body[data-platform-page="/my-apg/"] .apg-account-shell,
  body[data-platform-page="/my-apg/"] .apg-account-head,
  body[data-platform-page="/my-apg/"] .apg-account-body,
  body[data-platform-page="/my-apg/"] [data-account-signed-out]{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-body{
    padding:20px!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-tabs{
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form{
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
    margin:0!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form > label:not(.apg-account-consent){
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    grid-column:1 / -1!important;
    gap:7px!important;
    align-items:start!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin:0!important;
    padding:0!important;
    position:static!important;
    inset:auto!important;
    float:none!important;
    transform:none!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form input[type="email"],
  body[data-platform-page="/my-apg/"] .apg-account-form input[type="password"],
  body[data-platform-page="/my-apg/"] .apg-account-form input[type="text"]{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    min-height:46px!important;
    height:auto!important;
    margin:0!important;
    position:static!important;
    inset:auto!important;
    float:none!important;
    transform:none!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form .full,
  body[data-platform-page="/my-apg/"] .apg-account-consent,
  body[data-platform-page="/my-apg/"] .apg-account-note{
    grid-column:1 / -1!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .apg-account-form-actions{
    grid-column:1 / -1!important;
    display:flex!important;
    align-items:center!important;
    justify-content:flex-start!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:10px!important;
    margin:0!important;
    flex-wrap:wrap!important;
  }

  /* Every My APG card title reads from the left edge, including direct headings and
     headings wrapped in the shared section-head component. */
  body[data-platform-page="/my-apg/"] .workspace-panel,
  body[data-platform-page="/my-apg/"] .research-shelf,
  body[data-platform-page="/my-apg/"] [data-workspace-comparisons],
  body[data-platform-page="/my-apg/"] [data-workspace-guides]{
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-panel .section-head,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head.compact-head,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head,
  body[data-platform-page="/my-apg/"] .research-shelf .section-head.compact-head{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    align-items:flex-start!important;
    justify-content:flex-start!important;
    text-align:left!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-panel .section-head > div,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head .kicker,
  body[data-platform-page="/my-apg/"] .workspace-panel .section-head h2,
  body[data-platform-page="/my-apg/"] .workspace-panel > .kicker,
  body[data-platform-page="/my-apg/"] .workspace-panel > h2,
  body[data-platform-page="/my-apg/"] [data-workspace-comparisons] > .kicker,
  body[data-platform-page="/my-apg/"] [data-workspace-comparisons] > h2,
  body[data-platform-page="/my-apg/"] [data-workspace-guides] > .kicker,
  body[data-platform-page="/my-apg/"] [data-workspace-guides] > h2{
    display:block!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
    align-self:flex-start!important;
    text-align:left!important;
  }

  /* The history controls are workspace-level mobile actions, not a two-column CTA pair. */
  body[data-platform-page="/my-apg/"] .workspace-controls{
    display:grid!important;
    grid-template-columns:minmax(0,1fr)!important;
    align-items:stretch!important;
    justify-items:stretch!important;
    box-sizing:border-box!important;
    width:100%!important;
    min-width:0!important;
    max-width:none!important;
    gap:10px!important;
    margin-top:24px!important;
  }

  body[data-platform-page="/my-apg/"] .workspace-controls > .button,
  body[data-platform-page="/my-apg/"] .workspace-controls > a,
  body[data-platform-page="/my-apg/"] .workspace-controls > button{
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

  body[data-platform-page="/my-apg/"] .workspace-controls > [data-workspace-status]{
    grid-column:1!important;
    width:100%!important;
    margin:0!important;
    text-align:left!important;
  }
}
`;

function inject(html){
  let out=String(html||'');
  if(!out.includes('name="apg-mobile-account-footer-polish"')){
    out=out.replace('</head>',`<meta name="apg-mobile-account-footer-polish" content="v${VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  }
  return out;
}

function sendCss(req,res){
  res.statusCode=200;
  res.setHeader('Content-Type','text/css; charset=utf-8');
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-APG-Mobile-Account-Footer-Polish','v'+VERSION);
  return res.end(req.method==='HEAD'?'':css);
}

function handler(req,res){
  let path='/';
  try{path=new URL(req.url,ORIGIN).pathname}catch{}
  if(path===CSS_PATH&&(req.method==='GET'||req.method==='HEAD'))return sendCss(req,res);

  res.setHeader('X-APG-Mobile-Account-Footer-Polish','v'+VERSION);
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
    res.setHeader('X-APG-Mobile-Account-Footer-Polish','v'+VERSION);
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  MOBILE_ACCOUNT_FOOTER_POLISH_VERSION:VERSION,
  MOBILE_ACCOUNT_FOOTER_POLISH_CSS_PATH:CSS_PATH,
  mobileAccountFooterPolishCss:css,
  injectMobileAccountFooterPolish:inject
});

module.exports=handler;
