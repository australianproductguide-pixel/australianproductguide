'use strict';

// APG Premium Search v76.1 cascade correction.
// The site-wide v22 form selector carries intentionally high specificity. This
// presentation-only layer explicitly wins that cascade so Search renders as one
// integrated control on iOS/mobile and desktop without changing Search v52 behaviour.
const downstream=require('./premium-search-v76');

const PREMIUM_SEARCH_MOBILE_VERSION='76.1';
const CSS_PATH='/assets/premium-search-mobile-v761.css';

const css=`
/* APG Premium Search v76.1 — unified input cascade correction */
html body[data-surface-v22="true"] form.global-search > input[type="search"][data-site-search][name="q"],
html body form.global-search > input[type="search"][data-site-search][name="q"]{
  flex:1 1 auto!important;
  width:auto!important;
  min-width:0!important;
  min-height:0!important;
  height:auto!important;
  margin:0!important;
  padding:0 8px!important;
  border-width:0!important;
  border-style:none!important;
  border-color:transparent!important;
  border-radius:0!important;
  outline:0!important;
  outline-offset:0!important;
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
  box-shadow:none!important;
  -webkit-box-shadow:none!important;
  appearance:none!important;
  -webkit-appearance:none!important;
  color:var(--apg-search-navy,#0F172A)!important;
}
html body[data-surface-v22="true"] form.global-search > input[type="search"][data-site-search][name="q"]:focus,
html body[data-surface-v22="true"] form.global-search > input[type="search"][data-site-search][name="q"]:focus-visible,
html body form.global-search > input[type="search"][data-site-search][name="q"]:focus,
html body form.global-search > input[type="search"][data-site-search][name="q"]:focus-visible{
  border-width:0!important;
  border-style:none!important;
  border-color:transparent!important;
  border-radius:0!important;
  outline:0!important;
  background:transparent!important;
  background-color:transparent!important;
  box-shadow:none!important;
  -webkit-box-shadow:none!important;
}
html body form.global-search > input[type="search"][data-site-search][name="q"]::-webkit-search-decoration,
html body form.global-search > input[type="search"][data-site-search][name="q"]::-webkit-search-cancel-button,
html body form.global-search > input[type="search"][data-site-search][name="q"]::-webkit-search-results-button,
html body form.global-search > input[type="search"][data-site-search][name="q"]::-webkit-search-results-decoration{
  -webkit-appearance:none!important;
}

/* Keep the field and button balanced on narrow Australian mobile viewports. */
@media(max-width:920px){
  html body form.global-search{
    gap:0!important;
  }
  html body form.global-search > svg{
    margin-left:8px!important;
    margin-right:5px!important;
  }
  html body[data-surface-v22="true"] form.global-search > input[type="search"][data-site-search][name="q"]{
    flex:1 1 0%!important;
    width:0!important;
    min-width:0!important;
    min-height:46px!important;
    padding:0 5px!important;
    font-size:16px!important;
    line-height:1.25!important;
  }
  html body .apg-home-search-v9 > button[type="submit"],
  html body .apg-mobile-v8 .apg-mobile-search > button[type="submit"]{
    min-width:90px!important;
    min-height:46px!important;
    padding-inline:13px!important;
    margin-left:5px!important;
  }
  html body .apg-home-search-v9,
  html body .apg-mobile-v8 .apg-mobile-search{
    padding:5px!important;
    border-radius:16px!important;
    overflow:visible!important;
  }
}

@media(max-width:390px){
  html body .apg-home-search-v9 > button[type="submit"],
  html body .apg-mobile-v8 .apg-mobile-search > button[type="submit"]{
    min-width:84px!important;
    padding-inline:11px!important;
  }
  html body form.global-search > svg{
    margin-left:6px!important;
    margin-right:3px!important;
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

function inject(html){
  const out=String(html||'');
  if(out.includes('name="apg-premium-search-mobile"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-premium-search-mobile" content="v${PREMIUM_SEARCH_MOBILE_VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${PREMIUM_SEARCH_MOBILE_VERSION}"></head>`
  );
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);

  res.setHeader('X-APG-Premium-Search-Mobile','v'+PREMIUM_SEARCH_MOBILE_VERSION);
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
    return end(body,...args);
  };
  return downstream(req,res);
}

Object.assign(handler,downstream,{PREMIUM_SEARCH_MOBILE_VERSION,CSS_PATH,css,inject});
module.exports=handler;
