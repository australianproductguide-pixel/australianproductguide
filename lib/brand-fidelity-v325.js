// APG Brand Fidelity v32.5.2 final screenshot-led mobile menu rendering fix.
// Exact Production screenshots for v32.5.1 showed that a separate legacy
// /decision-lab/ anchor could survive even when all unclassified .mobile-power
// controls were removed. v32.5.2 therefore governs the semantic destination:
// the mobile navigation may contain exactly one visible /decision-lab/ action,
// the approved primary control, followed by one approved Ask Scout control.
const upstream=require('./brand-fidelity-v324');
const v29=require('./amazon-conversion-v29');
const v32=require('./brand-fidelity-v32');

const VERSION='32.5.2';
const CSS_PATH='/assets/brand-fidelity-v325.css';
const JS_PATH='/assets/brand-fidelity-v325.js';

const css=`
/* Brand Fidelity v32.5.2 — semantic mobile Decision Lab / Ask Scout hierarchy. */
@media(max-width:920px){
  body[data-brand-fidelity-v325="true"] #mobileNav .mobile-nav-inner{display:grid!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile,
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile{
    box-sizing:border-box!important;
    width:100%!important;
    min-height:54px!important;
    margin:2px 0!important;
    padding:0 16px!important;
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    border-radius:14px!important;
    box-shadow:none!important;
    text-decoration:none!important;
    font-weight:820!important;
    letter-spacing:-.01em!important;
    grid-column:1/-1!important;
  }
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile{
    order:30!important;
    background:linear-gradient(135deg,#172554,#2563EB)!important;
    border:1px solid #2563EB!important;
    color:#FFFFFF!important;
    font-size:0!important;
  }
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile{
    order:31!important;
    background:#EFF6FF!important;
    border:1px solid #BFDBFE!important;
    color:#1D4ED8!important;
    font-size:0!important;
  }
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile>* ,
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile>*{display:none!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile:before,
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:before{font-size:15px!important;line-height:1.2!important;font-weight:820!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile:after,
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:after{content:"→"!important;font-size:18px!important;line-height:1!important;font-weight:800!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile:before{content:"Decision Lab"!important;color:#FFFFFF!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-decision-mobile:after{color:#FFFFFF!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:before{content:"Ask Scout"!important;color:#1D4ED8!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:after{color:#1D4ED8!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:hover,
  body[data-brand-fidelity-v325="true"] #mobileNav .apg-v325-scout-mobile:focus-visible{background:#DBEAFE!important;border-color:#93C5FD!important}
  /* Semantic safeguard: no second Decision Lab destination may remain visible. */
  body[data-brand-fidelity-v325="true"] #mobileNav .mobile-nav-inner>a[href="/decision-lab/"]:not(.apg-v325-decision-mobile){display:none!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .mobile-power:not(.apg-v325-decision-mobile):not(.apg-v325-scout-mobile){display:none!important}
  body[data-brand-fidelity-v325="true"] #mobileNav .mobile-section{order:40!important}
}
`;

function normaliseMobileNav(segment){
  let nav=String(segment||'');
  nav=nav.replace(/<a class="mobile-power(?: [^"]*)?" href="\/decision-lab\/">[\s\S]*?<\/a>/i,
    '<a class="mobile-power apg-v325-decision-mobile" aria-label="Decision Lab" href="/decision-lab/">Decision Lab <span aria-hidden="true">→</span></a>');
  nav=nav.replace(/<button type="button" class="([^"]*apg-v26-scout-mobile[^"]*)"([^>]*)>[\s\S]*?<\/button>/i,(m,classes,attrs)=>{
    const clean=classes.split(/\s+/).filter(Boolean).filter(c=>c!=='apg-v325-scout-mobile').join(' ');
    const safeAttrs=attrs.replace(/\saria-label="[^"]*"/i,'');
    return `<button type="button" class="${clean} apg-v325-scout-mobile" aria-label="Ask Scout"${safeAttrs}>Ask Scout <span aria-hidden="true">→</span></button>`;
  });
  nav=nav.replace(/<a\b([^>]*href="\/decision-lab\/"[^>]*)>[\s\S]*?<\/a>/gi,(match,attrs)=>{
    if(/\bapg-v325-decision-mobile\b/.test(attrs))return match;
    return '';
  });
  return nav;
}

