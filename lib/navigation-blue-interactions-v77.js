'use strict';

// APG Navigation Blue Interactions v77.
// Presentation-only correction for legacy teal/green hover, focus and touch states
// remaining in the mobile navigation and Products mega menu. Keeps all navigation
// structure, links, disclosure behaviour and interaction logic unchanged.
const downstream=require('./homepage-situation-overlay-v701');

const NAVIGATION_BLUE_VERSION='77.0';
const CSS_PATH='/assets/navigation-blue-interactions-v77.css';

const css=`
/* APG Navigation Blue Interactions v77 — remove legacy green interaction states */
:root{
  --apg-nav-blue:#2563EB;
  --apg-nav-blue-strong:#1D4ED8;
  --apg-nav-blue-soft:#EFF6FF;
  --apg-nav-blue-border:#BFDBFE;
}

/* Mobile navigation accordion links: Deals, Popular products, Research & compare, etc. */
@media(max-width:920px){
  html body .apg-mobile-v8 .mobile-section a{
    -webkit-tap-highlight-color:rgba(37,99,235,.14)!important;
    transition:background-color .14s ease,color .14s ease,box-shadow .14s ease!important;
  }
  html body .apg-mobile-v8 .mobile-section a:hover,
  html body .apg-mobile-v8 .mobile-section a:focus-visible,
  html body .apg-mobile-v8 .mobile-section a:active{
    background:var(--apg-nav-blue-soft)!important;
    color:var(--apg-nav-blue)!important;
  }
  html body .apg-mobile-v8 .mobile-section a:focus-visible{
    outline:2px solid var(--apg-nav-blue)!important;
    outline-offset:-2px!important;
    box-shadow:inset 0 0 0 1px var(--apg-nav-blue-border)!important;
  }

  /* Accordion headings are clickable navigation controls too. */
  html body .apg-mobile-v8 .mobile-section summary{
    -webkit-tap-highlight-color:rgba(37,99,235,.14)!important;
    transition:background-color .14s ease,color .14s ease!important;
  }
  html body .apg-mobile-v8 .mobile-section summary:hover,
  html body .apg-mobile-v8 .mobile-section summary:focus-visible,
  html body .apg-mobile-v8 .mobile-section summary:active{
    background:var(--apg-nav-blue-soft)!important;
    color:var(--apg-nav-blue-strong)!important;
  }
  html body .apg-mobile-v8 .mobile-section[open] summary:hover,
  html body .apg-mobile-v8 .mobile-section[open] summary:focus-visible,
  html body .apg-mobile-v8 .mobile-section[open] summary:active{
    background:var(--apg-nav-blue-soft)!important;
    color:var(--apg-nav-blue-strong)!important;
  }

  /* Any history/helper controls inside the same mobile navigation shell. */
  html body .apg-mobile-v8 .apg-mobile-history-tools button:hover,
  html body .apg-mobile-v8 .apg-mobile-history-tools button:focus-visible,
  html body .apg-mobile-v8 .apg-mobile-history-tools button:active{
    background:transparent!important;
    color:var(--apg-nav-blue)!important;
    text-decoration:underline!important;
    text-underline-offset:3px!important;
  }
}

/* Desktop Products mega menu: use the same APG blue interaction language. */
html body .apg-discovery-menu a{
  -webkit-tap-highlight-color:rgba(37,99,235,.14)!important;
}
html body .apg-discovery-menu a:hover,
html body .apg-discovery-menu a:focus-visible,
html body .apg-discovery-menu a:active{
  color:var(--apg-nav-blue)!important;
}
html body .apg-discovery-menu .apg-mega-category:hover,
html body .apg-discovery-menu .apg-mega-category:focus-visible,
html body .apg-discovery-menu .apg-mega-category:active,
html body .apg-discovery-menu .apg-mega-head-actions a:hover,
html body .apg-discovery-menu .apg-mega-head-actions a:focus-visible,
html body .apg-discovery-menu .apg-mega-head-actions a:active,
html body .apg-discovery-menu .apg-mega-footer nav a:hover,
html body .apg-discovery-menu .apg-mega-footer nav a:focus-visible,
html body .apg-discovery-menu .apg-mega-footer nav a:active{
  background:var(--apg-nav-blue-soft)!important;
  color:var(--apg-nav-blue)!important;
  border-color:var(--apg-nav-blue-border)!important;
}
html body .apg-discovery-menu a:focus-visible{
  outline:2px solid var(--apg-nav-blue)!important;
  outline-offset:2px!important;
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
  if(out.includes('name="apg-navigation-blue-interactions"'))return out;
  return out.replace(
    '</head>',
    `<meta name="apg-navigation-blue-interactions" content="v${NAVIGATION_BLUE_VERSION}"><link rel="stylesheet" href="${CSS_PATH}?v=${NAVIGATION_BLUE_VERSION}"></head>`
  );
}

function handler(req,res){
  let path='';
  try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return sendCss(res,req);

  res.setHeader('X-APG-Navigation-Blue-Interactions','v'+NAVIGATION_BLUE_VERSION);
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

Object.assign(handler,downstream,{NAVIGATION_BLUE_VERSION,CSS_PATH,css,inject});
module.exports=handler;
