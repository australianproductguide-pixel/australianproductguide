'use strict';

// APG PageSpeed Performance v88.
// Evidence-led homepage performance hardening against the 23 Aug 2026 PageSpeed baseline.
// This layer is deliberately narrow: it changes loading priority only. It does not alter
// product guidance, recommendation logic, affiliate treatment, analytics scope, SEO or
// agentic discovery contracts.
const downstream=require('./action2-measurement-v87');

const ORIGIN='https://australianproductguide.au';
const PAGESPEED_PERFORMANCE_VERSION='88.0';

// These styles are below-the-fold, route-irrelevant on the homepage, or interaction-only.
// Keep shell, privacy, brand, mobile wordmark and search CSS render-blocking so FCP/LCP
// improvements do not come at the cost of layout shift or a flash of unstyled primary UI.
const HOME_NONBLOCKING_CSS=new Set([
  '/assets/amazon-shopping-creative-v41.css',
  '/assets/brand-system-v46-commerce.css',
  '/assets/brand-system-v46-imagery.css',
  '/assets/brand-system-v46-research-proof.css',
  '/assets/consumer-intelligence-v47.css',
  '/assets/catalogue-intelligence-v48.css',
  '/assets/social-integration-v56.css',
  '/assets/product-brand-placeholder-v64.css',
  '/assets/homepage-situation-overlay-v701.css',
  '/assets/navigation-blue-interactions-v77.css',
  '/assets/footer-navigation-v83.css'
]);

function requestUrl(req){
  try{return new URL(req?.url||'/',ORIGIN)}catch{return new URL(ORIGIN+'/')}
}
function pathOf(raw){
  try{return new URL(raw,ORIGIN).pathname}catch{return String(raw||'').split('?')[0]}
}
function escAttr(value){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function makeSecondaryCssNonBlocking(html){
  return String(html||'').replace(/<link rel="stylesheet" href="([^"]+)">/g,(full,href)=>{
    if(!HOME_NONBLOCKING_CSS.has(pathOf(href)))return full;
    const safe=escAttr(href);
    return `<link rel="stylesheet" href="${safe}" media="print" fetchpriority="low" onload="this.onload=null;this.media='all'" data-apg-noncritical-style="v${PAGESPEED_PERFORMANCE_VERSION}"><noscript><link rel="stylesheet" href="${safe}"></noscript>`;
  });
}

function markPerformanceContract(html){
  const text=String(html||'');
  if(text.includes('name="apg-pagespeed-performance"'))return text;
  return text.replace('</head>',`<meta name="apg-pagespeed-performance" content="v${PAGESPEED_PERFORMANCE_VERSION}"></head>`);
}

function transformHtml(html,path){
  let out=String(html||'');
  if(path==='/')out=makeSecondaryCssNonBlocking(out);
  return markPerformanceContract(out);
}

function handler(req,res){
  const url=requestUrl(req);
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&(typeof body==='string'||Buffer.isBuffer(body))&&type.startsWith('text/html')){
      const wasBuffer=Buffer.isBuffer(body);
      const original=wasBuffer?body.toString('utf8'):body;
      const next=transformHtml(original,url.pathname);
      if(next!==original){body=wasBuffer?Buffer.from(next,'utf8'):next;try{res.removeHeader('Content-Length')}catch{}}
    }
    return end(body,...args);
  };
  res.setHeader('X-APG-PageSpeed-Performance','v'+PAGESPEED_PERFORMANCE_VERSION);
  return downstream(req,res);
}

Object.assign(handler,downstream,{
  PAGESPEED_PERFORMANCE_VERSION,HOME_NONBLOCKING_CSS,pathOf,escAttr,
  makeSecondaryCssNonBlocking,markPerformanceContract,transformHtml
});
module.exports=handler;