function markServerControls(html){
  const source=String(html||'');
  return source.replace(/<nav\b([^>]*\bid="mobileNav"[^>]*)>[\s\S]*?<\/nav>/i,match=>normaliseMobileNav(match));
}

const clientJs=`(()=>{
  const reconcile=()=>{
    const nav=document.getElementById('mobileNav');
    const inner=nav&&nav.querySelector('.mobile-nav-inner');
    if(!inner)return;
    const decision=inner.querySelector('.apg-v325-decision-mobile')||inner.querySelector('a[href="/decision-lab/"]');
    const scout=inner.querySelector('.apg-v325-scout-mobile')||inner.querySelector('[data-v26-scout-mobile],[data-v26-scout-open].mobile-power');
    if(decision){
      if(!decision.classList.contains('apg-v325-decision-mobile'))decision.classList.add('mobile-power','apg-v325-decision-mobile');
      if(decision.getAttribute('aria-label')!=='Decision Lab')decision.setAttribute('aria-label','Decision Lab');
    }
    if(scout){
      if(!scout.classList.contains('apg-v325-scout-mobile'))scout.classList.add('mobile-power','apg-v325-scout-mobile');
      if(scout.getAttribute('aria-label')!=='Ask Scout')scout.setAttribute('aria-label','Ask Scout');
    }
    [...inner.querySelectorAll(':scope > a[href="/decision-lab/"]')].forEach(el=>{
      if(el!==decision)el.remove();
    });
    [...inner.querySelectorAll(':scope > .mobile-power')].forEach(el=>{
      if(el!==decision&&el!==scout)el.remove();
    });
    inner.dataset.apgV325Menu='true';
  };
  const boundedReconcile=()=>{
    reconcile();
    setTimeout(reconcile,120);
    setTimeout(reconcile,600);
  };
  const boot=()=>{
    boundedReconcile();
    document.querySelector('[data-mobile-toggle]')?.addEventListener('click',boundedReconcile);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;

function inject(html){
  let out=markServerControls(String(html||''));
  if(out.includes('data-brand-fidelity-v325="true"'))return out;
  out=out.replace(/<body\b([^>]*)>/i,'<body data-brand-fidelity-v325="true"$1>');
  if(!out.includes(CSS_PATH))out=out.replace('</head>',`<link rel="stylesheet" href="${CSS_PATH}?v=${VERSION}"></head>`);
  if(!out.includes(JS_PATH))out=out.replace('</body>',`<script src="${JS_PATH}?v=${VERSION}" defer></script></body>`);
  return out;
}
function send(res,req,body,type){
  res.statusCode=200;
  res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control','public, max-age=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.end(req.method==='HEAD'?'':body);
}
function transform(html,pathOrUrl){
  let out=upstream.transform?upstream.transform(String(html||''),pathOrUrl):String(html||'');
  return inject(out);
}
function handler(req,res){
  let path='';try{path=new URL(req.url,'https://australianproductguide.au').pathname}catch{}
  if(path===CSS_PATH)return send(res,req,css,'text/css; charset=utf-8');
  if(path===JS_PATH)return send(res,req,clientJs,'application/javascript; charset=utf-8');
  const end=res.end.bind(res);
  res.end=(body,...args)=>{
    const type=String(res.getHeader('Content-Type')||'').toLowerCase();
    if(req.method!=='HEAD'&&res.statusCode===200&&typeof body==='string'&&type.startsWith('text/html'))body=inject(body);
    return end(body,...args);
  };
  return upstream(req,res);
}
Object.assign(handler,v29,v32,upstream,{VERSION,CSS_PATH,JS_PATH,css,clientJs,normaliseMobileNav,markServerControls,inject,transform});
module.exports=handler;
