// APG Premium Theme v31.1 contrast and dark-surface polish.
// Keeps the approved v31 design system intact while guaranteeing readable dark
// applications and a correct light-centre logo treatment on APG Navy surfaces.
const upstream=require('./premium-theme-v31');

const VERSION='31.1';
const CSS_PATH='/assets/premium-theme-v311.css';

const css=`
/* Premium Theme v31.1 dark-surface contrast assurance */
body[data-theme-v31=true] .site-header .apg-brand-v30-mark path:last-child,
body[data-theme-v31=true] footer.apg-footer-v11 .apg-brand-v30-mark path:last-child{fill:#E2E8F0!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9 h2,
body[data-theme-v31=true] .apg-home-decision-panel-v9 h3,
body[data-theme-v31=true] .apg-home-trust-v9 h2,
body[data-theme-v31=true] .apg-home-trust-v9 h3,
body[data-theme-v31=true] .difference-engine h2,
body[data-theme-v31=true] .difference-engine h3,
body[data-theme-v31=true] .v6-diff-summary article:first-child h2,
body[data-theme-v31=true] .v6-diff-summary article:first-child h3{color:#FFFFFF!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9 p,
body[data-theme-v31=true] .apg-home-decision-panel-v9 small,
body[data-theme-v31=true] .apg-home-trust-v9 p,
body[data-theme-v31=true] .difference-engine p,
body[data-theme-v31=true] .v6-diff-summary article:first-child p{color:#CBD5E1!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9 strong,
body[data-theme-v31=true] .apg-home-trust-v9 strong,
body[data-theme-v31=true] .difference-engine strong,
body[data-theme-v31=true] .v6-diff-summary article:first-child strong{color:#F8FAFC!important}
body[data-theme-v31=true] .apg-home-decision-panel-v9>a,
body[data-theme-v31=true] .apg-home-trust-v9 a:not(.button),
body[data-theme-v31=true] .difference-engine a{color:#7DD3FC!important}
body[data-theme-v31=true] .decision-hero .decision-engine-card strong,
body[data-theme-v31=true] .search-hero strong{color:#FFFFFF!important}
body[data-theme-v31=true] .decision-hero .decision-engine-card p{color:#CBD5E1!important}
body[data-theme-v31=true] .decision-hero .decision-engine-card a{color:#93C5FD!important}
body[data-theme-v31=true] .apg-assistant-head strong{color:#FFFFFF!important}
body[data-theme-v31=true] .apg-assistant-head small{color:#CBD5E1!important}
@media(max-width:920px){
  body[data-theme-v31=true] .site-header .apg-brand-v30-mark path:last-child{fill:#E2E8F0!important}
}
`;

function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}

function injectPolish(html){
  let body=String(html||'');
  if(body.includes(CSS_PATH))return body;
  return body.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
}

module.exports=(req,res)=>{
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  const originalEnd=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=injectPolish(body);
    return originalEnd(body,...args);
  };
  return upstream(req,res);
};

module.exports.css=css;
module.exports.injectPolish=injectPolish;
